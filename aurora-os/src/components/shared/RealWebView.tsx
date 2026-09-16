import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { isNative } from '../../core/native';

export interface RealWebViewHandle {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stop: () => void;
  scrollToHorizontal: (left: number) => void;
  scrollBy: (left: number, top: number) => void;
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
  executeJavaScript(code: string): Promise<unknown>;
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
  scrollable?: boolean;
  minWidth?: number;
  minHeight?: number;
}

const RealWebView = forwardRef<RealWebViewHandle, RealWebViewProps>(function RealWebView(
  { src, partition, onUrl, onTitle, onLoad, style, scrollable = false, minWidth = 0, minHeight = 0 },
  ref
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const wvRef = useRef<WebviewElement | null>(null);
  const stackRef = useRef<string[]>([]);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !isNative()) return;
    let cleanupScrollable: (() => void) | undefined;
    const canvas = scrollable ? document.createElement('div') : host;

    const wv = document.createElement('webview' as keyof HTMLElementTagNameMap) as unknown as WebviewElement;
    wv.setAttribute('webpreferences', 'contextIsolation=yes, nodeIntegration=no');
    wv.partition = `persist:${partition}`;
    wv.style.width = '100%';
    wv.style.height = '100%';
    wv.style.border = 'none';
    wv.style.overflowX = 'auto';
    wv.style.overflowY = 'auto';
    if (scrollable) {
      canvas.style.width = `${Math.max(minWidth, host.clientWidth)}px`;
      canvas.style.height = `${Math.max(minHeight, host.clientHeight)}px`;
      canvas.style.position = 'relative';
      canvas.style.flexShrink = '0';
      wv.style.width = '100%';
      wv.style.height = '100%';

      const handlePointerDown = (event: Event) => {
        const pointerEvent = event as PointerEvent;
        if (pointerEvent.button === 0) {
          dragRef.current = { x: pointerEvent.clientX, y: pointerEvent.clientY };
          host.style.cursor = 'grabbing';
        }
      };
      const handlePointerMove = (event: Event) => {
        const pointerEvent = event as PointerEvent;
        const drag = dragRef.current;
        if (!drag) return;
        host.scrollBy({ left: drag.x - pointerEvent.clientX, top: drag.y - pointerEvent.clientY });
        drag.x = pointerEvent.clientX;
        drag.y = pointerEvent.clientY;
      };
      const stopDragging = () => {
        dragRef.current = null;
        host.style.cursor = 'grab';
      };

      wv.addEventListener('pointerdown', handlePointerDown);
      wv.addEventListener('pointermove', handlePointerMove);
      wv.addEventListener('pointerup', stopDragging);
      wv.addEventListener('pointercancel', stopDragging);
      wv.addEventListener('pointerleave', stopDragging);

      cleanupScrollable = () => {
        wv.removeEventListener('pointerdown', handlePointerDown);
        wv.removeEventListener('pointermove', handlePointerMove);
        wv.removeEventListener('pointerup', stopDragging);
        wv.removeEventListener('pointercancel', stopDragging);
        wv.removeEventListener('pointerleave', stopDragging);
      };
    }

    const pushIfNew = (url: string) => {
      const stack = stackRef.current;
      if (stack[stack.length - 1] !== url) stack.push(url);
    };

    const handleUrl = () => {
      try {
        const url = wv.getURL();
        onUrl?.(url);
        pushIfNew(url);
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

    stackRef.current = [src];
    wv.src = src;
    if (scrollable) {
      canvas.appendChild(wv);
      host.appendChild(canvas);
    } else {
      host.appendChild(wv);
    }
    wvRef.current = wv;

    return () => {
      wv.removeEventListener('did-navigate', handleUrl);
      wv.removeEventListener('did-navigate-in-page', handleUrl);
      wv.removeEventListener('page-title-updated', handleTitle);
      cleanupScrollable?.();
      wvRef.current = null;
      if (scrollable) {
        if (canvas.parentNode === host) host.removeChild(canvas);
      } else if (wv.parentNode === host) {
        host.removeChild(wv);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wv = wvRef.current;
    if (!wv) return;
    const next = src;
    const prev = stackRef.current[stackRef.current.length - 1] ?? '';
    if (next === prev) return;
    stackRef.current.push(next);
    if (wv.src !== next) wv.src = next;
  }, [src]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToHorizontal: (left: number) => {
        if (!scrollable) return;
        const host = hostRef.current;
        if (host) host.scrollLeft = Math.max(0, left);
      },
      scrollBy: (left: number, top: number) => {
        if (!scrollable) return;
        const host = hostRef.current;
        if (host) {
          host.scrollLeft += left;
          host.scrollTop += top;
        }
        const wv = wvRef.current;
        if (wv) {
          void wv.executeJavaScript(`window.scrollBy(${left}, ${top})`).catch(() => undefined);
        }
      },
      goBack: () => {
        const wv = wvRef.current;
        if (!wv) return;
        try {
          if (wv.canGoBack()) { wv.goBack(); return; }
        } catch { /* noop */ }
        const stack = stackRef.current;
        if (stack.length < 2) return;
        stack.pop();
        const target = stack[stack.length - 1];
        if (target && wv.getURL() !== target) wv.src = target;
      },
      goForward: () => {
        const wv = wvRef.current;
        try { if (wv?.canGoForward()) wv.goForward(); } catch { /* noop */ }
      },
      reload: () => wvRef.current?.reload(),
      stop: () => wvRef.current?.stop(),
    }),
    [scrollable]
  );

  if (!isNative()) {
    return (
      <div style={styles.fallback}>
        <div style={styles.fallbackText}>Contenido web real solo disponible en la app de escritorio (Electron).</div>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      data-wa-scroll-host={scrollable ? 'true' : undefined}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        ...(scrollable
          ? { overflow: 'scroll', scrollbarGutter: 'stable', cursor: 'grab' }
          : {}),
        ...style,
      }}
    />
  );
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