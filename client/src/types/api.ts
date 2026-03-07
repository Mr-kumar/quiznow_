export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Typed API error — use this instead of `error: any`
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
