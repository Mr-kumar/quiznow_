import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminSubjectsApi } from "@/api/subjects";
import { adminTopicsApi } from "@/api/subjects";
import { subjectKeys } from "@/api/query-keys";
import { parseApiError } from "@/lib/errors";
import { unwrap } from "@/lib/unwrap";
import type { Subject, Topic } from "@/api/subjects";

// ─── Subjects ─────────────────────────────────────────────────────────────────

export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.lists(),
    queryFn: async () => unwrap<Subject[]>(await adminSubjectsApi.getAll()),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: subjectKeys.detail(id),
    queryFn: async () => unwrap<Subject>(await adminSubjectsApi.getById(id)),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; isActive?: boolean }) =>
      adminSubjectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
      toast.success("Subject created");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; isActive?: boolean };
    }) => adminSubjectsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subjectKeys.detail(id) });
      toast.success("Subject updated");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminSubjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
      toast.success("Subject deleted");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}

// ─── Topics ───────────────────────────────────────────────────────────────────

export function useTopics() {
  return useQuery({
    queryKey: ["topics"],
    queryFn: async () => unwrap<Topic[]>(await adminTopicsApi.getAll()),
    staleTime: 1000 * 60 * 3,
  });
}

export function useTopic(id: string) {
  return useQuery({
    queryKey: ["topic", id],
    queryFn: async () => unwrap<Topic>(await adminTopicsApi.getById(id)),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      subjectId: string;
      parentId?: string;
    }) => adminTopicsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      toast.success("Topic created");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; subjectId?: string; parentId?: string };
    }) => adminTopicsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["topic", id] });
      toast.success("Topic updated");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminTopicsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      toast.success("Topic deleted");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}
