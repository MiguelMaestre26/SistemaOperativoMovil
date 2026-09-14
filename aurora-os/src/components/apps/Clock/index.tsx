import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AlarmClock, Timer as TimerIcon, StopCircle, History, Plus, Trash2, BellOff, BellRing, Wifi, WifiOff, X } from 'lucide-react';
import { usePersistedState, removeState } from '../../../core/persistence';
import { notificationService } from '../../../core/NotificationService';
import { tonePlayer } from '../../../core/audio';
import { fetchWorldTimes, type WorldTime } from '../../../core/worldClock';
import {
  Screen, AppHeader, TabBar, IconButton, Toggle, EmptyState, Button, ProgressRing,
  ListGroup, ListRow,
  openPrompt,
} from '../../ui';

interface Alarm {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
  label: string;
}

const DEFAULT_CITIES = ['America/Costa_Rica', 'America/New_York', 'Europe/Madrid', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/London', 'America/Sao_Paulo', 'Asia/Kolkata'];
const OLD_DEFAULT_CITIES = ['America/Costa_Rica', 'America/New_York', 'Europe/Madrid', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/London', 'America/Mexico_City', 'Asia/Kolkata'];

const POPULAR_ZONES = [
  'America/Caracas', 'America/Costa_Rica', 'America/Bogota', 'America/Lima',
  'America/Mexico_City', 'America/Guatemala', 'America/Panama', 'America/Santiago',
  'America/Buenos_Aires', 'America/Sao_Paulo', 'America/New_York', 'America/Toronto',
  'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix',
  'America/Vancouver', 'America/Havana', 'America/Puerto_Rico',
  'Europe/London', 'Europe/Paris', 'Europe/Madrid', 'Europe/Berlin', 'Europe/Rome',
  'Europe/Lisbon', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Zurich',
  'Europe/Athens', 'Europe/Istanbul', 'Europe/Warsaw', 'Europe/Moscow',
  'Africa/Cairo', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg', 'Africa/Casablanca',
  'Asia/Dubai', 'Asia/Riyadh', 'Asia/Kolkata', 'Asia/Karachi', 'Asia/Dhaka',
  'Asia/Bangkok', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Pacific/Auckland', 'Pacific/Honolulu',
];

function tzOffsetLabel(tz: string, date: Date): string {
  try {
    const part = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'longOffset' })
      .formatToParts(date).find(p => p.type === 'timeZoneName');
    return (part?.value ?? '').replace('GMT', 'UTC');
  } catch {
    return '';
  }
}

const TABS = [
  { id: 'world', label: 'Reloj', icon: AlarmClock },
  { id: 'alarm', label: 'Alarma', icon: BellRing },
  { id: 'sw', label: 'Cronómetro', icon: StopCircle },
  { id: 'timer', label: 'Temporizador', icon: TimerIcon },
];

function fmtTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function zoneInstant(now: Date, offsetHours: number): Date {
  return new Date(now.getTime() + offsetHours * 3600000);
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

const INTl_TIMEZONE_OK = (() => {
  try {
    return new Intl.DateTimeFormat('en', { timeZone: 'Pacific/Kiritimati', timeZoneName: 'long' }).resolvedOptions().timeZone === 'Pacific/Kiritimati';
  } catch {
    return false;
  }
})();

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
  const [cities, setCities] = usePersistedState<string[]>('clock:cities:v2', DEFAULT_CITIES);
  const [worldTimes, setWorldTimes] = useState<Record<string, WorldTime>>({});
  const [clocksOnline, setClocksOnline] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const allZones = useMemo<string[]>(() => (Intl.supportedValuesOf?.('timeZone') ?? []).slice(), []);

  useEffect(() => {
    setCities(prev => {
      const filtered = prev.filter(z => z && (allZones.includes(z) || POPULAR_ZONES.includes(z)));
      const isOldDefault = OLD_DEFAULT_CITIES.length === filtered.length && OLD_DEFAULT_CITIES.every(z => filtered.includes(z));
      if (isOldDefault || filtered.length < 2) return DEFAULT_CITIES;
      return filtered;
    });
    removeState('clock:cities');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const refreshClocks = useCallback(async () => {
    if (cities.length === 0) return;
    try {
      const entries = await fetchWorldTimes(cities);
      if (Object.keys(entries).length > 0) {
        setWorldTimes(prev => ({ ...prev, ...entries }));
        setClocksOnline(true);
      } else {
        setClocksOnline(false);
      }
    } catch {
      setClocksOnline(false);
    }
  }, [cities]);

  useEffect(() => {
    void refreshClocks();
    const t = setInterval(() => void refreshClocks(), 30 * 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities]);

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

  const addAlarm = async () => {
    const h = (await openPrompt({ title: 'Hora (0-23):', value: String(now.getHours()) })) ?? '7';
    const m = (await openPrompt({ title: 'Minutos (0-59):', value: String(now.getMinutes()) })) ?? '0';
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

  const timeFormats = useRef(new Map<string, Intl.DateTimeFormat>());
  const dateFormats = useRef(new Map<string, Intl.DateTimeFormat>());

  const cityLabel = (tz: string) =>
    (tz.split('/').pop() ?? tz).replace(/_/g, ' ').replace(/\bSt\b/g, 'St.');

  const intlDateFmt = (tz: string): string => {
    if (!INTl_TIMEZONE_OK) throw new Error('timeZone no soportado');
    let f = dateFormats.current.get(tz);
    if (!f) {
      f = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz });
      dateFormats.current.set(tz, f);
    }
    return f.format(now);
  };

  const cityDate = (tz: string) => {
    const wt = worldTimes[tz];
    let dateStr = '';
    if (wt && Number.isFinite(wt.offsetHours)) {
      const t = zoneInstant(now, wt.offsetHours);
      dateStr = `${WEEKDAYS[t.getUTCDay()]} ${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]}`;
    } else {
      try {
        dateStr = intlDateFmt(tz);
      } catch {
        dateStr = '';
      }
    }
    const offset = wt?.offset ? `UTC${wt.offset}` : tzOffsetLabel(tz, now);
    return `${dateStr} · ${tz}${offset ? ` · ${offset}` : ''}`;
  };

  const cityTime = (tz: string) => {
    const wt = worldTimes[tz];
    if (wt && Number.isFinite(wt.offsetHours)) {
      const t = zoneInstant(now, wt.offsetHours);
      return `${pad2(t.getUTCHours())}:${pad2(t.getUTCMinutes())}:${pad2(t.getUTCSeconds())}`;
    }
    try {
      if (!INTl_TIMEZONE_OK) throw new Error('timeZone no soportado');
      let f = timeFormats.current.get(tz);
      if (!f) {
        f = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: tz });
        timeFormats.current.set(tz, f);
      }
      return f.format(now);
    } catch {
      return '--:--:--';
    }
  };

  const query = pickerQuery.trim().toLowerCase();
  const filteredZones = query
    ? allZones.filter(z => z.toLowerCase().includes(query)).slice(0, 60)
    : [...new Set([...POPULAR_ZONES, ...DEFAULT_CITIES])];

  const addCity = (z: string) => {
    setCities(cs => (cs.includes(z) ? cs : [...cs, z]));
    setShowPicker(false);
    setPickerQuery('');
  };

  const removeCity = (z: string) => {
    if (cities.length <= 1) return;
    setCities(cs => cs.filter(c => c !== z));
    setWorldTimes(wt => {
      const next = { ...wt };
      delete next[z];
      return next;
    });
  };

  return (
    <Screen scroll={false} padding="0" style={{ position: 'relative' }}>
      <AppHeader title="Reloj" />

      <div style={styles.content}>
        {tab === 'world' && (
          <div style={styles.list}>
            <div style={styles.worldHead}>
              <span style={styles.count}>
                {clocksOnline ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Wifi size={12} color="var(--success)" /> Hora mundial en vivo
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <WifiOff size={12} color="var(--warning)" /> Sin conexión · hora por zona
                  </span>
                )}
                {worldTimes[Object.keys(worldTimes)[0] ?? ''] && (
                  <span style={{ marginLeft: 6 }}>· UTC{worldTimes[Object.keys(worldTimes)[0]].offset}</span>
                )}
              </span>
              <IconButton label="Agregar ciudad" bg="rgba(0,122,255,0.1)" onClick={() => setShowPicker(s => !s)}>
                <Plus size={18} color="var(--accent)" />
              </IconButton>
            </div>

            {showPicker && (
              <div style={styles.picker}>
                <div style={styles.pickerInputRow}>
                  <input
                    value={pickerQuery}
                    onChange={e => setPickerQuery(e.target.value)}
                    placeholder="Buscar zona horaria…"
                    style={styles.pickerInput}
                    autoFocus
                  />
                  <button className="pressable" style={styles.pickerClose} onClick={() => setShowPicker(false)} aria-label="Cerrar">
                    <X size={15} color="var(--text-secondary)" />
                  </button>
                </div>
                <div style={styles.pickerList}>
                  {filteredZones.length === 0 && (
                    <div style={styles.pickerEmpty}>Sin coincidencias</div>
                  )}
                  {filteredZones.map(z => (
                    <button key={z} className="pressable" style={styles.pickerItem} onClick={() => addCity(z)}>
                      <span style={styles.pickerItemName}>{z.replace(/_/g, ' ')}</span>
                      {cities.includes(z) && <span style={styles.pickerAdded}>añadida</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {cities.length === 0 ? (
              <EmptyState
                icon={<BellOff size={28} color="var(--text-secondary)" />}
                title="Sin ciudades"
                subtitle="Toca + para agregar."
              />
            ) : (
              <ListGroup>
                {cities.map((tz, i) => (
                  <ListRow
                    key={tz}
                    showSeparator={i < cities.length - 1}
                    label={cityLabel(tz)}
                    sublabel={cityDate(tz)}
                    value={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={styles.cityTime}>{cityTime(tz)}</span>
                        {cities.length > 1 && (
                          <button className="pressable" style={styles.cityRemove} onClick={() => removeCity(tz)} aria-label={`Quitar ${tz}`}>
                            <Trash2 size={15} color="var(--danger)" />
                          </button>
                        )}
                      </div>
                    }
                  />
                ))}
              </ListGroup>
            )}
          </div>
        )}

        {tab === 'alarm' && (
          <div style={styles.list}>
            <div style={styles.alarmHead}>
              <span style={styles.count}>
                {alarms.filter(a => a.enabled).length} alarma{alarms.filter(a => a.enabled).length === 1 ? '' : 's'} activa{alarms.filter(a => a.enabled).length === 1 ? '' : 's'}
              </span>
              <IconButton label="Agregar alarma" bg="rgba(0,122,255,0.1)" onClick={addAlarm}>
                <Plus size={18} color="var(--accent)" />
              </IconButton>
            </div>
            {alarms.length === 0 ? (
              <EmptyState
                icon={<BellOff size={28} color="var(--text-secondary)" />}
                title="Sin alarmas"
                subtitle="Toca + para crear una."
              />
            ) : (
              <ListGroup>
                {alarms
                  .slice()
                  .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
                  .map(a => (
                    <div key={a.id} className="cell-row" style={{ ...styles.alarmRow, ...(a.enabled ? {} : styles.alarmRowOff) }}>
                      <div>
                        <div style={styles.alarmTime}>{fmtTime(a.hour, a.minute)}</div>
                        {a.label && <div style={styles.alarmLabel}>{a.label}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Toggle checked={a.enabled} onChange={() => toggleAlarm(a.id)} />
                        <button className="pressable" style={styles.trashBtn} onClick={() => removeAlarm(a.id)} aria-label="Eliminar alarma">
                          <Trash2 size={17} color="var(--danger)" />
                        </button>
                      </div>
                      <div className="cell-sep" style={{ marginLeft: 18 }} />
                    </div>
                  ))}
              </ListGroup>
            )}
          </div>
        )}

        {tab === 'sw' && (
          <div style={styles.vertical}>
            <div style={styles.swDisplay}>{fmtMs(swMs)}</div>
            <div style={styles.swButtons}>
              <Button
                variant="secondary"
                size="lg"
                style={styles.swBtn}
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
              </Button>
              <Button
                size="lg"
                style={{ ...styles.swBtn, background: swRunning ? 'var(--warning)' : 'var(--success)', color: '#fff' }}
                onClick={() => setSwRunning(r => !r)}
              >
                {swRunning ? 'Detener' : 'Iniciar'}
              </Button>
            </div>
            {laps.length > 0 && (
              <div style={styles.laps}>
                {laps
                  .slice()
                  .reverse()
                  .map((l, i) => (
                    <div key={i} style={styles.lapRow}>
                      <span style={{ color: 'var(--text-secondary)' }}>Vuelta {laps.length - i}</span>
                      <span style={{ color: 'var(--text-primary)' }}>{fmtMs(l)}</span>
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
                <Button
                  size="lg"
                  style={{ ...styles.swBtn, background: 'var(--warning)', color: '#fff', marginTop: 18 }}
                  onClick={startTimer}
                  disabled={timerTotal <= 0}
                >
                  Iniciar
                </Button>
              </>
            ) : (
              <>
                <ProgressRing value={timerTotal > 0 ? timerLeft / (timerTotal * 1000) : 0} size={220} strokeWidth={9} color="var(--warning)">
                  <div style={styles.timerCount}>{fmtMs(timerLeft)}</div>
                </ProgressRing>
                <div style={styles.swButtons}>
                  <Button
                    variant="secondary"
                    size="lg"
                    style={styles.swBtn}
                    onClick={() => {
                      setTimerLeft(null);
                      setTimerTotal(0);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="lg"
                    style={{ ...styles.swBtn, background: timerLeft ? 'var(--text-secondary)' : 'var(--warning)', color: '#fff' }}
                    onClick={() => setTimerLeft(null)}
                  >
                    Detener
                  </Button>
                </div>
              </>
            )}
            <div style={styles.hint}>
              <TimerIcon size={16} color="var(--text-tertiary)" />
              <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Al terminar sonará una alarma y llegará una notificación.</span>
            </div>
          </div>
        )}
      </div>

      <TabBar tabs={TABS} activeId={tab} onChange={setTab} />

      {laps.length > 0 && tab === 'sw' && (
        <div style={styles.floatingLaps}>
          <History size={14} color="#8E8E93" />
          <span style={{ fontSize: 13, color: '#fff' }}>{laps.length} vueltas</span>
        </div>
      )}
    </Screen>
  );
}

const styles: Record<string, React.CSSProperties> = {
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  list: { flex: 1, overflowY: 'auto', paddingBottom: 20 },
  count: { fontSize: 13, color: 'var(--text-secondary)' },
  worldHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px' },
  alarmHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px' },
  cityTime: { fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' as const },
  cityRemove: { border: 'none', background: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  picker: {
    margin: '0 12px 12px',
    borderRadius: 14,
    background: 'var(--surface-card)',
    overflow: 'hidden',
    border: '0.5px solid var(--separator-cell)',
  },
  pickerInputRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '0.5px solid var(--separator-cell)' },
  pickerInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'none',
    fontSize: 14,
    color: 'var(--text-primary)',
    userSelect: 'text' as const,
  },
  pickerClose: { border: 'none', background: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pickerList: { maxHeight: 180, overflowY: 'auto' },
  pickerItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    border: 'none',
    background: 'none',
    padding: '10px 14px',
    cursor: 'pointer',
    borderBottom: '0.5px solid var(--separator-cell)',
    textAlign: 'left' as const,
  },
  pickerItemName: { fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  pickerAdded: { fontSize: 11, color: 'var(--success)', fontWeight: 600, flexShrink: 0 },
  pickerEmpty: { padding: 14, fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' as const },
  alarmRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 18px',
    background: 'transparent',
  },
  alarmRowOff: { opacity: 0.45 },
  alarmTime: { fontSize: 34, fontWeight: 200, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' as const },
  alarmLabel: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 },
  trashBtn: { border: 'none', background: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  vertical: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
    gap: 14,
  },
  swDisplay: { fontSize: 44, fontWeight: 200, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' as const },
  timerCount: { fontSize: 52, fontWeight: 200, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' as const },
  swButtons: { display: 'flex', gap: 16, marginTop: 10 },
  swBtn: {
    width: 84,
    height: 52,
    borderRadius: 26,
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laps: {
    width: '100%',
    maxHeight: 220,
    overflowY: 'auto',
    borderTop: '0.5px solid var(--separator-cell)',
    marginTop: 16,
  },
  lapRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 4px',
    borderBottom: '0.5px solid var(--separator-cell)',
    fontSize: 15,
    fontVariantNumeric: 'tabular-nums',
  },
  timerLabel: { fontSize: 14, color: 'var(--text-secondary)' },
  timerInput: {
    fontSize: 40,
    fontWeight: 200,
    width: 120,
    textAlign: 'center' as const,
    border: 'none',
    borderBottom: '2px solid var(--accent)',
    outline: 'none',
    color: 'var(--text-primary)',
    background: 'none',
    userSelect: 'text' as const,
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
};