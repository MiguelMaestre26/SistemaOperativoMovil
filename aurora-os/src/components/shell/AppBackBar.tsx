import { ChevronLeft, X, RotateCcw } from 'lucide-react';
import { toggleOrientation } from '../../core/orientation';

interface AppBackBarProps {
  appName: string;
  onBack: () => void;
  onClose: () => void;
}

export default function AppBackBar({ appName, onBack, onClose }: AppBackBarProps) {
  return (
    <div style={styles.bar}>
      <button style={styles.backBtn} onClick={onBack}>
        <ChevronLeft size={22} color="var(--accent)" />
        <span style={styles.backLabel}>Inicio</span>
      </button>

      <div style={styles.title}>{appName}</div>

      <div style={styles.actions}>
        <button style={styles.rotateBtn} onClick={toggleOrientation} aria-label="Rotar pantalla">
          <RotateCcw size={16} color="var(--text-tertiary)" />
        </button>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Cerrar app">
          <X size={16} color="var(--text-tertiary)" />
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    height: 44,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px 0 6px',
    background: 'var(--glass)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '0.5px solid var(--glass-border)',
    zIndex: 95,
    flexShrink: 0,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 4px',
    minWidth: 92,
  },
  backLabel: {
    fontSize: 16,
    color: 'var(--accent)',
    fontWeight: 400,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  actions: { display: 'flex', alignItems: 'center', gap: 6 },
  rotateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 15,
    background: 'var(--bg-tertiary)',
    border: 'none',
    cursor: 'pointer',
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 15,
    background: 'var(--bg-tertiary)',
    border: 'none',
    cursor: 'pointer',
    marginRight: 4,
  },
};