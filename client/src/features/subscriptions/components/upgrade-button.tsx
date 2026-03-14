"use client";

import { usePayment } from "@/hooks/use-payment";
import { Button } from "@/components/ui/button";
import { ZapIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

interface UpgradeButtonProps {
  planId: string;
  planName: string;
  price: number;
  className?: string;
}

export function UpgradeButton({
  planId,
  planName,
  price,
  className,
}: UpgradeButtonProps) {
  const { pay, loading } = usePayment({
    onSuccess: () =>
      toast("🎉 Subscribed!", {
        description: `You are now subscribed to ${planName}.`,
      }),
    onError: (msg) => toast.error("Payment failed", { description: msg }),
  });

  return (
    <Button
      onClick={() => pay(planId)}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <ZapIcon className="h-4 w-4 mr-2" />
      )}
      {loading ? "Processing…" : `Get ${planName} — ₹${price}`}
    </Button>
  );
}
