import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PromptOptions {
  title: string;
  message?: string;
  value?: string;
  placeholder?: string;
  kind?: 'text' | 'number';
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

type Resolver = (value: string | null) => void;
type ConfirmResolver = (value: boolean) => void;

interface DialogState {
  uid: number;
  kind: 'prompt' | 'confirm';
  options: PromptOptions | ConfirmOptions;
  resolve: Resolver | ConfirmResolver;
}

let current: DialogState | null = null;
let subscribe: ((state: DialogState | null) => void) | null = null;
let uidCounter = 0;

function publish(state: DialogState | null) {
  current = state;
  subscribe?.(state);
}

export function openPrompt(options: PromptOptions): Promise<string | null> {
  return new Promise(resolve => {
    publish({ uid: ++uidCounter, kind: 'prompt', options, resolve });
  });
}

export function openConfirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise(resolve => {
    publish({ uid: ++uidCounter, kind: 'confirm', options, resolve });
  });
}

export default function DialogProvider() {
  const [state, setState] = useState<DialogState | null>(current);

  useEffect(() => {
    subscribe = setState;
    return () => {
      subscribe = null;
    };
  }, []);

  const dismissPrompt = (value: string | null) => {
    const s = current;
    const resolver = s?.resolve;
    publish(null);
    if (resolver) (resolver as Resolver)(value);
  };

  const dismissConfirm = (value: boolean) => {
    const s = current;
    const resolver = s?.resolve;
    publish(null);
    if (resolver) (resolver as ConfirmResolver)(value);
  };

  return (
    <AnimatePresence>
      {state && (
        <div style={styles.root}>
          <motion.div
            style={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() =>
              state.kind === 'prompt'
                ? dismissPrompt(null)
                : dismissConfirm(false)
            }
          />
          <motion.div
            key={state.uid}
            style={styles.alert}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {state.kind === 'prompt' ? (
              <PromptBody
                options={state.options as PromptOptions}
                onCancel={() => dismissPrompt(null)}
                onConfirm={value => dismissPrompt(value)}
              />
            ) : (
              <ConfirmBody
                options={state.options as ConfirmOptions}
                onCancel={() => dismissConfirm(false)}
                onConfirm={() => dismissConfirm(true)}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PromptBody({
  options,
  onCancel,
  onConfirm,
}: {
  options: PromptOptions;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = useState(options.value ?? '');
  const confirmText = options.confirmText ?? 'Aceptar';
  const cancelText = options.cancelText ?? 'Cancelar';

  return (
    <div style={styles.body}>
      <span style={styles.title}>{options.title}</span>
      {options.message && <span style={styles.message}>{options.message}</span>}
      <input
        autoFocus
        type={options.kind === 'number' ? 'number' : 'text'}
        placeholder={options.placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') onConfirm(value);
        }}
        style={styles.input}
      />
      <div style={styles.actions}>
        <button className="pressable" onClick={onCancel} style={{ ...styles.btn, color: 'var(--text-secondary)' }}>
          {cancelText}
        </button>
        <div style={styles.sep} />
        <button className="pressable" onClick={() => onConfirm(value)} style={styles.btn}>
          {confirmText}
        </button>
      </div>
    </div>
  );
}

function ConfirmBody({
  options,
  onCancel,
  onConfirm,
}: {
  options: ConfirmOptions;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmText = options.confirmText ?? 'Aceptar';
  const cancelText = options.cancelText ?? 'Cancelar';

  return (
    <div style={styles.body}>
      <span style={styles.title}>{options.title}</span>
      <span style={styles.message}>{options.message}</span>
      <div style={styles.btnRow}>
        <button
          className="pressable"
          onClick={onCancel}
          style={{
            ...styles.rowBtn,
            color: 'var(--accent)',
            borderBottom: '0.5px solid var(--separator-cell)',
          }}
        >
          {cancelText}
        </button>
        <button
          className="pressable"
          onClick={onConfirm}
          style={{
            ...styles.rowBtn,
            color: options.destructive ? 'var(--danger)' : 'var(--accent)',
            fontWeight: 600,
          }}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'absolute',
    inset: 0,
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
  },
  alert: {
    position: 'relative',
    width: 280,
    maxWidth: '100%',
    borderRadius: 28,
    background: 'var(--surface-container-high)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 16px 0',
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
  },
  message: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    lineHeight: 1.4,
  },
  input: {
    marginTop: 6,
    background: 'var(--bg-tertiary)',
    border: 'none',
    borderRadius: 10,
    padding: '10px 12px',
    color: 'var(--text-primary)',
    fontSize: 16,
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    userSelect: 'text' as const,
  },
  actions: {
    display: 'flex',
    alignItems: 'stretch',
    margin: '14px -16px 0',
    borderTop: '0.5px solid var(--separator-cell)',
  },
  btn: {
    flex: 1,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--accent)',
    padding: '13px 0',
  },
  sep: {
    width: 0.5,
    background: 'var(--separator-cell)',
  },
  btnRow: {
    display: 'flex',
    flexDirection: 'column',
    margin: '14px -16px 0',
  },
  rowBtn: {
    width: '100%',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 17,
    padding: '13px 0',
  },
};