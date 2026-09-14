import { useRef, useState } from 'react';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { isNative, openExternalBrowser } from '../../../core/native';
import { Screen } from '../../ui';
import RealWebView, { type RealWebViewHandle } from '../../shared/RealWebView';
import LinkAppLaunch from '../../shared/LinkAppLaunch';

const NETFLIX_HOME = 'https://www.netflix.com';

export function NetflixIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polygon points="6.2,2.8 9.6,3.6 9.6,21.2 6.2,20.4" fill="#fff" />
      <polygon points="14.4,3.6 17.8,2.8 17.8,20.4 14.4,21.2" fill="#fff" />
    </svg>
  );
}

export default function NetflixApp() {
  const native = isNative();
  const wvRef = useRef<RealWebViewHandle>(null);
  const [liveUrl, setLiveUrl] = useState(NETFLIX_HOME);

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
            <NetflixIcon size={20} />
            <span style={styles.nativeTitle}>Netflix</span>
          </div>
          <button
            className="pressable"
            style={styles.nativeExt}
            onClick={() => openExternalBrowser(liveUrl || NETFLIX_HOME)}
            aria-label="Abrir en el navegador del sistema"
            title="Abrir en el navegador del sistema"
          >
            <ExternalLink size={16} color="#fff" />
          </button>
        </div>
        <div style={styles.nativeBody}>
          <RealWebView ref={wvRef} src={NETFLIX_HOME} partition="aurora-netflix" onUrl={setLiveUrl} />
        </div>
      </Screen>
    );
  }

  return (
    <LinkAppLaunch
      title="Netflix"
      url={NETFLIX_HOME}
      icon={<NetflixIcon size={40} />}
      subtitle="Series y películas reales, al instante."
      bg="linear-gradient(160deg, #E50914 0%, #B1060F 100%)"
      accent="#E50914"
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  nativeTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'linear-gradient(160deg, #E50914 0%, #B1060F 100%)',
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