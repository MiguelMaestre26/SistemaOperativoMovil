import { useState } from 'react';
import {
  Mail, Plus, Send, Star, RotateCw, Trash2, AtSign,
} from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { notificationService } from '../../../core/NotificationService';
import {
  Screen, AppHeader, ListGroup, ListRow, IconButton, Badge, EmptyState, Button,
} from '../../ui';

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
        <Screen scroll={false} padding="0">
          <AppHeader
            variant="standard"
            title=""
            onBack={() => setOpenId(null)}
            backLabel=""
            right={
              <div style={{ display: 'flex', gap: 4 }}>
                <IconButton label="Responder" onClick={() => openCompose(mail)}>
                  <RotateCw size={17} color="var(--accent)" style={{ transform: 'scaleX(-1)' }} />
                </IconButton>
                <IconButton label="Eliminar" bg="rgba(255,59,48,0.12)" onClick={() => remove(mail.id)}>
                  <Trash2 size={17} color="var(--danger)" />
                </IconButton>
              </div>
            }
          />
          <div style={styles.msgScroll}>
            <div className="typo-title2" style={styles.msgSubject}>{mail.subject}</div>
            <div style={styles.msgFrom}>De: <b>{mail.from}</b></div>
            <div style={styles.msgMeta}>
              {mail.to} · {new Date(mail.at).toLocaleString('es', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={styles.msgBody}>{mail.body}</div>
            <Button
              variant="primary"
              size="sm"
              style={{ alignSelf: 'flex-start', borderRadius: 20, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}
              onClick={() => openCompose(mail)}
            >
              <RotateCw size={14} color="#fff" style={{ transform: 'scaleX(-1)' }} /> Responder
            </Button>
          </div>
        </Screen>
      );
    }
  }

  if (view === 'compose') {
    return (
      <Screen scroll={false} padding="0">
        <AppHeader
          variant="standard"
          title={replyTo ? 'Responder' : 'Nuevo correo'}
          onBack={() => setView('inbox')}
          backLabel=""
          right={
            <IconButton
              label="Enviar"
              color={to.trim() && subject.trim() ? 'var(--accent)' : 'var(--text-tertiary)'}
              onClick={send}
            >
              <Send size={18} color={to.trim() && subject.trim() ? 'var(--accent)' : 'var(--text-tertiary)'} />
            </IconButton>
          }
        />
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
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader
        title="Correo"
        right={
          <IconButton label="Redactar" bg="var(--accent)" onClick={() => openCompose()}>
            <Plus size={20} color="#fff" />
          </IconButton>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Mail size={28} color="var(--text-secondary)" />}
          title="Bandeja vacía."
        />
      ) : (
        <ListGroup>
          {sorted.map((m, i) => (
            <ListRow
              key={m.id}
              showSeparator={i < sorted.length - 1}
              icon={<AtSign size={14} color="#fff" />}
              iconBg={m.read ? 'var(--bg-tertiary)' : 'var(--accent)'}
              label={m.from}
              sublabel={m.subject}
              onClick={() => open(m.id)}
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!m.read && <Badge dot color="var(--accent)" />}
                  <span style={styles.itemTime}>
                    {new Date(m.at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    className="pressable"
                    style={styles.starBtn}
                    onClick={e => { e.stopPropagation(); toggleStar(m.id); }}
                    aria-label="Marcar estrella"
                  >
                    <Star size={15} color={m.starred ? '#FFD700' : 'var(--text-tertiary)'} fill={m.starred ? '#FFD700' : 'none'} />
                  </button>
                </div>
              }
            />
          ))}
        </ListGroup>
      )}

      {unread > 0 && (
        <div style={styles.unreadBar}>{unread} sin leer</div>
      )}
    </Screen>
  );
}

const styles: Record<string, React.CSSProperties> = {
  itemTime: { fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 },
  starBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 2,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBar: {
    textAlign: 'center' as const,
    fontSize: 12,
    color: 'var(--accent)',
    padding: '8px 0',
    background: 'rgba(0,122,255,0.06)',
  },
  msgScroll: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  msgSubject: { color: 'var(--text-primary)', lineHeight: 1.25 },
  msgFrom: { fontSize: 14, color: 'var(--text-primary)', marginTop: 14, userSelect: 'text' as const },
  msgMeta: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, userSelect: 'text' as const },
  msgBody: {
    fontSize: 15,
    lineHeight: 1.6,
    color: 'var(--text-primary)',
    marginTop: 18,
    whiteSpace: 'pre-wrap' as const,
    userSelect: 'text' as const,
  },
  composeBody: { flex: 1, display: 'flex', flexDirection: 'column' },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderBottom: '0.5px solid var(--separator-cell)',
  },
  fieldLabel: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    width: 52,
    flexShrink: 0,
    fontWeight: 600,
  },
  fieldInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 14,
    color: 'var(--text-primary)',
    background: 'none',
    userSelect: 'text' as const,
  },
  bodyArea: {
    flex: 1,
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontSize: 15,
    lineHeight: 1.6,
    color: 'var(--text-primary)',
    padding: '16px',
    background: 'none',
    userSelect: 'text' as const,
  },
};