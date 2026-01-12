/**
 * Resolve the API base URL consistently across environments.
 *
 * - In local dev you may set VITE_API_URL to a full URL (e.g. http://localhost:3000/v1)
 * - In production you may set it to a relative path behind a proxy (e.g. /api/v1)
 */

export function getApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL || "").trim();
  if (!raw) return "";

  // Absolute URL
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/+$/, "");
  }

  // Relative path -> resolve against current origin
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${window.location.origin}${path}`.replace(/\/+$/, "");
}

