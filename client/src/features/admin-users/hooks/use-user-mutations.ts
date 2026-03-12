import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminUsersApi } from "@/api/users";
import { userKeys } from "@/api/query-keys";
import { parseApiError } from "@/lib/errors";
import type { CreateUserRequest, UpdateUserRequest } from "@/api/users";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => adminUsersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User created successfully");
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      adminUsersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      toast.success("User updated successfully");
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminUsersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User deleted");
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "SUSPENDED" | "BANNED" }) =>
      adminUsersApi.updateStatus(id, status),
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      toast.success(`User status updated to ${status}`);
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}
