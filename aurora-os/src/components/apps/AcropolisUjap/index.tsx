import { useRef, useState } from 'react';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { isNative, openExternalBrowser } from '../../../core/native';
import { Screen } from '../../ui';
import RealWebView, { type RealWebViewHandle } from '../../shared/RealWebView';
import LinkAppLaunch from '../../shared/LinkAppLaunch';

const ACROPOLIS_HOME = 'https://aulavirtual.ujap.edu.ve/';

export function AcropolisIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 2.5 8 12 12.5 21.5 8 12 3.5Z" fill="#fff" />
      <path d="M6.6 10.7V15c0 1.3 2.4 2.6 5.4 2.6s5.4-1.3 5.4-2.6v-4.3" stroke="#fff" strokeWidth="1.7" fill="none" />
      <path d="M21.5 8.3v5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function AcropolisUjapApp() {
  const native = isNative();
  const wvRef = useRef<RealWebViewHandle>(null);
  const [liveUrl, setLiveUrl] = useState(ACROPOLIS_HOME);

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
            <AcropolisIcon size={20} />
            <span style={styles.nativeTitle}>Acropolis UJAP</span>
          </div>
          <button
            className="pressable"
            style={styles.nativeExt}
            onClick={() => openExternalBrowser(liveUrl || ACROPOLIS_HOME)}
            aria-label="Abrir en el navegador del sistema"
            title="Abrir en el navegador del sistema"
          >
            <ExternalLink size={16} color="#fff" />
          </button>
        </div>
        <div style={styles.nativeBody}>
          <RealWebView ref={wvRef} src={ACROPOLIS_HOME} partition="aurora-ujap-acropolis" onUrl={setLiveUrl} />
        </div>
      </Screen>
    );
  }

  return (
    <LinkAppLaunch
      title="Acropolis UJAP"
      url={ACROPOLIS_HOME}
      icon={<AcropolisIcon size={40} />}
      subtitle="Aula virtual de la UJAP. Cursos, tareas y calificaciones."
      bg="linear-gradient(160deg, #B71C1C 0%, #5D0000 100%)"
      accent="#B71C1C"
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  nativeTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'linear-gradient(160deg, #B71C1C 0%, #5D0000 100%)',
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