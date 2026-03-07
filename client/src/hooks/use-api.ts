import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// Generic query hook
export function useApiQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    retry?: boolean | number;
  }
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

// Generic mutation hook
export function useApiMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: any, variables: V) => void;
    onSettled?: () => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      options?.onSuccess?.(data, variables);
      
      // Invalidate specified queries after successful mutation
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
    onError: options?.onError,
    onSettled: options?.onSettled,
  });
}

// Common GET query hook
export function useGetQuery<T>(
  endpoint: string,
  queryKey?: string[],
  options?: {
    enabled?: boolean;
    staleTime?: number;
    params?: Record<string, any>;
  }
) {
  const finalQueryKey = queryKey || [endpoint];
  
  return useQuery({
    queryKey: finalQueryKey,
    queryFn: () => api.get<T>(endpoint, { params: options?.params }).then(res => res.data),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime,
  });
}

// Common POST mutation hook
export function usePostMutation<T, V>(
  endpoint: string,
  options?: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: any, variables: V) => void;
    invalidateQueries?: string[][];
  }
) {
  return useApiMutation<T, V>(
    (variables) => api.post<T>(endpoint, variables).then(res => res.data),
    options
  );
}

// Common PUT mutation hook
export function usePutMutation<T, V>(
  endpoint: string,
  options?: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: any, variables: V) => void;
    invalidateQueries?: string[][];
  }
) {
  return useApiMutation<T, V>(
    (variables) => api.put<T>(endpoint, variables).then(res => res.data),
    options
  );
}

// Common DELETE mutation hook
export function useDeleteMutation<T>(
  endpoint: string,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.delete<T>(endpoint).then(res => res.data),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
      
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
    onError: options?.onError,
  });
}
