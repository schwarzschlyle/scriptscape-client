export function buildWsUrl(path: string) {
  const wsBase = import.meta.env.VITE_AI_API_WEBSOCKET_URL;
  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";

  // If wsBase is absolute, use it as-is.
  if (typeof wsBase === "string" && (wsBase.startsWith("ws://") || wsBase.startsWith("wss://"))) {
    return `${wsBase}${path}`;
  }

  // Otherwise treat it as a relative prefix (e.g. "/ai")
  const prefix = typeof wsBase === "string" ? wsBase : "";
  return `${wsProtocol}://${window.location.host}${prefix}${path}`;
}
