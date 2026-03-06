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

        console.log("Raw API response:", response);
        console.log("Response status:", response.status);
        console.log("Response data:", response.data);

        if (response.status === 401 || response.status === 403) {
          setError("Authentication required. Please log in again.");
          setData([]);
          return;
        }

        if (!response.data || !Array.isArray(response.data.data)) {
          console.error("Backend response structure:", response);
          console.error("response.data:", response.data);
          console.error("response.data.data:", response.data?.data);
          setError("Unexpected response from server. Please try again.");
          setData([]);
          return;
        }

        if (direction === "forward") {
          if (resetCursor !== undefined) {
            // Fresh load (filter/search changed or explicit reset)
            setData(response.data.data);
          } else {
            // Load-more: append
            setData((prev) => [...prev, ...response.data.data]);
          }
          // Store next cursor in ref — does NOT trigger re-render
          cursorRef.current = response.data.pagination?.nextCursor || undefined;
        } else {
          setData((prev) => [...response.data.data, ...prev]);
          cursorRef.current = response.data.pagination?.prevCursor || undefined;
        }

        setHasMore(response.data.pagination?.hasMore ?? false);
        setTotal(response.data.pagination?.total ?? 0);
      } catch (err) {
        const message =
          err !== null &&
          typeof err === "object" &&
          "response" in err &&
          (err as any).response?.data?.message
            ? (err as any).response.data.message
            : "Failed to fetch questions";
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
