import { useState } from 'react';
import { getAppIcon, ALL_APPS } from './Launcher';
import { useDockStore } from '../../stores/useDockStore';
import { Search } from 'lucide-react';

interface DockAppPickerProps {
  onClose: () => void;
}

export default function DockAppPicker({ onClose }: DockAppPickerProps) {
  const [search, setSearch] = useState('');
  const appIds = useDockStore(s => s.appIds);
  const addApp = useDockStore(s => s.addApp);
  const exitEditMode = useDockStore(s => s.exitEditMode);

  const filtered = ALL_APPS.filter(app =>
    !appIds.includes(app.id) &&
    app.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div
        style={styles.sheet}
        onClick={e => e.stopPropagation()}
      >
        <div style={styles.handle} />
        <div style={styles.header}>
          <span style={styles.title}>Añadir al dock</span>
          <button className="pressable" style={styles.doneBtn} onClick={onClose}>
            Listo
          </button>
        </div>

        <div style={styles.searchInput}>
          <Search size={15} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Buscar aplicaciones"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.grid}>
          {filtered.length === 0 && (
            <div style={styles.empty}>
              Todas las aplicaciones ya están en el dock o no hay resultados.
            </div>
          )}
          {filtered.map(app => (
            <div
              key={app.id}
              style={styles.appItem}
              onClick={() => {
                addApp(app.id);
                exitEditMode();
                onClose();
              }}
            >
              <div style={{ ...styles.appIcon, background: app.color }}>
                {getAppIcon(app.icon)}
              </div>
              <span style={styles.appName}>{app.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    zIndex: 150,
    display: 'flex',
    alignItems: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '74%',
    background: 'var(--surface-container-low)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    border: '1px solid var(--outline-variant)',
    borderBottom: 'none',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 16px 26px',
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    background: 'var(--outline-variant)',
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  doneBtn: {
    background: 'var(--primary)',
    color: 'var(--on-primary)',
    border: 'none',
    borderRadius: 999,
    padding: '7px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  searchInput: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--surface-container-high)',
    borderRadius: 999,
    padding: '10px 14px',
    marginBottom: 12,
    border: '1px solid var(--outline-variant)',
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: 15,
    fontFamily: 'inherit',
  },
  grid: {
    flex: 1,
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 18,
    alignContent: 'start',
    paddingTop: 4,
  },
  appItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
  },
  appIcon: {
    width: 54,
    height: 54,
    borderRadius: '24%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  },
  appName: {
    fontSize: 11,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
    lineHeight: 1.2,
    maxWidth: 72,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  empty: {
    gridColumn: '1 / -1',
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontSize: 14,
    padding: '24px 8px',
  },
};