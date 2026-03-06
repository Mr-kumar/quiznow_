import { useState, useCallback, useEffect, useRef } from "react";
import {
  adminQuestionsApi,
  CursorPaginationParams,
  CursorPaginationResponse,
  Question,
} from "@/lib/admin-api";
import { useDebounce } from "./use-debounce";

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

  // 🛡️ CRITICAL FIX: Use ref for cursor to prevent infinite loop
  const cursorRef = useRef<string | undefined>(undefined);

  const [filters, setFilters] = useState({
    search: initialSearch,
    topicId: initialTopicId,
    subject: initialSubject,
    lang: initialLang,
  });

  // 🛡️ DEBOUNCE: Prevent search spam on every keystroke
  const debouncedSearch = useDebounce(filters.search, 400);

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
          // 🛡️ CRITICAL FIX: Use cursorRef instead of cursor state
          cursor: resetCursor !== undefined ? resetCursor : cursorRef.current,
          limit: pagination.limit,
          direction,
          search: debouncedSearch, // 🛡️ Use debounced search instead of raw search
          topicId: filters.topicId || undefined,
          subject: filters.subject || undefined,
          lang: filters.lang || undefined,
        };

        const response = await adminQuestionsApi.getCursorPaginated({
          ...params,
          search: debouncedSearch, // 🛡️ Use debounced search instead of raw search
        });

        // Handle authentication failures and empty responses
        if (response.status === 401 || response.status === 403) {
          setError("Authentication required. Please log in again.");
          setData([]);
          return;
        }

        // Handle empty or invalid responses
        if (!response.data || Object.keys(response.data).length === 0) {
          setError("Server returned empty response. Please try again.");
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
            // 🛡️ CRITICAL FIX: Update ref instead of state
            cursorRef.current =
              response.data.pagination?.nextCursor || undefined;
          } else {
            // Load previous (prepend)
            setData((prev) => [...response.data.data, ...prev]);
            cursorRef.current =
              response.data.pagination?.prevCursor || undefined;
          }

          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        } else {
          // Handle unexpected response structure
          console.error("Unexpected API response structure:", response);
          setError("Invalid response format from server");
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
    // 🛡️ CRITICAL FIX: Remove cursor from dependencies to prevent infinite loop
    [debouncedSearch, filters.topicId, filters.subject, pagination.limit], // cursor removed
  );

  // Initial load
  useEffect(() => {
    fetch("forward", undefined);
  }, [
    // 🛡️ FIX: Remove filters.search to prevent double fetch
    // filters.search, // ← causes immediate fetch on every keystroke
    filters.topicId,
    filters.subject,
    filters.lang,
    pagination.limit,
    debouncedSearch, // 🛡️ Only fetch after debounce
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
