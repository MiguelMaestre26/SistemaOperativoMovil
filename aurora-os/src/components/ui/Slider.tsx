import type { ReactNode } from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  icon?: ReactNode;
  unit?: string;
}

export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  icon,
  unit = '%',
}: SliderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        minWidth: 0,
      }}
    >
      {icon && (
        <span style={{ color: 'var(--text-secondary)', flexShrink: 0, display: 'flex' }}>{icon}</span>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          flex: 1,
          width: '100%',
          accentColor: 'var(--primary)',
          height: 4,
          cursor: 'pointer',
          margin: 0,
        }}
      />
      <span
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          minWidth: 40,
          textAlign: 'right' as const,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {Math.round(value)}
        {unit}
      </span>
    </div>
  );
}