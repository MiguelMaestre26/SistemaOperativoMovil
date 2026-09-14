import { useRef, useState } from 'react';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { isNative, openExternalBrowser } from '../../../core/native';
import { Screen } from '../../ui';
import RealWebView, { type RealWebViewHandle } from '../../shared/RealWebView';
import LinkAppLaunch from '../../shared/LinkAppLaunch';

const UJAP_HOME = 'http://www.adm.ujap.edu.ve/adms/ingreso.php';

export function UjapIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <text x="12" y="16.4" textAnchor="middle" fontSize="7.4" fontWeight="800" fontFamily="'Arial Black', Arial, sans-serif" fill="#fff" letterSpacing="-0.4">UJAP</text>
    </svg>
  );
}

export default function UjapEnLineaApp() {
  const native = isNative();
  const wvRef = useRef<RealWebViewHandle>(null);
  const [liveUrl, setLiveUrl] = useState(UJAP_HOME);

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
            <UjapIcon size={20} />
            <span style={styles.nativeTitle}>UJAP En Línea</span>
          </div>
          <button
            className="pressable"
            style={styles.nativeExt}
            onClick={() => openExternalBrowser(liveUrl || UJAP_HOME)}
            aria-label="Abrir en el navegador del sistema"
            title="Abrir en el navegador del sistema"
          >
            <ExternalLink size={16} color="#fff" />
          </button>
        </div>
        <div style={styles.nativeBody}>
          <RealWebView ref={wvRef} src={UJAP_HOME} partition="aurora-ujap-admin" onUrl={setLiveUrl} />
        </div>
      </Screen>
    );
  }

  return (
    <LinkAppLaunch
      title="UJAP En Línea"
      url={UJAP_HOME}
      icon={<UjapIcon size={40} />}
      subtitle="Portal administrativo de la UJAP. Expediente, notas y trámites."
      bg="linear-gradient(160deg, #E53935 0%, #B71C1C 100%)"
      accent="#E53935"
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  nativeTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'linear-gradient(160deg, #E53935 0%, #B71C1C 100%)',
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