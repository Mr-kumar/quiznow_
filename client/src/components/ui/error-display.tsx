"use client";

import { AlertCircle, X, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "./button";
import { Alert, AlertDescription, AlertTitle } from "./alert";

export type ErrorType = "error" | "warning" | "info" | "success";

interface ErrorDisplayProps {
  type?: ErrorType;
  title: string;
  message?: string;
  details?: string | string[];
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  className?: string;
}

const errorConfig = {
  error: {
    icon: AlertCircle,
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    titleClassName: "text-red-800 dark:text-red-200",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200",
    titleClassName: "text-orange-800 dark:text-orange-200",
  },
  info: {
    icon: Info,
    className:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
    titleClassName: "text-blue-800 dark:text-blue-200",
  },
  success: {
    icon: CheckCircle,
    className:
      "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
    titleClassName: "text-green-800 dark:text-green-200",
  },
};

export function ErrorDisplay({
  type = "error",
  title,
  message,
  details,
  action,
  onClose,
  className,
}: ErrorDisplayProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <Alert className={`${config.className} ${className || ""}`}>
      <Icon className="h-4 w-4" />
      <div className="flex-1">
        <AlertTitle className={config.titleClassName}>{title}</AlertTitle>
        {message && <AlertDescription>{message}</AlertDescription>}
        {details && (
          <AlertDescription className="mt-2">
            {Array.isArray(details) ? (
              <ul className="list-disc list-inside space-y-1 text-sm">
                {details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm font-mono bg-black/5 dark:bg-white/5 p-2 rounded mt-1">
                {details}
              </div>
            )}
          </AlertDescription>
        )}
        {action && (
          <div className="mt-3">
            <Button
              variant={type === "error" ? "destructive" : "default"}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}

// Specialized error components for common scenarios
export function ValidationError({
  errors,
  onRetry,
}: {
  errors: string[];
  onRetry?: () => void;
}) {
  return (
    <ErrorDisplay
      type="warning"
      title="Validation Issues Found"
      message="Please fix the following issues:"
      details={errors}
      action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
    />
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      type="error"
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection."
      details="This could be due to network issues or server maintenance."
      action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
    />
  );
}

export function ValidationErrorDisplay({
  error,
  onRetry,
}: {
  error: any;
  onRetry?: () => void;
}) {
  const extractErrors = (err: any): string[] => {
    if (Array.isArray(err))
      return err.map((e) =>
        typeof e === "string" ? e : e.message || String(e),
      );
    if (err?.message) return [err.message];
    if (typeof err === "string") return [err];
    return ["An unknown error occurred"];
  };

  const errors = extractErrors(error);

  return (
    <ErrorDisplay
      type="warning"
      title="Validation Failed"
      message="Please address the following issues:"
      details={errors}
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
    />
  );
}

export function ServerError({
  error,
  onRetry,
}: {
  error: any;
  onRetry?: () => void;
}) {
  const getMessage = (err: any): string => {
    if (err?.response?.data?.message) return err.response.data.message;
    if (err?.message) return err.message;
    if (typeof err === "string") return err;
    return "An unexpected server error occurred";
  };

  const getDetails = (err: any): string | undefined => {
    if (err?.response?.data?.error) return err.response.data.error;
    if (err?.response?.status) return `Status: ${err.response.status}`;
    return undefined;
  };

  return (
    <ErrorDisplay
      type="error"
      title="Server Error"
      message={getMessage(error)}
      details={getDetails(error)}
      action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
    />
  );
}
