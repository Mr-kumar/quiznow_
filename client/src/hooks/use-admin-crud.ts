"use client";

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface UseListDataOptions {
  page?: number;
  limit?: number;
  search?: string;
}

interface ListDataResult {
  data: any[];
  total: number;
  page: number;
  limit: number;
}

export function useListData<T>(
  fetchFn: (options: UseListDataOptions) => Promise<ListDataResult>,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const loadData = useCallback(
    async (p = page, l = limit, s = search) => {
      setLoading(true);
      try {
        const result = await fetchFn({ page: p, limit: l, search: s });
        setData(result.data);
        setTotal(result.total);
        setPage(result.page);
        setLimit(result.limit);
      } catch (error: any) {
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, toast],
  );

  useEffect(() => {
    loadData(page, limit, search);
  }, [page, limit, search, loadData]);

  return {
    data,
    loading,
    total,
    page,
    limit,
    search,
    setPage,
    setLimit,
    setSearch,
    loadData: () => loadData(page, limit, search),
    refetch: () => loadData(page, limit, search),
  };
}

export function useCrudOperations<T>(
  createFn: (data: any) => Promise<any>,
  updateFn: (id: string, data: any) => Promise<any>,
  deleteFn: (id: string) => Promise<any>,
  onSuccess: () => void | Promise<void>,
) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const create = useCallback(
    async (data: any) => {
      setIsLoading(true);
      try {
        await createFn(data);
        toast({
          title: "Success",
          description: "Item created successfully",
        });
        await Promise.resolve(onSuccess());
        return true;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to create item",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [createFn, toast, onSuccess],
  );

  const update = useCallback(
    async (id: string, data: any) => {
      setIsLoading(true);
      try {
        await updateFn(id, data);
        toast({
          title: "Success",
          description: "Item updated successfully",
        });
        await Promise.resolve(onSuccess());
        return true;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to update item",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [updateFn, toast, onSuccess],
  );

  const remove = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        await deleteFn(id);
        toast({
          title: "Success",
          description: "Item deleted successfully",
        });
        await Promise.resolve(onSuccess());
        return true;
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to delete item",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [deleteFn, toast, onSuccess],
  );

  return {
    isLoading,
    create,
    update,
    remove,
  };
}
