/**
 * Normalise Axios response shapes.
 *
 * Handles both:
 *   AxiosResponse<T[]>                 → res.data is T[]
 *   AxiosResponse<ApiResponse<T>>      → res.data.data is T
 *   AxiosResponse<PaginatedResponse<T>>→ res.data.data is T[]
 *
 * Replaces 13 inline copies of: `(res.data as any)?.data ?? res.data`
 */
export function unwrap<T = any>(res: { data: any }): T {
  return (res.data as any)?.data ?? res.data;
}
