import { useAppStore } from '../../stores/useAppStore';
import { Phone, MessageSquare, Globe, Music, LayoutGrid } from 'lucide-react';

const DOCK_APPS = [
  { id: 'phone', icon: <Phone size={22} color="#34C759" /> },
  { id: 'messages', icon: <MessageSquare size={22} color="#34C759" /> },
  { id: 'browser', icon: <Globe size={22} color="#007AFF" /> },
  { id: 'music', icon: <Music size={22} color="#FC5C7D" /> },
];

interface DockProps {
  onOpenDrawer: () => void;
}

export default function Dock({ onOpenDrawer }: DockProps) {
  const openApp = useAppStore(s => s.openApp);
  const openApps = useAppStore(s => s.openApps);

  return (
    <div style={styles.container}>
      <div style={styles.dock}>
        {DOCK_APPS.map(app => {
          const isOpen = openApps.some(a => a.id === app.id && a.status !== 'terminated');
          return (
            <div
              key={app.id}
              style={styles.appItem}
              onClick={() => openApp(app.id)}
            >
              <div style={styles.appIcon}>
                {app.icon}
                {isOpen && <div style={styles.dot} />}
              </div>
            </div>
          );
        })}

        <div style={styles.separator} />

        <div style={styles.appItem} onClick={onOpenDrawer} aria-label="Todas las aplicaciones">
          <div style={styles.appIcon}>
            <LayoutGrid size={21} color="var(--text-primary)" />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 26,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 80,
    pointerEvents: 'none',
  },
  dock: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    padding: '10px 18px',
    borderRadius: 30,
    background: 'var(--glass)',
    backdropFilter: 'blur(22px) saturate(170%)',
    WebkitBackdropFilter: 'blur(22px) saturate(170%)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-md)',
    pointerEvents: 'auto',
  },
  appItem: {
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    background: 'var(--surface-container-high)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    boxShadow: 'var(--shadow-sm)',
  },
  dot: {
    position: 'absolute' as const,
    bottom: -5,
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: 'var(--primary)',
  },
  separator: {
    width: 1,
    height: 30,
    background: 'var(--outline-variant)',
  },
};