import type { ApiError } from "@/types/api";

export function parseApiError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosErr = error as any;
    return {
      message: axiosErr.response?.data?.message ?? "An error occurred",
      statusCode: axiosErr.response?.status ?? 500,
      errors: axiosErr.response?.data?.errors,
    };
  }
  return { message: "Network error", statusCode: 0 };
}
