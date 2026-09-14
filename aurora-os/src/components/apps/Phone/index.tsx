import { useState, useEffect, useRef } from 'react';
import {
  Star, Clock as ClockIcon, Users, Keyboard, Phone as PhoneIcon,
  Mic, MicOff, Delete, Plus, User as UserIcon,
  Send, MessageCircle,
} from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { notificationService } from '../../../core/NotificationService';
import { openExternal, waLink, tgChat, launchMessenger } from '../../../core/webapp';
import { isNative } from '../../../core/native';
import {
  Screen, AppHeader, ListGroup, ListRow, TabBar, IconButton, EmptyState, Sheet,
  openPrompt,
} from '../../ui';
import type { TabItem } from '../../ui/TabBar';

interface Contact {
  id: string;
  name: string;
  number: string;
  isFavorite: boolean;
}

interface CallEntry {
  id: string;
  name: string | null;
  number: string;
  at: number;
  type: 'out' | 'in' | 'missed';
  duration: number;
}

const TABS: TabItem[] = [
  { id: 'fav', label: 'Favoritos', icon: Star },
  { id: 'rec', label: 'Recientes', icon: ClockIcon },
  { id: 'con', label: 'Contactos', icon: Users },
  { id: 'key', label: 'Teclado', icon: Keyboard },
];

const INITIAL_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Mamá', number: '8888-0001', isFavorite: true },
  { id: 'c2', name: 'Papá', number: '8888-0002', isFavorite: true },
  { id: 'c3', name: 'Ana', number: '8888-0003', isFavorite: false },
  { id: 'c4', name: 'Luis Cervantes', number: '8888-0004', isFavorite: false },
  { id: 'c5', name: 'Pizzería Don Pepe', number: '2277-5566', isFavorite: false },
];

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function PhoneApp() {
  const [tab, setTab] = useState('fav');
  const [contacts, setContacts] = usePersistedState<Contact[]>('phone:contacts', INITIAL_CONTACTS);
  const [log, setLog] = usePersistedState<CallEntry[]>('phone:log', []);
  const [dial, setDial] = useState('');
  const [call, setCall] = useState<{ contact: Contact | null; number: string; incoming: boolean } | null>(null);
  const [callSec, setCallSec] = useState(0);
  const [muted, setMuted] = useState(false);
  const [sheet, setSheet] = useState<Contact | null>(null);
  const callTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const incomingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = (number: string, name: string | null, type: CallEntry['type'], duration = 0) => {
    const entry: CallEntry = { id: `cl_${Date.now()}`, name, number, at: Date.now(), type, duration };
    setLog(l => [entry, ...l].slice(0, 50));
  };

  const findContact = (number: string): Contact | null =>
    contacts.find(c => c.number === number) ?? null;

  const startCall = (number: string, incoming = false) => {
    const cleaned = number.replace(/[^\d]/g, '');
    if (!cleaned) return;
    setDial('');
    setCall({ contact: findContact(number), number: cleaned, incoming });
    setCallSec(0);
    setMuted(false);
    if (callTimer.current) clearInterval(callTimer.current);
    callTimer.current = setInterval(() => setCallSec(s => s + 1), 1000);
    if (!incoming) {
      addLog(cleaned, findContact(number)?.name ?? null, 'out');
      notificationService.push('phone', 'Llamada', `Llamando a ${findContact(number)?.name ?? number}…`);
    }
  };

  const answer = () => {
    setCall(c => (c ? { ...c, incoming: false } : c));
    addLog(call!.number, call!.contact?.name ?? null, 'in');
  };

  const endCall = () => {
    if (callTimer.current) clearInterval(callTimer.current);
    callTimer.current = null;
    if (call && call.incoming) {
      addLog(call.number, call.contact?.name ?? null, 'missed');
      notificationService.push('phone', 'Llamada perdida', `${call.contact?.name ?? call.number} te llamó`);
    }
    setCall(null);
  };

  const callBy = (service: 'aurora' | 'telegram' | 'whatsapp') => {
    if (!sheet) return;
    if (service === 'aurora') {
      setSheet(null);
      startCall(sheet.number);
      return;
    }
    openMessengerCall(sheet, service);
    setSheet(null);
  };

  const openMessengerCall = (contact: Contact, service: 'telegram' | 'whatsapp') => {
    if (isNative()) {
      launchMessenger(service);
      notificationService.push(
        service,
        service === 'telegram' ? 'Telegram' : 'WhatsApp',
        `Abro ${service === 'telegram' ? 'Telegram' : 'WhatsApp'} con ${contact.name}. Pulsa el icono de llamada de tu sesión.`,
      );
    } else if (service === 'telegram') {
      openExternal(tgChat(contact.number));
      notificationService.push('telegram', 'Telegram', `Abro Telegram con ${contact.name}. Pulsa el icono de llamada en tu sesión web.`);
    } else {
      openExternal(waLink(contact.number));
      notificationService.push('whatsapp', 'WhatsApp', `Abro WhatsApp con ${contact.name}. Pulsa el icono de llamada en tu sesión web.`);
    }
  };

  const scheduleIncoming = () => {
    incomingTimer.current = setTimeout(() => {
      const candidates = contacts.length ? contacts : [{ id: 'x', name: 'Número desconocido', number: '0000-0000', isFavorite: false }];
      const who = candidates[Math.floor(Math.random() * candidates.length)];
      startCall(who.number, true);
      scheduleIncoming();
    }, 90000);
  };

  useEffect(() => {
    scheduleIncoming();
    return () => {
      if (incomingTimer.current) clearTimeout(incomingTimer.current);
      if (callTimer.current) clearInterval(callTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addContact = async () => {
    const name = await openPrompt({ title: 'Nuevo contacto', placeholder: 'Nombre' });
    if (!name?.trim()) return;
    const number = await openPrompt({
      title: 'Nuevo contacto',
      message: 'Número (ej. 8888-0000)',
      placeholder: '8888-0000',
    });
    if (!number?.trim()) return;
    setContacts(cs => [...cs, { id: `c_${Date.now()}`, name: name.trim(), number: number.trim(), isFavorite: false }]);
  };

  const toggleFav = (id: string) => {
    setContacts(cs => cs.map(c => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c)));
  };

  const press = (d: string) => setDial(p => (p + d).slice(0, 12));

  const contactsSorted = [...contacts].sort((a, b) => a.name.localeCompare(b.name));
  const faves = contacts.filter(c => c.isFavorite);

  if (call) {
    const name = call.contact?.name ?? call.number;
    return (
      <div style={styles.callScreen}>
        <div style={styles.callAvatar}>{name.charAt(0).toUpperCase()}</div>
        <div style={styles.callName}>{name}</div>
        <div style={styles.callStatus}>
          {call.incoming ? 'Llamada entrante…' : fmtDuration(callSec)}
        </div>

        {call.incoming ? (
          <div style={styles.incomingRow}>
            <button className="pressable" style={{ ...styles.incomingBtn, background: '#FF3B30' }} onClick={endCall}>
              <PhoneIcon size={28} color="#fff" style={{ transform: 'rotate(135deg)' }} />
            </button>
            <button className="pressable" style={{ ...styles.incomingBtn, background: 'var(--success)' }} onClick={answer}>
              <PhoneIcon size={28} color="#fff" />
            </button>
          </div>
        ) : (
          <div style={styles.callRow}>
            <button className="pressable" style={styles.callBtn} onClick={() => setMuted(m => !m)}>
              {muted ? <MicOff size={24} color="#fff" /> : <Mic size={24} color="#fff" />}
              <span style={styles.callBtnLabel}>{muted ? 'Silenciado' : 'Silencio'}</span>
            </button>
            <button className="pressable" style={{ ...styles.callBtn, background: '#FF3B30' }} onClick={endCall}>
              <PhoneIcon size={26} color="#fff" style={{ transform: 'rotate(135deg)' }} />
            </button>
            <span style={{ width: 64 }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <Screen scroll={false} padding="0">
      <AppHeader
        title="Teléfono"
        right={
          tab === 'con' ? (
            <IconButton label="Agregar contacto" bg="rgba(0,122,255,0.12)" onClick={addContact}>
              <Plus size={20} color="var(--accent)" />
            </IconButton>
          ) : undefined
        }
      />

      <div style={styles.content}>
        {tab === 'fav' && (
          <div style={styles.list}>
            {faves.length === 0 ? (
              <EmptyState
                icon={<Star size={26} color="var(--primary)" />}
                iconBg="rgba(0,122,255,0.12)"
                title="Sin favoritos"
                subtitle="Marca a alguien como favorito desde Contactos."
              />
            ) : (
              <ListGroup>
                {faves.map((c, i) => (
                  <ListRow
                    key={c.id}
                    showSeparator={i < faves.length - 1}
                    icon={<Star size={15} color="#FFD700" fill="#FFD700" />}
                    iconBg="var(--primary)"
                    label={c.name}
                    sublabel={c.number}
                    onClick={() => setSheet(c)}
                    value={
                      <button
                        style={styles.iconBtn}
                        aria-label={`Llamar a ${c.name}`}
                        onClick={e => { e.stopPropagation(); setSheet(c); }}
                      >
                        <PhoneIcon size={18} color="var(--success)" />
                      </button>
                    }
                  />
                ))}
              </ListGroup>
            )}
          </div>
        )}

        {tab === 'rec' && (
          <div style={styles.list}>
            {log.length === 0 ? (
              <EmptyState
                icon={<ClockIcon size={26} color="var(--text-secondary)" />}
                title="Sin llamadas"
                subtitle="Aún no hay llamadas recientes."
              />
            ) : (
              <ListGroup>
                {log.map((e, i) => {
                  const c = findContact(e.number);
                  const row = c ?? { id: `rc_${e.id}`, name: e.name ?? e.number, number: e.number, isFavorite: false };
                  return (
                    <ListRow
                      key={e.id}
                      showSeparator={i < log.length - 1}
                      destructive={e.type === 'missed'}
                      label={e.name ?? e.number}
                      sublabel={`${e.type === 'out' ? 'Saliente' : e.type === 'in' ? 'Entrante' : 'Perdida'} · ${
                        e.duration > 0
                          ? fmtDuration(e.duration)
                          : new Date(e.at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
                      }`}
                      onClick={() => setSheet(row)}
                      value={
                        <button
                          style={styles.iconBtn}
                          aria-label={`Llamar a ${row.name}`}
                          onClick={ev => { ev.stopPropagation(); setSheet(row); }}
                        >
                          <PhoneIcon size={18} color="var(--accent)" />
                        </button>
                      }
                    />
                  );
                })}
              </ListGroup>
            )}
          </div>
        )}

        {tab === 'con' && (
          <div style={styles.list}>
            <ListGroup>
              {contactsSorted.map((c, i) => (
                <ListRow
                  key={c.id}
                  showSeparator={i < contactsSorted.length - 1}
                  icon={<UserIcon size={15} color="#fff" />}
                  iconBg="var(--primary)"
                  label={c.name}
                  sublabel={c.number}
                  onClick={() => setSheet(c)}
                  value={
                    <button
                      style={styles.iconBtn}
                      onClick={e => { e.stopPropagation(); toggleFav(c.id); }}
                      aria-label="Favorito"
                    >
                      <Star size={18} color={c.isFavorite ? '#FFD700' : 'var(--text-tertiary)'} fill={c.isFavorite ? '#FFD700' : 'none'} />
                    </button>
                  }
                />
              ))}
            </ListGroup>
          </div>
        )}

        {tab === 'key' && (
          <div style={styles.keypad}>
            <div style={styles.dialDisplay}>
              {dial || <span style={styles.dialPlaceholder}>Número</span>}
            </div>
            <div style={styles.keys}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(k => (
                <button key={k} className="pressable" style={styles.key} onClick={() => press(k)}>
                  {k}
                </button>
              ))}
            </div>
            <div style={styles.keyBottomRow}>
              <button className="pressable" style={styles.deleteKey} onClick={() => setDial(d => d.slice(0, -1))} aria-label="Borrar">
                <Delete size={20} color="var(--danger)" />
              </button>
              <button
                className="pressable"
                style={{ ...styles.callKey, opacity: dial ? 1 : 0.4 }}
                disabled={!dial}
                onClick={() => setSheet({ id: 'dial', name: dial, number: dial, isFavorite: false })}
                aria-label="Llamar"
              >
                <PhoneIcon size={26} color="#fff" />
              </button>
              <span style={{ width: 40 }} />
            </div>
          </div>
        )}
      </div>

      <TabBar tabs={TABS} activeId={tab} onChange={setTab} />

      <Sheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        title={sheet ? `${sheet.name} · ${sheet.number}` : undefined}
      >
        <div style={styles.sheetBody}>
          <button className="pressable" style={styles.sheetAction} onClick={() => callBy('aurora')}>
            <span style={styles.sheetIcon}><PhoneIcon size={18} color="var(--success)" /></span>
            Llamar (Aurora)
          </button>
          <button className="pressable" style={styles.sheetAction} onClick={() => callBy('telegram')}>
            <span style={styles.sheetIcon}><Send size={18} color="#0088CC" /></span>
            Llamar por Telegram
          </button>
          <button className="pressable" style={styles.sheetAction} onClick={() => callBy('whatsapp')}>
            <span style={styles.sheetIcon}><MessageCircle size={18} color="#25D366" /></span>
            Llamar por WhatsApp
          </button>
          <button
            className="pressable"
            style={{ marginTop: 10, border: 'none', background: 'none', color: 'var(--danger)', fontSize: 15, fontWeight: 600, padding: 10, cursor: 'pointer' }}
            onClick={() => setSheet(null)}
          >
            Cancelar
          </button>
        </div>
      </Sheet>
    </Screen>
  );
}

const styles: Record<string, React.CSSProperties> = {
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0 20px',
    display: 'flex',
    flexDirection: 'column',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
  },
  keypad: { flex: 1, display: 'flex', flexDirection: 'column', padding: '0 16px 12px', minHeight: 0 },
  dialDisplay: {
    fontSize: 30,
    fontWeight: 500,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
    padding: '14px 0',
    minHeight: 62,
    letterSpacing: 2,
  },
  dialPlaceholder: { color: 'var(--text-tertiary)', fontSize: 20, fontWeight: 400 },
  keys: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    rowGap: 10,
    columnGap: 12,
  },
  key: {
    height: 58,
    borderRadius: 29,
    border: 'none',
    background: 'var(--bg-tertiary)',
    fontSize: 24,
    fontWeight: 500,
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  keyBottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 12,
  },
  callKey: {
    width: 66,
    height: 66,
    borderRadius: 33,
    border: 'none',
    background: 'var(--success)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteKey: {
    width: 40,
    height: 40,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callScreen: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #1c2735 0%, #0f1620 100%)',
    color: '#fff',
    gap: 18,
    padding: '0 20px',
  },
  callAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    background: 'var(--primary)',
    fontSize: 40,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callName: { fontSize: 26, fontWeight: 600 },
  callStatus: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  incomingRow: { display: 'flex', gap: 56, marginTop: 30 },
  incomingBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 30,
  },
  callBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    border: 'none',
    background: 'rgba(255,255,255,0.12)',
    width: 64,
    height: 64,
    borderRadius: 32,
    cursor: 'pointer',
    justifyContent: 'center',
  },
  callBtnLabel: { fontSize: 11, color: '#fff' },
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
  sheetIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: 'var(--surface-card)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};