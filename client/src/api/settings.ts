import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

// Server returns key-value object, not array
export type AppSettings = Record<string, any>;

export const adminSettingsApi = {
  getAll: () => api.get<AppSettings>("/admin/settings"),

  getByKey: (key: string) =>
    api.get<{ key: string; value: any }>(`/admin/settings/${key}`),

  update: (key: string, value: any) =>
    api.post<{ key: string; value: any }>("/admin/settings", { key, value }),

  updateBatch: (updates: Array<{ key: string; value: any }>) =>
    api.post<{ key: string; value: any }[]>("/admin/settings/batch", updates),

  delete: (key: string) => api.delete<void>(`/admin/settings/${key}`),
};
