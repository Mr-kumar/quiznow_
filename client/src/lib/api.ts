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
    // 🛡️ BETTER 401 HANDLING: Auto-logout with user feedback
    if (error.response?.status === 401) {
      const authStore = useAuthStore.getState();
      authStore.logout(); // Use logout method for proper cleanup

      // Only show toast if this wasn't an automatic logout
      if (!authStore.tokenExpiry || Date.now() <= authStore.tokenExpiry) {
        console.warn("Session expired - logging out");
        // You could add a toast here if needed
      }
    }
    return Promise.reject(error);
  },
);

export default api;
