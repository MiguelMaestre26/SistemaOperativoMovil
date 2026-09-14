import type { CSSProperties, ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
  variant?: 'large' | 'standard';
  transparent?: boolean;
  style?: CSSProperties;
}

const styles: Record<string, React.CSSProperties> = {
  largeHeader: {
    padding: '6px 18px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flexShrink: 0,
  },
  largeBackRow: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: -10,
  },
  largeTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  largeTitle: {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: -0.5,
    lineHeight: 1.15,
    color: 'var(--text-primary)',
    margin: 0,
  },
  actionRight: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  stdHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    padding: '0 8px',
    gap: 6,
    flexShrink: 0,
  },
  stdTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
    flex: 1,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  side: {
    minWidth: 72,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    background: 'none',
    border: 'none',
    padding: '4px 6px 4px 2px',
    cursor: 'pointer',
    borderRadius: 8,
  },
  backLabel: {
    fontSize: 16,
    color: 'var(--accent)',
    fontWeight: 400,
  },
};

export default function AppHeader({
  title,
  onBack,
  backLabel = 'Atrás',
  right,
  variant = 'large',
  transparent = false,
  style,
}: AppHeaderProps) {
  const backBtn = onBack ? (
    <button className="pressable" onClick={onBack} style={styles.backBtn}>
      <ChevronLeft size={26} color="var(--accent)" />
      <span style={styles.backLabel}>{backLabel}</span>
    </button>
  ) : null;

  if (variant === 'standard') {
    return (
      <header
        style={{
          ...styles.stdHeader,
          background: transparent ? 'transparent' : 'var(--bg-primary)',
          borderBottom: transparent ? 'none' : '0.5px solid var(--separator-cell)',
          ...style,
        }}
      >
        <div style={styles.side}>{backBtn}</div>
        <span style={styles.stdTitle}>{title}</span>
        <div style={{ ...styles.side, justifyContent: 'flex-end' }}>{right}</div>
      </header>
    );
  }

  return (
    <header style={{ ...styles.largeHeader, ...style }}>
      {backBtn && <div style={styles.largeBackRow}>{backBtn}</div>}
      <div style={styles.largeTitleRow}>
        <h1 style={styles.largeTitle}>{title}</h1>
        {right && <div style={styles.actionRight}>{right}</div>}
      </div>
    </header>
  );
}