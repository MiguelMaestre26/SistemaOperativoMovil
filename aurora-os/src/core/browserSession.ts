import { useAppStore } from '../stores/useAppStore';

type UrlListener = (url: string) => void;

let pendingUrl: string | null = null;
const listeners = new Set<UrlListener>();

export function openInOs(url: string): void {
  pendingUrl = url;
  listeners.forEach((fn) => {
    try {
      fn(url);
    } catch {
      /* noop */
    }
  });
  useAppStore.getState().openApp('browser');
}

export function consumePendingUrl(): string | null {
  const u = pendingUrl;
  pendingUrl = null;
  return u;
}

export function onOpenInOsUrl(fn: UrlListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}