import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminSettingsApi } from "@/api/settings";
import { settingsKeys } from "@/api/query-keys";
import { parseApiError } from "@/lib/errors";
import { unwrap } from "@/lib/unwrap";
import type { AppSetting } from "@/api/settings";

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all(),
    queryFn: async () => unwrap<AppSetting[]>(await adminSettingsApi.getAll()),
    staleTime: 1000 * 60 * 10, // settings change rarely
  });
}

export function useSettingsByCategory(category: string) {
  return useQuery({
    queryKey: [...settingsKeys.all(), "category", category] as const,
    queryFn: async () => {
      const allSettings = unwrap<AppSetting>(await adminSettingsApi.getAll());
      // Filter by category - since server returns key-value, we need to handle this client-side
      // For now, return all settings since category filtering isn't supported by server
      return allSettings;
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 10,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      adminSettingsApi.update(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all() });
      toast.success("Setting saved");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}

export function useUpdateSettingsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: { key: string; value: any }[]) =>
      adminSettingsApi.updateBatch(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all() });
      toast.success("Settings saved");
    },
    onError: (error: unknown) => toast.error(parseApiError(error).message),
  });
}

// resetToDefaults is not supported by server
