export type ReconnectingWebSocketOptions = {
  /** Max reconnect attempts. */
  maxRetries?: number;
  /** Stop attempting reconnects after this total duration since creation. */
  maxDurationMs?: number;
  /** Base delay (ms) for exponential backoff. */
  minDelayMs?: number;
  /** Max delay (ms) for exponential backoff. */
  maxDelayMs?: number;
  /** Random jitter (+/-) added to the backoff delay. */
  jitterMs?: number;
  /**
   * If a connection opens and then closes in under this duration,
   * treat it as unstable and keep backing off (do NOT reset retries).
   */
  unstableConnectionThresholdMs?: number;
  /** Close codes that should NOT trigger reconnect (normal close, going away, etc.). */
  noReconnectCloseCodes?: number[];
};

type PendingSend = string | ArrayBufferLike | Blob | ArrayBufferView;

/**
 * Small reconnecting websocket helper.
 *
 * NOTE: Our AI result endpoints close the socket once a final message is sent.
 * In those cases, callers should call `close()` after handling the final message
 * to stop reconnect attempts.
 */
export class ReconnectingWebSocket {
  private url: string;
  private ws: WebSocket | null = null;
  private retries = 0;
  private startedAt = Date.now();
  private lastOpenedAt: number | null = null;
  private closedByUser = false;
  private reconnectTimer: number | null = null;
  private queue: PendingSend[] = [];

  /** Whether the current socket should attempt to reconnect after close. */
  private shouldReconnect = true;

  private opts: Required<ReconnectingWebSocketOptions>;

  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;

  constructor(url: string, opts: ReconnectingWebSocketOptions = {}) {
    this.url = url;
    this.opts = {
      maxRetries: opts.maxRetries ?? 10,
      maxDurationMs: opts.maxDurationMs ?? 2 * 60_000,
      minDelayMs: opts.minDelayMs ?? 750,
      maxDelayMs: opts.maxDelayMs ?? 20_000,
      jitterMs: opts.jitterMs ?? 500,
      unstableConnectionThresholdMs: opts.unstableConnectionThresholdMs ?? 1500,
      noReconnectCloseCodes: opts.noReconnectCloseCodes ?? [1000, 1001],
    };
    this.startedAt = Date.now();
    this.connect();
  }

  get readyState() {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  send(data: PendingSend) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
      return;
    }
    this.queue.push(data);
  }

  close(code?: number, reason?: string) {
    this.closedByUser = true;
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    try {
      this.ws?.close(code, reason);
    } finally {
      this.ws = null;
    }
  }

  private connect() {
    if (this.closedByUser) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = (ev) => {
      this.lastOpenedAt = Date.now();

      // Flush queued sends.
      while (this.queue.length && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const msg = this.queue.shift();
        if (msg !== undefined) this.ws.send(msg);
      }
      this.onopen?.(ev);
    };

    this.ws.onmessage = (ev) => {
      this.onmessage?.(ev);
    };

    this.ws.onerror = (ev) => {
      this.onerror?.(ev);
    };

    this.ws.onclose = (ev) => {
      this.onclose?.(ev);
      if (this.closedByUser || !this.shouldReconnect) return;

      // Normal close codes should not reconnect.
      if (this.opts.noReconnectCloseCodes.includes(ev.code)) return;

      // Reset retries only if the connection was stable for some time.
      const openedAt = this.lastOpenedAt;
      const livedMs = openedAt ? Date.now() - openedAt : null;
      if (livedMs !== null && livedMs >= this.opts.unstableConnectionThresholdMs) {
        this.retries = 0;
      }

      this.scheduleReconnect();
    };
  }

  /**
   * Prevent any future reconnect attempts without force-closing the socket.
   * Useful when you received a terminal server message and are done.
   */
  disableReconnect() {
    this.shouldReconnect = false;
  }

  private scheduleReconnect() {
    const elapsed = Date.now() - this.startedAt;
    if (elapsed > this.opts.maxDurationMs) return;
    if (this.retries >= this.opts.maxRetries) return;

    const exp = Math.min(this.opts.maxDelayMs, this.opts.minDelayMs * Math.pow(2, this.retries));
    const jitter = Math.floor((Math.random() * 2 - 1) * this.opts.jitterMs);
    const delay = Math.max(0, exp + jitter);
    this.retries += 1;

    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => this.connect(), delay);
  }
}
