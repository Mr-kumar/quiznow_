import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../../services/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  private razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  constructor(private prisma: PrismaService) {}

  // ── 1. Create a Razorpay Order ────────────────────────────────────────────
  async createOrder(userId: string, dto: CreateOrderDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if user already has an active subscription
    const existingSub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingSub) {
      throw new BadRequestException(
        'You already have an active subscription. Wait for it to expire or contact support.',
      );
    }

    // amount is in paise (₹1 = 100 paise)
    const amountInPaise = Math.round(plan.price * 100);

    const razorpayOrder = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${userId}_${Date.now()}`,
      notes: {
        planId: plan.id,
        planName: plan.name,
        userId,
      },
    });

    // Save the pending payment record in our DB
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        planId: plan.id,
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        status: 'PENDING',
      },
    });

    this.logger.log(`Order created: ${razorpayOrder.id} for user ${userId}`);

    return {
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
      userEmail: user.email,
      userName: user.name,
      paymentDbId: payment.id,
    };
  }

  // ── 2. Verify payment & activate subscription ─────────────────────────────
  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    // Step A: Verify the Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      this.logger.warn(`Signature mismatch for order ${dto.razorpayOrderId}`);
      throw new BadRequestException('Payment verification failed');
    }

    // Step B: Find the pending payment in DB
    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId: dto.razorpayOrderId },
      include: { plan: true },
    });

    if (!payment) throw new NotFoundException('Payment record not found');
    if (payment.userId !== userId)
      throw new BadRequestException('Unauthorised');
    if (payment.status === 'SUCCESS') {
      return { message: 'Already activated', alreadyDone: true };
    }

    // Step C: Create subscription + mark payment SUCCESS in one transaction
    const startAt = new Date();
    const expiresAt = new Date(startAt);
    expiresAt.setDate(expiresAt.getDate() + payment.plan.durationDays);

    const [subscription] = await this.prisma.$transaction([
      this.prisma.subscription.create({
        data: {
          userId,
          planId: payment.plan.id,
          startAt,
          expiresAt,
          status: SubscriptionStatus.ACTIVE,
          paymentOrderId: dto.razorpayOrderId,
          paymentId: dto.razorpayPaymentId,
        },
        include: { plan: true },
      }),
      this.prisma.payment.update({
        where: { razorpayOrderId: dto.razorpayOrderId },
        data: {
          razorpayPaymentId: dto.razorpayPaymentId,
          razorpaySignature: dto.razorpaySignature,
          status: 'SUCCESS',
        },
      }),
    ]);

    this.logger.log(
      `Payment verified & subscription activated: user=${userId} plan=${payment.plan.name}`,
    );

    return {
      success: true,
      subscription: {
        id: subscription.id,
        planName: subscription.plan.name,
        expiresAt: subscription.expiresAt,
      },
    };
  }

  // ── 3. Webhook handler (called by Razorpay server directly) ───────────────
  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      this.logger.warn('RAZORPAY_WEBHOOK_SECRET is not set — skipping webhook');
      return { received: true, warning: 'webhook_secret_not_configured' };
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      this.logger.warn('Webhook signature mismatch');
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString());
    this.logger.log(`Webhook received: ${event.event}`);

    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      // Find the matching payment
      const payment = await this.prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
      });

      if (!payment || payment.status === 'SUCCESS') return { received: true };

      // Mark success — subscription may already be activated via verify endpoint
      await this.prisma.payment.update({
        where: { razorpayOrderId: orderId },
        data: {
          razorpayPaymentId: paymentId,
          status: 'SUCCESS',
        },
      });

      this.logger.log(`Webhook: payment captured for order ${orderId}`);
    }

    if (event.event === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      await this.prisma.payment.updateMany({
        where: { razorpayOrderId: orderId },
        data: { status: 'FAILED' },
      });

      this.logger.warn(`Webhook: payment failed for order ${orderId}`);
    }

    return { received: true };
  }

  // ── 4. Get user's payment history ─────────────────────────────────────────
  async getMyPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // ── 5. Admin: Get all payments history ────────────────────────────────────
  async getAdminPayments(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        {
          user: {
            email: { contains: search, mode: 'insensitive' as const },
          },
        },
        {
          user: { name: { contains: search, mode: 'insensitive' as const } },
        },
        {
          plan: { name: { contains: search, mode: 'insensitive' as const } },
        },
        { razorpayOrderId: { contains: search, mode: 'insensitive' as const } },
        {
          razorpayPaymentId: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          plan: true,
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          subscription: {
            select: { id: true, status: true, expiresAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
