import { useAppStore } from '../stores/useAppStore';

type PdfListener = (doc: { name: string; dataUrl: string }) => void;

let pendingDoc: { name: string; dataUrl: string } | null = null;
const listeners = new Set<PdfListener>();

export function isPdfItem(item: { content?: string }): boolean {
  return item.content?.startsWith('data:application/pdf') === true;
}

export function openPdf(item: { name: string; content?: string }): void {
  const doc = { name: item.name, dataUrl: item.content ?? '' };
  pendingDoc = doc;
  listeners.forEach((fn) => {
    try {
      fn(doc);
    } catch {
      /* noop */
    }
  });
  useAppStore.getState().openApp('pdf-viewer');
}

export function consumePendingPdf(): { name: string; dataUrl: string } | null {
  const d = pendingDoc;
  pendingDoc = null;
  return d;
}

export function onOpenPdf(fn: PdfListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}