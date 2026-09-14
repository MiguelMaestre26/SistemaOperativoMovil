import { useState, useRef, useEffect, useCallback } from 'react';
import L, { type Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, X, Navigation, LocateFixed, MapPin, ArrowLeft, RotateCw, Home } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { isNative } from '../../../core/native';
import RealWebView, { type RealWebViewHandle } from '../../shared/RealWebView';

interface SearchResult {
  placeId: number;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

const UJAP = { lat: 10.2368, lng: -67.9619 };

// Google Maps
const GM_LANG = 'hl=es';
const GMAPS_DEFAULT =
  'https://www.google.com/maps/@10.2367632,-67.9638933,15z?entry=ttu&g_ep=EgoyMDI2MDkwOS4wIKXMDSoASAFQAw%3D%3D';
const gmapsSearchUrl = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}&${GM_LANG}`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function geocodeAddress(q: string): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const params = new URLSearchParams({ q, format: 'json', limit: '8', addressdetails: '1' });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('geocode failed');
    const data: unknown = await res.json();
    if (!Array.isArray(data)) throw new Error('bad data');
    return data.map((r: Record<string, unknown>) => ({
      placeId: Number(r.place_id),
      displayName: String(r.display_name ?? ''),
      lat: Number(r.lat),
      lng: Number(r.lon),
      type: String(r.type ?? ''),
    }));
  } finally {
    clearTimeout(timer);
  }
}

function NativeMaps() {
  const wvRef = useRef<RealWebViewHandle>(null);
  const [src, setSrc] = usePersistedState<string>('maps:gm:v4', GMAPS_DEFAULT);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashStatus = (msg: string) => {
    setStatus(msg);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(null), 3000);
  };

  const navigate = useCallback(
    (next: string) => {
      setQuery('');
      setSrc(next);
    },
    [setSrc],
  );

  const runSearch = (q: string) => {
    if (!q.trim()) return;
    navigate(gmapsSearchUrl(q.trim()));
  };

  const goHome = () => navigate(GMAPS_DEFAULT);

  const locate = () => {
    if (!navigator.geolocation) {
      flashStatus('Geolocalización no disponible');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => navigate(gmapsSearchUrl(`${pos.coords.latitude},${pos.coords.longitude}`)),
      () => flashStatus('No se pudo obtener tu ubicación'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const keepUrl = useCallback(
    (u: string) => {
      if (u && /maps/i.test(u)) setSrc(u);
    },
    [setSrc],
  );

  return (
    <div style={styles.container}>
      <RealWebView
        ref={wvRef}
        src={src}
        partition="aurora-maps-google"
        onUrl={keepUrl}
      />

      <div style={styles.searchBox}>
        <Search size={16} color="var(--text-secondary)" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') runSearch(query);
          }}
          placeholder="Buscar dirección o lugar en Google Maps…"
          style={styles.searchInput}
        />
        {query && (
          <button className="pressable" style={styles.clearBtn} onClick={() => setQuery('')} aria-label="Limpiar">
            <X size={14} color="var(--text-secondary)" />
          </button>
        )}
        <button className="pressable" style={styles.searchBtn} onClick={() => runSearch(query)} aria-label="Buscar">
          Buscar
        </button>
      </div>

      <div style={styles.ctrlCol}>
        <button className="pressable" style={styles.ctrlBtn} onClick={() => wvRef.current?.goBack()} aria-label="Atrás">
          <ArrowLeft size={15} color="#fff" />
        </button>
        <button className="pressable" style={styles.ctrlBtn} onClick={() => wvRef.current?.reload()} aria-label="Recargar">
          <RotateCw size={15} color="#fff" />
        </button>
        <button className="pressable" style={styles.ctrlBtn} onClick={goHome} aria-label="Universidad José Antonio Páez">
          <Home size={15} color="#fff" />
        </button>
      </div>

      <button className="pressable" style={styles.gps} onClick={locate} aria-label="Mi ubicación">
        <LocateFixed size={18} color="#fff" />
      </button>

      {status && <div style={styles.status}>{status}</div>}
    </div>
  );
}

function LeafletMaps() {
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [center, setCenter] = usePersistedState<{ lat: number; lng: number; zoom: number }>('maps:view:v2', {
    lat: UJAP.lat,
    lng: UJAP.lng,
    zoom: 14,
  });

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = L.map(mapElRef.current, {
      center: [center.lat, center.lng],
      zoom: center.zoom,
      zoomControl: false,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    const fixSize = () => map.invalidateSize();
    const t = setTimeout(fixSize, 400);
    const ro = typeof ResizeObserver !== 'undefined' && mapElRef.current
      ? new ResizeObserver(() => fixSize())
      : null;
    if (ro && mapElRef.current) ro.observe(mapElRef.current);
    map.on('moveend', () => {
      const c = map.getCenter();
      setCenter({ lat: c.lat, lng: c.lng, zoom: map.getZoom() });
    });
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      clearTimeout(t);
      ro?.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      userMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeUserMarker = useCallback((ll: L.LatLngExpression) => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) userMarkerRef.current.remove();
    const m = L.circleMarker(ll, {
      radius: 9,
      color: '#fff',
      weight: 3,
      fillColor: 'var(--primary)',
      fillOpacity: 1,
    }).addTo(map);
    m.bindPopup('<b>Tu ubicación</b>').openPopup();
    userMarkerRef.current = m;
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) {
      setStatus('Geolocalización no disponible');
      return;
    }
    setStatus(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const ll: L.LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
        mapRef.current?.setView(ll, 15);
        placeUserMarker(ll);
      },
      () => setStatus('No se pudo obtener tu ubicación'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [placeUserMarker]);

  const runSearch = async (q: string) => {
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    setStatus(null);
    try {
      const res = await geocodeAddress(q);
      setResults(res);
      if (res.length === 0) {
        setStatus('Sin resultados para esa búsqueda');
        return;
      }
      markersRef.current?.clearLayers();
      const bounds: [number, number][] = [];
      for (const r of res) {
        const ll: L.LatLngExpression = [r.lat, r.lng];
        bounds.push([r.lat, r.lng]);
        const m = L.circleMarker(ll, {
          radius: 7,
          color: '#fff',
          weight: 2,
          fillColor: '#FF3B30',
          fillOpacity: 1,
        });
        m.bindPopup(`<b>${escapeHtml(r.displayName.split(',')[0] ?? r.displayName)}</b><br/>${escapeHtml(r.displayName)}`);
        m.on('click', () => setSelected(r));
        m.addTo(markersRef.current!);
      }
      mapRef.current?.fitBounds(L.latLngBounds(bounds), { padding: [30, 30], maxZoom: 15 });
    } catch {
      setStatus('Error al buscar (verifica tu conexión)');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={styles.container}>
      <div ref={mapElRef} style={styles.map} />

      <div style={styles.searchBox}>
        <Search size={16} color="var(--text-secondary)" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') void runSearch(query.trim());
          }}
          placeholder="Buscar dirección o lugar…"
          style={styles.searchInput}
        />
        {query && (
          <button className="pressable" style={styles.clearBtn} onClick={() => setQuery('')} aria-label="Limpiar">
            <X size={14} color="var(--text-secondary)" />
          </button>
        )}
        <button className="pressable" style={styles.searchBtn} onClick={() => void runSearch(query.trim())} aria-label="Buscar">
          {searching ? '…' : 'Buscar'}
        </button>
      </div>

      {results.length > 0 && (
        <div style={styles.results}>
          {results.map(r => (
            <button
              key={r.placeId}
              className="pressable"
              style={styles.result}
              onClick={() => {
                setSelected(r);
                setResults([]);
                setQuery('');
                mapRef.current?.setView([r.lat, r.lng], 16);
              }}
            >
              <span style={styles.resultEmoji}><MapPin size={15} color="#FF3B30" /></span>
              <span style={styles.resultMain}>
                <span style={styles.resultName}>{r.displayName.split(',')[0]}</span>
                <span style={styles.resultCat}>{r.displayName}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {status && <div style={styles.status}>{status}</div>}

      <button className="pressable" style={styles.gps} onClick={locate} aria-label="Mi ubicación">
        <LocateFixed size={18} color="#fff" />
      </button>

      {selected && (
        <div style={styles.card}>
          <div style={styles.cardTop}>
            <span style={styles.cardPin}><MapPin size={16} color="var(--accent)" /></span>
            <div style={styles.cardMain}>
              <div style={styles.cardName}>{selected.displayName.split(',')[0]}</div>
              <div style={styles.cardCat}>{selected.displayName} · {selected.type}</div>
            </div>
            <button className="pressable" style={styles.cardClose} onClick={() => setSelected(null)} aria-label="Cerrar">
              <X size={16} color="var(--text-secondary)" />
            </button>
          </div>
          <button
            className="pressable"
            style={styles.navBtn}
            onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lng}#map=16/${selected.lat}/${selected.lng}`, '_blank', 'noopener')}
          >
            <Navigation size={16} color="#fff" /> Abrir en OpenStreetMap
          </button>
        </div>
      )}
    </div>
  );
}

export default function MapsApp() {
  if (isNative()) return <NativeMaps />;
  return <LeafletMaps />;
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100%', position: 'relative', overflow: 'hidden' },
  map: { width: '100%', height: '100%' },
  searchBox: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 124,
    height: 40,
    borderRadius: 20,
    background: 'var(--glass)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 8px 0 14px',
    zIndex: 500,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 14,
    color: 'var(--text-primary)',
    background: 'none',
    minWidth: 0,
    fontFamily: 'inherit',
    userSelect: 'text' as const,
  },
  clearBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  searchBtn: {
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 14px',
    borderRadius: 16,
    cursor: 'pointer',
    flexShrink: 0,
  },
  results: {
    position: 'absolute',
    top: 58,
    left: 12,
    right: 12,
    maxHeight: 260,
    overflowY: 'auto',
    background: 'var(--surface-card)',
    borderRadius: 14,
    boxShadow: '0 4px 18px rgba(0,0,0,0.15)',
    zIndex: 500,
  },
  result: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    border: 'none',
    background: 'none',
    padding: '11px 14px',
    cursor: 'pointer',
    borderBottom: '0.5px solid var(--separator-cell)',
    textAlign: 'left' as const,
  },
  resultEmoji: { flexShrink: 0 },
  resultMain: { flex: 1, minWidth: 0 },
  resultName: { display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  resultCat: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginTop: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  status: {
    position: 'absolute',
    top: 58,
    left: 12,
    right: 12,
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    fontSize: 12,
    textAlign: 'center' as const,
    padding: '10px',
    borderRadius: 12,
    zIndex: 500,
  },
  ctrlCol: {
    position: 'absolute',
    right: 14,
    top: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 510,
  },
  ctrlBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    border: 'none',
    background: 'rgba(0,0,0,0.55)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gps: {
    position: 'absolute',
    bottom: 118,
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    border: 'none',
    background: 'var(--accent)',
    boxShadow: '0 3px 12px rgba(0,122,255,0.45)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 500,
  },
  card: {
    position: 'absolute',
    bottom: 54,
    left: 12,
    right: 12,
    background: 'var(--surface-card)',
    borderRadius: 16,
    padding: '13px 16px',
    boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
    zIndex: 500,
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 10 },
  cardPin: { flexShrink: 0 },
  cardMain: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' },
  cardCat: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  cardClose: {
    border: 'none',
    background: 'var(--bg-tertiary)',
    width: 28,
    height: 28,
    borderRadius: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  navBtn: {
    marginTop: 12,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '11px 0',
    borderRadius: 22,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};