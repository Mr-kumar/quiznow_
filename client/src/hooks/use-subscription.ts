"use client";

import { useQuery } from "@tanstack/react-query";
import { studentUsersApi } from "@/api/student-users";
import { studentKeys } from "@/api/query-keys";

export function useSubscription() {
  const query = useQuery({
    queryKey: studentKeys.subscription(),
    queryFn: async () => {
      const res = await studentUsersApi.getMySubscription();
      // Student API returns { success: true, data: subscription | null } structure
      const response = res.data as any;
      return response?.data ?? response;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const subscription = query.data;

  // Check if the returned subscription is active and not expired
  const hasActiveSubscription =
    subscription &&
    subscription.status === "ACTIVE" &&
    new Date(subscription.expiresAt) > new Date();

  return {
    subscription, // this is the inner data (Subscription)
    isSubscribed: !!hasActiveSubscription,
    isLoading: query.isLoading,
    isError: query.isError,
    // Provide full query data for components that expect the outer object
    queryData: { data: subscription },
  };
}
