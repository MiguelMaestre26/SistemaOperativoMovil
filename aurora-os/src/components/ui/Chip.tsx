interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export default function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      className="pressable"
      onClick={onClick}
      style={{
        border: active ? '1px solid transparent' : '1px solid var(--outline-variant)',
        borderRadius: 999,
        padding: '7px 16px',
        fontSize: 14,
        fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        background: active ? 'var(--secondary-container)' : 'var(--surface-container-low)',
        color: active ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {label}
    </button>
  );
}