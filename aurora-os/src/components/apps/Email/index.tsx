import { useState } from 'react';
import {
  Mail, Plus, ChevronLeft, Send, Star, RotateCw, Trash2, AtSign,
} from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { notificationService } from '../../../core/NotificationService';

interface Email {
  id: string;
  folder: 'inbox' | 'sent';
  from: string;
  to: string;
  subject: string;
  body: string;
  at: number;
  read: boolean;
  starred: boolean;
}

const INITIAL: Email[] = [
  {
    id: 'e0',
    folder: 'inbox',
    from: 'Equipo Aurora',
    to: 'tú',
    subject: '¡Bienvenido a Aurora OS!',
    body: 'Hola,\n\nEsta es tu bandeja de entrada. Todo lo que hagas aquí (leer, marcar estrellas, enviar) se guarda en tu dispositivo.\n\nPruébame: el botón + te deja redactar un correo y Responder contesta al remitente.\n\n— Aurora Team',
    at: Date.now() - 3600e3,
    read: false,
    starred: true,
  },
];

const DRAFT_BODY = 'Estimado/a,\n\n\nSaludos,';

export default function EmailApp() {
  const [mails, setMails] = usePersistedState<Email[]>('email:mails', INITIAL);
  const [view, setView] = useState<'inbox' | 'compose'>('inbox');
  const [openId, setOpenId] = useState<string | null>(null);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<Email | null>(null);

  const unread = mails.filter(m => m.folder === 'inbox' && !m.read).length;

  const sorted = [...mails]
    .filter(m => m.folder === 'inbox')
    .sort((a, b) => b.at - a.at);

  const open = (id: string) => {
    setOpenId(id);
    setMails(ms => ms.map(m => (m.id === id ? { ...m, read: true } : m)));
  };

  const toggleStar = (id: string) => {
    setMails(ms => ms.map(m => (m.id === id ? { ...m, starred: !m.starred } : m)));
  };

  const openCompose = (reply?: Email) => {
    setReplyTo(reply ?? null);
    setTo(reply ? reply.from : '');
    setSubject(reply ? `Re: ${reply.subject}` : '');
    setBody(reply ? DRAFT_BODY : '');
    setOpenId(null);
    setView('compose');
  };

  const send = () => {
    if (!to.trim() || !subject.trim()) return;
    const mail: Email = {
      id: `e_${Date.now()}`,
      folder: 'sent',
      from: 'tú',
      to: to.trim(),
      subject: subject.trim(),
      body: body.trim() || '(sin contenido)',
      at: Date.now(),
      read: true,
      starred: false,
    };
    setMails(ms => [mail, ...ms]);
    notificationService.push('email', 'Correo enviado', `Para: ${to}`);
    setView('inbox');
  };

  const remove = (id: string) => {
    setMails(ms => ms.filter(m => m.id !== id));
    setOpenId(null);
  };

  if (openId) {
    const mail = mails.find(m => m.id === openId);
    if (mail) {
      return (
        <div style={styles.container}>
          <div style={styles.msgHeader}>
            <button style={styles.iconBtn} onClick={() => setOpenId(null)} aria-label="Volver">
              <ChevronLeft size={22} color="#007AFF" />
            </button>
            <button style={styles.iconBtn} onClick={() => openCompose(mail)} aria-label="Responder">
              <RotateCw size={18} color="#007AFF" style={{ transform: 'scaleX(-1)' }} />
            </button>
            <button style={styles.iconBtn} onClick={() => remove(mail.id)} aria-label="Eliminar">
              <Trash2 size={18} color="#FF3B30" />
            </button>
          </div>
          <div style={styles.msgScroll}>
            <div style={styles.msgSubject}>{mail.subject}</div>
            <div style={styles.msgFrom}>De: <b>{mail.from}</b></div>
            <div style={styles.msgMeta}>
              {mail.to} · {new Date(mail.at).toLocaleString('es', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={styles.msgBody}>{mail.body}</div>
            <button style={styles.replyBtn} onClick={() => openCompose(mail)}>
              <RotateCw size={14} color="#fff" style={{ transform: 'scaleX(-1)' }} /> Responder
            </button>
          </div>
        </div>
      );
    }
  }

  if (view === 'compose') {
    return (
      <div style={styles.container}>
        <div style={styles.msgHeader}>
          <button style={styles.iconBtn} onClick={() => setView('inbox')} aria-label="Cancelar">
            <ChevronLeft size={22} color="#007AFF" />
          </button>
          <span style={styles.composeTitle}>{replyTo ? 'Responder' : 'Nuevo correo'}</span>
          <button style={styles.sendTop} onClick={send} disabled={!to.trim() || !subject.trim()}>
            <Send size={18} color={to.trim() && subject.trim() ? '#007AFF' : '#C7C7CC'} />
          </button>
        </div>
        <div style={styles.composeBody}>
          <div style={styles.fieldRow}>
            <span style={styles.fieldLabel}>Para</span>
            <input value={to} onChange={e => setTo(e.target.value)} placeholder="destinatario@correo.com" style={styles.fieldInput} />
          </div>
          <div style={styles.fieldRow}>
            <span style={styles.fieldLabel}>Asunto</span>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Asunto" style={styles.fieldInput} />
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Escribe tu mensaje…"
            style={styles.bodyArea}
            autoFocus
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Correo</span>
        <button style={styles.iconBtn} onClick={() => openCompose()} aria-label="Redactar">
          <Plus size={22} color="#007AFF" />
        </button>
      </div>

      <div style={styles.list}>
        {sorted.length === 0 ? (
          <div style={styles.empty}>
            <Mail size={42} color="#E5E5EA" />
            <div style={styles.emptyText}>Bandeja vacía.</div>
          </div>
        ) : (
          sorted.map(m => (
            <button key={m.id} style={styles.item} onClick={() => open(m.id)}>
              <div style={styles.avatar}>
                <AtSign size={14} color="#fff" />
              </div>
              <div style={styles.itemMain}>
                <div style={styles.itemTop}>
                  <span style={{ ...styles.itemFrom, fontWeight: m.read ? 500 : 700, color: m.read ? '#333' : '#111' }}>
                    {m.from}
                  </span>
                  <span style={styles.itemTime}>
                    {new Date(m.at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={styles.itemSubject}>
                  {!m.read && <span style={styles.unreadDot} />}
                  <span style={{ fontWeight: m.read ? 400 : 600, color: m.read ? '#8E8E93' : '#333' }}>
                    {m.subject}
                  </span>
                </div>
                <div style={styles.itemPreview}>{m.body.replace(/\n/g, ' ')}</div>
              </div>
              <button
                style={styles.starBtn}
                onClick={e => { e.stopPropagation(); toggleStar(m.id); }}
                aria-label="Marcar estrella"
              >
                <Star size={16} color={m.starred ? '#FFD700' : '#E5E5EA'} fill={m.starred ? '#FFD700' : '#E5E5EA'} />
              </button>
            </button>
          ))
        )}
      </div>

      {unread > 0 && (
        <div style={styles.unreadBar}>{unread} sin leer</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px 6px',
  },
  title: { fontSize: 22, fontWeight: 700, color: '#111' },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { flex: 1, overflowY: 'auto', paddingBottom: 20 },
  item: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    border: 'none',
    background: 'none',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '0.5px solid rgba(0,0,0,0.05)',
    textAlign: 'left' as const,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: '#007AFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  itemMain: { flex: 1, minWidth: 0 },
  itemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  itemFrom: { fontSize: 14 },
  itemTime: { fontSize: 11, color: '#8E8E93', flexShrink: 0 },
  itemSubject: { fontSize: 13, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    background: '#007AFF',
    flexShrink: 0,
  },
  itemPreview: {
    fontSize: 12,
    color: '#B0B0B5',
    marginTop: 3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  starBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 2,
    flexShrink: 0,
  },
  unreadBar: {
    textAlign: 'center' as const,
    fontSize: 12,
    color: '#007AFF',
    padding: '8px 0',
    background: 'rgba(0,122,255,0.06)',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: '40%',
  },
  emptyText: { color: '#C7C7CC', fontSize: 14 },
  msgHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderBottom: '0.5px solid rgba(0,0,0,0.08)',
  },
  msgScroll: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  msgSubject: { fontSize: 22, fontWeight: 700, color: '#111', lineHeight: 1.25 },
  msgFrom: { fontSize: 14, color: '#333', marginTop: 14 },
  msgMeta: { fontSize: 12, color: '#8E8E93', marginTop: 6 },
  msgBody: {
    fontSize: 15,
    lineHeight: 1.6,
    color: '#333',
    marginTop: 18,
    whiteSpace: 'pre-wrap',
  },
  replyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    padding: '10px 18px',
    borderRadius: 20,
    border: 'none',
    background: '#007AFF',
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
  },
  composeTitle: { fontSize: 15, fontWeight: 600, color: '#111' },
  sendTop: {
    width: 34,
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeBody: { flex: 1, display: 'flex', flexDirection: 'column' },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderBottom: '0.5px solid rgba(0,0,0,0.06)',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#8E8E93',
    width: 52,
    flexShrink: 0,
    fontWeight: 600,
  },
  fieldInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 14,
    color: '#111',
    background: 'none',
  },
  bodyArea: {
    flex: 1,
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontSize: 15,
    lineHeight: 1.6,
    color: '#333',
    padding: '16px',
    background: 'none',
  },
};