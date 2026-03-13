import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Request,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/auth/guards/roles.guard';
import { Roles } from '../iam/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ── Student: create a Razorpay order ──────────────────────────────────────
  @Post('payments/create-order')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Create Razorpay order for plan purchase' })
  createOrder(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.paymentsService.createOrder(req.user.userId, dto);
  }

  // ── Student: verify payment after checkout ────────────────────────────────
  @Post('payments/verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Verify Razorpay payment & activate subscription' })
  verifyPayment(@Body() dto: VerifyPaymentDto, @Request() req: any) {
    return this.paymentsService.verifyPayment(req.user.userId, dto);
  }

  // ── Razorpay webhook — NO auth guard (Razorpay server calls this) ─────────
  @Post('payments/webhook')
  @ApiOperation({ summary: 'Razorpay webhook endpoint (server-to-server)' })
  async webhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(
      req.rawBody as Buffer,
      signature,
    );
  }

  // ── Student: payment history ──────────────────────────────────────────────
  @Get('payments/my-history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get current user payment history' })
  getMyPayments(@Request() req: any) {
    return this.paymentsService.getMyPayments(req.user.userId);
  }

  // ── Admin: all payments ───────────────────────────────────────────────────
  @Get('admin/payments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all payments (admin)' })
  getAdminPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.paymentsService.getAdminPayments(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
    );
  }
}
