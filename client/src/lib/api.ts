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
  const token = useAuthStore.getState().token; // Get token from Zustand store
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Response Interceptor (Handle Errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 (Unauthorized), log the user out automatically
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default api;
