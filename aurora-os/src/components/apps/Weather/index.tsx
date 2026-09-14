import { useState, useEffect, useCallback } from 'react';
import { CloudSun, RefreshCw, Search, X, LocateFixed, MapPin } from 'lucide-react';
import {
  fetchWeather,
  searchCity,
  weatherCodeInfo,
  DEFAULT_CITY,
  FAVORITE_CITIES,
  type WeatherReport,
  type City,
} from '../../../core/weather';
import { usePersistedState } from '../../../core/persistence';

export default function Weather() {
  const [weather, setWeather] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  const [city, setCity] = usePersistedState<City>('weather:city:v2', DEFAULT_CITY);
  const [favorites, setFavorites] = usePersistedState<City[]>('weather:favorites:v2', FAVORITE_CITIES);
  const [unit, setUnit] = usePersistedState<'C' | 'F'>('weather:unit', 'C');

  const load = useCallback(
    async (c: City | null = null, tempUnit: 'C' | 'F' | null = null) => {
      const target = c ?? city;
      const u = tempUnit ?? unit;
      setLoading(true);
      const report = await fetchWeather(target, u);
      setWeather(report);
      setLoading(false);
    },
    [city, unit],
  );

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15 * 60 * 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (unit) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await searchCity(query);
      setResults(res);
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const pickCity = (c: City) => {
    setCity(c);
    setQuery('');
    setResults([]);
    setFavorites(fs => (fs.some(f => f.name === c.name) ? fs : [...fs, c].slice(-8)));
    void load(c);
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && results.length > 0) {
      pickCity(results[0]);
    } else if (e.key === 'Escape') {
      setQuery('');
      setResults([]);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c: City = { name: 'Mi ubicación', lat: pos.coords.latitude, lon: pos.coords.longitude };
        pickCity(c);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  if (loading && !weather) {
    return (
      <div style={styles.center}>
        <CloudSun size={48} color="#fff" style={{ opacity: 0.7 }} />
        <div style={styles.loadingText}>Consultando clima…</div>
      </div>
    );
  }

  if (!weather) return null;

  const cur = weatherCodeInfo(weather.current.code, weather.current.isDay);
  const now = new Date();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.searchBox}>
          <Search size={15} color="#fff" style={{ opacity: 0.8 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
            placeholder="Buscar ciudad…"
            style={styles.searchInput}
          />
          {query && (
            <button style={styles.clearBtn} onClick={() => setQuery('')} aria-label="Limpiar">
              <X size={14} color="#fff" />
            </button>
          )}
          {searching && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>…</span>}
        </div>

        <div style={styles.headerBtns}>
          <div style={styles.unitSeg}>
            {(['C', 'F'] as const).map(u => (
              <button
                key={u}
                style={{ ...styles.unitBtn, ...(unit === u ? styles.unitBtnActive : {}) }}
                onClick={() => setUnit(u)}
                aria-label={`Grados ${u}`}
              >
                °{u}
              </button>
            ))}
          </div>
          <button style={styles.iconBtn} onClick={locate} aria-label="Mi ubicación">
            <LocateFixed size={15} color="#fff" />
          </button>
          <button style={styles.iconBtn} onClick={() => void load()} aria-label="Actualizar">
            <RefreshCw size={15} color="#fff" className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {query && (
        <div style={styles.results}>
          {results.length === 0 && !searching && (
            <div style={styles.noRes}>Sin resultados</div>
          )}
          {results.map(r => (
            <button key={r.name} style={styles.result} onClick={() => pickCity(r)}>
              <MapPin size={14} color="var(--primary)" />
              <span style={styles.resultName}>{r.name}</span>
            </button>
          ))}
        </div>
      )}

      {favorites.length > 1 && (
        <div style={styles.favRow}>
          {favorites.map(f => (
            <button
              key={f.name}
              style={{ ...styles.favChip, ...(f.name === weather.location ? styles.favChipActive : {}) }}
              onClick={() => {
                setCity(f);
                void load(f);
              }}
            >
              {f.name.split(',')[0]}
            </button>
          ))}
        </div>
      )}

      <div style={styles.hero}>
        <div style={styles.location}>{weather.location}</div>
        <div style={styles.condition}>{cur.emoji} {cur.label}</div>
        <div style={styles.temp}>{weather.current.temp}{weather.unit}</div>
        <div style={styles.hilow}>
          Máx {weather.daily[0]?.max}{weather.unit} · Mín {weather.daily[0]?.min}{weather.unit}
        </div>
        <div style={styles.details}>
          <span>Sensación {weather.current.feels}{weather.unit}</span>
          <span>Humedad {weather.current.humidity}%</span>
          <span>Viento {weather.current.wind} km/h</span>
        </div>
        <div style={styles.updated}>Actualizado {now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Próximas 24 horas</div>
        <div style={styles.hourlyRow}>
          {weather.hourly.map((h, i) => {
            const info = weatherCodeInfo(h.code, true);
            return (
              <div key={i} style={styles.hourItem}>
                <span style={styles.hourTime}>{h.time}</span>
                <span style={styles.hourIcon}>{info.emoji}</span>
                <span style={styles.hourTemp}>{h.temp}{weather.unit}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Próximos 7 días</div>
        {weather.daily.map((d, i) => {
          const info = weatherCodeInfo(d.code, true);
          return (
            <div key={i} style={styles.dayRow}>
              <span style={styles.dayName}>{d.date}</span>
              <span style={styles.dayIcon}>{info.emoji}</span>
              <span style={styles.dayCond}>{info.label}</span>
              <span style={styles.dayTemps}>
                <b>{d.max}{weather.unit}</b> <span style={{ opacity: 0.55 }}>{d.min}{weather.unit}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: 'linear-gradient(180deg, #5C9EFF 0%, #3478F6 45%, #6A5CF6 100%)',
  },
  loadingText: { color: '#fff', fontSize: 14, opacity: 0.85 },
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #5C9EFF 0%, #3478F6 45%, #6A5CF6 100%)',
    overflowY: 'auto',
    color: '#fff',
  },
  header: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 4px' },
  searchBox: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 12px',
  },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#fff', background: 'none' },
  clearBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  headerBtns: { display: 'flex', alignItems: 'center', gap: 6 },
  unitSeg: { display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: 2 },
  unitBtn: {
    border: 'none',
    background: 'none',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: 700,
    width: 28,
    height: 24,
    borderRadius: 12,
    cursor: 'pointer',
  },
  unitBtnActive: { background: '#fff', color: '#3478F6' },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  results: {
    margin: '6px 16px 0',
    background: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 4px 18px rgba(0,0,0,0.25)',
    zIndex: 20,
  },
  result: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '11px 14px',
    border: 'none',
    background: 'none',
    borderBottom: '0.5px solid rgba(0,0,0,0.05)',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  resultName: { fontSize: 14, color: '#111' },
  noRes: { padding: 14, fontSize: 13, color: '#C7C7CC', textAlign: 'center' as const },
  favRow: { display: 'flex', gap: 8, padding: '6px 16px 2px', overflowX: 'auto' },
  favChip: {
    padding: '6px 13px',
    borderRadius: 14,
    border: 'none',
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
    flexShrink: 0,
  },
  favChipActive: { background: '#fff', color: '#3478F6', fontWeight: 700 },
  hero: { position: 'relative', textAlign: 'center', padding: '14px 16px 20px' },
  location: { fontSize: 18, fontWeight: 500, paddingLeft: 36, paddingRight: 36 },
  condition: { fontSize: 13, opacity: 0.9, marginTop: 2 },
  temp: { fontSize: 76, fontWeight: 200, lineHeight: 1 },
  hilow: { fontSize: 16, opacity: 0.85, marginTop: 4 },
  details: {
    display: 'flex',
    justifyContent: 'center',
    gap: 14,
    marginTop: 14,
    fontSize: 12,
    opacity: 0.9,
  },
  updated: { fontSize: 11, opacity: 0.7, marginTop: 10 },
  card: {
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    margin: '0 16px 16px',
    padding: '14px 0',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  cardTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
    padding: '0 16px 8px',
  },
  hourlyRow: { display: 'flex', overflowX: 'auto', padding: '0 8px', gap: 4 },
  hourItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    flexShrink: 0,
  },
  hourTime: { fontSize: 12, opacity: 0.85 },
  hourIcon: { fontSize: 20 },
  hourTemp: { fontSize: 14, fontWeight: 500 },
  dayRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 16px',
    borderTop: '0.5px solid rgba(255,255,255,0.18)',
  },
  dayName: { width: 110, fontSize: 15, textTransform: 'capitalize' },
  dayIcon: { fontSize: 18 },
  dayCond: { flex: 1, fontSize: 12, opacity: 0.8 },
  dayTemps: { fontSize: 14, display: 'flex', gap: 6 },
};