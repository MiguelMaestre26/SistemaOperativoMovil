import { useAppStore } from '../../stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getAppIcon } from './Launcher';

interface TaskSwitcherProps {
  onClose: () => void;
}

export default function TaskSwitcher({ onClose }: TaskSwitcherProps) {
  const openApps = useAppStore(s => s.openApps);
  const closeApp = useAppStore(s => s.closeApp);
  const bringToFront = useAppStore(s => s.bringToFront);

  const visibleApps = openApps.filter(a => a.status !== 'terminated');

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.counter}>
        {visibleApps.length} app{visibleApps.length !== 1 ? 's' : ''} open
      </div>

      <div style={styles.cardsContainer}>
        <AnimatePresence>
          {visibleApps.map(app => (
            <motion.div
              key={app.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0, y: 100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={styles.card}
              onClick={(e) => {
                e.stopPropagation();
                bringToFront(app.id);
                onClose();
              }}
            >
              <div style={{
                ...styles.cardHeader,
                background: app.definition.color,
              }}>
                <div style={styles.cardTitle}>
                  {getAppIcon(app.definition.icon, 16)}
                  <span style={styles.cardName}>{app.definition.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeApp(app.id);
                  }}
                  style={styles.closeBtn}
                >
                  <X size={12} color="#fff" />
                </button>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.cardPlaceholder}>
                  {getAppIcon(app.definition.icon, 36)}
                  <div style={styles.cardLabel}>{app.definition.name}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {visibleApps.length === 0 && (
        <div style={styles.empty}>No apps open</div>
      )}

      <div style={styles.hint}>Tap anywhere to close</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    zIndex: 9500,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  counter: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
    fontWeight: 500,
  },
  cardsContainer: {
    display: 'flex',
    gap: 16,
    overflowX: 'auto',
    padding: '10px 20px',
    width: '100%',
    justifyContent: 'center',
  },
  card: {
    minWidth: 180,
    maxWidth: 220,
    height: 320,
    borderRadius: 16,
    background: 'var(--bg-secondary)',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  cardHeader: {
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  cardName: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 600,
  },
  closeBtn: {
    background: 'rgba(0,0,0,0.3)',
    border: 'none',
    borderRadius: '50%',
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  cardBody: {
    flex: 1,
    height: 'calc(100% - 36px)',
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPlaceholder: {
    textAlign: 'center',
    opacity: 0.4,
  },
  cardLabel: {
    fontSize: 11,
    marginTop: 8,
    color: 'var(--text-secondary)',
  },
  empty: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center' as const,
  },
  hint: {
    marginTop: 'auto',
    paddingTop: 20,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
};
