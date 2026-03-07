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
      toast.success("Question deleted successfully");
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
      toast.success("Question soft deleted successfully");
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      toast.success("Questions bulk tagged successfully");
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
    }) => adminQuestionsApi.bulkUpload(file, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      toast.success("Questions bulk uploaded successfully");
    },
    onError: (error: unknown) => {
      const apiError = parseApiError(error);
      toast.error(apiError.message);
    },
  });
}
