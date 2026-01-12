import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { getApiBaseUrl } from "./baseUrl";

const AUTH_REFRESH_ENDPOINT = "/auth/refresh";

const API_BASE_URL = getApiBaseUrl();

export type UnauthHandler = () => void;

let accessToken: string | null = null;
let onUnauthenticated: UnauthHandler | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setOnUnauthenticated(handler: UnauthHandler | null) {
  onUnauthenticated = handler;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Needed so the refresh HttpOnly cookie is sent.
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    // Refresh token is stored in HttpOnly cookie; no body required.
    const resp = await axios.post(
      `${API_BASE_URL}${AUTH_REFRESH_ENDPOINT}`,
      null,
      { headers: { "Content-Type": "application/json" }, withCredentials: true }
    );
    const nextAccessToken = resp.data?.accessToken;
    if (!nextAccessToken) throw new Error("Token refresh failed");
    setAccessToken(nextAccessToken);
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
    const token = getAccessToken();
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
      setAccessToken(null);
      onUnauthenticated?.();
      return Promise.reject(error);
    }
  }
);

export default api;
