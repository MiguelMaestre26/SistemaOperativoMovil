import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, CalendarPlus } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  time: string;
  color: string;
}

const COLORS = ['#FF3B30', '#FF9500', '#34C759', '#007AFF', '#5856D6', '#AF52DE'];

function keyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey(): string {
  return keyOf(new Date());
}

export default function CalendarApp() {
  const [events, setEvents] = usePersistedState<CalendarEvent[]>('calendar:events', []);
  const [view, setView] = useState(new Date());
  const [selected, setSelected] = useState<string>(todayKey());

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayKey();

  const eventsFor = (key: string) => events.filter(e => e.date === key);
  const selectedEvents = eventsFor(selected);

  const prev = () => setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  const next = () => setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1));

  const addEvent = (dateKey: string) => {
    const title = window.prompt('Título del evento:');
    if (!title?.trim()) return;
    const time = window.prompt('Hora (ej. 9:00):', '09:00') || '9:00';
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    setEvents(es => [...es, { id: `ev_${Date.now()}`, date: dateKey, title: title.trim(), time, color }]);
  };

  const removeEvent = (id: string) => {
    setEvents(es => es.filter(e => e.id !== id));
  };

  const monthName = view.toLocaleDateString('es', { month: 'long', year: 'numeric' });
  const weekdayRow = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const cells: (number | null)[] = [
    ...Array.from({ length: (firstDay + 7) % 7 }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Calendario</h1>
      </div>

      <div style={styles.monthNav}>
        <button style={styles.navBtn} onClick={prev} aria-label="Mes anterior">
          <ChevronLeft size={20} color="#007AFF" />
        </button>
        <span style={styles.monthName}>{monthName}</span>
        <button style={styles.navBtn} onClick={next} aria-label="Mes siguiente">
          <ChevronRight size={20} color="#007AFF" />
        </button>
      </div>

      <div style={styles.grid}>
        {weekdayRow.map((d, i) => (
          <div key={i} style={styles.weekday}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} style={styles.cell} />;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const evs = eventsFor(key);
          const isToday = key === today;
          const isSelected = key === selected;
          return (
            <button
              key={key}
              style={{
                ...styles.cell,
                ...(isSelected ? styles.cellSelected : {}),
                ...(isToday && !isSelected ? styles.cellToday : {}),
              }}
              onClick={() => setSelected(key)}
            >
              <span style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: isToday ? 700 : 500,
                color: isToday && !isSelected ? '#fff' : '#111',
                background: isToday && !isSelected ? '#FF9500' : 'none',
              }}>
                {day}
              </span>
              <div style={styles.dots}>
                {evs.slice(0, 2).map(e => (
                  <span key={e.id} style={{ ...styles.dot, background: e.color }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div style={styles.eventsCard}>
        <div style={styles.eventsHead}>
          <span style={styles.eventsTitle}>
            {new Date(`${selected}T00:00`).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <button style={styles.addBtn} onClick={() => addEvent(selected)} aria-label="Agregar evento">
            <CalendarPlus size={18} color="#fff" />
          </button>
        </div>
        {selectedEvents.length === 0 ? (
          <div style={styles.noEvents}>Sin eventos. Toca + para agregar uno.</div>
        ) : (
          selectedEvents
            .slice()
            .sort((a, b) => a.time.localeCompare(b.time))
            .map(e => (
              <div key={e.id} style={styles.eventRow}>
                <span style={{ ...styles.eventColor, background: e.color }} />
                <div style={styles.eventMain}>
                  <div style={styles.eventTitle}>{e.title}</div>
                  <div style={styles.eventTime}>{e.time}</div>
                </div>
                <button style={styles.delEvent} onClick={() => removeEvent(e.id)} aria-label="Eliminar evento">
                  <Trash2 size={16} color="#FF3B30" />
                </button>
              </div>
            ))
        )}
        <button style={styles.todayBar} onClick={() => { const d = new Date(); setView(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(today); }}>
          Volver a hoy
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' },
  header: { padding: '12px 16px 4px' },
  title: { fontSize: 22, fontWeight: 700, color: '#111', margin: 0 },
  monthNav: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '6px 0' },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    border: 'none',
    background: 'rgba(0,122,255,0.08)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthName: { fontSize: 17, fontWeight: 600, color: '#111', textTransform: 'capitalize' as const, minWidth: 130, textAlign: 'center' as const },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: '0 10px' },
  weekday: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center' as const,
    padding: '4px 0',
    fontWeight: 600,
  },
  cell: {
    aspectRatio: '1/1.1',
    borderRadius: 10,
    border: 'none',
    background: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative' as const,
  },
  cellSelected: { background: 'rgba(0,122,255,0.12)' },
  cellToday: {},
  dots: { display: 'flex', gap: 2, height: 5, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  eventsCard: {
    flex: 1,
    margin: '10px 12px 14px',
    background: '#F7F7F9',
    borderRadius: 16,
    padding: '14px 16px',
    overflowY: 'auto',
  },
  eventsHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  eventsTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#111',
    textTransform: 'capitalize' as const,
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    border: 'none',
    background: '#007AFF',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEvents: { color: '#C7C7CC', fontSize: 13, marginTop: 16, textAlign: 'center' as const },
  eventRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' },
  eventColor: { width: 4, height: 34, borderRadius: 2, flexShrink: 0 },
  eventMain: { flex: 1, minWidth: 0 },
  eventTitle: { fontSize: 14, fontWeight: 500, color: '#111' },
  eventTime: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  delEvent: { border: 'none', background: 'none', cursor: 'pointer', padding: 6 },
  todayBar: {
    marginTop: 12,
    padding: '10px 0',
    border: 'none',
    background: 'rgba(0,122,255,0.08)',
    color: '#007AFF',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 10,
    cursor: 'pointer',
    width: '100%',
  },
};