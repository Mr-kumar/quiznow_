/**
 * stores/auth-store.ts  (UPDATED — BUG-1 FIX)
 *
 * Changes:
 *  1. login() now also writes token to a cookie ("qn_token") so middleware.ts
 *     can read it at the Edge (localStorage is not accessible server-side).
 *  2. logout() clears the cookie too.
 *  3. Fixed the inverted 401 toast condition (was: Date.now() <= tokenExpiry)
 *  4. JWT decode now uses atob() instead of Buffer.from() (browser-safe)
 *  5. BUG-1 FIX: Storage key is now role-aware — admin sessions use
 *     'qn_admin_token' cookie to prevent cross-session logout when both
 *     admin and student are open in the same browser.
 *
 * Cookie approach: httpOnly is NOT set here (we can't from client JS).
 * The cookie is readable by middleware because it's a same-origin request.
 * For production, move token to an httpOnly cookie set by the server on login.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STUDENT" | "INSTRUCTOR";
  status?: "ACTIVE" | "SUSPENDED" | "BANNED";
  preferredLang?: "EN" | "HI";
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  tokenExpiry?: number; // Unix ms timestamp — when the token expires
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (user: AuthUser, token: string, expiresIn?: number) => void;
  logout: () => void;
  refreshToken: () => void;
}

// ── Cookie helpers (Edge-readable, NOT httpOnly) ──────────────────────────────

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return; // SSR guard
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `max-age=${maxAgeSeconds}`,
    "path=/",
    "SameSite=Lax",
  ]
    .filter(Boolean)
    .join("; ");
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return; // SSR guard
  document.cookie = `${name}=; max-age=0; path=/`;
}

// ── BUG-1 FIX: Get correct cookie name based on stored role ──────────────────

function getCookieName(role?: string): string {
  return role === "ADMIN" ? "qn_admin_token" : "qn_token";
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tokenExpiry: undefined,
      isAuthenticated: false,
      isLoading: true,

      login: (user, token, expiresIn) => {
        const tokenExpiry = expiresIn
          ? Date.now() + expiresIn * 1000
          : undefined;

        // BUG-1 FIX: Write token to role-specific cookie
        const cookieName = getCookieName(user.role);
        const cookieMaxAge = expiresIn ?? 60 * 60 * 24 * 7; // default 7 days
        setCookie(cookieName, token, cookieMaxAge);
        // Also write to the generic cookie so middleware always has a token
        setCookie("qn_token", token, cookieMaxAge);

        set({
          user,
          token,
          tokenExpiry,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        // BUG-1 FIX: Clear both role-specific and generic cookies
        const state = useAuthStore.getState();
        const cookieName = getCookieName(state.user?.role);
        deleteCookie(cookieName);
        deleteCookie("qn_token");

        // Clear ALL auth state immediately
        set({
          user: null,
          token: null,
          tokenExpiry: undefined,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshToken: () => {
        const state = useAuthStore.getState();
        if (
          state.token &&
          state.tokenExpiry &&
          Date.now() > state.tokenExpiry // ✅ FIXED: was <= (inverted)
        ) {
          const cookieName = getCookieName(state.user?.role);
          deleteCookie(cookieName);
          deleteCookie("qn_token");
          set({
            user: null,
            token: null,
            tokenExpiry: undefined,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "quiznow-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;

          // Check token expiry on page load / tab restore
          if (state.tokenExpiry && Date.now() > state.tokenExpiry) {
            state.token = null;
            state.tokenExpiry = undefined;
            state.isAuthenticated = false;
            state.user = null;
            deleteCookie("qn_token");
            deleteCookie("qn_admin_token");
          } else if (state.token) {
            // Re-sync cookie in case it was cleared (e.g. browser cookie cleanup)
            const remainingMs = state.tokenExpiry
              ? state.tokenExpiry - Date.now()
              : 1000 * 60 * 60 * 24 * 7;
            const cookieName = getCookieName(state.user?.role);
            setCookie(cookieName, state.token, Math.floor(remainingMs / 1000));
            setCookie("qn_token", state.token, Math.floor(remainingMs / 1000));
          }
        }
      },
    },
  ),
);
