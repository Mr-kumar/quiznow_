"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export type ErrorHandlerOptions = {
  showToast?: boolean;
  logToConsole?: boolean;
  fallbackMessage?: string;
  duration?: number;
};

export function useErrorHandler() {
  const { toast } = useToast();
  const [errors, setErrors] = useState<
    Array<{ id: string; error: any; type: string }>
  >([]);

  const handleError = useCallback(
    (error: any, options: ErrorHandlerOptions = {}) => {
      const {
        showToast = true,
        logToConsole = true,
        fallbackMessage = "An unexpected error occurred",
        duration = 5000,
      } = options;

      // Log to console for debugging
      if (logToConsole) {
        console.error("Error caught by useErrorHandler:", error);
      }

      // Extract meaningful error information
      const errorInfo = extractErrorInfo(error, fallbackMessage);

      // Add to error state for UI display
      const errorId = Math.random().toString(36).substr(2, 9);
      setErrors((prev) => [
        ...prev,
        { id: errorId, error: errorInfo, type: errorInfo.type },
      ]);

      // Show toast notification
      if (showToast) {
        toast({
          title: errorInfo.title,
          description: errorInfo.message,
          variant: errorInfo.type === "success" ? "default" : "destructive",
        });
      }

      return errorInfo;
    },
    [toast],
  );

  const clearError = useCallback((id?: string) => {
    if (id) {
      setErrors((prev) => prev.filter((e) => e.id !== id));
    } else {
      setErrors([]);
    }
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    handleError,
    errors,
    clearError,
    clearAllErrors,
  };
}

function extractErrorInfo(error: any, fallbackMessage: string) {
  // Handle empty or undefined errors
  if (
    !error ||
    (typeof error === "object" && Object.keys(error).length === 0)
  ) {
    return {
      type: "error",
      title: "Error",
      message: fallbackMessage || "An unexpected error occurred.",
      details: "No additional error information was provided.",
      action: "Try Again",
    };
  }

  // Network errors
  if (error?.code === "NETWORK_ERROR" || error?.message?.includes("fetch")) {
    return {
      type: "error",
      title: "Network Error",
      message:
        "Unable to connect to the server. Please check your internet connection.",
      details: "This could be due to network issues or server maintenance.",
      action: "Retry",
    };
  }

  // Validation errors (NestJS class-validator)
  if (
    error?.response?.data?.message &&
    Array.isArray(error.response.data.message)
  ) {
    return {
      type: "warning",
      title: "Validation Failed",
      message: "Please address the following issues:",
      details: error.response.data.message,
      action: "Fix Issues",
    };
  }

  // HTTP status errors
  if (error?.response?.status) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;

    switch (status) {
      case 400:
        return {
          type: "warning",
          title: "Bad Request",
          message: message || "The request was invalid.",
          details: error.response.data?.error,
          action: "Check Input",
        };
      case 401:
        return {
          type: "error",
          title: "Unauthorized",
          message: "You need to log in to access this resource.",
          details: "Please log in again and try.",
          action: "Login",
        };
      case 403:
        return {
          type: "error",
          title: "Access Denied",
          message: "You don't have permission to perform this action.",
          details:
            "Contact your administrator if you believe this is an error.",
          action: "Contact Admin",
        };
      case 404:
        return {
          type: "error",
          title: "Not Found",
          message: "The requested resource was not found.",
          details: error.response.data?.error,
          action: "Check URL",
        };
      case 422:
        return {
          type: "warning",
          title: "Validation Error",
          message: message || "The provided data is invalid.",
          details: error.response.data?.details || error.response.data?.error,
          action: "Fix Data",
        };
      case 429:
        return {
          type: "warning",
          title: "Too Many Requests",
          message: "Please wait before trying again.",
          details: "Rate limit exceeded. Try again later.",
          action: "Wait",
        };
      case 500:
        return {
          type: "error",
          title: "Server Error",
          message: "An internal server error occurred.",
          details:
            error.response.data?.error ||
            "The server encountered an unexpected error.",
          action: "Try Again",
        };
      default:
        return {
          type: "error",
          title: "HTTP Error",
          message: message || `HTTP ${status} error occurred.`,
          details: error.response.data?.error,
          action: "Retry",
        };
    }
  }

  // Prisma errors
  if (error?.code?.startsWith("P")) {
    switch (error.code) {
      case "P2002":
        return {
          type: "warning",
          title: "Duplicate Entry",
          message: "This record already exists.",
          details: error.meta?.target || "A unique constraint was violated.",
          action: "Check Data",
        };
      case "P2025":
        return {
          type: "error",
          title: "Record Not Found",
          message: "The requested record was not found.",
          details:
            error.meta?.cause ||
            "No record found with the provided identifier.",
          action: "Check ID",
        };
      default:
        return {
          type: "error",
          title: "Database Error",
          message: "A database error occurred.",
          details: error.message,
          action: "Try Again",
        };
    }
  }

  // Generic error fallback
  return {
    type: "error",
    title: "Error",
    message: error?.message || fallbackMessage,
    details: error?.stack || error?.toString(),
    action: "Try Again",
  };
}

// Specialized error handlers for common scenarios
export const errorHandlers = {
  network: (error: any) => ({
    type: "error" as const,
    title: "Network Error",
    message:
      "Unable to connect to the server. Please check your internet connection.",
    details:
      error?.message ||
      "This could be due to network issues or server maintenance.",
    action: "Retry",
  }),

  validation: (error: any) => ({
    type: "warning" as const,
    title: "Validation Failed",
    message: "Please address the following issues:",
    details: Array.isArray(error?.response?.data?.message)
      ? error.response.data.message
      : [error?.message || "Invalid data provided"],
    action: "Fix Issues",
  }),

  upload: (error: any) => {
    if (error?.response?.data?.message?.includes("topic")) {
      return {
        type: "warning" as const,
        title: "Topic Error",
        message: "There's an issue with the topic selection.",
        details: error.response.data.message,
        action: "Check Topic",
      };
    }

    if (error?.response?.data?.message?.includes("file")) {
      return {
        type: "warning" as const,
        title: "File Error",
        message: "There's an issue with the uploaded file.",
        details: error.response.data.message,
        action: "Check File",
      };
    }

    return {
      type: "error" as const,
      title: "Upload Failed",
      message: "Failed to upload the file.",
      details: error?.response?.data?.message || error?.message,
      action: "Try Again",
    };
  },

  auth: (error: any) => ({
    type: "error" as const,
    title: "Authentication Error",
    message: "You need to be logged in to perform this action.",
    details: error?.message || "Session expired or invalid credentials.",
    action: "Login",
  }),
};
