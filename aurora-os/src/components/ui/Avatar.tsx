import type { CSSProperties } from 'react';

function colorForName(name: string, fallback?: string): string {
  if (fallback) return fallback;
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) % 360;
  }
  return `hsl(${h}, 42%, 48%)`;
}

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
  img?: string;
  style?: CSSProperties;
}

export default function Avatar({ name, size = 44, color, img, style }: AvatarProps) {
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();

  if (img) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundImage: `url(${img})`,
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: colorForName(name, color),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontSize: size * 0.36,
        fontWeight: 600,
        letterSpacing: 0.3,
        flexShrink: 0,
        ...style,
      }}
    >
      {initials || '?'}
    </div>
  );
}