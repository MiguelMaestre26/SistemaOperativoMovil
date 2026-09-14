import { useRef, useState } from 'react';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { isNative, openExternalBrowser } from '../../../core/native';
import { Screen } from '../../ui';
import RealWebView, { type RealWebViewHandle } from '../../shared/RealWebView';
import LinkAppLaunch from '../../shared/LinkAppLaunch';

const GMAIL_HOME = 'https://mail.google.com';

export function GmailIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5.5h16a1.6 1.6 0 0 1 1.6 1.6v10.2a1.6 1.6 0 0 1-1.6 1.6H4a1.6 1.6 0 0 1-1.6-1.6V7.1A1.6 1.6 0 0 1 4 5.5Z" fill="#fff" />
      <path d="M4.2 7.8 12 14.5 19.8 7.8" stroke="#C5221F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function GmailApp() {
  const native = isNative();
  const wvRef = useRef<RealWebViewHandle>(null);
  const [liveUrl, setLiveUrl] = useState(GMAIL_HOME);

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
            <GmailIcon size={20} />
            <span style={styles.nativeTitle}>Gmail</span>
          </div>
          <button
            className="pressable"
            style={styles.nativeExt}
            onClick={() => openExternalBrowser(liveUrl || GMAIL_HOME)}
            aria-label="Abrir en el navegador del sistema"
            title="Abrir en el navegador del sistema"
          >
            <ExternalLink size={16} color="#fff" />
          </button>
        </div>
        <div style={styles.nativeBody}>
          <RealWebView ref={wvRef} src={GMAIL_HOME} partition="aurora-gmail" onUrl={setLiveUrl} />
        </div>
      </Screen>
    );
  }

  return (
    <LinkAppLaunch
      title="Gmail"
      url={GMAIL_HOME}
      icon={<GmailIcon size={40} />}
      subtitle="Tu correo real, directo a tu bandeja."
      bg="linear-gradient(160deg, #EA4335 0%, #C5221F 100%)"
      accent="#C5221F"
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  nativeTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'linear-gradient(160deg, #EA4335 0%, #C5221F 100%)',
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