import { useState, useCallback, useEffect, useRef } from "react";
import {
  adminQuestionsApi,
  type CursorPaginationParams,
  type CursorPaginationResponse,
  type Question,
} from "@/api/questions";
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
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [limit] = useState(initialLimit);

  const [filters, setFilters] = useState({
    search: initialSearch,
    topicId: initialTopicId,
    subject: initialSubject,
    lang: initialLang,
  });

  const debouncedSearch = useDebounce(filters.search, 400);

  // ── ROOT FIX: cursor as a ref, NOT state ─────────────────────────────────
  // Using useState for cursor caused fetch() to be recreated on every API
  // response (because cursor changed), which recreated loadMore(), which
  // triggered the IntersectionObserver, which called loadMore() again → crash.
  const cursorRef = useRef<string | undefined>(undefined);

  // Guard against concurrent fetches
  const isFetchingRef = useRef(false);

  const fetch = useCallback(
    async (
      direction: "forward" | "backward" = "forward",
      resetCursor?: string,
    ) => {
      // Prevent concurrent requests
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const params: CursorPaginationParams = {
          // If resetCursor is explicitly passed (even as ""), use it.
          // Otherwise use the ref value for load-more.
          cursor:
            resetCursor !== undefined
              ? resetCursor || undefined
              : cursorRef.current,
          limit,
          direction,
          search: debouncedSearch,
          topicId: filters.topicId || undefined,
          subject: filters.subject || undefined,
          lang: filters.lang || undefined,
        };

        const response = await adminQuestionsApi.getCursorPaginated(params);

        if (!response.data || !Array.isArray(response.data.data)) {
          setError("Unexpected response from server. Please try again.");
          setData([]);
          return;
        }

        if (direction === "forward") {
          if (resetCursor !== undefined) {
            // Fresh load (filter/search changed or explicit reset)
            setData(response.data.data);
          } else {
            // Load-more: append, but prevent duplicates
            setData((prev) => {
              const existingIds = new Set(prev.map((q) => q.id));
              const newQuestions = response.data.data.filter(
                (q) => !existingIds.has(q.id),
              );
              return [...prev, ...newQuestions];
            });
          }
          // Store next cursor in ref — does NOT trigger re-render
          cursorRef.current = response.data.pagination?.nextCursor || undefined;
        } else {
          setData((prev) => {
            const existingIds = new Set(prev.map((q) => q.id));
            const newQuestions = response.data.data.filter(
              (q) => !existingIds.has(q.id),
            );
            return [...newQuestions, ...prev];
          });
          cursorRef.current = response.data.pagination?.prevCursor || undefined;
        }

        setHasMore(response.data.pagination?.hasMore ?? false);
        setTotal(response.data.pagination?.total ?? 0);
      } catch (err) {
        // Handle different error scenarios
        let message = "Failed to fetch questions";

        if (err !== null && typeof err === "object" && "response" in err) {
          const axiosError = err as any;
          if (axiosError.response?.data?.message) {
            message = axiosError.response.data.message;
          } else if (axiosError.response?.status === 401) {
            message = "Authentication required. Please log in again.";
          } else if (axiosError.response?.status === 403) {
            message =
              "Access denied. You don't have permission to view these questions.";
          } else if (axiosError.response?.status >= 500) {
            message = "Server error. Please try again later.";
          }
        } else if (err instanceof Error) {
          message = err.message || message;
        }

        setError(message);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    // ── KEY: cursor is NOT in deps — it lives in cursorRef ─────────────────
    // Only things that actually change the query are here.
    [debouncedSearch, filters.topicId, filters.subject, filters.lang, limit],
  );

  // ── Effect: re-fetch on filter/search changes ─────────────────────────────
  // filters.search is intentionally NOT here — debouncedSearch covers it.
  // Having both caused a double-fetch on every keystroke.
  useEffect(() => {
    cursorRef.current = undefined; // reset cursor on filter change
    fetch("forward", ""); // pass "" so resetCursor !== undefined
  }, [
    debouncedSearch,
    filters.topicId,
    filters.subject,
    filters.lang,
    limit,
    // fetch is stable because cursor is no longer in its deps
  ]);

  // ── Public API ────────────────────────────────────────────────────────────

  const loadMore = useCallback(() => {
    // hasMore and loading checked here at call time (not stale closure)
    if (!isFetchingRef.current) {
      fetch("forward");
    }
  }, [fetch]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    // The useEffect above will pick up the change and reset cursor
  }, []);

  const reset = useCallback(() => {
    cursorRef.current = undefined;
    setData([]);
    setHasMore(true);
    fetch("forward", "");
  }, [fetch]);

  return {
    data,
    loading,
    error,
    filters,
    hasMore,
    total,
    loadMore,
    updateFilters,
    reset,
  };
}
