import type { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabBarProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function TabBar({ tabs, activeId, onChange }: TabBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        padding: '8px 12px 10px',
        background: 'var(--surface-container)',
        borderTop: '0.5px solid var(--separator-cell)',
        flexShrink: 0,
      }}
    >
      {tabs.map(tab => {
        const active = tab.id === activeId;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className="pressable"
            aria-label={tab.label}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '2px 0',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 28,
                borderRadius: 14,
                background: active ? 'var(--secondary-container)' : 'transparent',
                transition: 'background 0.2s ease',
              }}
            >
              <Icon size={22} color={active ? 'var(--on-secondary-container)' : 'var(--text-tertiary)'} />
            </span>
            <span
              style={{
                fontSize: 11,
                color: active ? 'var(--primary)' : 'var(--text-tertiary)',
                fontWeight: 500,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}