import { useRef, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getAppIcon } from './Launcher';

interface AppSwitcherProps {
  onClose: () => void;
}

export default function AppSwitcher({ onClose }: AppSwitcherProps) {
  const openApps = useAppStore(s => s.openApps);
  const recentApps = useAppStore(s => s.recentApps);
  const closeApp = useAppStore(s => s.closeApp);
  const bringToFront = useAppStore(s => s.bringToFront);

  // Orden de más reciente → más antiguo
  const visible = openApps.filter(a => a.status !== 'terminated');
  const ordered = [...visible].sort((a, b) => {
    const ia = recentApps.indexOf(a.id);
    const ib = recentApps.indexOf(b.id);
    return (ib === -1 ? -1 : ib) - (ia === -1 ? -1 : ia);
  });

  return (
    <div
      style={styles.overlay}
      onClick={onClose}
    >
      <div style={styles.header}>
        <span style={styles.counter}>
          {visible.length} {visible.length === 1 ? 'app' : 'apps'} abiertas
        </span>
        <button style={styles.doneBtn} onClick={onClose}>Listo</button>
      </div>

      <div style={styles.track}>
        <AnimatePresence>
          {ordered.map((app, idx) => (
            <AppCard
              key={app.id}
              index={idx}
              color={app.definition.color}
              icon={app.definition.icon}
              name={app.definition.name}
              onTap={() => {
                bringToFront(app.id);
                onClose();
              }}
              onClose={() => closeApp(app.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {ordered.length === 0 && (
        <div style={styles.empty}>No hay apps abiertas</div>
      )}

      <div style={styles.hintWrap}>
        <div style={styles.hint}>Desliza ↑ para cerrar · toca una tarjeta para abrirla</div>
        <div style={styles.trackDots}>
          {ordered.map((_, i) => (
            <span key={i} style={styles.dot} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface AppCardProps {
  index: number;
  color: string;
  icon: string;
  name: string;
  onTap: () => void;
  onClose: () => void;
}

function AppCard({ index, color, icon, name, onTap, onClose }: AppCardProps) {
  const dragRef = useRef<{ startY: number; dy: number } | null>(null);
  const [lift, setLift] = useState(0);

  const deferred = index * 0.05;

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startY: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    if (dy < 0) {
      d.dy = dy;
      setLift(Math.max(-70, dy));
    } else if (dy > 0 && d.dy < 0) {
      setLift(0);
    }
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && d.dy < -60) {
      onClose();
      return;
    }
    if (d && d.dy < 0) setLift(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 90, transition: { duration: 0.16 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 30, delay: deferred }}
      style={{ ...styles.cardWrap, transform: `translateY(${lift}px)` }}
      onClick={onTap}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div style={{ height: 40, background: color, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
        <span style={styles.cardTitle}>
          {getAppIcon(icon, 18)}
          <span style={styles.cardName}>{name}</span>
        </span>
        <button
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
          onPointerDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
          style={styles.closeBtn}
          aria-label={`Cerrar ${name}`}
        >
          <X size={13} color="#fff" />
        </button>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardPalette}>
          <span style={{ opacity: 0.9 }}>{getAppIcon(icon, 52)}</span>
          <span style={styles.cardBigName}>{name}</span>
        </div>
      </div>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(22px) saturate(160%)',
    WebkitBackdropFilter: 'blur(22px) saturate(160%)',
    zIndex: 9500,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 46,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 22px 6px',
  },
  counter: {
    fontSize: 22,
    fontWeight: 700,
    color: '#ffffff',
    textShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  doneBtn: {
    border: 'none',
    background: 'rgba(255,255,255,0.22)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 16,
    padding: '7px 16px',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  track: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '10px 26px',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
  },
  cardWrap: {
    scrollSnapAlign: 'center' as const,
    flexShrink: 0,
    width: '78%',
    height: '68%',
    maxWidth: 300,
    borderRadius: 28,
    cursor: 'pointer',
    overflow: 'hidden',
    background: 'var(--surface-container-low)',
    boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
    position: 'relative' as const,
    touchAction: 'pan-x',
  },
  cardTitle: { display: 'flex', alignItems: 'center', gap: 7 },
  cardName: { fontSize: 13, fontWeight: 600, color: '#fff' },
  closeBtn: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.28)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  cardBody: {
    height: 'calc(100% - 40px)',
    background: 'linear-gradient(180deg, var(--surface-container), var(--surface-container-low))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPalette: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  cardBigName: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' },
  empty: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    textAlign: 'center' as const,
    padding: 30,
  },
  hintWrap: { padding: '12px 0 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  hint: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  trackDots: { display: 'flex', gap: 5 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.5)',
  },
};