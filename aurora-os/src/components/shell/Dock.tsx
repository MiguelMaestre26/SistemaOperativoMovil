import { useAppStore } from '../../stores/useAppStore';
import { Phone, MessageSquare, Globe, Music } from 'lucide-react';

const DOCK_APPS = [
  { id: 'phone', icon: <Phone size={22} color="#34C759" /> },
  { id: 'messages', icon: <MessageSquare size={22} color="#34C759" /> },
  { id: 'browser', icon: <Globe size={22} color="#007AFF" /> },
  { id: 'music', icon: <Music size={22} color="#FC5C7D" /> },
];

export default function Dock() {
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
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 28,
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
    gap: 20,
    padding: '10px 20px',
    borderRadius: 24,
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.15)',
    pointerEvents: 'auto',
  },
  appItem: {
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },
  appIcon: {
    width: 50,
    height: 50,
    borderRadius: 13,
    background: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  dot: {
    position: 'absolute' as const,
    bottom: -5,
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.6)',
  },
};
