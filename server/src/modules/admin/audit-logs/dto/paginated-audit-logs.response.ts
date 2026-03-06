// Typed response shape for all paginated audit log queries.
// Keeps the API contract explicit and avoids returning raw Prisma models.

export interface AuditLogItem {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  actorId: string | null;
  actorRole: string | null;
  createdAt: Date;
  // metadata is intentionally omitted from list view — fetch one by ID to get it
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedAuditLogsResponse {
  data: AuditLogItem[];
  meta: PaginatedMeta;
}
