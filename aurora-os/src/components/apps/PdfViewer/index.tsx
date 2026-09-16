import { useState, useEffect, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from 'lucide-react';
import { consumePendingPdf, onOpenPdf } from '../../../core/pdfSession';
import { Screen, AppHeader, EmptyState } from '../../ui';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const ZOOM_STEPS = [0.6, 0.8, 1.0, 1.3, 1.6, 2.0];
const ZOOM_DEFAULT = 1.0;

function base64ToUint8Array(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(',')[1];
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function PdfPageCanvas({ pdf, page, zoom }: { pdf: pdfjsLib.PDFDocumentProxy; page: number; zoom: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    (async () => {
      try {
        const pdfPage = await pdf.getPage(page);
        if (cancelled) return;
        const vp = pdfPage.getViewport({ scale: window.devicePixelRatio * zoom });
        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.width = `${vp.width / window.devicePixelRatio}px`;
        canvas.style.height = `${vp.height / window.devicePixelRatio}px`;
        if (cancelled) return;
        await pdfPage.render({ canvas, viewport: vp }).promise;
      } catch {
        /* page render failed — skip */
      }
    })();

    return () => { cancelled = true; };
  }, [pdf, page, zoom]);

  return (
    <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto 12px', maxWidth: '100%' }} />
  );
}

export default function PdfViewer() {
  const [doc, setDoc] = useState<ReturnType<typeof consumePendingPdf>>(() => consumePendingPdf());
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  const loadPdf = useCallback(async (dataUrl: string) => {
    setLoading(true);
    setError(null);
    setPdf(null);
    setPage(1);
    try {
      const loadingTask = pdfjsLib.getDocument({ data: base64ToUint8Array(dataUrl) });
      const pdfDoc = await loadingTask.promise;
      setPdf(pdfDoc);
      setPages(pdfDoc.numPages);
      setRenderKey(k => k + 1);
    } catch {
      setError('No se pudo abrir el PDF.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (doc) {
      void loadPdf(doc.dataUrl); // eslint-disable-line react/set-state-in-effect
    }
  }, [doc, loadPdf]);

  useEffect(() => {
    const off = onOpenPdf((next) => {
      setDoc(next);
      void loadPdf(next.dataUrl);
    });
    return off;
  }, [loadPdf]);

  const prev = () => { if (page > 1) setPage(p => p - 1); };
  const next = () => { if (pdf && page < pages) setPage(p => p + 1); };
  const zoomIn = () => {
    setZoom(z => {
      const next = ZOOM_STEPS.find(s => s > z + 0.01);
      return next ?? z;
    });
    setRenderKey(k => k + 1);
  };
  const zoomOut = () => {
    setZoom(z => {
      const prev = [...ZOOM_STEPS].reverse().find(s => s < z - 0.01);
      return prev ?? z;
    });
    setRenderKey(k => k + 1);
  };

  return (
    <Screen scroll={false} padding="0" style={{ background: 'var(--bg-primary)' }}>
      <AppHeader
        title={doc?.name ?? 'PDF'}
        variant="standard"
        right={
          <span style={styles.pageIndicator}>
            {pages > 0 ? `${page} / ${pages}` : loading ? '...' : ''}
          </span>
        }
      />

      {error && (
        <div style={styles.center}>
          <EmptyState
            icon={<FileText size={28} color="var(--text-secondary)" />}
            title={error}
          />
        </div>
      )}

      {loading && (
        <div style={styles.center}>
          <EmptyState
            icon={<FileText size={28} color="var(--text-secondary)" />}
            title="Abriendo PDF…"
          />
        </div>
      )}

      {pdf && !loading && (
        <div style={styles.viewer}>
          <div style={styles.canvasWrap} key={renderKey}>
            <PdfPageCanvas pdf={pdf} page={page} zoom={zoom} />
          </div>

          <div style={styles.toolbar}>
            <button
              className="pressable"
              style={{ ...styles.toolBtn, opacity: zoom <= ZOOM_STEPS[0] ? 0.35 : 1 }}
              onClick={zoomOut}
              aria-label="Zoom out"
            >
              <ZoomOut size={18} color="var(--accent)" />
            </button>

            <span style={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>

            <button
              className="pressable"
              style={{ ...styles.toolBtn, opacity: zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1] ? 0.35 : 1 }}
              onClick={zoomIn}
              aria-label="Zoom in"
            >
              <ZoomIn size={18} color="var(--accent)" />
            </button>

            <div style={styles.sep} />

            <button
              className="pressable"
              style={{ ...styles.toolBtn, opacity: page <= 1 ? 0.35 : 1 }}
              onClick={prev}
              disabled={page <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft size={20} color="var(--accent)" />
            </button>

            <button
              className="pressable"
              style={{ ...styles.toolBtn, opacity: page >= pages ? 0.35 : 1 }}
              onClick={next}
              disabled={page >= pages}
              aria-label="Siguiente página"
            >
              <ChevronRight size={20} color="var(--accent)" />
            </button>
          </div>
        </div>
      )}

      {!pdf && !loading && !error && (
        <div style={styles.center}>
          <EmptyState
            icon={<FileText size={28} color="var(--text-secondary)" />}
            title="Sin documento"
          />
        </div>
      )}
    </Screen>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  viewer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--bg-secondary, #1c1c1e)',
  },
  canvasWrap: {
    flex: 1,
    overflow: 'auto',
    padding: '8px 10px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  toolbar: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '8px 12px',
    borderTop: '0.5px solid var(--separator-cell)',
    background: 'var(--bg-primary)',
  },
  toolBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 10,
    border: 'none',
    background: 'rgba(0,122,255,0.10)',
    cursor: 'pointer',
  },
  pageIndicator: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  zoomLabel: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 500,
    minWidth: 36,
    textAlign: 'center' as const,
  },
  sep: {
    width: 1,
    height: 18,
    background: 'var(--separator-cell)',
    margin: '0 2px',
  },
};