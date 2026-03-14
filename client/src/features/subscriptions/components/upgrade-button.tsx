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

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function UpgradeButton({
  planId,
  planName,
  price,
  className,
}: UpgradeButtonProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { pay, loading } = usePayment({
    onSuccess: async () => {
      // Invalidate the subscription cache instantly so the golden dashboard appears
      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      
      toast.success("🎉 Subscribed!", {
        description: `You are now subscribed to ${planName}. Redirecting to dashboard...`,
      });
      
      // Auto-redirect to the dashboard so they can see their new premium UI
      router.push("/dashboard");
    },
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
