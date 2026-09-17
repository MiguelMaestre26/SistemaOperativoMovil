import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Download, ExternalLink, Search, Home,
  ImagePlus, X,
} from 'lucide-react';
import { openExternal } from '../../../core/webapp';
import { isNative } from '../../../core/native';
import { saveUrlToStore, onImageDownloaded } from '../../../core/downloads';
import { useSystemStore } from '../../../stores/useSystemStore';
import { consumePendingUrl, onOpenInOsUrl, consumePendingSearch, onOpenInOsSearch } from '../../../core/browserSession';
import RealWebView, { type RealWebViewHandle } from '../../shared/RealWebView';
import { Screen, IconButton } from '../../ui';

const GOOGLE = 'https://www.google.com';
const GOOGLE_HOME = `${GOOGLE}/`;
const googleSearchUrl = (q: string) => `${GOOGLE}/search?q=${encodeURIComponent(q)}&hl=es`;

function looksLikeUrl(raw: string): boolean {
  return /^https?:\/\//i.test(raw) || (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(raw) && !/\s/.test(raw));
}

export default function Browser() {
  const [initialUrl] = useState(() => {
    if (isNative()) return 'home';
    const q = consumePendingSearch();
    if (q) return googleSearchUrl(q);
    return consumePendingUrl() ?? 'home';
  });
  const [url, setUrl] = useState(initialUrl);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [idx, setIdx] = useState(0);
  const [address, setAddress] = useState('');
  const addressRef = useRef<HTMLInputElement>(null);
  const [frameKey, setFrameKey] = useState(0);

  const [downloading, setDownloading] = useState(false);
  const [savedImage, setSavedImage] = useState<{ filename: string; dataUrl: string } | null>(null);

  const native = isNative();
  const pendingSearchRef = useRef<string | null>(null);
  const [nativeSrc, setNativeSrc] = useState<string | null>(
    () => {
      pendingSearchRef.current = consumePendingSearch();
      return native
        ? consumePendingUrl() ?? (pendingSearchRef.current ? googleSearchUrl(pendingSearchRef.current) : GOOGLE_HOME)
        : null;
    }
  );
  const [nativeUrl, setNativeUrl] = useState('');
  const [nativeAddress, setNativeAddress] = useState('');
  const wvRef = useRef<RealWebViewHandle>(null);

  const goNativeHome = () => setNativeSrc(GOOGLE_HOME);

  const submitNative = (raw: string) => {
    const input = raw.trim();
    setNativeAddress('');
    if (!input) return;
    if (input === 'home') {
      goNativeHome();
      return;
    }
    if (looksLikeUrl(input)) {
      setNativeSrc(input.startsWith('http') ? input : `https://${input}`);
      return;
    }
    setNativeSrc(googleSearchUrl(input));
  };

  const isHome = url === 'home';
  const canGoBack = idx > 0;
  const canGoForward = idx < history.length - 1;

  const goToUrl = (next: string) => {
    setUrl(next);
    const h = [...history.slice(0, idx + 1), next];
    setHistory(h);
    setIdx(h.length - 1);
  };

  const goBack = () => {
    if (!canGoBack) return;
    const ni = idx - 1;
    setIdx(ni);
    setUrl(history[ni]);
  };

  const goForward = () => {
    if (!canGoForward) return;
    const ni = idx + 1;
    setIdx(ni);
    setUrl(history[ni]);
  };

  const performSearch = (q: string) => {
    if (native) setNativeSrc(googleSearchUrl(q));
    else openExternal(googleSearchUrl(q));
  };

  useEffect(() => {
    if (!native) return;
    const off = onOpenInOsSearch((q) => performSearch(q));
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  useEffect(() => {
    if (native) return;
    const offUrl = onOpenInOsUrl((u) => goToUrl(u));
    const offSearch = onOpenInOsSearch((q) => goToUrl(googleSearchUrl(q)));
    return () => {
      offUrl();
      offSearch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  useEffect(() => {
    const q = pendingSearchRef.current;
    if (q) performSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!native) return;
    const off = onOpenInOsUrl((u) => setNativeSrc(u));
    return off;
  }, [native]);

  useEffect(() => {
    const off = onImageDownloaded((info) => setSavedImage(info));
    return off;
  }, []);

  const submitAddress = (raw?: string) => {
    const input = (raw ?? address).trim();
    if (!input) return;
    setAddress('');
    addressRef.current?.blur();
    if (input === 'home') {
      goToUrl('home');
      return;
    }
    if (/^(https?:\/\/|about:)/i.test(input)) {
      goToUrl(input);
      return;
    }
    if (looksLikeUrl(input)) {
      goToUrl(`https://${input}`);
      return;
    }
    openExternal(googleSearchUrl(input));
  };

  const reload = () => {
    if (!isHome) setFrameKey(k => k + 1);
  };

  const openCurrent = () => {
    openExternal(isHome ? GOOGLE_HOME : url);
  };

  const download = async (targetOverride?: string) => {
    const target = (targetOverride && targetOverride.trim()) || (isHome ? '' : url);
    if (!target || downloading) return;
    setDownloading(true);
    try {
      await saveUrlToStore(target);
    } finally {
      setDownloading(false);
    }
  };

  const applyWallpaper = (info: { dataUrl: string }) => {
    useSystemStore.getState().setWallpaper(info.dataUrl);
    setSavedImage(null);
  };

  const showHome = isHome;
  const showFrame = !showHome;

  const domain = showFrame
    ? (() => { try { return new URL(url).hostname; } catch { return url; } })()
    : '';

  if (native) {
    return (
      <Screen scroll={false} padding="0">
        <div style={styles.toolbar}>
          <IconButton label="Atrás" size={30} bg="transparent" onClick={() => wvRef.current?.goBack()}>
            <ArrowLeft size={17} color="var(--accent)" />
          </IconButton>
          <IconButton label="Adelante" size={30} bg="transparent" onClick={() => wvRef.current?.goForward()}>
            <ArrowRight size={17} color="var(--accent)" />
          </IconButton>
          <IconButton label="Recargar" size={30} bg="transparent" onClick={() => wvRef.current?.reload()}>
            <RotateCw size={15} color="var(--accent)" />
          </IconButton>
          <IconButton label="Inicio" size={30} bg="transparent" onClick={goNativeHome}>
            <Home size={16} color="var(--accent)" />
          </IconButton>
          <input
            value={nativeAddress}
            onChange={e => setNativeAddress(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitNative(nativeAddress); }}
            onFocus={() => setNativeAddress('')}
            placeholder={nativeUrl}
            style={styles.address}
          />
          <IconButton label="Buscar" size={30} bg="transparent" onClick={() => submitNative(nativeAddress)}>
            <Search size={16} color="var(--accent)" />
          </IconButton>
          <IconButton
            label="Descargar página"
            size={30}
            bg="transparent"
            onClick={() => download(nativeUrl || nativeSrc || '')}
            style={{ opacity: downloading || !(nativeUrl || nativeSrc) ? 0.4 : 1 }}
          >
            <Download size={16} color={downloading || !(nativeUrl || nativeSrc) ? 'var(--text-tertiary)' : 'var(--success)'} />
          </IconButton>
        </div>

        <div style={styles.content}>
          {nativeSrc && (
            <RealWebView
              ref={wvRef}
              src={nativeSrc}
              partition="aurora-browser-google"
              onUrl={setNativeUrl}
            />
          )}
        </div>

        {savedImage && (
          <ImageSavedBanner info={savedImage} onUse={() => applyWallpaper(savedImage)} onClose={() => setSavedImage(null)} />
        )}
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padding="0">
      <div style={styles.toolbar}>
        <IconButton
          label="Atrás"
          size={30}
          bg="transparent"
          onClick={goBack}
          style={{ opacity: canGoBack ? 1 : 0.4 }}
        >
          <ArrowLeft size={17} color={canGoBack ? 'var(--accent)' : 'var(--text-tertiary)'} />
        </IconButton>
        <IconButton
          label="Adelante"
          size={30}
          bg="transparent"
          onClick={goForward}
          style={{ opacity: canGoForward ? 1 : 0.4 }}
        >
          <ArrowRight size={17} color={canGoForward ? 'var(--accent)' : 'var(--text-tertiary)'} />
        </IconButton>
        <IconButton label="Recargar" size={30} bg="transparent" onClick={reload}>
          <RotateCw size={15} color="var(--accent)" />
        </IconButton>
        <IconButton label="Inicio" size={30} bg="transparent" onClick={() => goToUrl('home')}>
          <Home size={16} color="var(--accent)" />
        </IconButton>
        <input
          ref={addressRef}
          value={address}
          onChange={e => setAddress(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submitAddress(); }}
          onFocus={() => setAddress('')}
          placeholder={showFrame ? domain : 'Buscar en Google'}
          style={styles.address}
        />
        <IconButton label="Buscar" size={30} bg="transparent" onClick={() => submitAddress()}>
          <Search size={16} color="var(--accent)" />
        </IconButton>
        <IconButton label="Abrir en pestaña" size={30} bg="transparent" onClick={openCurrent}>
          <ExternalLink size={16} color="var(--accent)" />
        </IconButton>
        <IconButton
          label="Descargar"
          size={30}
          bg="transparent"
          onClick={() => download()}
          style={{ opacity: downloading || isHome ? 0.4 : 1 }}
        >
          <Download size={16} color={!downloading && !isHome ? 'var(--success)' : 'var(--text-tertiary)'} />
        </IconButton>
      </div>

      <div style={styles.content}>
        {showHome && <GoogleHome onSearch={q => openExternal(googleSearchUrl(q))} />}

        {showFrame && (
          <>
            <div style={styles.frameNotice}>
              <span>Ver ventana embebida</span>
              <button className="pressable" style={styles.frameNoticeBtn} onClick={openCurrent}>Abrir en pestaña →</button>
            </div>
            <iframe
              key={url + frameKey}
              src={url}
              title={domain}
              style={styles.frame}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
            />
          </>
        )}
      </div>

      {savedImage && (
        <ImageSavedBanner info={savedImage} onUse={() => applyWallpaper(savedImage)} onClose={() => setSavedImage(null)} />
      )}
    </Screen>
  );
}

function ImageSavedBanner({
  info, onUse, onClose,
}: {
  info: { filename: string; dataUrl: string };
  onUse: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 10000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.filename]);

  return (
    <div style={styles.banner}>
      <div style={styles.bannerThumb}>
        <img src={info.dataUrl} alt="" style={styles.bannerThumbImg} />
      </div>
      <div style={styles.bannerText}>
        <b style={styles.bannerName}>{info.filename}</b>
        <span style={styles.bannerSub}>Guardada en Archivos</span>
      </div>
      <button className="pressable" style={styles.bannerBtn} onClick={onUse}>
        <ImagePlus size={14} color="#fff" /> Fondo
      </button>
      <button className="pressable" style={styles.bannerClose} onClick={onClose} aria-label="Cerrar">
        <X size={14} color="#8E8E93" />
      </button>
    </div>
  );
}

function GoogleHome({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState('');
  const submit = () => { if (q.trim()) onSearch(q.trim()); };
  return (
    <div style={styles.googleHome}>
      <div style={styles.googleLogoBig}>
        <span style={{ ...styles.gLetter, color: '#4285F4' }}>G</span>
        <span style={{ ...styles.gLetter, color: '#EA4335' }}>o</span>
        <span style={{ ...styles.gLetter, color: '#FBBC05' }}>o</span>
        <span style={{ ...styles.gLetter, color: '#4285F4' }}>g</span>
        <span style={{ ...styles.gLetter, color: '#34A853' }}>l</span>
        <span style={{ ...styles.gLetter, color: '#EA4335' }}>e</span>
      </div>
      <div style={styles.googleBar}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="Buscar en Google"
          style={styles.googleInput}
        />
        <button className="pressable" style={styles.googleSearchBtn} onClick={submit} aria-label="Buscar">
          <Search size={16} color="var(--text-secondary)" />
        </button>
      </div>
      <button className="pressable" style={styles.googleWebBtn} onClick={() => openExternal(GOOGLE)}>
        <ExternalLink size={17} color="#fff" />
        <span>Google Web</span>
      </button>
      <div style={styles.googleNote}>
        Tu búsqueda se abre en Google con exactamente lo que pediste.
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '7px 8px',
    background: 'var(--bg-secondary)',
    borderBottom: '0.5px solid var(--separator-cell)',
    flexShrink: 0,
  },
  address: {
    flex: 1,
    minWidth: 0,
    margin: '0 3px',
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: 'var(--surface-input)',
    padding: '0 12px',
    fontSize: 13,
    color: 'var(--text-primary)',
    outline: 'none',
  },
  content: { flex: 1, position: 'relative', overflow: 'hidden' },
  banner: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    zIndex: 30,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(28,28,30,0.92)',
    color: '#fff',
    borderRadius: 14,
    padding: '8px 12px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
  },
  bannerThumb: {
    width: 34,
    height: 34,
    borderRadius: 8,
    overflow: 'hidden',
    background: '#333',
    flexShrink: 0,
  },
  bannerThumbImg: { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' },
  bannerText: { flex: 1, minWidth: 0 },
  bannerName: { display: 'block', fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  bannerSub: { display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  bannerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    border: 'none',
    background: 'var(--success)',
    color: '#fff',
    borderRadius: 12,
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  bannerClose: {
    border: 'none',
    background: 'rgba(255,255,255,0.12)',
    width: 24,
    height: 24,
    borderRadius: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  frame: { width: '100%', height: '100%', border: 'none', background: '#fff' },
  frameNotice: {
    position: 'absolute',
    top: 6,
    left: 10,
    right: 10,
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: 11,
    padding: '4px 10px',
    borderRadius: 10,
    pointerEvents: 'auto' as const,
  },
  frameNoticeBtn: { border: 'none', background: 'none', color: '#7EC8FF', cursor: 'pointer', fontSize: 11, fontWeight: 600 },

  googleHome: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    padding: '0 22px',
  },
  googleLogoBig: { display: 'flex', marginBottom: 18 },
  gLetter: { fontSize: 30, fontWeight: 600, letterSpacing: -1 },
  googleBar: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid var(--separator-cell)',
    borderRadius: 24,
    padding: '0 6px 0 16px',
    height: 44,
    background: 'var(--surface-input)',
    boxShadow: 'var(--shadow-sm)',
  },
  googleInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', background: 'none' },
  googleSearchBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleWebBtn: {
    marginTop: 18,
    height: 46,
    padding: '0 22px',
    borderRadius: 14,
    border: 'none',
    background: '#1A73E8',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 14px rgba(26,115,232,0.35)',
  },
  googleNote: { fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' as const, marginTop: 16, lineHeight: 1.5 },
};