import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth-store";
import api from "../lib/api";

interface LoginCredentials {
  email: string;
  password?: string; // Optional for dev login
}

interface DevLoginResponse {
  access_token: string;
}

// Simple JWT decode function (for development only)
function decodeJwt(token: string) {
  const base64Payload = token.split(".")[1];
  const payload = Buffer.from(base64Payload, "base64").toString();
  return JSON.parse(payload);
}

interface JwtPayload {
  sub: string; // user id
  email: string;
  role: "ADMIN" | "STUDENT";
  iat: number;
  exp: number;
}

// Hook for user login (development mode)
export function useLogin() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (
      credentials: LoginCredentials,
    ): Promise<DevLoginResponse> => {
      // Use dev login endpoint
      const response = await api.post<DevLoginResponse>("/auth/dev-login", {
        email: credentials.email,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Decode JWT to extract user info
      const payload = decodeJwt(data.access_token) as JwtPayload;
      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.email, // Use email as name for now
        role: payload.role,
      };

      // Store user and token (no expiresIn for dev tokens)
      login(user, data.access_token, undefined);
    },
    onError: (error: any) => {
      console.error("Login failed:", error.response?.data || error.message);
    },
  });
}

// Hook for user logout
export function useLogout() {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      logout();
    },
    onError: (error: any) => {
      console.error("Logout failed:", error.response?.data || error.message);
      logout(); // still logout locally even if server call fails
    },
  });
}

// Hook for getting current user profile
export function useCurrentUser() {
  const { isAuthenticated, token } = useAuthStore();

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await api.get("/auth/me");
      return response.data;
    },
    enabled: isAuthenticated && !!token,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// Hook for refreshing token
export function useRefreshToken() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ token: string; expiresIn: number }>(
        "/auth/refresh",
      );
      return response.data;
    },
    onSuccess: (data) => {
      // FIXED: actually save the new token to the store.
      // Previously called refreshToken() which only checked expiry — never persisted new token.
      const { user, login } = useAuthStore.getState();
      if (user) {
        login(user, data.token, data.expiresIn);
      }
    },
    onError: (error: any) => {
      console.error(
        "Token refresh failed:",
        error.response?.data || error.message,
      );
      // Force logout if refresh fails — token is unrecoverable
      useAuthStore.getState().logout();
    },
  });
}
