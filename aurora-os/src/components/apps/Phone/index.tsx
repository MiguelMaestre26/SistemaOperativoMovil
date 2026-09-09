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

const TABS = [
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

  const addContact = () => {
    const name = window.prompt('Nombre:');
    if (!name?.trim()) return;
    const number = window.prompt('Número (ej. 8888-0000):');
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
            <button style={{ ...styles.incomingBtn, background: '#FF3B30' }} onClick={endCall}>
              <PhoneIcon size={28} color="#fff" style={{ transform: 'rotate(135deg)' }} />
            </button>
            <button style={{ ...styles.incomingBtn, background: '#34C759' }} onClick={answer}>
              <PhoneIcon size={28} color="#fff" />
            </button>
          </div>
        ) : (
          <div style={styles.callRow}>
            <button style={styles.callBtn} onClick={() => setMuted(m => !m)}>
              {muted ? <MicOff size={24} color="#fff" /> : <Mic size={24} color="#fff" />}
              <span style={styles.callBtnLabel}>{muted ? 'Silenciado' : 'Silencio'}</span>
            </button>
            <button style={{ ...styles.callBtn, background: '#FF3B30' }} onClick={endCall}>
              <PhoneIcon size={26} color="#fff" style={{ transform: 'rotate(135deg)' }} />
            </button>
            <span style={{ width: 64 }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Teléfono</span>
        {tab === 'con' && (
          <button style={styles.addContactBtn} onClick={addContact} aria-label="Agregar contacto">
            <Plus size={18} color="#007AFF" />
          </button>
        )}
      </div>

      <div style={styles.content}>
        {tab === 'fav' && (
          <div style={styles.list}>
            <div style={styles.sectionLabel}>Favoritos</div>
            {faves.length === 0 ? (
              <div style={styles.emptyText}>Marca a alguien como favorito desde Contactos.</div>
            ) : (
              faves.map(c => (
                <div key={c.id} style={styles.row} onClick={() => setSheet(c)}>
                  <div style={styles.avatar}>
                    <Star size={16} color="#FFD700" />
                  </div>
                  <div style={styles.rowMain}>
                    <div style={styles.rowName}>{c.name}</div>
                    <div style={styles.rowNumber}>{c.number}</div>
                  </div>
                  <button
                    style={styles.callIconBtn}
                    aria-label={`Llamar a ${c.name} por WhatsApp o Telegram`}
                    onClick={e => { e.stopPropagation(); setSheet(c); }}
                  >
                    <PhoneIcon size={18} color="#34C759" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'rec' && (
          <div style={styles.list}>
            <div style={styles.sectionLabel}>Recientes</div>
            {log.length === 0 ? (
              <div style={styles.emptyText}>Aún no hay llamadas.</div>
            ) : (
              log.map(e => {
                const c = findContact(e.number);
                const row = c ?? { id: `rc_${e.id}`, name: e.name ?? e.number, number: e.number, isFavorite: false };
                return (
                  <div key={e.id} style={styles.row} onClick={() => setSheet(row)}>
                    <div style={styles.rowMain}>
                      <div style={{ ...styles.rowName, color: e.type === 'missed' ? '#FF3B30' : '#111' }}>
                        {e.name ?? e.number}
                      </div>
                      <div style={styles.rowNumber}>
                        {e.type === 'out' ? 'Saliente · ' : e.type === 'in' ? 'Entrante · ' : 'Perdida · '}
                        {e.duration > 0 ? fmtDuration(e.duration) : new Date(e.at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      style={styles.callIconBtn}
                      aria-label={`Llamar a ${row.name} por WhatsApp o Telegram`}
                      onClick={ev => { ev.stopPropagation(); setSheet(row); }}
                    >
                      <PhoneIcon size={18} color="#007AFF" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'con' && (
          <div style={styles.list}>
            <div style={styles.sectionLabel}>Contactos</div>
            {contactsSorted.map(c => (
              <div key={c.id} style={styles.row} onClick={() => setSheet(c)}>
                <div style={styles.avatar}>
                  <UserIcon size={16} color="#fff" />
                </div>
                <div style={styles.rowMain}>
                  <div style={styles.rowName}>{c.name}</div>
                  <div style={styles.rowNumber}>{c.number}</div>
                </div>
                <button
                  style={styles.starBtn}
                  onClick={e => { e.stopPropagation(); toggleFav(c.id); }}
                  aria-label="Favorito"
                >
                  <Star size={18} color={c.isFavorite ? '#FFD700' : '#C7C7CC'} fill={c.isFavorite ? '#FFD700' : 'none'} />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'key' && (
          <div style={styles.keypad}>
            <div style={styles.dialDisplay}>{dial || <span style={styles.dialPlaceholder}>Número</span>}</div>
            <div style={styles.keys}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(k => (
                <button key={k} style={styles.key} onClick={() => press(k)}>
                  {k}
                </button>
              ))}
            </div>
            <div style={styles.keyBottomRow}>
              <button style={styles.deleteKey} onClick={() => setDial(d => d.slice(0, -1))} aria-label="Borrar">
                <Delete size={20} color="#FF3B30" />
              </button>
              <button
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

      <div style={styles.tabs}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              style={{ ...styles.tab, ...(tab === t.id ? styles.tabActive : {}) }}
              onClick={() => setTab(t.id)}
            >
              <Icon size={20} color={tab === t.id ? '#007AFF' : '#8E8E93'} />
              <span style={{ ...styles.tabLabel, color: tab === t.id ? '#007AFF' : '#8E8E93' }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {sheet && (
        <div style={styles.sheetOverlay} onClick={() => setSheet(null)}>
          <div style={styles.sheet} onClick={e => e.stopPropagation()}>
            <div style={styles.sheetHeader}>
              <div style={styles.sheetAvatar}>{sheet.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={styles.sheetName}>{sheet.name}</div>
                <div style={styles.sheetNumber}>{sheet.number}</div>
              </div>
            </div>
            <button style={styles.sheetAction} onClick={() => callBy('aurora')}>
              <PhoneIcon size={18} color="#34C759" />
              <span>Llamar (Aurora)</span>
            </button>
            <button style={styles.sheetAction} onClick={() => callBy('telegram')}>
              <Send size={18} color="#0088CC" />
              <span>Llamar por Telegram</span>
            </button>
            <button style={styles.sheetAction} onClick={() => callBy('whatsapp')}>
              <MessageCircle size={18} color="#25D366" />
              <span>Llamar por WhatsApp</span>
            </button>
            <button style={styles.sheetCancel} onClick={() => setSheet(null)}>Cancelar</button>
          </div>
        </div>
      )}
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
    padding: '12px 16px 6px',
  },
  title: { fontSize: 22, fontWeight: 700, color: '#111' },
  addContactBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    border: 'none',
    background: 'rgba(0,122,255,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  list: { flex: 1, overflowY: 'auto', paddingBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: '#8E8E93',
    padding: '12px 16px 6px',
  },
  row: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    borderBottom: '0.5px solid rgba(0,0,0,0.05)',
    cursor: 'pointer',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: '#007AFF',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 15, fontWeight: 500, color: '#111' },
  rowNumber: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  callIconBtn: {
    position: 'relative' as const,
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
  starBtn: { border: 'none', background: 'none', cursor: 'pointer', padding: 4 },
  emptyText: { color: '#C7C7CC', fontSize: 13, textAlign: 'center' as const, marginTop: 40, padding: '0 20px' },
  keypad: { flex: 1, display: 'flex', flexDirection: 'column', padding: '0 16px 12px' },
  dialDisplay: {
    fontSize: 30,
    fontWeight: 500,
    color: '#111',
    textAlign: 'center' as const,
    padding: '14px 0',
    minHeight: 62,
    letterSpacing: 2,
  },
  dialPlaceholder: { color: '#C7C7CC', fontSize: 20, fontWeight: 400 },
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
    background: '#F2F2F7',
    fontSize: 24,
    fontWeight: 500,
    color: '#111',
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
    background: '#34C759',
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
  tabs: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 0 10px',
    borderTop: '0.5px solid rgba(0,0,0,0.08)',
    background: '#fff',
  },
  tab: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  tabActive: {},
  tabLabel: { fontSize: 10, fontWeight: 500 },
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
    background: '#007AFF',
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
  sheetOverlay: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 20,
    display: 'flex',
    alignItems: 'flex-end',
  },
  sheet: {
    width: '100%',
    background: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: '18px 16px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    boxShadow: '0 -6px 24px rgba(0,0,0,0.2)',
  },
  sheetHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 },
  sheetAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    background: '#007AFF',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 600,
  },
  sheetName: { fontSize: 16, fontWeight: 600, color: '#111' },
  sheetNumber: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  sheetAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.06)',
    background: '#F9F9FA',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: '#111',
    textAlign: 'left' as const,
  },
  sheetCancel: {
    marginTop: 4,
    border: 'none',
    background: 'none',
    color: '#FF3B30',
    fontSize: 15,
    fontWeight: 600,
    padding: 10,
    cursor: 'pointer',
  },
};