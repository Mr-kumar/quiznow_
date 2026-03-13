import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge Middleware — runs before every matched request, at the CDN edge.
 *
 * Strategy:
 *  - Token is read from the Authorization header that Zustand stores in
 *    localStorage as "quiznow-storage". Because localStorage is not
 *    accessible in Edge middleware (server-side), we store the token ALSO
 *    in a cookie called "qn_token" on login (see stores/auth-store.ts note).
 *
 *  - Protected routes: /dashboard/** and /test/**
 *  - Admin routes: /dashboard/admin/** — require role ADMIN (decoded from JWT)
 *  - Redirect target: /login with ?from= so login can redirect back
 *
 * NOTE: This is a lightweight JWT check (signature NOT verified at edge —
 * that is done by the NestJS backend on every API call). We only check
 * expiry and role from the payload here for redirect UX.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTokenFromRequest(req: NextRequest): string | null {
  // Primary: cookie set by auth-store on login
  const cookie = req.cookies.get("qn_token")?.value;
  if (cookie) return cookie;

  // Fallback: Authorization header (for API calls that pass through)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: "ADMIN" | "STUDENT" | "INSTRUCTOR";
  exp: number;
  iat: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;

    // Edge runtime supports atob()
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  // payload.exp is in seconds, Date.now() is in milliseconds
  return Date.now() >= payload.exp * 1000;
}

// ── Route matchers ────────────────────────────────────────────────────────────

// W-8 FIX: Added /profile and /leaderboard to protected routes
const PROTECTED_PREFIXES = ["/dashboard", "/test", "/profile", "/leaderboard"] as const;

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/dashboard/admin");
}

// ── Middleware ─────────────────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip — not a protected route
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(req);

  // No token at all → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname); // preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeJwtPayload(token);

  // Malformed or undecodable token → redirect to login
  if (!payload) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    // Clear the bad cookie
    response.cookies.delete("qn_token");
    return response;
  }

  // Expired token → redirect to login
  if (isTokenExpired(payload)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    loginUrl.searchParams.set("reason", "expired");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("qn_token");
    return response;
  }

  // Admin route but user is not ADMIN → redirect to student dashboard
  if (isAdminRoute(pathname) && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // All good — pass request through, attach user info as headers
  // (useful for Server Components to read without re-decoding)
  const response = NextResponse.next();
  response.headers.set("x-user-id", payload.sub);
  response.headers.set("x-user-role", payload.role);
  response.headers.set("x-user-email", payload.email);

  return response;
}

// ── Config — which routes the middleware runs on ───────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - public assets (png, jpg, svg, etc.)
     *  - api routes    (Next.js route handlers — they handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)$).*)",
  ],
};
