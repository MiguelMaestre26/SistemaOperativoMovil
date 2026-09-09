import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { isNative } from '../../core/native';

export interface RealWebViewHandle {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stop: () => void;
}

interface WebviewElement extends HTMLElement {
  src: string;
  partition?: string | null;
  goBack(): void;
  goForward(): void;
  reload(): void;
  stop(): void;
  getURL(): string;
  canGoBack(): boolean;
  canGoForward(): boolean;
  getTitle(): string;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface RealWebViewProps {
  src: string;
  partition: string;
  onUrl?: (url: string) => void;
  onTitle?: (title: string) => void;
  onLoad?: () => void;
  style?: React.CSSProperties;
}

const RealWebView = forwardRef<RealWebViewHandle, RealWebViewProps>(function RealWebView(
  { src, partition, onUrl, onTitle, onLoad, style },
  ref
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const wvRef = useRef<WebviewElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !isNative()) return;

    const wv = document.createElement('webview' as keyof HTMLElementTagNameMap) as unknown as WebviewElement;
    wv.setAttribute('webpreferences', 'contextIsolation=yes, nodeIntegration=no');
    wv.partition = `persist:${partition}`;
    wv.style.width = '100%';
    wv.style.height = '100%';
    wv.style.border = 'none';

    const handleUrl = () => {
      try {
        onUrl?.(wv.getURL());
      } catch {
        /* noop */
      }
    };
    const handleTitle = (e: Event) => {
      const title = (e as unknown as { title?: string }).title;
      if (title) onTitle?.(title);
    };

    wv.addEventListener('did-navigate', handleUrl);
    wv.addEventListener('did-navigate-in-page', handleUrl);
    wv.addEventListener('page-title-updated', handleTitle);
    wv.addEventListener('dom-ready', () => onLoad?.());

    wv.src = src;
    host.appendChild(wv);
    wvRef.current = wv;

    return () => {
      wv.removeEventListener('did-navigate', handleUrl);
      wv.removeEventListener('did-navigate-in-page', handleUrl);
      wv.removeEventListener('page-title-updated', handleTitle);
      wvRef.current = null;
      if (wv.parentNode === host) host.removeChild(wv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wv = wvRef.current;
    if (wv && wv.src !== src) {
      wv.src = src;
    }
  }, [src]);

  useImperativeHandle(
    ref,
    () => ({
      goBack: () => wvRef.current?.goBack(),
      goForward: () => wvRef.current?.goForward(),
      reload: () => wvRef.current?.reload(),
      stop: () => wvRef.current?.stop(),
    }),
    []
  );

  if (!isNative()) {
    return (
      <div style={styles.fallback}>
        <div style={styles.fallbackText}>Contenido web real solo disponible en la app de escritorio (Electron).</div>
      </div>
    );
  }

  return <div ref={hostRef} style={{ width: '100%', height: '100%', position: 'relative', ...style }} />;
});

export default RealWebView;

const styles: Record<string, React.CSSProperties> = {
  fallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F2F2F7',
    padding: '0 24px',
  },
  fallbackText: { fontSize: 12, color: '#8E8E93', textAlign: 'center' as const, lineHeight: 1.5 },
};