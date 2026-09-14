import type { ReactNode } from 'react';
import ListGroup from './ListGroup';

interface ListSectionProps {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function ListSection({ title, children, footer }: ListSectionProps) {
  return (
    <section style={{ marginTop: title ? 0 : 14, flexShrink: 0 }}>
      {title && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase' as const,
            letterSpacing: 0.5,
            padding: '12px 20px 6px',
          }}
        >
          {title}
        </div>
      )}
      <ListGroup>{children}</ListGroup>
      {footer && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            padding: '8px 20px 0',
            lineHeight: 1.35,
          }}
        >
          {footer}
        </div>
      )}
    </section>
  );
}