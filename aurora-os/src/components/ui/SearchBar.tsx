import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar',
  onCancel,
  autoFocus,
}: SearchBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--surface-container-high)',
          borderRadius: 999,
          padding: '12px 18px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Search size={16} color="var(--text-secondary)" />
        <input
          autoFocus={autoFocus}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 16,
            fontFamily: 'inherit',
            userSelect: 'text' as const,
          }}
        />
      </div>
      {onCancel && (
        <button
          className="pressable"
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: 16,
            fontWeight: 500,
            cursor: 'pointer',
            padding: '4px 2px',
          }}
        >
          Cancelar
        </button>
      )}
    </div>
  );
}