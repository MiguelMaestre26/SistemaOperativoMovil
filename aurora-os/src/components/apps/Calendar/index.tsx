import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, CalendarPlus } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { Screen, AppHeader, IconButton, ListGroup, ListRow, openPrompt } from '../../ui';

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

  const addEvent = async (dateKey: string) => {
    const title = await openPrompt({ title: 'Título del evento:', placeholder: 'Nombre del evento' });
    if (!title?.trim()) return;
    const time = (await openPrompt({ title: 'Hora (ej. 9:00):', value: '09:00' })) || '9:00';
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

  const selectedEventsSorted = selectedEvents
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <Screen scroll={false} padding="0">
      <AppHeader title="Calendario" />

      <div style={styles.monthNav}>
        <IconButton label="Mes anterior" bg="rgba(0,122,255,0.1)" onClick={prev}>
          <ChevronLeft size={18} color="var(--accent)" />
        </IconButton>
        <span className="typo-headline" style={styles.monthName}>{monthName}</span>
        <IconButton label="Mes siguiente" bg="rgba(0,122,255,0.1)" onClick={next}>
          <ChevronRight size={18} color="var(--accent)" />
        </IconButton>
      </div>

      <div style={styles.grid}>
        {weekdayRow.map((d, i) => (
          <div key={i} className="typo-caption2" style={styles.weekday}>{d}</div>
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
              className="pressable"
              style={{
                ...styles.cell,
                ...(isSelected ? styles.cellSelected : {}),
              }}
              onClick={() => setSelected(key)}
            >
              <span style={{
                ...styles.dayNum,
                color: isToday && !isSelected ? '#fff' : 'var(--text-primary)',
                background: isToday && !isSelected ? 'var(--warning)' : 'none',
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
          <span className="typo-subhead" style={styles.eventsTitle}>
            {new Date(`${selected}T00:00`).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <IconButton label="Agregar evento" bg="var(--accent)" onClick={() => addEvent(selected)}>
            <CalendarPlus size={16} color="#fff" />
          </IconButton>
        </div>
        {selectedEventsSorted.length === 0 ? (
          <div style={styles.noEvents}>Sin eventos. Toca + para agregar uno.</div>
        ) : (
          <ListGroup inset={false}>
            {selectedEventsSorted.map((e, i) => (
              <ListRow
                key={e.id}
                showSeparator={i < selectedEventsSorted.length - 1}
                icon={<span style={{ width: 4, height: 24, borderRadius: 2, background: e.color, display: 'block' }} />}
                iconBg="transparent"
                label={e.title}
                sublabel={e.time}
                value={
                  <button className="pressable" style={styles.delEvent} onClick={() => removeEvent(e.id)} aria-label="Eliminar evento">
                    <Trash2 size={16} color="var(--danger)" />
                  </button>
                }
              />
            ))}
          </ListGroup>
        )}
        <button className="pressable" style={styles.todayBar} onClick={() => { const d = new Date(); setView(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(today); }}>
          Volver a hoy
        </button>
      </div>
    </Screen>
  );
}

const styles: Record<string, React.CSSProperties> = {
  monthNav: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '6px 0' },
  monthName: {
    color: 'var(--text-primary)',
    textTransform: 'capitalize' as const,
    minWidth: 130,
    textAlign: 'center' as const,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: '0 10px' },
  weekday: {
    color: 'var(--text-secondary)',
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
  cellSelected: { background: 'rgba(0,122,255,0.14)' },
  dayNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 500,
  },
  dots: { display: 'flex', gap: 2, height: 5, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  eventsCard: {
    flex: 1,
    minHeight: 0,
    margin: '10px 12px 14px',
    background: 'var(--surface-card)',
    borderRadius: 16,
    padding: '14px 12px',
    overflowY: 'auto',
  },
  eventsHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 6px' },
  eventsTitle: {
    color: 'var(--text-primary)',
    fontWeight: 700,
    textTransform: 'capitalize' as const,
  },
  noEvents: { color: 'var(--text-tertiary)', fontSize: 13, marginTop: 16, textAlign: 'center' as const },
  delEvent: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBar: {
    marginTop: 12,
    padding: '10px 0',
    border: 'none',
    background: 'rgba(0,122,255,0.08)',
    color: 'var(--accent)',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 10,
    cursor: 'pointer',
    width: '100%',
  },
};