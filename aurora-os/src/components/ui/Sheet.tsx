import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function Sheet({ open, onClose, children, title }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <div style={styles.root}>
          <motion.div
            style={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            style={styles.panel}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div style={styles.handle} />
            {title && <div style={styles.title}>{title}</div>}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'absolute',
    inset: 0,
    zIndex: 80,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
  },
  panel: {
    position: 'relative',
    background: 'var(--surface-container-high)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: '10px 16px 28px',
    maxHeight: '82%',
    overflowY: 'auto',
    boxShadow: '0 -12px 48px rgba(0,0,0,0.35)',
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    background: 'var(--outline-variant)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
};