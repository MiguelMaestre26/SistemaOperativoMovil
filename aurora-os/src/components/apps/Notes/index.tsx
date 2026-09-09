import { useState } from 'react';
import { Plus, Trash2, ChevronLeft, StickyNote } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';

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
    <div style={styles.container}>
      {openId === null ? (
        <>
          <div style={styles.header}>
            <span style={styles.title}>Notas</span>
            <button style={styles.addBtn} onClick={add} aria-label="Nueva nota">
              <Plus size={20} color="#fff" />
            </button>
          </div>
          <div style={styles.list}>
            {sorted.length === 0 ? (
              <div style={styles.empty}>
                <StickyNote size={42} color="#E5E5EA" />
                <div style={styles.emptyText}>Sin notas aún.<br />Toca + para crear una.</div>
              </div>
            ) : (
              sorted.map(n => (
                <button key={n.id} style={styles.item} onClick={() => open(n.id)}>
                  <div style={styles.itemTitle}>{n.title || 'Sin título'}</div>
                  <div style={styles.itemBody}>{n.body}</div>
                  <div style={styles.itemDate}>
                    {new Date(n.updatedAt).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <div style={styles.editor}>
          <div style={styles.editorBar}>
            <button style={styles.backBtn} onClick={close} aria-label="Volver">
              <ChevronLeft size={22} color="#007AFF" />
            </button>
            {openId !== 'new' && (
              <button style={styles.deleteBtn} onClick={remove} aria-label="Eliminar">
                <Trash2 size={18} color="#FF3B30" />
              </button>
            )}
          </div>
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
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#F2F2F7',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px 8px',
  },
  title: { fontSize: 22, fontWeight: 700, color: '#111' },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: '#FFD700',
    color: '#222',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(255,215,0,0.4)',
  },
  list: { flex: 1, overflowY: 'auto', padding: '0 16px 20px' },
  item: {
    display: 'block',
    width: '100%',
    textAlign: 'left' as const,
    background: '#fff',
    borderRadius: 12,
    border: 'none',
    padding: '12px 14px',
    marginBottom: 8,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  itemTitle: { fontSize: 15, fontWeight: 600, color: '#111' },
  itemBody: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  itemDate: { fontSize: 11, color: '#C7C7CC', marginTop: 8 },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: '40%',
  },
  emptyText: { color: '#C7C7CC', fontSize: 14, textAlign: 'center' as const, lineHeight: 1.5 },
  editor: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
  },
  editorBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: 'rgba(255,59,48,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInput: {
    border: 'none',
    outline: 'none',
    fontSize: 26,
    fontWeight: 700,
    color: '#111',
    padding: '4px 20px 8px',
    background: 'none',
  },
  bodyInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontSize: 16,
    lineHeight: 1.5,
    color: '#333',
    padding: '0 20px 20px',
    background: 'none',
  },
};