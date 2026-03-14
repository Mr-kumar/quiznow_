"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { UpgradeButton } from "@/features/subscriptions/components/upgrade-button";

interface PlansCTAProps {
  planId: string;
  planName: string;
  price: number;
  ctaClass: string;
}

export function PlansCTA({ planId, planName, price, ctaClass }: PlansCTAProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <Link href="/login" className="mb-5 mt-2 block w-full">
        <Button className={`w-full gap-1.5 ${ctaClass}`}>
          Get Started
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Button>
      </Link>
    );
  }

  return (
    <UpgradeButton 
      planId={planId} 
      planName={planName} 
      price={price} 
      className={`w-full mb-5 mt-2 ${ctaClass}`} 
    />
  );
}
