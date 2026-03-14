import api from "@/lib/api";

// Server GET /admin/settings returns a plain key-value object:
// { "system.siteName": "QuizNow", "system.tagline": "...", ... }
export type SettingsMap = Record<string, any>;

// For display/editing we convert the flat map to this shape
export interface AppSetting {
  id?: string; // Some consumers might send id
  key: string;
  value: any;
}

export const adminSettingsApi = {
  // Returns flat object: { "key": "value", ... }
  getAll: () => api.get<SettingsMap>("/admin/settings"),

  // POST /admin/settings  body: { key, value }
  update: (key: string, value: any) =>
    api.post<AppSetting>("/admin/settings", { key, value }),

  // POST /admin/settings/batch  body: [{ key, value }, ...]
  updateBatch: (updates: AppSetting[]) =>
    api.post<AppSetting[]>("/admin/settings/batch", updates),

  // DELETE /admin/settings/:key
  delete: (key: string) => api.delete(`/admin/settings/${key}`),
};
