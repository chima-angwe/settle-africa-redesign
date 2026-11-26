export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  durationMs: number;
}

export interface ToastOptions {
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 4500;
const MAX_TOASTS = 4;
const DEDUPE_WINDOW_MS = 300;

type Listener = () => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();
const timers = new Map<string, number>();
let lastSignature = { key: "", timestamp: 0 };

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function removeToast(id: string) {
  const timer = timers.get(id);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timers.delete(id);
  }

  const next = toasts.filter((item) => item.id !== id);
  if (next.length !== toasts.length) {
    toasts = next;
    emitChange();
  }
}

function pushToast(
  variant: ToastVariant,
  message: string,
  options?: ToastOptions,
): string {
  const cleanMessage = message.trim();
  if (!cleanMessage) {
    return "";
  }

  const now = Date.now();
  const signatureKey = `${variant}:${cleanMessage}`;
  if (
    lastSignature.key === signatureKey &&
    now - lastSignature.timestamp < DEDUPE_WINDOW_MS
  ) {
    return "";
  }
  lastSignature = { key: signatureKey, timestamp: now };

  const id = `toast-${now}-${Math.random().toString(36).slice(2, 8)}`;
  const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;

  const nextItem: ToastItem = {
    id,
    variant,
    message: cleanMessage,
    durationMs,
  };

  const nextList = [nextItem, ...toasts];
  if (nextList.length > MAX_TOASTS) {
    const evicted = nextList.slice(MAX_TOASTS);
    for (const item of evicted) {
      const timer = timers.get(item.id);
      if (timer !== undefined) {
        window.clearTimeout(timer);
        timers.delete(item.id);
      }
    }
  }
  toasts = nextList.slice(0, MAX_TOASTS);

  if (typeof window !== "undefined" && durationMs > 0) {
    const timer = window.setTimeout(() => {
      removeToast(id);
    }, durationMs);
    timers.set(id, timer);
  }

  emitChange();
  return id;
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToastSnapshot(): ToastItem[] {
  return toasts;
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    pushToast("success", message, options),
  error: (message: string, options?: ToastOptions) =>
    pushToast("error", message, options),
  info: (message: string, options?: ToastOptions) =>
    pushToast("info", message, options),
  dismiss: removeToast,
  clear: () => {
    for (const timer of timers.values()) {
      window.clearTimeout(timer);
    }
    timers.clear();
    if (toasts.length > 0) {
      toasts = [];
      emitChange();
    }
  },
};
