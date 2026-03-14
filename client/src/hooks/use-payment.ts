"use client";

import { useState, useCallback } from "react";
import { useRazorpay } from "./use-razorpay";
import { paymentsApi } from "@/api/payments";
import { useRouter } from "next/navigation";

interface UsePaymentOptions {
  onSuccess?: () => void;
  onError?: (err: string) => void;
}

export function usePayment({ onSuccess, onError }: UsePaymentOptions = {}) {
  const { loaded } = useRazorpay();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pay = useCallback(
    async (planId: string) => {
      if (!loaded) {
        onError?.("Razorpay script not loaded yet. Please try again.");
        return;
      }

      setLoading(true);
      try {
        // Step 1: Create order on backend
        const { data: order } = await paymentsApi.createOrder(planId);

        if (order.isFree) {
          onSuccess?.();
          router.push("/dashboard?payment=success");
          return;
        }

        // Step 2: Open Razorpay checkout
        const rzp = new window.Razorpay({
          key: order.keyId || "",
          amount: order.amount,
          currency: order.currency || "INR",
          name: "QuizNow",
          description: `Subscribe to ${order.planName}`,
          order_id: order.orderId || "",
          prefill: {
            name: order.userName,
            email: order.userEmail,
          },
          theme: { color: "#6366f1" },

          handler: async (response) => {
            // Step 3: Verify payment on backend
            try {
              await paymentsApi.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              onSuccess?.();
              router.push("/dashboard?payment=success");
            } catch {
              onError?.("Payment verification failed. Contact support.");
            } finally {
              setLoading(false);
            }
          },

          modal: {
            ondismiss: () => setLoading(false),
          },
        });

        rzp.open();
      } catch (err: any) {
        setLoading(false);
        onError?.(err?.response?.data?.message ?? "Failed to initiate payment");
      }
    },
    [loaded, onSuccess, onError, router],
  );

  return { pay, loading };
}
