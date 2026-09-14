import type { CSSProperties, ReactNode } from 'react';

interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  label?: string;
  size?: number;
  bg?: string;
  color?: string;
  style?: CSSProperties;
}

export default function IconButton({
  children,
  onClick,
  label,
  size = 36,
  bg = 'var(--bg-tertiary)',
  color = 'var(--text-primary)',
  style,
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className="pressable"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2.6,
        border: 'none',
        background: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </button>
  );
}