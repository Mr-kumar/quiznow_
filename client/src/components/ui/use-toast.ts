import { useState, useCallback } from "react";

export interface Toast {
  id?: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "destructive";
}

export interface ToastState {
  toasts: Toast[];
}

let toastCount = 0;

export function toast({ title, description, variant = "default" }: Toast) {
  const id = (++toastCount).toString();
  const toastElement = document.createElement("div");
  toastElement.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-sm ${
    variant === "destructive"
      ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
      : "bg-white border-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-50"
  }`;
  toastElement.innerHTML = `
    <div class="flex flex-col space-y-1">
      ${title ? `<div class="font-semibold">${title}</div>` : ""}
      ${description ? `<div class="text-sm opacity-90">${description}</div>` : ""}
    </div>
  `;

  document.body.appendChild(toastElement);

  setTimeout(() => {
    toastElement.remove();
  }, 3000);
}

export function useToast() {
  return { toast };
}
