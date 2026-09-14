import { useState } from 'react';
import { useSystemStore } from '../../../stores/useSystemStore';
import { toast } from '../../ui';
import { Delete, X } from 'lucide-react';

type Step = 'current' | 'new' | 'confirm';

interface ChangePinDialogProps {
  onClose: () => void;
}

const STEP_INFO: Record<Step, { title: string; subtitle: string }> = {
  current: { title: 'Contraseña actual', subtitle: 'Introduce tu contraseña actual' },
  new: { title: 'Nueva contraseña', subtitle: 'Elige una contraseña de 4 dígitos' },
  confirm: { title: 'Confirmar contraseña', subtitle: 'Repite la nueva contraseña' },
};

export default function ChangePinDialog({ onClose }: ChangePinDialogProps) {
  const pinCode = useSystemStore(s => s.pinCode);
  const setPinCode = useSystemStore(s => s.setPinCode);

  const [step, setStep] = useState<Step>('current');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [newPin, setNewPin] = useState('');

  const fail = (msg: string) => {
    setError(msg);
    setShake(true);
    setValue('');
    setTimeout(() => {
      setError('');
      setShake(false);
    }, 700);
  };

  const advance = (attempt: string) => {
    if (step === 'current') {
      if (attempt === pinCode) {
        setStep('new');
        setValue('');
      } else {
        fail('La contraseña actual no es correcta');
      }
    } else if (step === 'new') {
      if (/^\d{4}$/.test(attempt)) {
        setNewPin(attempt);
        setStep('confirm');
        setValue('');
      } else {
        fail('La contraseña debe tener 4 dígitos');
      }
    } else {
      if (attempt === newPin) {
        setPinCode(attempt);
        toast('Contraseña actualizada');
        onClose();
      } else {
        fail('Las contraseñas no coinciden');
      }
    }
  };

  const addDigit = (digit: string) => {
    const next = value.length < 4 ? value + digit : value;
    setValue(next);
    if (next.length === 4) advance(next);
  };

  const info = STEP_INFO[step];

  return (
    <div style={styles.root}>
      <div style={styles.backdrop} onClick={onClose} />

      <div style={styles.card} onClick={e => e.stopPropagation()}>
        <button className="pressable" style={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          <X size={16} color="var(--text-secondary)" />
        </button>

        <span style={styles.title}>{info.title}</span>
        <span style={styles.subtitle}>{info.subtitle}</span>

        <div
          style={{
            ...styles.dots,
            animation: shake ? 'pin-shake 0.4s ease' : undefined,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              style={{
                ...styles.dot,
                background: i < value.length ? 'var(--primary)' : 'var(--outline-variant)',
              }}
            />
          ))}
        </div>

        {error && <span style={styles.error}>{error}</span>}

        <div style={styles.keypad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
            <button
              key={n}
              className="pressable"
              onClick={() => addDigit(n)}
              style={styles.key}
            >
              {n}
            </button>
          ))}
          <div aria-hidden style={styles.key} />
          <button
            key="0"
            className="pressable"
            onClick={() => addDigit('0')}
            style={styles.key}
          >
            0
          </button>
          <button
            className="pressable"
            onClick={() => setValue(prev => prev.slice(0, -1))}
            style={styles.key}
            aria-label="Borrar"
          >
            <Delete size={20} color="var(--text-primary)" />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'absolute',
    inset: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 300,
    borderRadius: 28,
    background: 'var(--surface-container-high)',
    padding: '24px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    boxShadow: 'var(--shadow-lg)',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: 'none',
    background: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
  },
  dots: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 6,
    minHeight: 14,
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: '50%',
    transition: 'background 0.15s ease',
  },
  error: {
    fontSize: 12,
    color: 'var(--danger, #ff3b30)',
    minHeight: 16,
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 72px)',
    gap: 14,
    marginTop: 6,
  },
  key: {
    width: 72,
    height: 60,
    borderRadius: 18,
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--outline-variant)',
    color: 'var(--text-primary)',
    fontSize: 24,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    outline: 'none',
    touchAction: 'manipulation' as const,
    WebkitTapHighlightColor: 'transparent',
  },
};