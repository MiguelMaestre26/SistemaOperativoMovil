import type { CSSProperties } from 'react';

interface BadgeProps {
  count?: number;
  dot?: boolean;
  color?: string;
  style?: CSSProperties;
}

export default function Badge({ count, dot, color = 'var(--danger)', style }: BadgeProps) {
  if (dot) {
    return (
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  if (!count || count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);
  return (
    <span
      style={{
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        background: color,
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5px',
        flexShrink: 0,
        ...style,
      }}
    >
      {label}
    </span>
  );
}