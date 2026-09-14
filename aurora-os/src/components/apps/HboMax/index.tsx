import { useRef, useState } from 'react';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { isNative, openExternalBrowser } from '../../../core/native';
import { Screen } from '../../ui';
import RealWebView, { type RealWebViewHandle } from '../../shared/RealWebView';
import LinkAppLaunch from '../../shared/LinkAppLaunch';

const HBO_HOME = 'https://www.hbomax.com';

export function HboIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <text x="12" y="16.6" textAnchor="middle" fontSize="12" fontWeight="800" fontFamily="'Arial Black', Arial, sans-serif" fill="#fff" letterSpacing="-0.8">HBO</text>
    </svg>
  );
}

export default function HboMaxApp() {
  const native = isNative();
  const wvRef = useRef<RealWebViewHandle>(null);
  const [liveUrl, setLiveUrl] = useState(HBO_HOME);

  if (native) {
    return (
      <Screen scroll={false} padding="0">
        <div style={styles.nativeTop}>
          <button
            className="pressable"
            style={styles.nativeBack}
            onClick={() => wvRef.current?.goBack()}
            aria-label="Retroceder"
            title="Retroceder"
          >
            <ChevronLeft size={22} color="#fff" />
          </button>
          <div style={styles.nativeBrand}>
            <HboIcon size={20} />
            <span style={styles.nativeTitle}>HBO Max</span>
          </div>
          <button
            className="pressable"
            style={styles.nativeExt}
            onClick={() => openExternalBrowser(liveUrl || HBO_HOME)}
            aria-label="Abrir en el navegador del sistema"
            title="Abrir en el navegador del sistema"
          >
            <ExternalLink size={16} color="#fff" />
          </button>
        </div>
        <div style={styles.nativeBody}>
          <RealWebView ref={wvRef} src={HBO_HOME} partition="aurora-hbomax" onUrl={setLiveUrl} />
        </div>
      </Screen>
    );
  }

  return (
    <LinkAppLaunch
      title="HBO Max"
      url={HBO_HOME}
      icon={<HboIcon size={40} />}
      subtitle="Estrenos, series y películas reales."
      bg="linear-gradient(160deg, #A24BF3 0%, #7B2FF7 100%)"
      accent="#7B2FF7"
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  nativeTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'linear-gradient(160deg, #A24BF3 0%, #7B2FF7 100%)',
    flexShrink: 0,
  },
  nativeBack: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'rgba(255,255,255,0.18)',
    width: 32,
    height: 32,
    borderRadius: 16,
    cursor: 'pointer',
    flexShrink: 0,
  },
  nativeBrand: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  nativeTitle: { fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' as const, flex: 1, minWidth: 0 },
  nativeExt: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'rgba(255,255,255,0.18)',
    width: 32,
    height: 32,
    borderRadius: 16,
    cursor: 'pointer',
    flexShrink: 0,
  },
  nativeBody: { flex: 1, minHeight: 0 },
};