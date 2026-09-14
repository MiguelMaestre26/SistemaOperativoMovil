import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { getAppIcon, ALL_APPS } from './Launcher';
import { Search } from 'lucide-react';

interface AppDrawerProps {
  onClose: () => void;
}

export default function AppDrawer({ onClose }: AppDrawerProps) {
  const openApp = useAppStore(s => s.openApp);
  const [search, setSearch] = useState('');

  const filtered = ALL_APPS.filter(app =>
    app.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.searchBar}>
        <div style={styles.searchInput}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search apps"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.input}
          />
        </div>
        <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
      </div>

      <div style={styles.grid}>
        {filtered.map(app => (
          <div
            key={app.id}
            style={styles.appItem}
            onClick={() => {
              openApp(app.id);
              onClose();
            }}
          >
            <div style={{
              ...styles.appIcon,
              background: app.color,
            }}>
              {getAppIcon(app.icon)}
            </div>
            <span style={styles.appName}>{app.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    inset: 0,
    background: 'var(--surface-container-low)',
    zIndex: 90,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  searchBar: {
    padding: '12px 16px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--surface-container-high)',
    borderRadius: 999,
    padding: '11px 16px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--outline-variant)',
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: 16,
    fontFamily: 'inherit',
  },
  cancelBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 8px',
  },
  grid: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 16px 100px',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
    alignContent: 'start',
  },
  appItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
  },
  appIcon: {
    width: 56,
    height: 56,
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
};
