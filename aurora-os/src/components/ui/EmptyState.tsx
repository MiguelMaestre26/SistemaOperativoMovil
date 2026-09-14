import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, iconBg, title, subtitle, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        textAlign: 'center' as const,
        gap: 8,
      }}
    >
      {icon && (
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 20,
            background: iconBg ?? 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6,
            color: 'var(--text-secondary)',
          }}
        >
          {icon}
        </div>
      )}
      <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      {subtitle && (
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, maxWidth: 260 }}>
          {subtitle}
        </span>
      )}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}