interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      style={{
        width: 52,
        height: 32,
        borderRadius: 16,
        background: checked ? 'var(--primary)' : 'var(--surface-container-highest)',
        border: checked ? '2px solid var(--primary)' : '2px solid var(--outline)',
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.25s ease, border-color 0.25s ease',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: checked ? 'var(--on-primary)' : 'var(--outline)',
          left: checked ? 26 : 4,
          transition: 'left 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.25s ease',
          boxShadow: checked ? '0 0 0 0 rgba(0,0,0,0)' : 'var(--shadow-sm)',
        }}
      />
    </div>
  );
}