"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    const exchangeCode = async () => {
      try {
        const res = await api.post("/auth/exchange", { code });
        const { access_token, expiresIn } = res.data;

        // Decode JWT payload — base64url → JSON
        const base64Payload = access_token
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/");

        const payload = JSON.parse(atob(base64Payload));

        const user = {
          id: payload.sub as string,
          email: payload.email as string,
          name: (payload.name ?? payload.email) as string,
          role: payload.role as "ADMIN" | "STUDENT" | "INSTRUCTOR",
          image: (payload.image as string) ?? undefined,
        };

        // Stores token in Zustand + localStorage + sets qn_token cookie
        login(user, access_token, expiresIn);

        // Same role-based redirect as login-form.tsx
        if (user.role === "ADMIN") {
          router.replace("/dashboard/admin");
        } else {
          router.replace("/dashboard");
        }
      } catch (err) {
        console.error("[auth/callback] Token exchange failed:", err);
        router.replace("/login?error=token_invalid");
      }
    };

    exchangeCode();
  }, [searchParams, login, router]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="h-10 w-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-xl shadow-lg">
        Q
      </div>
      <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Signing you in…
      </p>
      <Suspense fallback={null}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
