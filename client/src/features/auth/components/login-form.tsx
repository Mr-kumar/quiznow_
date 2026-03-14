"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Official Google brand colours — no extra package needed
function GoogleIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Human-readable messages for each error code the backend can send
const OAUTH_ERRORS: Record<string, string> = {
  google_denied: "Google sign-in was cancelled. Please try again.",
  oauth_failed: "Sign-in failed. Please try again.",
  token_invalid: "Something went wrong reading your session. Please try again.",
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const isDev = process.env.NODE_ENV === "development";

  // Read ?error= set by the backend callback or by auth/callback/page.tsx
  const oauthErrorCode = searchParams.get("error") ?? "";
  const oauthErrorMessage = OAUTH_ERRORS[oauthErrorCode] ?? "";

  // ── Google sign-in ─────────────────────────────────────────────────────────
  // No API call — just redirect the browser to the NestJS OAuth entry point.
  // NestJS handles everything from here; we wait for /auth/callback to come back.
  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL!;
  };

  // ── Dev email login ────────────────────────────────────────────────────────
  const handleDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setEmailError("");

    try {
      const { data } = await api.post("/auth/dev-login", { email });

      const jwtPayload = JSON.parse(
        atob(
          data.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
        ),
      );

      const user = {
        id: jwtPayload.sub,
        email: jwtPayload.email,
        name: jwtPayload.name ?? jwtPayload.email,
        role: jwtPayload.role,
      };

      const expiresIn = jwtPayload.exp
        ? jwtPayload.exp - Math.floor(Date.now() / 1000)
        : undefined;

      login(user, data.access_token, expiresIn);

      if (user.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setEmailError("Login failed. Check the email is in the database.");
    } finally {
      setIsEmailLoading(false);
    }
  };

  const isAnyLoading = isEmailLoading || isGoogleLoading;

  return (
    <Card className="w-full max-w-md border-zinc-200 shadow-xl dark:border-zinc-800 bg-white/50 backdrop-blur-sm dark:bg-black/50">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          Welcome back
        </CardTitle>
        <CardDescription className="text-center">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {/* OAuth error from backend redirect — shown when ?error= is in URL */}
        {oauthErrorMessage && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md border border-red-100 dark:border-red-900/50">
            {oauthErrorMessage}
          </div>
        )}

        {/* ── Google button ───────────────────────────────────────────────── */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 gap-2.5 text-sm font-medium"
          onClick={handleGoogleLogin}
          disabled={isAnyLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {isGoogleLoading ? "Redirecting to Google…" : "Continue with Google"}
        </Button>

        {/* ── Dev-only email form ─────────────────────────────────────────── */}
        {isDev && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-400">
                  Development only
                </span>
              </div>
            </div>

            <form onSubmit={handleDevSubmit} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="any email in the database"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isAnyLoading}
                  className="bg-white dark:bg-zinc-950"
                  required
                />
              </div>

              {emailError && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md border border-red-100 dark:bg-red-900/20 dark:border-red-900/50">
                  {emailError}
                </p>
              )}

              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={isAnyLoading}
              >
                {isEmailLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEmailLoading ? "Signing in…" : "Sign in (Dev)"}
              </Button>
            </form>
          </>
        )}
      </CardContent>

      <CardFooter />
    </Card>
  );
}
