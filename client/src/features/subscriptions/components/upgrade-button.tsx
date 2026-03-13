'use client';

import { usePayment } from '@/hooks/use-payment';
import { Button } from '@/components/ui/button';
import { ZapIcon, Loader2Icon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();

  const { pay, loading } = usePayment({
    onSuccess: () =>
      toast({
        title: '🎉 Subscribed!',
        description: `You are now subscribed to ${planName}.`,
      }),
    onError: (msg) =>
      toast({
        title: 'Payment failed',
        description: msg,
        variant: 'destructive',
      }),
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
      {loading ? 'Processing…' : `Get ${planName} — ₹${price}`}
    </Button>
  );
}
