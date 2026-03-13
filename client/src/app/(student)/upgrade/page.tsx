'use client';

import { useQuery } from '@tanstack/react-query';
import { adminPlansApi } from '@/api/plans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircleIcon, CheckIcon, CrownIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UpgradeButton } from '@/features/subscriptions/components/upgrade-button';
import { Badge } from '@/components/ui/badge';
import type { Plan } from '@/api/plans';

export default function UpgradePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-plans'],
    queryFn: () => adminPlansApi.getAll(1, 100).then((res: any) => res.data),
  });

  const plans = Array.isArray(data) ? data : ((data as any)?.data ?? []);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-4 text-center">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[400px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load subscription plans. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl flex items-center justify-center gap-3">
          <CrownIcon className="h-10 w-10 text-amber-500" />
          Upgrade to Premium
        </h1>
        <p className="text-xl text-muted-foreground">
          Unlock unlimited access to all premium tests, advanced analytics, and priority features.
        </p>
      </div>

      {/* Test Mode Notice */}
      <Alert className="bg-blue-50/50 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300">
        <AlertCircleIcon className="h-4 w-4 stroke-current" />
        <AlertTitle>Test Mode Active</AlertTitle>
        <AlertDescription>
          This integration is in test mode. Please use the Razorpay test card details: <br />
          Card Number: <strong>4111 1111 1111 1111</strong>, Expiry: <strong>12/28</strong>, CVV: <strong>123</strong>
        </AlertDescription>
      </Alert>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        {plans.map((plan: Plan) => (
          <Card
            key={plan.id}
            className="relative flex flex-col border-2 border-transparent hover:border-primary/50 transition-all shadow-md hover:shadow-xl"
          >
            {plan.durationDays > 30 && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white border-0">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <div className="mt-4 flex items-baseline justify-center gap-x-2">
                <span className="text-5xl font-extrabold tracking-tight">₹{plan.price}</span>
                <span className="text-sm font-semibold leading-6 text-muted-foreground">
                  / {plan.durationDays} days
                </span>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-4 text-sm leading-6 text-muted-foreground mb-8 flex-1">
                <li className="flex gap-x-3">
                  <CheckIcon className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                  Unlimited premium tests
                </li>
                <li className="flex gap-x-3">
                  <CheckIcon className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                  Detailed performance analytics
                </li>
                <li className="flex gap-x-3">
                  <CheckIcon className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                  Personalised weak area insights
                </li>
                <li className="flex gap-x-3">
                  <CheckIcon className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                  Priority support
                </li>
              </ul>
              <UpgradeButton
                planId={plan.id}
                planName={plan.name}
                price={plan.price}
                className="w-full mt-auto"
              />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {plans.length === 0 && (
        <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl">
          No premium plans are available at the moment.
        </div>
      )}
    </div>
  );
}
