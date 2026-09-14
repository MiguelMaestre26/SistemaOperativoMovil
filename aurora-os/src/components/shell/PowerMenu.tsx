import { motion, AnimatePresence } from 'framer-motion';
import { powerManager } from '../../core/PowerManager';
import { Power, RotateCcw, Lock } from 'lucide-react';

interface PowerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PowerMenu({ isOpen, onClose }: PowerMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          style={styles.overlay}
          onClick={onClose}
        >
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ x: '100%', opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, delay: 0.04 }}
            style={styles.panel}
          >
            <div style={styles.handle} />

            <span style={styles.title}>Menú de energía</span>

            <div style={styles.actions}>
              <button
                style={{ ...styles.actionBtn, background: 'rgba(255,159,10,0.18)' }}
                onClick={() => { powerManager.lock(); onClose(); }}
              >
                <Lock size={22} color="var(--warning)" />
                <span style={styles.actionLabel}>Bloquear pantalla</span>
              </button>

              <button
                style={{ ...styles.actionBtn, background: 'rgba(48,209,88,0.16)' }}
                onClick={() => { powerManager.reboot(); onClose(); }}
              >
                <RotateCcw size={22} color="var(--success)" />
                <span style={styles.actionLabel}>Reiniciar</span>
              </button>

              <button
                style={{ ...styles.actionBtn, background: 'rgba(255,69,58,0.18)' }}
                onClick={() => { powerManager.shutdown(); onClose(); }}
              >
                <Power size={22} color="var(--danger)" />
                <span style={styles.actionLabel}>Apagar</span>
              </button>
            </div>

            <span style={styles.hint}>
              Mantén pulsado el botón de encendido para reiniciar directamente
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: 46,
    zIndex: 9550,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    padding: 12,
  },
  panel: {
    width: 210,
    background: 'rgba(40,40,44,0.95)',
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    borderRadius: 26,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: '14px 14px 18px',
    gap: 10,
    boxShadow: '0 30px 70px rgba(0,0,0,0.55)',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    background: 'rgba(255,255,255,0.4)',
    alignSelf: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    textAlign: 'center' as const,
    marginBottom: 6,
  },
  actions: { display: 'flex', flexDirection: 'column', gap: 10 },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '13px 14px',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  actionLabel: { fontSize: 14, fontWeight: 600, color: '#fff' },
  hint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center' as const,
    lineHeight: 1.3,
    marginTop: 'auto',
    paddingTop: 4,
  },
};