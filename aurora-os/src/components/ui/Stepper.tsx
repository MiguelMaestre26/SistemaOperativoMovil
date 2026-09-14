import { Minus, Plus } from 'lucide-react';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
}

export default function Stepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  format,
}: StepperProps) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const display = format ? format(value) : String(value);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <button
        className="pressable"
        aria-label="Disminuir"
        onClick={() => onChange(clamp(value - step))}
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: 'none',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Minus size={15} />
      </button>
      <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', minWidth: 40, textAlign: 'center' }}>
        {display}
      </span>
      <button
        className="pressable"
        aria-label="Aumentar"
        onClick={() => onChange(clamp(value + step))}
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: 'none',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}