import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Download, ExternalLink, Compass, Search, Home,
  ImagePlus, X,
} from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { openExternal } from '../../../core/webapp';
import { isNative } from '../../../core/native';
import { saveUrlToStore, onImageDownloaded } from '../../../core/downloads';
import { useSystemStore } from '../../../stores/useSystemStore';
import { consumePendingUrl, onOpenInOsUrl } from '../../../core/browserSession';
import RealWebView, { type RealWebViewHandle } from '../../shared/RealWebView';

type Engine = 'google' | 'firefox';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const GOOGLE = 'https://www.google.com';

const NATIVE_HOME: Record<Engine, string> = {
  google: 'https://www.google.com/',
  firefox: 'https://www.mozilla.org/es-ES/firefox/',
};
const NATIVE_SEARCH: Record<Engine, (q: string) => string> = {
  google: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=es`,
  firefox: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
};

function looksLikeUrl(raw: string): boolean {
  return /^https?:\/\//i.test(raw) || (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(raw) && !/\s/.test(raw));
}

export default function Browser() {
  const [engine, setEngine] = usePersistedState<Engine | null>('browser:engine', null);
  const [url, setUrl] = useState('home');
  const [history, setHistory] = useState<string[]>(['home']);
  const [idx, setIdx] = useState(0);
  const [address, setAddress] = useState('');
  const addressRef = useRef<HTMLInputElement>(null);
  const [frameKey, setFrameKey] = useState(0);

  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [activeQuery, setActiveQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [savedImage, setSavedImage] = useState<{ filename: string; dataUrl: string } | null>(null);

  const native = isNative();
  const [nativeSrc, setNativeSrc] = useState<string | null>(
    () => (native ? consumePendingUrl() ?? (engine ? NATIVE_HOME[engine] : null) : null)
  );
  const [nativeUrl, setNativeUrl] = useState('');
  const [nativeAddress, setNativeAddress] = useState('');
  const wvRef = useRef<RealWebViewHandle>(null);

  const goNativeHome = () => {
    if (engine) setNativeSrc(NATIVE_HOME[engine]);
  };

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
    if (engine) setNativeSrc(NATIVE_SEARCH[engine](input));
  };

  const isHome = url === 'home';
  const canGoBack = idx > 0;
  const canGoForward = idx < history.length - 1;

  const goToUrl = (next: string) => {
    setResults(null);
    setActiveQuery('');
    setSearchError('');
    setUrl(next);
    const h = [...history.slice(0, idx + 1), next];
    setHistory(h);
    setIdx(h.length - 1);
  };

  const goBack = () => {
    if (!canGoBack) return;
    setResults(null);
    const ni = idx - 1;
    setIdx(ni);
    setUrl(history[ni]);
  };

  const goForward = () => {
    if (!canGoForward) return;
    setResults(null);
    const ni = idx + 1;
    setIdx(ni);
    setUrl(history[ni]);
  };

  const runSearch = async (q: string) => {
    const query = q.trim();
    if (!query) return;
    setActiveQuery(query);
    setResults([]);
    setSearchError('');
    setSearching(true);
    try {
      const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Error al buscar');
    } finally {
      setSearching(false);
    }
  };

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
    if (engine === 'google') {
      openExternal(`${GOOGLE}/search?q=${encodeURIComponent(input)}`);
      return;
    }
    runSearch(input);
  };

  const reload = () => {
    if (results) {
      setResults(null);
      setActiveQuery('');
      runSearch(activeQuery || '');
      return;
    }
    if (!isHome) setFrameKey(k => k + 1);
  };

  const openCurrent = () => {
    if (results && activeQuery) {
      openExternal(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(activeQuery)}`);
      return;
    }
    const target = isHome
      ? engine === 'google'
        ? GOOGLE
        : activeQuery
          ? `https://html.duckduckgo.com/html/?q=${encodeURIComponent(activeQuery)}`
          : GOOGLE
      : url;
    openExternal(target);
  };

  const switchEngine = (next: Engine) => {
    setEngine(next);
    if (native) setNativeSrc(NATIVE_HOME[next]);
    else goToUrl('home');
  };

  useEffect(() => {
    if (!native) return;
    const off = onOpenInOsUrl((u) => setNativeSrc(u));
    return off;
  }, [native]);

  useEffect(() => {
    const off = onImageDownloaded((info) => setSavedImage(info));
    return off;
  }, []);

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

  if (!engine) {
    return (
      <div style={styles.chooser}>
        <div style={styles.chooserGlobe}>
          <Search size={40} color="#007AFF" />
        </div>
        <div style={styles.chooserTitle}>Aurora Browser</div>
        <div style={styles.chooserSub}>¿Dónde quieres buscar en la web?</div>

        <button style={styles.googleCard} onClick={() => switchEngine('google')}>
          <div style={styles.googleLogo}>
            <span style={{ ...styles.gLetter, color: '#4285F4' }}>G</span>
            <span style={{ ...styles.gLetter, color: '#EA4335' }}>o</span>
            <span style={{ ...styles.gLetter, color: '#FBBC05' }}>o</span>
            <span style={{ ...styles.gLetter, color: '#4285F4' }}>g</span>
            <span style={{ ...styles.gLetter, color: '#34A853' }}>l</span>
            <span style={{ ...styles.gLetter, color: '#EA4335' }}>e</span>
          </div>
          <div style={styles.cardText}>
            {native ? <>Google <b>real</b> dentro del teléfono — busca en google.com.</> : <>Abrir la página real de <b>google.com</b> en tu navegador y buscar allí.</>}
          </div>
          <div style={styles.cardHint}>{native ? 'Todo dentro del OS' : 'Abre en una pestaña nueva'}</div>
        </button>

        <button style={styles.firefoxCard} onClick={() => switchEngine('firefox')}>
          <div style={styles.foxBadge}><span style={styles.foxEmoji}>🦊</span></div>
          <div style={styles.cardText}>
            {native ? <>Firefox <b>real</b> — Mozilla como inicio y Bing para buscar.</> : <>Inicio estilo <b>Firefox</b> con búsqueda dentro del teléfono y descargas.</>}
          </div>
          <div style={styles.cardHint}>{native ? 'Dentro del OS' : 'Búsqueda y resultados integrados'}</div>
        </button>
      </div>
    );
  }

  const showHome = isHome;
  const showResults = results !== null;
  const showFrame = !showHome && !showResults;

  const domain = showFrame
    ? (() => { try { return new URL(url).hostname; } catch { return url; } })()
    : '';

  if (native) {
    return (
      <div style={styles.container}>
        <div style={styles.toolbar}>
          <button style={styles.toolBtn} onClick={() => wvRef.current?.goBack()} aria-label="Atrás">
            <ArrowLeft size={17} color="#007AFF" />
          </button>
          <button style={styles.toolBtn} onClick={() => wvRef.current?.goForward()} aria-label="Adelante">
            <ArrowRight size={17} color="#007AFF" />
          </button>
          <button style={styles.toolBtn} onClick={() => wvRef.current?.reload()} aria-label="Recargar">
            <RotateCw size={15} color="#007AFF" />
          </button>
          <button style={styles.toolBtn} onClick={goNativeHome} aria-label="Inicio">
            <Home size={16} color="#007AFF" />
          </button>
          <input
            value={nativeAddress}
            onChange={e => setNativeAddress(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitNative(nativeAddress); }}
            onFocus={() => setNativeAddress('')}
            placeholder={nativeUrl}
            style={styles.address}
          />
          <button style={styles.toolBtn} onClick={() => submitNative(nativeAddress)} aria-label="Buscar">
            <Search size={16} color="#007AFF" />
          </button>
          <button
            style={styles.toolBtn}
            onClick={() => download(nativeUrl || nativeSrc || '')}
            disabled={downloading || !(nativeUrl || nativeSrc)}
            aria-label="Descargar página"
            title="Guardar página actual en Archivos"
          >
            <Download size={16} color={downloading ? '#C7C7CC' : '#34C759'} />
          </button>
          <button
            style={styles.engineBtn}
            onClick={() => setEngine(null)}
            title={`Motor actual: ${engine}`}
            aria-label="Cambiar motor de búsqueda"
          >
            <Compass size={13} color="#fff" />
            <span style={styles.engineLabel}>{engine === 'google' ? 'G' : 'F'}</span>
          </button>
        </div>

        <div style={styles.content}>
          {nativeSrc && (
            <RealWebView
              ref={wvRef}
              src={nativeSrc}
              partition={engine === 'google' ? 'aurora-browser-google' : 'aurora-browser-firefox'}
              onUrl={setNativeUrl}
            />
          )}
        </div>

        {savedImage && (
          <ImageSavedBanner info={savedImage} onUse={() => applyWallpaper(savedImage)} onClose={() => setSavedImage(null)} />
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <button style={styles.toolBtn} onClick={goBack} disabled={!canGoBack} aria-label="Atrás">
          <ArrowLeft size={17} color={canGoBack ? '#007AFF' : '#C7C7CC'} />
        </button>
        <button style={styles.toolBtn} onClick={goForward} disabled={!canGoForward} aria-label="Adelante">
          <ArrowRight size={17} color={canGoForward ? '#007AFF' : '#C7C7CC'} />
        </button>
        <button style={styles.toolBtn} onClick={reload} aria-label="Recargar">
          <RotateCw size={15} color="#007AFF" />
        </button>
        <button style={styles.toolBtn} onClick={() => goToUrl('home')} aria-label="Inicio">
          <Home size={16} color="#007AFF" />
        </button>
        <input
          ref={addressRef}
          value={address}
          onChange={e => setAddress(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submitAddress(); }}
          onFocus={() => setAddress('')}
          placeholder={showHome ? 'Buscar o escribir URL' : showResults ? activeQuery : domain}
          style={styles.address}
        />
        <button style={styles.toolBtn} onClick={() => submitAddress()} aria-label="Buscar">
          <Search size={16} color="#007AFF" />
        </button>
        <button style={styles.toolBtn} onClick={openCurrent} aria-label="Abrir en pestaña">
          <ExternalLink size={16} color="#007AFF" />
        </button>
        <button
          style={{ ...styles.toolBtn, position: 'relative' }}
          onClick={() => download()}
          disabled={downloading || isHome}
          aria-label="Descargar"
        >
          <Download size={16} color={!downloading && !isHome ? '#34C759' : '#C7C7CC'} />
          {engine === 'google' && !isHome && (
            <span style={styles.engineDot} title="Motor: Google" />
          )}
        </button>
        <button
          style={styles.engineBtn}
          onClick={() => setEngine(null)}
          title={`Motor actual: ${engine}`}
          aria-label="Cambiar motor de búsqueda"
        >
          <Compass size={13} color="#fff" />
          <span style={styles.engineLabel}>{engine === 'google' ? 'G' : 'F'}</span>
        </button>
      </div>

      <div style={styles.content}>
        {showHome && engine === 'google' && <GoogleHome onSearch={q => openExternal(`${GOOGLE}/search?q=${encodeURIComponent(q)}`)} />}
        {showHome && engine === 'firefox' && <FirefoxHome onSearch={runSearch} onOpen={goToUrl} />}

        {showResults && (
          <SearchResults
            query={activeQuery}
            results={results}
            searching={searching}
            error={searchError}
            onOpenInFrame={goToUrl}
            onOpenExternal={openExternal}
          />
        )}

        {showFrame && (
          <>
            <div style={styles.frameNotice}>
              <span>Ver ventana embebida</span>
              <button style={styles.frameNoticeBtn} onClick={openCurrent}>Abrir en pestaña →</button>
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
    </div>
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
      <button style={styles.bannerBtn} onClick={onUse}>
        <ImagePlus size={14} color="#fff" /> Fondo
      </button>
      <button style={styles.bannerClose} onClick={onClose} aria-label="Cerrar">
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
        <button style={styles.googleSearchBtn} onClick={submit} aria-label="Buscar">
          <Search size={16} color="#5F6368" />
        </button>
      </div>
      <button style={styles.googleWebBtn} onClick={() => openExternal(GOOGLE)}>
        <ExternalLink size={17} color="#fff" />
        <span>Google Web</span>
      </button>
      <div style={styles.googleNote}>
        Tu búsqueda y la página de Google se abren en una pestaña nueva de tu navegador
        (Google no permite incrustar su web dentro de otras páginas).
      </div>
    </div>
  );
}

const FIREFOX_LINKS = [
  { label: 'Wikipedia', url: 'https://es.wikipedia.org', emoji: '🌐' },
  { label: 'YouTube', url: 'https://www.youtube.com', emoji: '▶️' },
  { label: 'MDN', url: 'https://developer.mozilla.org', emoji: '📘' },
  { label: 'BBC', url: 'https://www.bbc.com/mundo', emoji: '📰' },
];

function FirefoxHome({ onSearch, onOpen }: { onSearch: (q: string) => void; onOpen: (u: string) => void }) {
  const [q, setQ] = useState('');
  const submit = () => { if (q.trim()) onSearch(q.trim()); };
  return (
    <div style={styles.fxHome}>
      <div style={styles.fxBadgeBig}><span style={styles.foxEmoji}>🦊</span></div>
      <div style={styles.fxTitle}>Firefox</div>
      <div style={styles.fxBar}>
        <Search size={15} color="#fff" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="Buscar en la web"
          style={styles.fxInput}
        />
      </div>
      <div style={styles.fxShortcuts}>
        {FIREFOX_LINKS.map(l => (
          <button key={l.url} style={styles.fxShortcut} onClick={() => onOpen(l.url)}>
            <span style={styles.fxShortcutEmoji}>{l.emoji}</span>
            <span style={styles.fxShortcutLabel}>{l.label}</span>
          </button>
        ))}
      </div>
      <div style={styles.fxNote}>
        Resultados dentro del teléfono. Si un sitio se bloquea, usa “Abrir en pestaña”.
      </div>
    </div>
  );
}

function SearchResults({
  query, results, searching, error, onOpenInFrame, onOpenExternal,
}: {
  query: string;
  results: SearchResult[];
  searching: boolean;
  error: string;
  onOpenInFrame: (u: string) => void;
  onOpenExternal: (u: string) => void;
}) {
  return (
    <div style={styles.resultsPage}>
      <div style={styles.resultsHead}>
        <span style={styles.resultsQuery}>“{query}”</span>
        <button style={styles.resultsExt} onClick={() => onOpenExternal(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`)}>
          Ver en DuckDuckGo ↗
        </button>
      </div>
      {searching && <div style={styles.resultsInfo}>Buscando…</div>}
      {error && <div style={styles.resultsErr}>Error al buscar: {error}</div>}
      {!searching && !error && results.length === 0 && (
        <div style={styles.resultsInfo}>Sin resultados. Prueba con otra consulta.</div>
      )}
      {!searching && results.map((r, i) => (
        <div key={`${r.url}_${i}`} style={styles.resultCard}>
          <button style={styles.resultTitle} onClick={() => onOpenInFrame(r.url)}>{r.title}</button>
          <div style={styles.resultUrl}>{r.url}</div>
          {r.snippet && <div style={styles.resultSnippet}>{r.snippet}</div>}
          <div style={styles.resultActions}>
            <button style={styles.resultAction} onClick={() => onOpenInFrame(r.url)}>Abrir</button>
            <button style={styles.resultAction} onClick={() => onOpenExternal(r.url)}>Pestaña ↗</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    padding: '7px 8px',
    background: '#F2F2F7',
    borderBottom: '0.5px solid rgba(0,0,0,0.08)',
    flexShrink: 0,
  },
  toolBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  address: {
    flex: 1,
    minWidth: 0,
    margin: '0 3px',
    height: 32,
    borderRadius: 16,
    border: 'none',
    background: '#fff',
    padding: '0 12px',
    fontSize: 12,
    color: '#111',
    outline: 'none',
  },
  engineBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    border: 'none',
    background: '#007AFF',
    color: '#fff',
    height: 28,
    borderRadius: 14,
    padding: '0 8px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  engineLabel: { fontSize: 12, fontWeight: 700 },
  engineDot: {
    position: 'absolute',
    top: 6,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    background: '#4285F4',
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
    background: '#34C759',
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

  chooser: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 22px 0',
    background: 'linear-gradient(180deg, #F5F9FF 0%, #fff 60%)',
    overflowY: 'auto',
  },
  chooserGlobe: {
    width: 80,
    height: 80,
    borderRadius: 40,
    background: 'rgba(0,122,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooserTitle: { fontSize: 21, fontWeight: 700, color: '#111', marginTop: 12 },
  chooserSub: { fontSize: 13, color: '#8E8E93', marginTop: 4, marginBottom: 22 },
  googleCard: {
    width: '100%',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 16,
    background: '#fff',
    padding: '18px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  },
  googleLogo: { display: 'flex' },
  gLetter: { fontSize: 30, fontWeight: 600, letterSpacing: -1 },
  googleLogoBig: { display: 'flex', marginBottom: 18 },
  firefoxCard: {
    width: '100%',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 16,
    background: '#fff',
    padding: '18px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    marginTop: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  },
  foxBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    background: '#FF7139',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  cardText: { fontSize: 13, color: '#333', textAlign: 'center' as const, lineHeight: 1.45 },
  cardHint: { fontSize: 11, color: '#8E8E93' },

  googleHome: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    padding: '0 22px',
  },
  googleBar: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid #DADCE0',
    borderRadius: 24,
    padding: '0 6px 0 16px',
    height: 44,
    boxShadow: '0 1px 6px rgba(32,33,36,0.12)',
  },
  googleInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#111' },
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
  googleNote: { fontSize: 11, color: '#9AA0A6', textAlign: 'center' as const, marginTop: 16, lineHeight: 1.5 },

  fxHome: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '44px 20px 0',
    background: 'linear-gradient(170deg, #0C0F2D 0%, #161A3A 45%, #201541 100%)',
    overflowY: 'auto',
  },
  fxBadgeBig: {
    width: 62,
    height: 62,
    borderRadius: 31,
    background: '#FF7139',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 34,
    boxShadow: '0 6px 18px rgba(255,113,57,0.4)',
  },
  fxTitle: { fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 12 },
  fxBar: {
    width: '100%',
    marginTop: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 24,
    padding: '0 14px',
    height: 44,
  },
  fxInput: { flex: 1, border: 'none', outline: 'none', background: 'transparent', color: '#fff', fontSize: 14 },
  fxShortcuts: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
    marginTop: 20,
  },
  fxShortcut: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '12px 8px',
    borderRadius: 14,
    border: 'none',
    background: 'rgba(255,255,255,0.08)',
    cursor: 'pointer',
  },
  fxShortcutEmoji: { fontSize: 22 },
  fxShortcutLabel: { fontSize: 12, color: '#DFE3FF', fontWeight: 500 },
  fxNote: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center' as const, marginTop: 22 },

  resultsPage: {
    height: '100%',
    overflowY: 'auto',
    background: '#fff',
    padding: '12px 14px 24px',
  },
  resultsHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  resultsQuery: { fontSize: 15, fontWeight: 700, color: '#111' },
  resultsExt: { border: 'none', background: 'none', color: '#007AFF', fontSize: 12, cursor: 'pointer' },
  resultsInfo: { color: '#8E8E93', fontSize: 13, textAlign: 'center' as const, padding: '40px 0' },
  resultsErr: { color: '#FF3B30', fontSize: 13, textAlign: 'center' as const, padding: '24px 0' },
  resultCard: {
    borderBottom: '0.5px solid rgba(0,0,0,0.06)',
    padding: '10px 2px 12px',
  },
  resultTitle: { fontSize: 14, fontWeight: 600, color: '#1A0DAB', border: 'none', background: 'none', padding: 0, textAlign: 'left' as const, cursor: 'pointer' },
  resultUrl: { fontSize: 11, color: '#006621', marginTop: 3 },
  resultSnippet: { fontSize: 12, color: '#444', marginTop: 4, lineHeight: 1.45 },
  resultActions: { display: 'flex', gap: 10, marginTop: 6 },
  resultAction: {
    border: '1px solid #DADCE0',
    background: '#fff',
    borderRadius: 10,
    padding: '4px 10px',
    fontSize: 11,
    color: '#1A73E8',
    fontWeight: 600,
    cursor: 'pointer',
  },
};