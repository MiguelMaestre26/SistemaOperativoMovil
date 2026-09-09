import { useState } from 'react';
import { MessageCircle, ExternalLink, ShieldCheck, RotateCcw } from 'lucide-react';
import { openExternal, WA_WEB, waLink } from '../../../core/webapp';
import { notificationService } from '../../../core/NotificationService';
import { isNative } from '../../../core/native';
import { openInOs } from '../../../core/browserSession';
import { toggleOrientation } from '../../../core/orientation';
import RealWebView from '../../shared/RealWebView';

export default function WhatsAppApp() {
  const native = isNative();
  const [liveUrl, setLiveUrl] = useState(WA_WEB);

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
      <div style={styles.container}>
        <div style={styles.nativeTop}>
          <div style={styles.nativeBrand}>
            <ShieldCheck size={13} color={official ? '#4CD964' : '#FF6B6B'} />
            <span style={styles.nativeTitle}>WhatsApp</span>
          </div>
          <span
            style={{ ...styles.nativeUrlText, color: official ? '#E8FFF0' : '#FFD9D9' }}
            title={liveUrl}
          >
            {host || '…'}
          </span>
          <button
            style={styles.nativeBtn}
            onClick={toggleOrientation}
            title="Rotar pantalla (horizontal/vertical)"
            aria-label="Rotar pantalla"
          >
            <RotateCcw size={13} color="#fff" />
          </button>
          <button
            style={styles.nativeBtn}
            onClick={() => {
              const n = window.prompt('Número de la persona (ej. 50688880001):');
              if (n?.trim()) openInOs(waLink(n.trim()));
            }}
          >
            Chatear por número
          </button>
        </div>
        <div style={styles.nativeBody}>
          <RealWebView src={WA_WEB} partition="aurora-wa" onUrl={setLiveUrl} />
        </div>
      </div>
    );
  }

  const open = (url: string, msg: string) => {
    openExternal(url);
    notificationService.push('whatsapp', 'WhatsApp Web', msg);
  };

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.badge}>
          <MessageCircle size={38} color="#fff" />
        </div>
        <div style={styles.title}>WhatsApp</div>
        <div style={styles.subtitle}>Chats y llamadas reales<br />con tu cuenta de verdad.</div>
      </div>

      <div style={styles.body}>
        <div style={styles.infoCard}>
          <div style={styles.infoText}>
            Este teléfono se conecta a <b>WhatsApp Web</b>, la versión oficial para navegador.
            Se abrirá en una pestaña nueva con un código QR: escanéalo con tu teléfono y tendrás tus
            chats y llamadas de audio/vídeo reales.
          </div>
        </div>

        <button style={styles.mainBtn} onClick={() => open(WA_WEB, 'Te abrí WhatsApp Web. Escanea el QR con tu teléfono.')}>
          <ExternalLink size={18} color="#fff" />
          <span>Abrir WhatsApp Web</span>
        </button>

        <button style={styles.chatBtn} onClick={() => {
          const n = window.prompt('Número de la persona (ej. 50688880001):');
          if (n?.trim()) open(waLink(n.trim()), 'WhatsApp abierto. Se creó el chat con ese número.');
        }}>
          <span>Chatear por número</span>
        </button>

        <div style={styles.hint}>La llamada se realiza dentro de tu sesión de WhatsApp (botón de llamada en el chat).</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-primary)',
  },
  nativeTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'linear-gradient(160deg, #25D366 0%, #128C7E 100%)',
    flexShrink: 0,
  },
  nativeBrand: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  nativeTitle: { fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' },
  nativeUrlText: {
    flex: 1,
    minWidth: 0,
    textAlign: 'left',
    fontFamily: 'Consolas, Menlo, monospace',
    fontSize: 11,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: 'inherit',
  },
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
  hero: {
    background: 'linear-gradient(160deg, #25D366 0%, #128C7E 100%)',
    padding: '40px 20px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    textAlign: 'center' as const,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    background: 'rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: 700, color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 },
  body: { flex: 1, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' },
  infoCard: {
    background: 'rgba(37,211,102,0.10)',
    borderRadius: 14,
    padding: '14px 16px',
  },
  infoText: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 },
  mainBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    border: 'none',
    background: '#25D366',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 4px 18px rgba(37,211,102,0.35)',
  },
  chatBtn: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    border: '1px solid rgba(37,211,102,0.4)',
    background: 'transparent',
    color: '#128C7E',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  hint: { fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' as const, marginTop: 4 },
};