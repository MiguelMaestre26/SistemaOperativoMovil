import { useState, useEffect } from 'react';
import { CloudSun, RefreshCw } from 'lucide-react';
import { fetchWeather, weatherCodeInfo, type WeatherReport } from '../../../core/weather';

export default function Weather() {
  const [weather, setWeather] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const report = await fetchWeather();
    setWeather(report);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

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
      <div style={styles.hero}>
        <button style={styles.refresh} onClick={() => void load()} aria-label="Actualizar">
          <RefreshCw size={15} color="#fff" className={loading ? 'spin' : ''} />
        </button>
        <div style={styles.location}>{weather.location}</div>
        <div style={styles.condition}>{cur.emoji} {cur.label}</div>
        <div style={styles.temp}>{weather.current.temp}°</div>
        <div style={styles.hilow}>
          Máx {weather.daily[0]?.max}° · Mín {weather.daily[0]?.min}°
        </div>
        <div style={styles.details}>
          <span>Sensación {weather.current.feels}°</span>
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
                <span style={styles.hourTemp}>{h.temp}°</span>
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
                <b>{d.max}°</b> <span style={{ opacity: 0.55 }}>{d.min}°</span>
              </span>
            </div>
          );
        })}
      </div>
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
    background: 'linear-gradient(180deg, #4A90D9 0%, #357ABD 40%, #5B9BD5 100%)',
  },
  loadingText: { color: '#fff', fontSize: 14, opacity: 0.85 },
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #4A90D9 0%, #357ABD 40%, #5B9BD5 100%)',
    overflowY: 'auto',
    color: '#fff',
  },
  hero: { position: 'relative', textAlign: 'center', padding: '18px 16px 22px' },
  refresh: {
    position: 'absolute',
    top: 14,
    right: 14,
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: 16,
    width: 30,
    height: 30,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  location: { fontSize: 18, fontWeight: 500 },
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
  last: { height: 20 },
};