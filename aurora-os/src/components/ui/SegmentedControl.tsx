import { motion } from 'framer-motion';

export interface SegmentOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  name = 'seg',
}: SegmentedControlProps) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--surface-container-high)',
        borderRadius: 999,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              position: 'relative' as const,
              borderRadius: 999,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--on-secondary-container)' : 'var(--text-secondary)',
              transition: 'color 0.2s ease',
            }}
          >
            {active && (
              <motion.span
                layoutId={`seg-${name}`}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 999,
                  background: 'var(--secondary-container)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}