import { useAppStore } from '../stores/useAppStore';

type UrlListener = (url: string) => void;
type SearchListener = (query: string) => void;

let pendingUrl: string | null = null;
let pendingSearch: string | null = null;
const listeners = new Set<UrlListener>();
const searchListeners = new Set<SearchListener>();

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

export function openSearchInOs(query: string): void {
  pendingSearch = query;
  searchListeners.forEach((fn) => {
    try {
      fn(query);
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

export function consumePendingSearch(): string | null {
  const q = pendingSearch;
  pendingSearch = null;
  return q;
}

export function onOpenInOsUrl(fn: UrlListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function onOpenInOsSearch(fn: SearchListener): () => void {
  searchListeners.add(fn);
  return () => {
    searchListeners.delete(fn);
  };
}