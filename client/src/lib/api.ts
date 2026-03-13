import axios from "axios";
import { useAuthStore } from "../stores/auth-store";

// 1. Create the Axios Instance
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const api = axios.create({
  baseURL, // Use environment variable for API URL
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor (Attach Token)
api.interceptors.request.use((config) => {
  // 🛡️ PROPER SELECTOR: Use Zustand selector instead of hook-like call
  const authStore = useAuthStore.getState();
  const token = authStore.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Response Interceptor (Handle Errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // W-1 FIX: Check token expiry BEFORE logout (was checking after,
    // which always returned false because logout clears tokenExpiry)
    if (error.response?.status === 401) {
      const authStore = useAuthStore.getState();
      const isExpired =
        authStore.tokenExpiry && Date.now() > authStore.tokenExpiry;

      authStore.logout(); // Use logout method for proper cleanup

      if (isExpired) {
        console.warn("Session expired - logged out automatically");
      }
    }
    return Promise.reject(error);
  },
);

export default api;
