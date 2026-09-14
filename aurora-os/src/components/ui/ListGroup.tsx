import type { CSSProperties, ReactNode } from 'react';

interface ListGroupProps {
  children: ReactNode;
  inset?: boolean;
  style?: CSSProperties;
  className?: string;
}

export default function ListGroup({ children, inset = true, style, className = '' }: ListGroupProps) {
  return (
    <div
      className={`cell-group ${className}`}
      style={{
        background: 'var(--surface-card)',
        borderRadius: inset ? 'var(--radius-lg)' : 0,
        overflow: 'hidden',
        margin: inset ? '0 16px' : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}