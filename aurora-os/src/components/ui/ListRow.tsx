import type { CSSProperties, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface ListRowProps {
  icon?: ReactNode;
  iconBg?: string;
  label: string;
  sublabel?: string;
  value?: ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  contentStyle?: CSSProperties;
  showSeparator?: boolean;
}

export default function ListRow({
  icon,
  iconBg,
  label,
  sublabel,
  value,
  chevron,
  onClick,
  destructive,
  disabled,
  contentStyle,
  showSeparator = true,
}: ListRowProps) {
  const hasChevron = chevron ?? Boolean(onClick);
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      className="cell-row"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        border: 'none',
        background: 'transparent',
        textAlign: 'left' as const,
        cursor: onClick ? 'pointer' : 'default',
        opacity: disabled ? 0.4 : 1,
        padding: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '0 16px', ...contentStyle }}>
        {icon && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: iconBg ?? 'var(--secondary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: destructive ? 'var(--danger)' : 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {label}
          </span>
          {sublabel && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
              }}
            >
              {sublabel}
            </span>
          )}
        </div>
        {value !== undefined && (
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', flexShrink: 0 }}>{value}</span>
        )}
        {hasChevron && <ChevronRight size={18} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />}
      </div>
      {showSeparator && <div className="cell-sep" style={{ marginLeft: icon ? 58 : 16 }} />}
    </Wrapper>
  );
}