"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";

// Importing the shadcn components you installed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react"; // Standard icon library for Next.js

export default function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState(""); // BUG-8 FIX: Removed hardcoded prefill
  const [password, setPassword] = useState(""); // BUG-8 FIX: Added password field
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // BUG-8 FIX: Use proper login endpoint, fallback to dev-login only in dev
      const isDev = process.env.NODE_ENV === "development";
      const endpoint = isDev ? "/auth/dev-login" : "/auth/login";
      const payload = isDev ? { email } : { email, password };

      const { data } = await api.post(endpoint, payload);

      // 2. Decode JWT from server to get real user data
      const jwtPayload = JSON.parse(
        atob(
          data.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
        ),
      );

      // 3. Create user object from JWT payload
      const user = {
        id: jwtPayload.sub,
        email: jwtPayload.email,
        name: jwtPayload.name ?? jwtPayload.email,
        role: jwtPayload.role,
      };

      // BUG-4 FIX: Extract token expiry from JWT and pass to login()
      const expiresIn = jwtPayload.exp
        ? jwtPayload.exp - Math.floor(Date.now() / 1000)
        : undefined;

      // 4. Save to Zustand Store with expiry
      login(user, data.access_token, expiresIn);

      // 5. 🎯 Intelligent Redirect based on Role
      if (user.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isDev = process.env.NODE_ENV === "development";

  return (
    <Card className="w-full max-w-md border-zinc-200 shadow-xl dark:border-zinc-800 bg-white/50 backdrop-blur-sm dark:bg-black/50">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          Welcome back
        </CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to sign in to your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="bg-white dark:bg-zinc-950"
              required
            />
          </div>

          {/* BUG-8 FIX: Show password field (hidden in dev mode for convenience) */}
          {!isDev && (
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-white dark:bg-zinc-950"
                required={!isDev}
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md border border-red-100 dark:bg-red-900/20 dark:border-red-900/50">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
