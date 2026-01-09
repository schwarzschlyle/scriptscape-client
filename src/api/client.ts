import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

const AUTH_REFRESH_ENDPOINT = "/auth/refresh";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("refreshToken") || "";
    if (!refreshToken) throw new Error("Missing refresh token");

    const resp = await axios.post(
      `${API_BASE_URL}${AUTH_REFRESH_ENDPOINT}`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" }, withCredentials: true }
    );
    const nextAccessToken = resp.data?.accessToken;
    const nextRefreshToken = resp.data?.refreshToken;
    if (!nextAccessToken) throw new Error("Token refresh failed");

    localStorage.setItem("accessToken", nextAccessToken);
    if (nextRefreshToken) localStorage.setItem("refreshToken", nextRefreshToken);
    return nextAccessToken as string;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.set?.("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest) return Promise.reject(error);
    if (status !== 401) return Promise.reject(error);
    if (originalRequest._retry) return Promise.reject(error);
    if ((originalRequest.url || "").includes(AUTH_REFRESH_ENDPOINT)) return Promise.reject(error);

    originalRequest._retry = true;

    try {
      const nextToken = await refreshAccessToken();
      originalRequest.headers.set?.("Authorization", `Bearer ${nextToken}`);
      return api.request(originalRequest);
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return Promise.reject(error);
    }
  }
);

export default api;
