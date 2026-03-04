import { useState, useCallback, useEffect } from "react";
import {
  adminQuestionsApi,
  CursorPaginationParams,
  CursorPaginationResponse,
  Question,
} from "@/lib/admin-api";

interface UseCursorPaginationOptions {
  initialLimit?: number;
  initialSearch?: string;
  initialTopicId?: string;
  initialSubject?: string;
  initialLang?: string;
}

export function useCursorPagination(options: UseCursorPaginationOptions = {}) {
  const {
    initialLimit = 50,
    initialSearch = "",
    initialTopicId = "",
    initialSubject = "",
    initialLang = "en",
  } = options;

  const [data, setData] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<
    CursorPaginationResponse<Question>["pagination"]
  >({
    nextCursor: null,
    prevCursor: null,
    hasMore: true,
    hasPrevious: false,
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: initialLimit,
  });

  const [filters, setFilters] = useState({
    search: initialSearch,
    topicId: initialTopicId,
    subject: initialSubject,
    lang: initialLang,
  });

  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const fetch = useCallback(
    async (
      direction: "forward" | "backward" = "forward",
      resetCursor?: string,
    ) => {
      setLoading(true);
      setError(null);

      try {
        const params: CursorPaginationParams = {
          cursor: resetCursor !== undefined ? resetCursor : cursor,
          limit: pagination.limit,
          direction,
          search: filters.search || undefined,
          topicId: filters.topicId || undefined,
          subject: filters.subject || undefined,
          lang: filters.lang || undefined,
        };

        const response = await adminQuestionsApi.getCursorPaginated(params);

        // DEBUG: Log the response structure for troubleshooting
        console.log('API Response structure:', {
          hasData: !!response.data,
          hasDataData: !!(response.data && response.data.data),
          hasPagination: !!(response.data && response.data.pagination),
          dataIsArray: Array.isArray(response.data?.data),
          responseKeys: Object.keys(response),
          dataKeys: response.data ? Object.keys(response.data) : [],
          status: response.status,
          statusText: response.statusText
        });

        // Handle authentication failures and empty responses
        if (response.status === 401 || response.status === 403) {
          setError('Authentication required. Please log in again.');
          setData([]);
          return;
        }

        // Handle empty or invalid responses
        if (!response.data || Object.keys(response.data).length === 0) {
          setError('Server returned empty response. Please try again.');
          setData([]);
          return;
        }

        // SAFE ACCESS: Handle potential response structure issues
        if (response.data && Array.isArray(response.data.data)) {
          if (direction === "forward") {
            if (resetCursor !== undefined) {
              // Fresh load (new search or filter)
              setData(response.data.data);
            } else {
              // Load more (append)
              setData((prev) => [...prev, ...response.data.data]);
            }
            setCursor(response.data.pagination?.nextCursor || undefined);
          } else {
            // Load previous (prepend)
            setData((prev) => [...response.data.data, ...prev]);
            setCursor(response.data.pagination?.prevCursor || undefined);
          }

          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        } else {
          // Handle unexpected response structure
          console.error('Unexpected API response structure:', response);
          setError('Invalid response format from server');
          setData([]);
        }
      } catch (err) {
        const message =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          (err as any).response?.data?.message
            ? (err as any).response.data.message
            : "Failed to fetch data";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [cursor, filters, pagination.limit],
  );

  // Initial load
  useEffect(() => {
    fetch("forward", undefined);
  }, [
    filters.search,
    filters.topicId,
    filters.subject,
    filters.lang,
    pagination.limit,
  ]);

  // Load more
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetch("forward");
    }
  }, [pagination.hasMore, loading, fetch]);

  // Load previous
  const loadPrevious = useCallback(() => {
    if (pagination.hasPrevious && !loading) {
      fetch("backward");
    }
  }, [pagination.hasPrevious, loading, fetch]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCursor(undefined); // Reset cursor when filters change
  }, []);

  // Update limit
  const updateLimit = useCallback((newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    setCursor(undefined); // Reset cursor when limit changes
  }, []);

  // Reset to first page
  const reset = useCallback(() => {
    setCursor(undefined);
    setData([]);
    fetch("forward", undefined);
  }, [fetch]);

  return {
    data,
    loading,
    error,
    pagination,
    filters,
    loadMore,
    loadPrevious,
    updateFilters,
    updateLimit,
    reset,
    hasMore: pagination.hasMore,
    hasPrevious: pagination.hasPrevious,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    total: pagination.total,
  };
}
