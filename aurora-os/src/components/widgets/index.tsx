import { useState, useEffect } from 'react';
import { Calendar as CalIcon, StickyNote, Zap, BatteryCharging, Battery } from 'lucide-react';
import { useSystemStore } from '../../stores/useSystemStore';
import { loadState } from '../../core/persistence';
import { fetchWeather, weatherCodeInfo, DEFAULT_CITY, type WeatherReport } from '../../core/weather';

export interface WidgetProps {
  onOpenApp: (id: string) => void;
}

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function ClockWidget({ onOpenApp }: WidgetProps) {
  const now = useNow();
  const time = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <button
      className="widget-container glass-card"
      style={{ ...styles.wide, padding: '20px 22px' }}
      onClick={() => onOpenApp('clock')}
    >
      <Panels />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%' }}>
        <span style={styles.clockTime}>{time}</span>
        <span style={styles.clockSeconds}>{now.toLocaleTimeString('es', { second: '2-digit' })}</span>
      </div>
      <div style={styles.clockDate}>{date}</div>
    </button>
  );
}

function Panels() {
  return (
    <>
      <div style={styles.pillLeft} />
      <div style={styles.pillRight} />
    </>
  );
}

export function WeatherWidget({ onOpenApp }: WidgetProps) {
  const [report, setReport] = useState<WeatherReport | null>(null);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      void fetchWeather(DEFAULT_CITY, 'C').then(r => {
        if (alive) setReport(r);
      });
    };
    refresh();
    const t = setInterval(refresh, 15 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const info = report ? weatherCodeInfo(report.current.code, report.current.isDay) : null;

  return (
    <button
      className="widget-container glass-card"
      style={{ ...styles.wide, padding: '16px 20px' }}
      onClick={() => onOpenApp('weather')}
    >
      <div style={styles.weatherHeader}>
        <span style={styles.weatherTitle}>Tiempo</span>
        <span style={styles.weatherLoc}>{report?.location ?? '…'}</span>
      </div>
      <div style={styles.weatherMain}>
        <span style={styles.weatherEmoji}>{info?.emoji ?? '🌤️'}</span>
        <span style={styles.weatherTemp}>{report ? `${report.current.temp}${report.unit}` : '—'}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={styles.weatherLabel}>{info?.label ?? 'Cargando…'}</span>
          <span style={styles.weatherFeels}>
            {report ? `Sensación ${report.current.feels}${report.unit} · Humedad ${report.current.humidity}%` : ''}
          </span>
        </div>
      </div>
    </button>
  );
}

export function BatteryWidget({ onOpenApp }: WidgetProps) {
  const batteryLevel = useSystemStore(s => s.batteryLevel);
  const isCharging = useSystemStore(s => s.isCharging);
  const color = batteryLevel > 60 ? 'var(--success)' : batteryLevel > 20 ? 'var(--warning)' : 'var(--danger)';

  return (
    <button
      className="widget-container glass-card"
      style={styles.small}
      onClick={() => onOpenApp('settings')}
    >
      <div style={styles.smallHeader}>
        {isCharging ? <BatteryCharging size={16} color={color} /> : <Battery size={16} color={color} />}
        <span style={styles.smallTitle}>Batería</span>
      </div>
      <div style={{ ...styles.batteryNum, color }}>{Math.round(batteryLevel)}%</div>
      <div style={styles.batteryTrack}>
        <div style={{ width: `${batteryLevel}%`, height: '100%', borderRadius: 4, background: color }} />
      </div>
    </button>
  );
}

export function CalendarWidget({ onOpenApp }: WidgetProps) {
  const now = useNow();
  return (
    <button
      className="widget-container glass-card"
      style={styles.small}
      onClick={() => onOpenApp('calendar')}
    >
      <div style={styles.smallHeader}>
        <CalIcon size={16} color="var(--accent)" />
        <span style={styles.smallTitle}>Hoy</span>
      </div>
      <div style={styles.calBox}>
        <span style={styles.calDay}>{now.getDate()}</span>
        <span style={styles.calMonth}>{now.toLocaleDateString('es', { month: 'long' })}</span>
      </div>
    </button>
  );
}

interface StoredNote {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

export function NotesWidget({ onOpenApp }: WidgetProps) {
  const [notes, setNotes] = useState<StoredNote[]>([]);

  useEffect(() => {
    const sync = () => setNotes(loadState<StoredNote[]>('notes', []));
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  const top = sorted[0];
  const preview = top
    ? (top.title || top.body || 'Nota sin texto')
    : 'Toca para crear una nota rápida';

  return (
    <button
      className="widget-container glass-card"
      style={{ ...styles.wide, padding: '14px 18px' }}
      onClick={() => onOpenApp('notes')}
    >
      <div style={styles.smallHeader}>
        <StickyNote size={16} color="#FFD700" />
        <span style={styles.smallTitle}>Notas</span>
        {top && <span style={styles.noteCount}>{sorted.length}</span>}
      </div>
      <div style={styles.notePreview}>{preview}</div>
    </button>
  );
}

export function WidgetsPage({ onOpenApp }: WidgetProps) {
  return (
    <div style={styles.scroll}>
      <div style={styles.sectionHeader}>Buen día</div>
      <div style={styles.grid}>
        <ClockWidget onOpenApp={onOpenApp} />
        <WeatherWidget onOpenApp={onOpenApp} />
        <BatteryWidget onOpenApp={onOpenApp} />
        <CalendarWidget onOpenApp={onOpenApp} />
        <NotesWidget onOpenApp={onOpenApp} />
      </div>
      <div style={styles.hintIcon}>
        <Zap size={14} color="var(--text-tertiary)" />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scroll: {
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    padding: '4px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    paddingTop: 2,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  wide: {
    gridColumn: 'span 2',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    border: 'none',
    minWidth: 0,
  },
  small: {
    gridColumn: 'span 1',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    border: 'none',
    padding: '14px 16px',
    minHeight: 96,
  },
  pillLeft: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: '50%',
    background: 'color-mix(in srgb, var(--primary-container) 65%, transparent)',
    filter: 'blur(18px)',
  },
  pillRight: {
    position: 'absolute',
    bottom: -80,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: 'color-mix(in srgb, var(--tertiary-container) 55%, transparent)',
    filter: 'blur(20px)',
  },
  clockTime: {
    fontSize: 54,
    fontWeight: 600,
    letterSpacing: -2,
    color: 'var(--text-primary)',
    lineHeight: 1,
    position: 'relative' as const,
  },
  clockSeconds: {
    fontSize: 18,
    fontWeight: 300,
    color: 'var(--text-secondary)',
    position: 'relative' as const,
  },
  clockDate: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    textTransform: 'capitalize' as const,
    position: 'relative' as const,
  },
  weatherHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    position: 'relative' as const,
  },
  weatherTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' },
  weatherLoc: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  weatherMain: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    position: 'relative' as const,
  },
  weatherEmoji: { fontSize: 40, lineHeight: 1 },
  weatherTemp: { fontSize: 44, fontWeight: 600, letterSpacing: -1, color: 'var(--text-primary)' },
  weatherLabel: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  weatherFeels: { fontSize: 11, color: 'var(--text-secondary)' },
  smallHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    position: 'relative' as const,
  },
  smallTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', flex: 1 },
  batteryNum: { fontSize: 30, fontWeight: 700, letterSpacing: -1 },
  batteryTrack: {
    width: '100%',
    height: 6,
    borderRadius: 4,
    background: 'var(--widget-tint)',
    overflow: 'hidden',
  },
  calBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: 1.1,
  },
  calDay: { fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' },
  calMonth: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    textTransform: 'capitalize' as const,
  },
  noteCount: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--accent)',
    background: 'var(--widget-tint)',
    borderRadius: 8,
    padding: '1px 7px',
  },
  notePreview: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '100%',
  },
  hintIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    color: 'var(--text-tertiary)',
    fontSize: 11,
    padding: '8px 0 2px',
  },
};