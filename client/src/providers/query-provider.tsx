"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Time in milliseconds that inactive queries will remain in cache
            staleTime: 1000 * 60 * 5, // 5 minutes
            // Time in milliseconds that queries will be garbage collected
            gcTime: 1000 * 60 * 10, // 10 minutes
            // Number of times to retry failed requests
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors (client errors)
              if (
                error?.response?.status >= 400 &&
                error?.response?.status < 500
              ) {
                return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
            // Delay between retries in milliseconds
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            // Whether queries should refetch on window focus
            refetchOnWindowFocus: false,
            // Whether queries should refetch on reconnect
            refetchOnReconnect: true,
            // Whether queries should refetch on mount
            refetchOnMount: true,
          },
          mutations: {
            // Number of times to retry failed mutations
            retry: 1,
            // Whether mutations should be retried
            retryDelay: 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools
        initialIsOpen={false}
        position="right"
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  );
}
