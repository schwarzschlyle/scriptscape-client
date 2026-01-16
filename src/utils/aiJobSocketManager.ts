import { ReconnectingWebSocket, type ReconnectingWebSocketOptions } from "./websocket";

type JobHandle = {
  ws: ReconnectingWebSocket;
  timeoutId: number | null;
};

export type AiJobSocketAttachOptions = {
  /** Absolute websocket URL to connect to. */
  url: string;
  /**
   * Hard timeout for the whole job (ms). On timeout, we'll disable reconnect,
   * close the socket, and invoke `onTimeout`.
   */
  timeoutMs: number;
  /** Optional tuning for reconnect behavior. */
  wsOptions?: ReconnectingWebSocketOptions;
  onMessage: (event: MessageEvent, helpers: { close: () => void }) => void;
  onTimeout?: (helpers: { close: () => void }) => void;
  onError?: (event: Event) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
};

/**
 * Production-grade singleton manager for AI job websocket + timeout lifecycle.
 *
 * Goals:
 * - Ensure at most ONE socket + ONE timeout per jobId.
 * - Ensure all sockets are disabled from reconnecting and closed on terminal states.
 * - Ensure timeouts are always cleared on terminal states (prevents leaks).
 * - Provide `cleanupAll()` for hook/component unmount.
 */
export class AiJobSocketManager {
  private jobs = new Map<string, JobHandle>();

  has(jobId: string) {
    return this.jobs.has(jobId);
  }

  attach(jobId: string, opts: AiJobSocketAttachOptions) {
    // If already attached, no-op (idempotent under StrictMode / rerenders).
    if (this.jobs.has(jobId)) return;

    const close = () => this.cleanup(jobId);

    const ws = new ReconnectingWebSocket(opts.url, opts.wsOptions);

    ws.onopen = (ev) => {
      opts.onOpen?.(ev);
    };

    ws.onmessage = (ev) => {
      opts.onMessage(ev, { close });
    };

    ws.onerror = (ev) => {
      opts.onError?.(ev);
    };

    ws.onclose = (ev) => {
      opts.onClose?.(ev);
    };

    const timeoutId = window.setTimeout(() => {
      // Still attached? Then this timeout is the terminal event.
      if (!this.jobs.has(jobId)) return;
      try {
        opts.onTimeout?.({ close });
      } finally {
        close();
      }
    }, opts.timeoutMs);

    this.jobs.set(jobId, { ws, timeoutId });
  }

  cleanup(jobId: string) {
    const handle = this.jobs.get(jobId);
    if (!handle) return;
    this.jobs.delete(jobId);

    try {
      if (handle.timeoutId) window.clearTimeout(handle.timeoutId);
    } catch {
      // ignore
    }

    try {
      handle.ws.disableReconnect();
      handle.ws.close();
    } catch {
      // ignore
    }
  }

  cleanupAll() {
    Array.from(this.jobs.keys()).forEach((jobId) => this.cleanup(jobId));
  }
}

