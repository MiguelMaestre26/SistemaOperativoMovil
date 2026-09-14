import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  padded?: boolean;
}

export default function Card({ children, style, className = '', padded = true }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        padding: padded ? 16 : 0,
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}