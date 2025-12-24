// scriptscape-client/src/api/client.ts

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token if available (customize as needed)
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Axios v1+ uses AxiosHeaders, which supports set()
      config.headers.set?.("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Global error handling (optional)
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // Optionally handle logout or token refresh
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
