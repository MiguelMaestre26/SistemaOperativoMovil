import type { CSSProperties, ReactNode } from 'react';

interface IconBubbleProps {
  icon: ReactNode;
  size?: number;
  background?: string;
  radius?: number;
  style?: CSSProperties;
}

export default function IconBubble({
  icon,
  size = 40,
  background = 'var(--bg-tertiary)',
  radius,
  style,
}: IconBubbleProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? size * 0.28,
        background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      {icon}
    </div>
  );
}