import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastItem {
  id: number;
  message: string;
}

type Listener = (toast: ToastItem) => void;
let listener: Listener | null = null;
let counter = 0;

export function toast(message: string) {
  listener?.({ id: ++counter, message });
}

export default function ToastProvider() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listener = item => {
      setItems(prev => [...prev, item]);
      setTimeout(() => {
        setItems(prev => prev.filter(t => t.id !== item.id));
      }, 2200);
    };
    return () => {
      listener = null;
    };
  }, []);

  return (
    <div style={styles.root}>
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            style={styles.toast}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {item.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    zIndex: 300,
    pointerEvents: 'none',
  },
  toast: {
    background: 'var(--inverse-surface)',
    color: 'var(--inverse-on-surface)',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 8,
    padding: '10px 18px',
    boxShadow: 'var(--shadow-lg)',
    maxWidth: '80%',
    textAlign: 'center' as const,
  },
};