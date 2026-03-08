import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminQuestionsApi } from "@/api/questions";
import { questionKeys } from "@/api/query-keys";
import { parseApiError } from "@/lib/errors";
import type {
  CreateQuestionRequest,
  UpdateQuestionRequest,
} from "@/api/questions";

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminQuestionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      toast.success("Question created successfully");
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionRequest }) =>
      adminQuestionsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(id) });
      toast.success("Question updated successfully");
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminQuestionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      toast.success("Question deleted");
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}

export function useSoftDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminQuestionsApi.softDelete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(id) });
      toast.success("Question deactivated");
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}

export function useBulkTagQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionIds,
      topicId,
    }: {
      questionIds: string[];
      topicId: string;
    }) => adminQuestionsApi.bulkTag(questionIds, topicId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      const count = data?.data?.updatedCount ?? data?.updatedCount ?? "?";
      toast.success(`${count} questions reassigned`);
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}

export function useBulkUploadQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      sectionId,
      topicId,
    }: {
      file: File;
      sectionId: string;
      topicId?: string;
    }) =>
      // ✅ FIX: Pass topicId through — the original hook silently dropped it.
      adminQuestionsApi.bulkUpload(file, sectionId, topicId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      const count = data?.data?.count ?? data?.count ?? "?";
      toast.success(`${count} questions uploaded`);
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}
