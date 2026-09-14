import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, MessageCircle, Send, Plus,
  Phone as PhoneIcon, Bell,
} from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { notificationService } from '../../../core/NotificationService';
import { openExternal, waLink, tgChat, TG_WEB, launchMessenger } from '../../../core/webapp';
import { isNative } from '../../../core/native';
import {
  Screen, AppHeader, ListGroup, ListRow, Avatar, Badge, EmptyState, Sheet, IconButton,
  openPrompt,
} from '../../ui';

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
  aurora: { label: 'Aurora', icon: MessageSquare, color: 'var(--primary)' },
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
  const [callOpen, setCallOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const repliesRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const ref = repliesRef;
    return () => ref.current.forEach(t => clearTimeout(t));
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

  const newChat = async () => {
    const name = await openPrompt({ title: 'Nuevo mensaje', placeholder: 'Nombre del contacto' });
    if (!name?.trim()) return;
    const number = await openPrompt({
      title: 'Nuevo mensaje',
      message: 'Número (opcional, para WhatsApp/Telegram)',
      placeholder: '8888-0000',
    });
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

    // eslint-disable-next-line react/purity
    const msg: Msg = { id: `m_${Date.now()}`, from: 'me', text, at: Date.now() };
    setConvs(cs => cs.map(c => (c.id === open.id ? { ...c, messages: [...c.messages, msg] } : c)));
    setDraft('');
    setTyping(true);
    // eslint-disable-next-line react/purity
    const replyText = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    // eslint-disable-next-line react/purity
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
    setCallOpen(false);
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
      <Screen scroll={false} padding="0">
        <AppHeader
          title="Mensajes"
          right={
            <IconButton label="Nuevo mensaje" bg="var(--accent)" onClick={newChat}>
              <Plus size={20} color="#fff" />
            </IconButton>
          }
        />

        <div style={styles.quickBar}>
          <span style={styles.quickLabel}>Continuar en</span>
          <button className="pressable" style={{ ...styles.quickBtn, background: '#25D366' }} onClick={() => launchMessenger('whatsapp')}>
            <MessageCircle size={14} color="#fff" /> WhatsApp
          </button>
          <button className="pressable" style={{ ...styles.quickBtn, background: '#0088CC' }} onClick={() => launchMessenger('telegram')}>
            <Send size={14} color="#fff" /> Telegram
          </button>
        </div>

        <div style={styles.list}>
          {sorted.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={28} color="var(--text-secondary)" />}
              title="Sin conversaciones"
              subtitle="Toca + para escribirle a alguien."
            />
          ) : (
            <ListGroup>
              {sorted.map((c, i) => {
                const last = c.messages.at(-1);
                return (
                  <ListRow
                    key={c.id}
                    showSeparator={i < sorted.length - 1}
                    icon={<Avatar name={c.name} size={34} style={{ borderRadius: 10 }} />}
                    label={c.name}
                    sublabel={last ? `${last.from === 'me' ? 'Tú: ' : ''}${last.text}` : 'Nuevo contacto'}
                    onClick={() => { setOpenId(c.id); markRead(c.id); setService('aurora'); }}
                    value={c.unread > 0 ? <Badge count={c.unread} /> : undefined}
                  />
                );
              })}
            </ListGroup>
          )}
        </div>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padding="0">
      <AppHeader
        variant="standard"
        title={open.name}
        onBack={() => setOpenId(null)}
        backLabel=""
        right={
          <IconButton label="Llamar" onClick={() => setCallOpen(true)}>
            <PhoneIcon size={18} color="var(--accent)" />
          </IconButton>
        }
      />

      <div ref={listRef} style={styles.chatBody}>
        {open.messages.map(m => (
          <div
            key={m.id}
            style={{
              ...styles.bubble,
              alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start',
              background: m.from === 'me' ? 'var(--accent)' : 'var(--bg-tertiary)',
              borderBottomRightRadius: m.from === 'me' ? 4 : 18,
              borderBottomLeftRadius: m.from === 'me' ? 18 : 4,
            }}
          >
            <div style={{ ...styles.bubbleText, color: m.from === 'me' ? '#fff' : 'var(--text-primary)' }}>
              {m.text}
            </div>
            <div
              style={{
                ...styles.bubbleTime,
                color: m.from === 'me' ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)',
              }}
            >
              {new Date(m.at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ ...styles.bubble, alignSelf: 'flex-start', background: 'var(--bg-tertiary)', borderBottomLeftRadius: 4 }}>
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
              className="pressable"
              style={{
                ...styles.serviceChip,
                ...(active ? { background: meta.color, color: '#fff', borderColor: meta.color } : {}),
              }}
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
        <button className="pressable" style={styles.sendBtn} onClick={send} disabled={!draft.trim()} aria-label="Enviar">
          <Send size={18} color={draft.trim() ? '#fff' : 'rgba(255,255,255,0.5)'} />
        </button>
      </div>

      <Sheet open={callOpen} onClose={() => setCallOpen(false)} title={`Llamar a ${open.name}`}>
        <div style={styles.sheetBody}>
          <button className="pressable" style={styles.sheetAction} onClick={() => callByService('aurora')}>
            <PhoneIcon size={18} color="var(--primary)" /> Llamar (Aurora)
          </button>
          <button className="pressable" style={styles.sheetAction} onClick={() => callByService('whatsapp')}>
            <MessageCircle size={18} color="#25D366" /> Llamar por WhatsApp
          </button>
          <button className="pressable" style={styles.sheetAction} onClick={() => callByService('telegram')}>
            <Send size={18} color="#0088CC" /> Llamar por Telegram
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={styles.sheetHint}><Bell size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Se abrirá el mensajero de tu preferencia</span>
        </div>
      </Sheet>
    </Screen>
  );
}

const styles: Record<string, React.CSSProperties> = {
  quickBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px 12px',
  },
  quickLabel: { fontSize: 12, color: 'var(--text-secondary)', marginRight: 2 },
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
    boxShadow: 'var(--shadow-sm)',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 0 20px',
    display: 'flex',
    flexDirection: 'column',
  },
  chatBody: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '14px 12px',
    background: 'var(--bg-secondary)',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    padding: '8px 12px',
  },
  bubbleText: { fontSize: 14, lineHeight: 1.35 },
  bubbleTime: { fontSize: 10, marginTop: 3, textAlign: 'right' as const },
  typingDots: { display: 'flex', gap: 4, padding: '4px 2px' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: 'var(--text-secondary)',
    animation: 'blink 1.2s infinite',
  },
  serviceBar: {
    display: 'flex',
    gap: 8,
    padding: '10px 12px 0',
    justifyContent: 'center',
    background: 'var(--bg-secondary)',
  },
  serviceChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    borderRadius: 14,
    border: '1px solid var(--separator-cell)',
    background: 'var(--surface-input)',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  inputBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px 14px',
    borderTop: '0.5px solid var(--separator-cell)',
    background: 'var(--bg-secondary)',
  },
  input: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    border: 'none',
    background: 'var(--surface-input)',
    padding: '0 14px',
    fontSize: 14,
    outline: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    userSelect: 'text' as const,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: 'var(--accent)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: { display: 'flex', flexDirection: 'column', gap: 8 },
  sheetAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 12,
    border: 'none',
    background: 'var(--bg-tertiary)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
    textAlign: 'left' as const,
  },
  sheetHint: { fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 },
};