import { useState, useEffect, useRef } from 'react';
import { MessageSquare, MessageCircle, Send, Plus, ChevronLeft, Phone as PhoneIcon } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { notificationService } from '../../../core/NotificationService';
import { openExternal, waLink, tgChat, TG_WEB, launchMessenger } from '../../../core/webapp';
import { isNative } from '../../../core/native';

interface Msg {
  id: string;
  from: 'me' | 'them';
  text: string;
  at: number;
}

interface Conversation {
  id: string;
  name: string;
  number?: string;
  messages: Msg[];
  unread: number;
}

type Service = 'aurora' | 'whatsapp' | 'telegram';

const SERVICE_META: Record<Service, { label: string; icon: typeof Send; color: string }> = {
  aurora: { label: 'Aurora', icon: MessageSquare, color: '#007AFF' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  telegram: { label: 'Telegram', icon: Send, color: '#0088CC' },
};

const REPLIES = [
  '¡Claro! Perfecto.',
  'Mmm, déjame pensarlo y te confirmo.',
  'Eso suena bien 😄',
  '¿Puedes explicarme un poco más?',
  'Voy llegando, en 10 min.',
  '¡Genial, gracias por avisarme!',
  'Jaja totalmente.',
  'Sí, yo lo vi. Increíble, ¿no?',
  'Te escribo más tarde, ando ocupado.',
  'Ok, me parece bien.',
];

export default function Messages() {
  const [convs, setConvs] = usePersistedState<Conversation[]>('messages:conversations', []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [service, setService] = useState<Service>('aurora');
  const [callMenu, setCallMenu] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const repliesRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => repliesRef.current.forEach(t => clearTimeout(t));
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [openId, convs, typing]);

  const open = convs.find(c => c.id === openId) ?? null;

  const sorted = [...convs].sort(
    (a, b) => (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0),
  );

  const markRead = (id: string) => {
    setConvs(cs => cs.map(c => (c.id === id && c.unread > 0 ? { ...c, unread: 0 } : c)));
  };

  const newChat = () => {
    const name = window.prompt('Nombre del contacto:');
    if (!name?.trim()) return;
    const number = window.prompt('Número (opcional, para WhatsApp/Telegram):');
    const id = `c_${Date.now()}`;
    setConvs(cs => [{ id, name: name.trim(), number: number?.trim() || undefined, messages: [], unread: 0 }, ...cs]);
    setOpenId(id);
    setService('aurora');
  };

  const send = () => {
    const text = draft.trim();
    if (!text || !open) return;

    if (service !== 'aurora') {
      if (isNative()) {
        navigator.clipboard.writeText(text).catch(() => {});
        if (service === 'whatsapp') {
          if (!open.number) {
            notificationService.push('messages', open.name, 'Este contacto no tiene número. Agrega uno para usar WhatsApp.');
            return;
          }
          launchMessenger('whatsapp');
          notificationService.push('whatsapp', 'WhatsApp', `Mensaje copiado. Pégalo en el chat de ${open.name} en WhatsApp.`);
        } else {
          launchMessenger('telegram');
          notificationService.push('telegram', 'Telegram', `Mensaje copiado. Pégalo en el chat de ${open.name} en Telegram.`);
        }
        setDraft('');
        return;
      }
      if (service === 'whatsapp') {
        if (!open.number) {
          notificationService.push('messages', open.name, 'Este contacto no tiene número. Agrega uno para enviar por WhatsApp.');
          return;
        }
        openExternal(waLink(open.number, text));
        notificationService.push('whatsapp', 'WhatsApp', `Abro WhatsApp para enviar el mensaje a ${open.name}.`);
      } else {
        if (open.number) openExternal(tgChat(open.number));
        else openExternal(TG_WEB);
        notificationService.push('telegram', 'Telegram', `Abro Telegram para enviar el mensaje a ${open.name}.`);
      }
      setDraft('');
      return;
    }

    const msg: Msg = { id: `m_${Date.now()}`, from: 'me', text, at: Date.now() };
    setConvs(cs => cs.map(c => (c.id === open.id ? { ...c, messages: [...c.messages, msg] } : c)));
    setDraft('');
    setTyping(true);
    const replyText = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    const delay = 900 + Math.random() * 1400;
    const t = setTimeout(() => {
      const reply: Msg = { id: `m_${Date.now()}_r`, from: 'them', text: replyText, at: Date.now() };
      setConvs(cs =>
        cs.map(c =>
          c.id === open.id
            ? { ...c, messages: [...c.messages, reply], unread: c.id === openId ? 0 : c.unread + 1 }
            : c,
        ),
      );
      setTyping(false);
      notificationService.push('messages', open.name, replyText);
    }, delay);
    repliesRef.current.push(t);
  };

  const call = () => {
    if (!open) return;
    notificationService.push('phone', 'Llamada', `Llamando a ${open.name}…`);
  };

  const callByService = (svc: Service) => {
    setCallMenu(false);
    if (svc === 'aurora') return call();
    if (!open) return;
    if (isNative()) {
      launchMessenger(svc);
      notificationService.push(svc, svc === 'telegram' ? 'Telegram' : 'WhatsApp', `Abro ${svc === 'telegram' ? 'Telegram' : 'WhatsApp'} con ${open.name}. Pulsa el icono de llamada de tu sesión.`);
    } else if (svc === 'telegram') {
      openExternal(tgChat(open.number || ''));
      notificationService.push('telegram', 'Telegram', `Abro Telegram con ${open.name}. Pulsa el icono de llamada en tu sesión web.`);
    } else {
      openExternal(waLink(open.number || ''));
      notificationService.push('whatsapp', 'WhatsApp', `Abro WhatsApp con ${open.name}. Pulsa el icono de llamada en tu sesión web.`);
    }
  };

  if (!open) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>Mensajes</span>
          <button style={styles.addBtn} onClick={newChat} aria-label="Nuevo mensaje">
            <Plus size={18} color="#fff" />
          </button>
        </div>
        <div style={styles.quickBar}>
          <span style={styles.quickLabel}>Continuar en</span>
          <button style={{ ...styles.quickBtn, background: '#25D366' }} onClick={() => launchMessenger('whatsapp')}>
            <MessageCircle size={14} color="#fff" /> WhatsApp
          </button>
          <button style={{ ...styles.quickBtn, background: '#0088CC' }} onClick={() => launchMessenger('telegram')}>
            <Send size={14} color="#fff" /> Telegram
          </button>
        </div>
        <div style={styles.list}>
          {sorted.length === 0 ? (
            <div style={styles.empty}>
              <MessageSquare size={42} color="#E5E5EA" />
              <div style={styles.emptyText}>Sin conversaciones.<br />Toca + para escribirle a alguien.</div>
            </div>
          ) : (
            sorted.map(c => {
              const last = c.messages.at(-1);
              const partner = c.name;
              return (
                <button
                  key={c.id}
                  style={styles.item}
                  onClick={() => { setOpenId(c.id); markRead(c.id); setService('aurora'); }}
                >
                  <div style={styles.avatar}>
                    {partner.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.itemMain}>
                    <div style={styles.itemTop}>
                      <span style={styles.itemName}>{partner}</span>
                    </div>
                    <div style={styles.itemPreview}>
                      {last ? `${last.from === 'me' ? 'Tú: ' : ''}${last.text}` : 'Nuevo contacto'}
                    </div>
                  </div>
                  {c.unread > 0 && (
                    <span style={styles.badge}>{c.unread}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.chatHeader}>
        <button style={styles.iconBtn} onClick={() => setOpenId(null)} aria-label="Volver">
          <ChevronLeft size={22} color="#007AFF" />
        </button>
        <div style={styles.chatHeaderMain}>
          <div style={styles.chatName}>{open.name}</div>
          <div style={styles.chatStatus}>{typing ? 'escribiendo…' : 'en línea'}</div>
        </div>
        <button style={styles.iconBtn} onClick={() => setCallMenu(m => !m)} aria-label="Opciones de llamada">
          <PhoneIcon size={18} color="#007AFF" />
        </button>
        {callMenu && (
          <div style={styles.callMenu}>
            <button style={styles.callMenuItem} onClick={() => callByService('aurora')}>
              <PhoneIcon size={15} color="#007AFF" /> Llamar (Aurora)
            </button>
            <button style={styles.callMenuItem} onClick={() => callByService('whatsapp')}>
              <MessageCircle size={15} color="#25D366" /> Llamar por WhatsApp
            </button>
            <button style={styles.callMenuItem} onClick={() => callByService('telegram')}>
              <Send size={15} color="#0088CC" /> Llamar por Telegram
            </button>
          </div>
        )}
      </div>

      <div ref={listRef} style={styles.chatBody}>
        {open.messages.map(m => (
          <div key={m.id} style={{
            ...styles.bubble,
            alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
            background: m.from === 'me' ? '#007AFF' : '#E9E9EB',
          }}>
            <div style={{ ...styles.bubbleText, color: m.from === 'me' ? '#fff' : '#111' }}>
              {m.text}
            </div>
            <div style={{ ...styles.bubbleTime, color: m.from === 'me' ? 'rgba(255,255,255,0.7)' : '#8E8E93' }}>
              {new Date(m.at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ ...styles.bubble, alignSelf: 'flex-start', background: '#E9E9EB' }}>
            <div style={styles.typingDots}>
              <span style={styles.dot} /><span style={{ ...styles.dot, animationDelay: '0.15s' }} /><span style={{ ...styles.dot, animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
      </div>

      <div style={styles.serviceBar}>
        {(Object.keys(SERVICE_META) as Service[]).map(s => {
          const meta = SERVICE_META[s];
          const Icon = meta.icon;
          const active = service === s;
          return (
            <button
              key={s}
              style={{ ...styles.serviceChip, ...(active ? { background: meta.color, color: '#fff' } : {}) }}
              onClick={() => setService(s)}
            >
              <Icon size={13} color={active ? '#fff' : meta.color} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      <div style={styles.inputBar}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder="Mensaje…"
          style={styles.input}
        />
        <button style={styles.sendBtn} onClick={send} disabled={!draft.trim()} aria-label="Enviar">
          <Send size={18} color={draft.trim() ? '#fff' : '#B0B0B5'} />
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px 8px',
  },
  title: { fontSize: 22, fontWeight: 700, color: '#111' },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    border: 'none',
    background: '#007AFF',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px 10px',
  },
  quickLabel: { fontSize: 12, color: '#8E8E93', marginRight: 2 },
  quickBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    border: 'none',
    color: '#fff',
    borderRadius: 14,
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
  list: { flex: 1, overflowY: 'auto', padding: '0 0 20px' },
  item: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    border: 'none',
    background: 'none',
    padding: '10px 16px',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    background: 'linear-gradient(135deg, #34C759, #30B0C7)',
    color: '#fff',
    fontSize: 18,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemMain: { flex: 1, minWidth: 0 },
  itemTop: { display: 'flex', alignItems: 'center', gap: 6 },
  itemName: { fontSize: 15, fontWeight: 600, color: '#111' },
  itemPreview: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    background: '#FF3B30',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: '40%',
  },
  emptyText: { color: '#C7C7CC', fontSize: 14, textAlign: 'center' as const, lineHeight: 1.5 },
  chatHeader: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    padding: '8px 10px',
    gap: 4,
    borderBottom: '0.5px solid rgba(0,0,0,0.08)',
  },
  callMenu: {
    position: 'absolute' as const,
    right: 8,
    top: 40,
    width: 190,
    zIndex: 40,
    background: '#fff',
    borderRadius: 12,
    border: '0.5px solid rgba(0,0,0,0.1)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    padding: 6,
  },
  callMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '9px 10px',
    border: 'none',
    background: 'transparent',
    borderRadius: 8,
    fontSize: 13,
    color: '#111',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderMain: { flex: 1, minWidth: 0 },
  chatName: { fontSize: 15, fontWeight: 600, color: '#111', textAlign: 'center' as const },
  chatStatus: { fontSize: 11, color: '#30B0C7', textAlign: 'center' as const },
  chatBody: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '14px 12px',
    background: '#F7F7F9',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    padding: '8px 12px',
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 1.35 },
  bubbleTime: { fontSize: 10, marginTop: 3, textAlign: 'right' as const },
  typingDots: { display: 'flex', gap: 4, padding: '4px 2px' },
  serviceBar: {
    display: 'flex',
    gap: 8,
    padding: '8px 12px 0',
    justifyContent: 'center',
  },
  serviceChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    borderRadius: 14,
    border: '1px solid rgba(0,0,0,0.08)',
    background: '#F2F2F7',
    color: '#111',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#8E8E93',
    animation: 'blink 1.2s infinite',
  },
  inputBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    borderTop: '0.5px solid rgba(0,0,0,0.08)',
    background: '#fff',
  },
  input: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    border: 'none',
    background: '#F2F2F7',
    padding: '0 14px',
    fontSize: 14,
    outline: 'none',
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: '#007AFF',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};