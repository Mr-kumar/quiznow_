import { useQuery } from "@tanstack/react-query";
import { adminQuestionsApi } from "@/api/questions";
import { questionKeys } from "@/api/query-keys";

export function useQuestion(id: string) {
  return useQuery({
    queryKey: questionKeys.detail(id),
    queryFn: async () => {
      const res = await adminQuestionsApi.getById(id);
      return (res.data as any)?.data ?? res.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

// Cursor-based pagination for large datasets
interface UseCursorQuestionsParams {
  cursor?: string;
  limit?: number;
  direction?: "forward" | "backward";
  search?: string;
  topicId?: string;
  subject?: string;
  lang?: string;
}

export function useCursorQuestions(params: UseCursorQuestionsParams = {}) {
  const {
    cursor,
    limit = 50,
    direction = "forward",
    search,
    topicId,
    subject,
    lang = "en",
  } = params;

  return useQuery({
    queryKey: questionKeys.cursor({
      cursor,
      limit,
      direction,
      search,
      topicId,
      subject,
      lang,
    }),
    queryFn: async () => {
      try {
        const res = await adminQuestionsApi.getCursorPaginated({
          cursor,
          limit,
          direction,
          search: search || undefined,
          topicId: topicId || undefined,
          subject: subject || undefined,
          lang,
        });
        return res.data;
      } catch (error) {
        console.error("Questions API Error:", error);
        throw error;
      }
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 1, // 1 min - fresher for cursor pagination
  });
}
