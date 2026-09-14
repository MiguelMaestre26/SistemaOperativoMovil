import { useRef, useState } from 'react';
import { MessageCircle, ShieldCheck, ChevronLeft } from 'lucide-react';
import { WA_WEB, waLink } from '../../../core/webapp';
import { isNative } from '../../../core/native';
import { openInOs } from '../../../core/browserSession';
import { Screen, AppHeader, openPrompt } from '../../ui';
import RealWebView, { type RealWebViewHandle } from '../../shared/RealWebView';
import LinkAppLaunch from '../../shared/LinkAppLaunch';

export default function WhatsAppApp() {
  const native = isNative();
  const [liveUrl, setLiveUrl] = useState(WA_WEB);
  const wvRef = useRef<RealWebViewHandle>(null);

  const host = (() => {
    try {
      return new URL(liveUrl).hostname;
    } catch {
      return '';
    }
  })();
  const official = host.endsWith('web.whatsapp.com');

  if (native) {
    return (
      <Screen scroll={false} padding="0">
        <AppHeader variant="standard" title="WhatsApp" />
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
            <ShieldCheck size={13} color={official ? '#4CD964' : '#FF6B6B'} />
            <span style={styles.nativeTitle}>{host || '…'}</span>
          </div>
          <button
            className="pressable"
            style={styles.nativeBtn}
            onClick={async () => {
              const n = await openPrompt({ title: 'Número de la persona', placeholder: 'ej. 50688880001', confirmText: 'Abrir' });
              if (n?.trim()) openInOs(waLink(n.trim()));
            }}
          >
            Chatear por número
          </button>
        </div>
        <div style={styles.nativeBody}>
          <RealWebView ref={wvRef} src={WA_WEB} partition="aurora-wa" onUrl={setLiveUrl} />
        </div>
      </Screen>
    );
  }

  return (
    <LinkAppLaunch
      title="WhatsApp"
      url={WA_WEB}
      icon={<MessageCircle size={38} color="#fff" />}
      subtitle="Se abrió WhatsApp Web. Inicia sesión escaneando el código QR con tu teléfono."
      bg="linear-gradient(160deg, #25D366 0%, #128C7E 100%)"
      accent="#25D366"
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  nativeTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'linear-gradient(160deg, #25D366 0%, #128C7E 100%)',
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
  nativeTitle: { fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' },
  nativeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: 'none',
    background: 'rgba(255,255,255,0.18)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 8,
    padding: '6px 12px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  nativeBody: { flex: 1, minHeight: 0 },
};