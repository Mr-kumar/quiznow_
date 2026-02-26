import axios from "axios";
import { useAuthStore } from "../stores/auth-store";

// 1. Create the Axios Instance
const api = axios.create({
  baseURL: "http://localhost:4000", // Your NestJS Backend URL
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
