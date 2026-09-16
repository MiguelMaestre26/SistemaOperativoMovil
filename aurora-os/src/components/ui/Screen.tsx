import type { CSSProperties, ReactNode } from 'react';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  scrollX?: boolean;
  padding?: string;
  style?: CSSProperties;
  className?: string;
  bg?: string;
}

export default function Screen({
  children,
  scroll = true,
  scrollX = false,
  padding = '0 0 24px',
  style,
  className = '',
  bg = 'var(--bg-primary)',
}: ScreenProps) {
  return (
    <div
      className={className}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflowY: scroll ? 'auto' : 'hidden',
        overflowX: scrollX !== false ? 'auto' : 'hidden',
        background: bg,
        padding,
        WebkitOverflowScrolling: 'touch',
        ...style,
      }}
    >
      {children}
    </div>
  );
}