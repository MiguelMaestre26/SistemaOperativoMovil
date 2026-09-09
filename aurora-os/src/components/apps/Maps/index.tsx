import { useState, useRef, useEffect } from 'react';
import { Search, Navigation, X, List, MapPin, LocateFixed } from 'lucide-react';

interface Place {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  emoji: string;
}

const PLACES: Place[] = [
  { id: 'p1', name: 'Parque Central', category: 'Parque', x: 180, y: 150, emoji: '🌳' },
  { id: 'p2', name: 'Museo Nacional', category: 'Museo', x: 240, y: 200, emoji: '🏛️' },
  { id: 'p3', name: 'Teatro Nacional', category: 'Teatro', x: 200, y: 120, emoji: '🎭' },
  { id: 'p4', name: 'Estadio Nacional', category: 'Deporte', x: 90, y: 320, emoji: '⚽' },
  { id: 'p5', name: 'La Sabana', category: 'Parque', x: 120, y: 80, emoji: '🌲' },
  { id: 'p6', name: 'Mall San Pedro', category: 'Compras', x: 280, y: 90, emoji: '🛍️' },
  { id: 'p7', name: 'Hospital Calderón', category: 'Salud', x: 70, y: 220, emoji: '🏥' },
  { id: 'p8', name: 'UCR Campus', category: 'Educación', x: 300, y: 300, emoji: '🎓' },
];

const USER_START = { x: 160, y: 250 };

const ROADS: Array<[number, number, number, number]> = [
  [60, 120, 300, 120], [40, 200, 320, 200], [80, 280, 300, 280],
  [100, 60, 100, 360], [180, 40, 180, 360], [260, 60, 260, 360],
  [320, 160, 200, 360], [60, 40, 60, 360],
];

function stepCount(dx: number, dy: number): number {
  return Math.max(8, Math.round(Math.abs(dx) / 6 + Math.abs(dy) / 6));
}

export default function MapsApp() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Place | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState(USER_START);
  const routeRef = useRef<SVGPathElement | null>(null);
  const rafRef = useRef<number>(0);

  const matches = PLACES.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase()),
  );

  const startNav = (place: Place) => {
    setSelected(place);
    setNavigating(true);
    setProgress(0);
  };

  useEffect(() => {
    if (!navigating || !selected) return;
    const start = progress === 0 ? USER_START : position;
    const dx = selected.x - start.x;
    const dy = selected.y - start.y;
    const steps = stepCount(dx, dy);
    const per = 1 / steps;
    let t = 0;
    const tick = () => {
      t += per;
      const k = Math.min(1, t);
      setPosition({ x: USER_START.x + (selected.x - USER_START.x) * k, y: USER_START.y + (selected.y - USER_START.y) * k });
      setProgress(k);
      if (k < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setNavigating(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigating]);

  const distance = selected ? Math.round(Math.hypot(selected.x - USER_START.x, selected.y - USER_START.y) / 8) : 0;
  const eta = selected ? Math.max(2, Math.round(distance / 5)) : 0;

  return (
    <div style={styles.container}>
      <svg viewBox="0 0 360 500" style={styles.map} preserveAspectRatio="xMidYMid slice">
        <rect width="360" height="500" fill="#E8EDF2" />
        <path
          d="M0,420 Q90,380 180,430 T360,400 L360,500 L0,500 Z"
          fill="#BBD9F2"
        />
        <ellipse cx="180" cy="150" rx="46" ry="60" fill="#CFE8C6" />
        <ellipse cx="120" cy="80" rx="70" ry="46" fill="#CBE2BE" />
        <rect x="220" y="240" width="56" height="40" rx="4" fill="#E3DAC9" />
        {ROADS.map((r, i) => (
          <line key={i} x1={r[0]} y1={r[1]} x2={r[2]} y2={r[3]} stroke="#fff" strokeWidth="9" strokeLinecap="round" />
        ))}
        {ROADS.map((r, i) => (
          <line key={`c${i}`} x1={r[0]} y1={r[1]} x2={r[2]} y2={r[3]} stroke="#F8F9FB" strokeWidth="2.5" strokeDasharray="7 7" strokeLinecap="round" />
        ))}

        {navigating && selected && (
          <path
            ref={routeRef}
            d={`M${USER_START.x},${USER_START.y} L${selected.x},${selected.y}`}
            stroke="#007AFF"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="10 8"
            fill="none"
            opacity="0.9"
          />
        )}

        {PLACES.map(p => (
          <g key={p.id} onClick={() => setSelected(p)} style={{ cursor: 'pointer' }}>
            <circle cx={p.x} cy={p.y} r="7" fill="#fff" stroke="#007AFF" strokeWidth="2.5" />
            <text
              x={p.x}
              y={p.y - 12}
              fontSize="16"
              textAnchor="middle"
              style={{ pointerEvents: 'none' }}
            >
              {p.emoji}
            </text>
          </g>
        ))}

        <g key={JSON.stringify(position)}>
          <circle cx={position.x} cy={position.y} r="12" fill="#007AFF" stroke="#fff" strokeWidth="3" />
          <circle cx={position.x} cy={position.y} r="20" fill="rgba(0,122,255,0.25)" />
        </g>
      </svg>

      <div style={styles.searchBox}>
        <Search size={16} color="#8E8E93" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar lugares en San José…"
          style={styles.searchInput}
        />
        {query && (
          <button style={styles.clearBtn} onClick={() => setQuery('')} aria-label="Limpiar">
            <X size={14} color="#8E8E93" />
          </button>
        )}
      </div>

      {query && (
        <div style={styles.results}>
          {matches.length === 0 && <div style={styles.noRes}>Sin resultados</div>}
          {matches.map(p => (
            <button key={p.id} style={styles.result} onClick={() => { setSelected(p); setQuery(''); }}>
              <span style={styles.resultEmoji}>{p.emoji}</span>
              <span style={styles.resultMain}>
                <span style={styles.resultName}>{p.name}</span>
                <span style={styles.resultCat}>{p.category}</span>
              </span>
              <MapPin size={15} color="#007AFF" />
            </button>
          ))}
        </div>
      )}

      <button
        style={styles.gps}
        onClick={() => { setSelected(null); setNavigating(false); }}
        aria-label="Centrar mapa"
      >
        <LocateFixed size={18} color="#fff" />
      </button>

      {selected && (
        <div style={styles.card}>
          <div style={styles.cardTop}>
            <span style={styles.cardEmoji}>{selected.emoji}</span>
            <div style={styles.cardMain}>
              <div style={styles.cardName}>{selected.name}</div>
              <div style={styles.cardCat}>{selected.category} · Centro San José</div>
            </div>
            <button style={styles.cardClose} onClick={() => setSelected(null)} aria-label="Cerrar">
              <X size={16} color="#8E8E93" />
            </button>
          </div>
          {navigating ? (
            <div style={styles.navRow}>
              <div style={styles.navInfo}>
                <div style={styles.navBig}>{eta} min</div>
                <div style={styles.navSmall}>{distance} m</div>
              </div>
              <div style={styles.navBar}>
                <div style={{ ...styles.navFill, width: `${progress * 100}%` }} />
              </div>
            </div>
          ) : (
            <button style={styles.navBtn} onClick={() => startNav(selected)}>
              <Navigation size={16} color="#fff" /> Cómo llegar
            </button>
          )}
        </div>
      )}

      {navigating && selected && (
        <div style={styles.steps}>
          <List size={14} color="#8E8E93" />
          <span style={{ fontSize: 13, color: '#111' }}>
            {progress < 0.5 ? 'Continúa por Avenida Central hasta ' : 'Ya casi llegas a '}
            <b>{selected.name}</b> ({Math.round((1 - progress) * 100)}%)
          </span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100%', position: 'relative', background: '#E8EDF2', overflow: 'hidden' },
  map: { width: '100%', height: '100%' },
  searchBox: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    height: 38,
    borderRadius: 19,
    background: '#fff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 14px',
    zIndex: 30,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 14,
    color: '#111',
    background: 'none',
  },
  clearBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  results: {
    position: 'absolute',
    top: 58,
    left: 12,
    right: 12,
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
    zIndex: 30,
    overflow: 'hidden',
  },
  result: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    border: 'none',
    background: 'none',
    padding: '12px 14px',
    cursor: 'pointer',
    borderBottom: '0.5px solid rgba(0,0,0,0.05)',
    textAlign: 'left' as const,
  },
  resultEmoji: { fontSize: 18 },
  resultMain: { flex: 1, minWidth: 0 },
  resultName: { display: 'block', fontSize: 14, fontWeight: 600, color: '#111' },
  resultCat: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
  noRes: { padding: '14px', fontSize: 13, color: '#C7C7CC', textAlign: 'center' as const },
  gps: {
    position: 'absolute',
    bottom: 130,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    border: 'none',
    background: '#007AFF',
    boxShadow: '0 2px 10px rgba(0,122,255,0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  card: {
    position: 'absolute',
    bottom: 60,
    left: 12,
    right: 12,
    background: '#fff',
    borderRadius: 16,
    padding: '14px 16px',
    boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
    zIndex: 30,
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: 12 },
  cardEmoji: { fontSize: 30 },
  cardMain: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 16, fontWeight: 700, color: '#111' },
  cardCat: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  cardClose: {
    border: 'none',
    background: '#F2F2F7',
    width: 28,
    height: 28,
    borderRadius: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    marginTop: 12,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 0',
    borderRadius: 24,
    border: 'none',
    background: '#007AFF',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  navRow: { marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 },
  navInfo: { flexShrink: 0 },
  navBig: { fontSize: 18, fontWeight: 700, color: '#007AFF' },
  navSmall: { fontSize: 11, color: '#8E8E93' },
  navBar: { flex: 1, height: 6, borderRadius: 3, background: '#E5E5EA', overflow: 'hidden' },
  navFill: { height: '100%', background: '#007AFF', borderRadius: 3, transition: 'width 0.3s' },
  steps: {
    position: 'absolute',
    bottom: 150,
    left: 12,
    right: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    padding: '12px',
    borderRadius: 14,
    zIndex: 40,
  },
};