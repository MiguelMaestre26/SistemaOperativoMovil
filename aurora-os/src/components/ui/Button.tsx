import type { CSSProperties, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'plain' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
  ariaLabel?: string;
}

const variants: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--primary)',
    color: 'var(--on-primary)',
    boxShadow: 'var(--shadow-sm)',
  },
  secondary: {
    background: 'var(--secondary-container)',
    color: 'var(--on-secondary-container)',
  },
  destructive: {
    background: 'var(--error)',
    color: 'var(--on-error)',
    boxShadow: 'var(--shadow-sm)',
  },
  plain: {
    background: 'transparent',
    color: 'var(--primary)',
  },
  glass: {
    background: 'var(--surface-container-high)',
    color: 'var(--on-surface)',
    border: '1px solid var(--outline-variant)',
  },
};

const sizes: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '6px 16px', fontSize: 13, borderRadius: 999 },
  md: { padding: '10px 22px', fontSize: 15, borderRadius: 999 },
  lg: { padding: '14px 26px', fontSize: 16, borderRadius: 999 },
};

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  className = '',
  ariaLabel,
}: ButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={`pressable ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        border: 'none',
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
    >
      {children}
    </button>
  );
}