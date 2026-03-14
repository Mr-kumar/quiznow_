import api from "@/lib/api";

export interface CreateOrderResponse {
  isFree?: boolean;
  orderId?: string;
  amount: number;
  currency?: string;
  keyId?: string;
  planName: string;
  userEmail: string;
  userName: string;
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  planId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  createdAt: string;
  updatedAt: string;
  plan?: {
    id: string;
    name: string;
    price: number;
    durationDays: number;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  subscription?: {
    id: string;
    status: string;
    expiresAt: string;
  } | null;
}

export const paymentsApi = {
  createOrder: (planId: string) =>
    api.post<CreateOrderResponse>("/payments/create-order", { planId }),

  verifyPayment: (payload: VerifyPaymentPayload) =>
    api.post("/payments/verify", payload),

  getMyPayments: () => api.get<PaymentRecord[]>("/payments/my-history"),

  // Admin endpoints
  getAdminPayments: (page = 1, limit = 10, search?: string) =>
    api.get<{ data: PaymentRecord[]; total: number; page: number; limit: number }>(
      "/admin/payments",
      { params: { page, limit, search } },
    ),
};
