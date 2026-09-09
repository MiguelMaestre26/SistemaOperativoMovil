import { useState, useEffect, useRef } from 'react';
import { AlarmClock, Timer as TimerIcon, StopCircle, History, Plus, Trash2, BellOff, BellRing } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { notificationService } from '../../../core/NotificationService';
import { tonePlayer } from '../../../core/audio';

interface Alarm {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
  label: string;
}

const CITIES = ['America/Costa_Rica', 'America/New_York', 'Europe/Madrid', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/London', 'America/Mexico_City', 'Asia/Kolkata'];

const TABS = [
  { id: 'world', label: 'Reloj', icon: AlarmClock },
  { id: 'alarm', label: 'Alarma', icon: BellRing },
  { id: 'sw', label: 'Cronómetro', icon: StopCircle },
  { id: 'timer', label: 'Temporizador', icon: TimerIcon },
];

function fmtTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function fmtMs(ms: number): string {
  const cs = Math.floor(ms / 10) % 100;
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function beep() {
  tonePlayer.setTempo(180);
  tonePlayer.load([1567.98, 1567.98, 1567.98]);
  tonePlayer.resume();
  setTimeout(() => tonePlayer.pause(), 1800);
}

export default function ClockApp() {
  const [now, setNow] = useState(new Date());
  const [tab, setTab] = useState('world');
  const [alarms, setAlarms] = usePersistedState<Alarm[]>('clock:alarms', []);
  const [swRunning, setSwRunning] = useState(false);
  const [swMs, setSwMs] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [timerTotal, setTimerTotal] = usePersistedState<number>('clock:timer', 0);
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const firedRef = useRef<string[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!swRunning) return;
    const start = Date.now() - swMs;
    const t = setInterval(() => setSwMs(Date.now() - start), 30);
    return () => clearInterval(t);
  }, [swRunning]);

  useEffect(() => {
    if (timerLeft === null || timerLeft === undefined) return;
    const t = setInterval(() => {
      setTimerLeft(l => {
        if (l === null || l <= 0) {
          clearInterval(t);
          return 0;
        }
        return l - 10;
      });
    }, 10);
    return () => clearInterval(t);
  }, [timerLeft !== null]);

  useEffect(() => {
    if (timerLeft === 0) {
      beep();
      notificationService.push('clock', 'Temporizador', '¡Tu temporizador terminó!');
      setTimerLeft(null);
    }
  }, [timerLeft]);

  useEffect(() => {
    for (const alarm of alarms) {
      if (!alarm.enabled) continue;
      const key = `${alarm.id}-${now.getHours()}-${now.getMinutes()}`;
      if (now.getHours() === alarm.hour && now.getMinutes() === alarm.minute && !firedRef.current.includes(key)) {
        firedRef.current.push(key);
        beep();
        notificationService.push('clock', 'Alarma', alarm.label || `Alarma ${fmtTime(alarm.hour, alarm.minute)}`);
      }
    }
    if (firedRef.current.length > 30) firedRef.current = firedRef.current.slice(-20);
  }, [now, alarms]);

  const addAlarm = () => {
    const h = window.prompt('Hora (0-23):', String(now.getHours())) ?? '7';
    const m = window.prompt('Minutos (0-59):', String(now.getMinutes())) ?? '0';
    const hh = Math.min(23, Math.max(0, parseInt(h, 10) || 0));
    const mm = Math.min(59, Math.max(0, parseInt(m, 10) || 0));
    setAlarms(as => [...as, { id: `a_${Date.now()}`, hour: hh, minute: mm, enabled: true, label: '' }]);
  };

  const toggleAlarm = (id: string) => {
    setAlarms(as => as.map(a => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  const removeAlarm = (id: string) => setAlarms(as => as.filter(a => a.id !== id));

  const startTimer = () => {
    if (timerTotal <= 0) return;
    setTimerLeft(timerTotal * 1000);
  };

  const cityTime = (zone: string) => {
    try {
      return new Intl.DateTimeFormat('es', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(now);
    } catch {
      return '--:--:--';
    }
  };

  const cityDate = (zone: string) => {
    try {
      return new Intl.DateTimeFormat('es', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short' }).format(now);
    } catch {
      return '';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Reloj</span>
      </div>

      <div style={styles.content}>
        {tab === 'world' && (
          <div style={styles.list}>
            {CITIES.map(zone => {
              const label = zone.split('/').pop()?.replace('_', ' ') ?? zone;
              return (
                <div key={zone} style={styles.cityRow}>
                  <div>
                    <div style={styles.cityName}>{label}</div>
                    <div style={styles.cityDate}>{cityDate(zone)}</div>
                  </div>
                  <div style={styles.cityTime}>{cityTime(zone)}</div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'alarm' && (
          <div style={styles.list}>
            <div style={styles.alarmHead}>
              <span style={styles.count}>
                {alarms.filter(a => a.enabled).length} alarma{alarms.filter(a => a.enabled).length === 1 ? '' : 's'} activa{alarms.filter(a => a.enabled).length === 1 ? '' : 's'}
              </span>
              <button style={styles.addBtn} onClick={addAlarm} aria-label="Agregar alarma">
                <Plus size={18} color="#007AFF" />
              </button>
            </div>
            {alarms.length === 0 ? (
              <div style={styles.emptyText}>
                <BellOff size={34} color="#E5E5EA" />
                <span style={{ color: '#C7C7CC', fontSize: 13, marginTop: 8 }}>Sin alarmas. Toca + para crear una.</span>
              </div>
            ) : (
              alarms
                .slice()
                .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
                .map(a => (
                  <div key={a.id} style={{ ...styles.alarmRow, opacity: a.enabled ? 1 : 0.45 }}>
                    <div>
                      <div style={styles.alarmTime}>{fmtTime(a.hour, a.minute)}</div>
                      {a.label && <div style={styles.alarmLabel}>{a.label}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        style={styles.switch}
                        onClick={() => toggleAlarm(a.id)}
                        aria-label={a.enabled ? 'Desactivar' : 'Activar'}
                      >
                        <span style={{ ...styles.switchKnob, transform: a.enabled ? 'translateX(20px)' : 'none', background: a.enabled ? '#fff' : '#8E8E93' }} />
                      </button>
                      <button style={styles.trashBtn} onClick={() => removeAlarm(a.id)} aria-label="Eliminar alarma">
                        <Trash2 size={17} color="#FF3B30" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {tab === 'sw' && (
          <div style={styles.vertical}>
            <div style={styles.swDisplay}>{fmtMs(swMs)}</div>
            <div style={styles.swButtons}>
              <button
                style={{ ...styles.swBtn, background: '#F2F2F7', color: '#111' }}
                onClick={() => {
                  if (swRunning) {
                    setLaps(l => [...l, swMs]);
                  } else {
                    setSwMs(0);
                    setLaps([]);
                  }
                }}
              >
                {swRunning ? 'Vuelta' : 'Reiniciar'}
              </button>
              <button
                style={{ ...styles.swBtn, background: swRunning ? '#FF9500' : '#34C759', color: '#fff' }}
                onClick={() => setSwRunning(r => !r)}
              >
                {swRunning ? 'Detener' : 'Iniciar'}
              </button>
            </div>
            {laps.length > 0 && (
              <div style={styles.laps}>
                {laps
                  .slice()
                  .reverse()
                  .map((l, i) => (
                    <div key={i} style={styles.lapRow}>
                      <span style={{ color: '#8E8E93' }}>Vuelta {laps.length - i}</span>
                      <span>{fmtMs(l)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {tab === 'timer' && (
          <div style={styles.vertical}>
            {timerLeft === null ? (
              <>
                <div style={styles.timerLabel}>Minutos</div>
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={timerTotal}
                  onChange={e => setTimerTotal(Math.max(0, Number(e.target.value)))}
                  style={styles.timerInput}
                />
                <button
                  style={{ ...styles.swBtn, background: '#FF9500', color: '#fff', marginTop: 18 }}
                  onClick={startTimer}
                  disabled={timerTotal <= 0}
                >
                  Iniciar
                </button>
              </>
            ) : (
              <>
                <div style={styles.timerCount}>{fmtMs(timerLeft)}</div>
                <div style={styles.swButtons}>
                  <button
                    style={{ ...styles.swBtn, background: '#F2F2F7', color: '#111' }}
                    onClick={() => {
                      setTimerLeft(null);
                      setTimerTotal(0);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    style={{ ...styles.swBtn, background: timerLeft ? '#8E8E93' : '#FF9500', color: '#fff' }}
                    onClick={() => setTimerLeft(null)}
                  >
                    Detener
                  </button>
                </div>
              </>
            )}
            <div style={styles.hint}>
              <TimerIcon size={16} color="#C7C7CC" />
              <span style={{ color: '#C7C7CC', fontSize: 13 }}>Al terminar sonará una alarma y llegará una notificación.</span>
            </div>
          </div>
        )}
      </div>

      <div style={styles.tabs}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              style={{ ...styles.tab, ...(tab === t.id ? styles.tabActive : {}) }}
              onClick={() => setTab(t.id)}
            >
              <Icon size={20} color={tab === t.id ? '#007AFF' : '#8E8E93'} />
              <span style={{ ...styles.tabLabel, color: tab === t.id ? '#007AFF' : '#8E8E93' }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {laps.length > 0 && tab === 'sw' && (
        <div style={styles.floatingLaps}>
          <History size={14} color="#8E8E93" />
          <span style={{ fontSize: 13, color: '#111' }}>{laps.length} vueltas</span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' },
  header: { padding: '12px 16px 6px' },
  title: { fontSize: 22, fontWeight: 700, color: '#111' },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  list: { flex: 1, overflowY: 'auto', paddingBottom: 20 },
  cityRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 18px',
    borderBottom: '0.5px solid rgba(0,0,0,0.06)',
  },
  cityName: { fontSize: 17, fontWeight: 600, color: '#111' },
  cityDate: { fontSize: 12, color: '#8E8E93', marginTop: 2, textTransform: 'capitalize' as const },
  cityTime: { fontSize: 22, fontWeight: 500, color: '#111', fontVariantNumeric: 'tabular-nums' as const },
  alarmHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px' },
  count: { fontSize: 13, color: '#8E8E93' },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    border: 'none',
    background: 'rgba(0,122,255,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alarmRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '0.5px solid rgba(0,0,0,0.06)',
  },
  alarmTime: { fontSize: 34, fontWeight: 200, color: '#111' },
  alarmLabel: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  switch: {
    width: 46,
    height: 28,
    borderRadius: 14,
    border: 'none',
    background: 'rgba(0,0,0,0.12)',
    position: 'relative',
    cursor: 'pointer',
  },
  switchKnob: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    background: '#8E8E93',
    boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
    transition: 'all 0.2s',
  },
  trashBtn: { border: 'none', background: 'none', cursor: 'pointer', padding: 6 },
  emptyText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    marginTop: '30%',
    textAlign: 'center' as const,
  },
  vertical: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
    gap: 14,
  },
  swDisplay: { fontSize: 44, fontWeight: 200, color: '#111', fontVariantNumeric: 'tabular-nums' as const },
  timerCount: { fontSize: 52, fontWeight: 200, color: '#111', fontVariantNumeric: 'tabular-nums' as const },
  swButtons: { display: 'flex', gap: 16, marginTop: 10 },
  swBtn: {
    width: 84,
    height: 52,
    borderRadius: 26,
    border: 'none',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
  },
  laps: {
    width: '100%',
    maxHeight: 220,
    overflowY: 'auto',
    borderTop: '0.5px solid rgba(0,0,0,0.06)',
    marginTop: 16,
  },
  lapRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 4px',
    borderBottom: '0.5px solid rgba(0,0,0,0.05)',
    fontSize: 15,
    fontVariantNumeric: 'tabular-nums' as const,
  },
  timerLabel: { fontSize: 14, color: '#8E8E93' },
  timerInput: {
    fontSize: 40,
    fontWeight: 200,
    width: 120,
    textAlign: 'center' as const,
    border: 'none',
    borderBottom: '2px solid #007AFF',
    outline: 'none',
    color: '#111',
    background: 'none',
  },
  hint: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingBottom: 26,
  },
  floatingLaps: {
    position: 'absolute',
    bottom: 74,
    right: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(0,0,0,0.75)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: 18,
  },
  tabs: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 0 10px',
    borderTop: '0.5px solid rgba(0,0,0,0.08)',
    background: '#fff',
  },
  tab: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  tabActive: {},
  tabLabel: { fontSize: 10, fontWeight: 500 },
};