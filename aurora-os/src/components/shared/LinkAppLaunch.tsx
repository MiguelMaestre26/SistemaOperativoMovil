import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { openExternal } from '../../core/webapp';

interface LinkAppLaunchProps {
  title: string;
  url: string;
  icon: ReactNode;
  subtitle?: string;
  bg?: string;
  accent?: string;
}

export default function LinkAppLaunch({
  title,
  url,
  icon,
  subtitle,
  bg = 'linear-gradient(160deg, #1c1c1e 0%, #0f0f11 100%)',
  accent = '#1c1c1e',
}: LinkAppLaunchProps) {
  useEffect(() => {
    const t = setTimeout(() => openExternal(url), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 24px',
      textAlign: 'center' as const,
      background: bg,
    }}>
      <div style={{
        width: 84,
        height: 84,
        borderRadius: 42,
        background: 'rgba(255,255,255,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 14 }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, marginTop: 6 }}>{subtitle}</div>
      )}
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 18 }}>
        La página se abrió en una pestaña nueva.
      </div>
      <button
        className="pressable"
        onClick={() => openExternal(url)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 14,
          height: 50,
          borderRadius: 14,
          border: 'none',
          background: accent,
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          padding: '0 22px',
          boxShadow: '0 4px 18px rgba(0,0,0,0.25)',
        }}
      >
        <ExternalLink size={18} color="#fff" />
        <span>Reabrir {title}</span>
      </button>
    </div>
  );
}