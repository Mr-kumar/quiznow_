"use client";

import { useQuery } from "@tanstack/react-query";
import { studentUsersApi } from "@/api/student-users";

export function useSubscription() {
  const query = useQuery({
    queryKey: ["my-subscription"],
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
    subscription,
    isSubscribed: !!hasActiveSubscription,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
