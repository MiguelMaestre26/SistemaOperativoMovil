import { useState } from 'react';
import { Plus, Trash2, StickyNote } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { Screen, AppHeader, IconButton, ListGroup, ListRow, EmptyState } from '../../ui';

interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

export default function Notes() {
  const [notes, setNotes] = usePersistedState<Note[]>('notes', []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const open = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    setOpenId(id);
    setTitle(note.title);
    setBody(note.body);
  };

  const close = () => {
    if (openId) {
      const updated = { id: openId, title, body, updatedAt: Date.now() };
      setNotes(ns => {
        const exists = ns.some(n => n.id === openId);
        return exists
          ? ns.map(n => (n.id === openId ? updated : n))
          : [updated, ...ns];
      });
    }
    setOpenId(null);
  };

  const add = () => {
    setOpenId(null);
    setTitle('');
    setBody('');
    setOpenId('new');
  };

  const remove = () => {
    if (openId) {
      setNotes(ns => ns.filter(n => n.id !== openId));
    }
    setOpenId(null);
  };

  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <Screen scroll={false} padding="0">
      {openId === null ? (
        <>
          <AppHeader
            title="Notas"
            right={
              <IconButton label="Nueva nota" bg="#FFD700" onClick={add}>
                <Plus size={20} color="#222" />
              </IconButton>
            }
          />
          <div style={styles.list}>
            {sorted.length === 0 ? (
              <EmptyState
                icon={<StickyNote size={28} color="var(--text-secondary)" />}
                title="Sin notas aún."
                subtitle="Toca + para crear una."
              />
            ) : (
              <ListGroup>
                {sorted.map((n, i) => (
                  <ListRow
                    key={n.id}
                    showSeparator={i < sorted.length - 1}
                    label={n.title || 'Sin título'}
                    sublabel={n.body}
                    onClick={() => open(n.id)}
                    value={
                      <span style={styles.itemDate}>
                        {new Date(n.updatedAt).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    }
                  />
                ))}
              </ListGroup>
            )}
          </div>
        </>
      ) : (
        <>
          <AppHeader
            variant="standard"
            title=""
            onBack={close}
            backLabel=""
            right={
              openId !== 'new' ? (
                <IconButton label="Eliminar" bg="rgba(255,59,48,0.1)" onClick={remove}>
                  <Trash2 size={18} color="var(--danger)" />
                </IconButton>
              ) : undefined
            }
          />
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título"
            style={styles.titleInput}
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Escribe aquí…"
            style={styles.bodyInput}
            autoFocus
          />
        </>
      )}
    </Screen>
  );
}

const styles: Record<string, React.CSSProperties> = {
  list: { flex: 1, overflowY: 'auto', padding: '0 0 20px' },
  itemDate: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    whiteSpace: 'nowrap' as const,
  },
  titleInput: {
    border: 'none',
    outline: 'none',
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--text-primary)',
    padding: '4px 20px 8px',
    background: 'none',
    fontFamily: 'inherit',
    userSelect: 'text' as const,
  },
  bodyInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontSize: 16,
    lineHeight: 1.5,
    color: 'var(--text-primary)',
    padding: '0 20px 20px',
    background: 'none',
    userSelect: 'text' as const,
  },
};