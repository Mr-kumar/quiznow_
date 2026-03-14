import api from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Subject, Topic } from "@/types/subjects";

export type { Subject, Topic };

export interface Question {
  id: string;
  hash: string;
  topicId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  translations: Array<{
    id: string;
    questionId: string;
    lang: "EN" | "HI";
    content: string;
    explanation?: string;
    imageUrl?: string;
  }>;
  options: Array<{
    id: string;
    questionId: string;
    order: number;
    isCorrect: boolean;
    createdAt: string;
    updatedAt: string;
    translations: Array<{
      id: string;
      optionId: string;
      lang: "EN" | "HI";
      text: string;
    }>;
  }>;
  topic?: {
    id: string;
    name: string;
    subject?: Subject;
  };
  _count?: {
    sectionLinks: number;
  };
  /** @deprecated use _count.sectionLinks */
  usageCount?: number;
}

export interface CreateQuestionRequest {
  content: string;
  type?: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty?: string;
  topicId?: string;
}

export interface UpdateQuestionRequest {
  content?: string;
  type?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  difficulty?: string;
  topicId?: string;
  isActive?: boolean;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  direction?: "forward" | "backward";
  search?: string;
  topicId?: string;
  subject?: string;
  lang?: string;
}

export interface CursorPaginationResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    prevCursor: string | null;
    hasMore: boolean;
    hasPrevious: boolean;
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
  };
}

export const questionsApi = {
  getCursorPaginated: (params: CursorPaginationParams = {}) =>
    api.get<CursorPaginationResponse<Question>>("/questions/cursor-paginated", {
      params: {
        cursor: params.cursor,
        limit: params.limit ?? 50,
        direction: params.direction ?? "forward",
        search: params.search,
        topicId: params.topicId,
        subject: params.subject,
        lang: params.lang,
      },
    }),
};

export const adminQuestionsApi = {
  // Cursor-based pagination (primary)
  getCursorPaginated: (params: CursorPaginationParams = {}) =>
    api.get<CursorPaginationResponse<Question>>("/questions/cursor-paginated", {
      params: {
        cursor: params.cursor,
        limit: params.limit ?? 50,
        direction: params.direction ?? "forward",
        search: params.search,
        topicId: params.topicId,
        subject: params.subject,
        lang: params.lang ?? "en",
      },
    }),

  // FIX: added topicId / subject / lang params (previously silently dropped)
  getAll: (
    page = 1,
    limit = 10,
    search?: string,
    topicId?: string,
    subject?: string,
    lang?: string,
  ) =>
    api.get<PaginatedResponse<Question>>("/questions", {
      params: { page, limit, search, topicId, subject, lang },
    }),

  getById: (id: string) => api.get<ApiResponse<Question>>(`/questions/${id}`),
  create: (questionData: CreateQuestionRequest) =>
    api.post<ApiResponse<Question>>("/questions", questionData),
  update: (id: string, questionData: UpdateQuestionRequest) =>
    api.patch<ApiResponse<Question>>(`/questions/${id}`, questionData),
  delete: (id: string) => api.delete<ApiResponse<void>>(`/questions/${id}`),

  softDelete: (id: string) =>
    api.patch<ApiResponse<Question>>(`/questions/${id}/soft-delete`, {}),

  bulkTag: (questionIds: string[], topicId: string) =>
    api.patch<{ success: boolean; updatedCount: number }>(
      "/questions/bulk-tag",
      { questionIds, topicId },
    ),

  bulkUpload: (file: File, sectionId: string, topicId?: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("sectionId", sectionId);
    if (topicId) form.append("topicId", topicId);
    return api.post<{ success: boolean; count: number }>(
      "/questions/upload",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },
};
