import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Calculator, Clock, FileText, Settings, FolderOpen,
  Camera, Image, Globe, Phone, MessageSquare,
  CloudSun, Music, Mail, Bot, ShoppingBag,
  Calendar, Map, Radio, BookOpen, Video,
  Compass, Newspaper, Heart, Gamepad2,
  Send, MessageCircle, FileBadge
} from 'lucide-react';
import type { AppDefinition } from '../../types';

const ALL_APPS: AppDefinition[] = [
  { id: 'calculator', name: 'Calculator', icon: 'calculator', color: '#1C1C1E', category: 'utilities' },
  { id: 'clock', name: 'Clock', icon: 'clock', color: '#FF9500', category: 'utilities' },
  { id: 'notes', name: 'Notes', icon: 'notes', color: '#FFCC00', category: 'productivity' },
  { id: 'settings', name: 'Settings', icon: 'settings', color: '#8E8E93', category: 'system' },
  { id: 'file-manager', name: 'Files', icon: 'files', color: '#007AFF', category: 'utilities' },
  { id: 'camera', name: 'Camera', icon: 'camera', color: '#1C1C1E', category: 'media' },
  { id: 'gallery', name: 'Photos', icon: 'gallery', color: '#FF6B6B', category: 'media' },
  { id: 'browser', name: 'Safari', icon: 'browser', color: '#007AFF', category: 'system' },
  { id: 'phone', name: 'Phone', icon: 'phone', color: '#34C759', category: 'communication' },
  { id: 'messages', name: 'Messages', icon: 'messages', color: '#34C759', category: 'communication' },
  { id: 'weather', name: 'Weather', icon: 'weather', color: '#5AC8FA', category: 'utilities' },
  { id: 'music', name: 'Music', icon: 'music', color: '#FC5C7D', category: 'media' },
  { id: 'email', name: 'Mail', icon: 'email', color: '#007AFF', category: 'communication' },
  { id: 'chocolate-plan', name: 'Chocolate', icon: 'assistant', color: '#8B5E3C', category: 'system' },
  { id: 'calendar', name: 'Calendar', icon: 'calendar', color: '#FF3B30', category: 'productivity' },
  { id: 'maps', name: 'Maps', icon: 'maps', color: '#34C759', category: 'utilities' },
  { id: 'podcasts', name: 'Podcasts', icon: 'podcasts', color: '#8B5CF6', category: 'media' },
  { id: 'books', name: 'Books', icon: 'books', color: '#FF9500', category: 'productivity' },
  { id: 'videos', name: 'Videos', icon: 'videos', color: '#1C1C1E', category: 'media' },
  { id: 'compass', name: 'Compass', icon: 'compass', color: '#1C1C1E', category: 'utilities' },
  { id: 'news', name: 'News', icon: 'news', color: '#FF3B30', category: 'productivity' },
  { id: 'health', name: 'Health', icon: 'health', color: '#FF2D55', category: 'utilities' },
  { id: 'games', name: 'Games', icon: 'games', color: '#5856D6', category: 'media' },
  { id: 'pokedex', name: 'Pokédex', icon: 'pokedex', color: '#FF3B30', category: 'media' },
  { id: 'telegram', name: 'Telegram', icon: 'telegram', color: '#0088CC', category: 'communication' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', color: '#25D366', category: 'communication' },
  { id: 'youtube', name: 'YouTube', icon: 'youtube', color: '#FF0000', category: 'media' },
  { id: 'hbo-max', name: 'HBO Max', icon: 'hbomax', color: '#7B2FF7', category: 'media' },
  { id: 'disney-plus', name: 'Disney Plus', icon: 'disneyplus', color: '#113CCF', category: 'media' },
  { id: 'netflix', name: 'Netflix', icon: 'netflix', color: '#E50914', category: 'media' },
  { id: 'gmail', name: 'Gmail', icon: 'gmail', color: '#EA4335', category: 'communication' },
  { id: 'snake', name: 'Snake', icon: 'snake', color: '#34C759', category: 'media' },
  { id: 'ujap-en-linea', name: 'UJAP En Línea', icon: 'ujap', color: '#C62828', category: 'utilities' },
  { id: 'acropolis-ujap', name: 'Acropolis UJAP', icon: 'acropolis', color: '#8E0000', category: 'utilities' },
  { id: 'geometry-dash', name: 'Geometry Dash', icon: 'geometrydash', color: '#FFD60A', category: 'media' },
  { id: 'pdf-viewer', name: 'PDF Viewer', icon: 'pdf', color: '#FF3B30', category: 'utilities' },
];

function getAppIcon(icon: string, size = 24) {
  const s = size;
  const icons: Record<string, ReactNode> = {
    calculator: <Calculator size={s} color="#fff" />,
    clock: <Clock size={s} color="#fff" />,
    notes: <FileText size={s} color="#fff" />,
    settings: <Settings size={s} color="#fff" />,
    files: <FolderOpen size={s} color="#fff" />,
    camera: <Camera size={s} color="#fff" />,
    gallery: <Image size={s} color="#fff" />,
    browser: <Globe size={s} color="#fff" />,
    phone: <Phone size={s} color="#fff" />,
    messages: <MessageSquare size={s} color="#fff" />,
    weather: <CloudSun size={s} color="#fff" />,
    music: <Music size={s} color="#fff" />,
    email: <Mail size={s} color="#fff" />,
    assistant: <Bot size={s} color="#fff" />,
    calendar: <Calendar size={s} color="#fff" />,
    maps: <Map size={s} color="#fff" />,
    podcasts: <Radio size={s} color="#fff" />,
    books: <BookOpen size={s} color="#fff" />,
    videos: <Video size={s} color="#fff" />,
    compass: <Compass size={s} color="#fff" />,
    news: <Newspaper size={s} color="#fff" />,
    health: <Heart size={s} color="#fff" />,
    games: <Gamepad2 size={s} color="#fff" />,
    pokedex: <PokeballIcon size={s} />,
    telegram: <Send size={s} color="#fff" />,
    whatsapp: <MessageCircle size={s} color="#fff" />,
    youtube: <YoutubeIcon size={s} />,
    hbomax: <HboIcon size={s} />,
    disneyplus: <DisneyIcon size={s} />,
    netflix: <NetflixIcon size={s} />,
    gmail: <GmailIcon size={s} />,
    snake: <SnakeIcon size={s} />,
    ujap: <UjapIcon size={s} />,
    acropolis: <AcropolisIcon size={s} />,
    geometrydash: <GeometryDashIcon size={s} />,
    pdf: <FileBadge size={s} color="#fff" />,
    store: <ShoppingBag size={s} color="#fff" />,
  };
  return icons[icon] || <ShoppingBag size={s} color="#fff" />;
}

function YoutubeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4.5" width="20" height="15" rx="4" fill="#fff" />
      <path d="M10 9.2v5.6l5-2.8-5-2.8Z" fill="#FF0000" />
    </svg>
  );
}

function HboIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <text x="12" y="16.6" textAnchor="middle" fontSize="12" fontWeight="800" fontFamily="'Arial Black', Arial, sans-serif" fill="#fff" letterSpacing="-0.8">HBO</text>
    </svg>
  );
}

function DisneyIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <text x="12" y="16.4" textAnchor="middle" fontSize="8.6" fontWeight="700" fontFamily="Arial, sans-serif" fill="#fff" letterSpacing="-1.1">Disney+</text>
    </svg>
  );
}

function NetflixIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polygon points="6.2,2.8 9.6,3.6 9.6,21.2 6.2,20.4" fill="#fff" />
      <polygon points="14.4,3.6 17.8,2.8 17.8,20.4 14.4,21.2" fill="#fff" />
    </svg>
  );
}

function GmailIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5.5h16a1.6 1.6 0 0 1 1.6 1.6v10.2a1.6 1.6 0 0 1-1.6 1.6H4a1.6 1.6 0 0 1-1.6-1.6V7.1A1.6 1.6 0 0 1 4 5.5Z" fill="#fff" />
      <path d="M4.2 7.8 12 14.5 19.8 7.8" stroke="#C5221F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PokeballIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2a10 10 0 0 1 10 10h-6a4 4 0 0 0-8 0H2A10 10 0 0 1 12 2Z" fill="#fff" />
      <path d="M12 22A10 10 0 0 1 2 12h6a4 4 0 0 0 8 0h6a10 10 0 0 1-10 10Z" fill="#fff" />
      <circle cx="12" cy="12" r="3.2" fill="#fff" />
      <circle cx="12" cy="12" r="1.4" fill="#111" />
      <rect x="2" y="10.6" width="20" height="2.8" fill="#fff" />
    </svg>
  );
}

function SnakeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 5c3.4-2.6 7.4-1.8 8.4 1.4 1.3 4.3-3.4 4.4-3.4 7.2 0 2.7 2.3 4.4 4.9 3.9"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="14.3" cy="17.5" r="1.5" fill="#34C759" />
    </svg>
  );
}

function UjapIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <text x="12" y="16.4" textAnchor="middle" fontSize="7.4" fontWeight="800" fontFamily="'Arial Black', Arial, sans-serif" fill="#fff" letterSpacing="-0.4">UJAP</text>
    </svg>
  );
}

function AcropolisIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 2.5 8 12 12.5 21.5 8 12 3.5Z" fill="#fff" />
      <path d="M6.6 10.7V15c0 1.3 2.4 2.6 5.4 2.6s5.4-1.3 5.4-2.6v-4.3" stroke="#fff" strokeWidth="1.7" fill="none" />
      <path d="M21.5 8.3v5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function GeometryDashIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="#fff" />
      <circle cx="12" cy="12" r="3.1" fill="#111" />
      <path d="M8.2 6.2 17.8 17.8" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17.8 6.2 8.2 17.8" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export { getAppIcon, ALL_APPS };

interface LauncherProps {
  onOpenApp: (id: string) => void;
}

export default function Launcher({ onOpenApp }: LauncherProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('es', { weekday: 'long', month: 'long', day: 'numeric' });

  const systemApps = ALL_APPS.filter(a => a.category === 'system');
  const utilityApps = ALL_APPS.filter(a => a.category === 'utilities');
  const commApps = ALL_APPS.filter(a => a.category === 'communication');
  const mediaApps = ALL_APPS.filter(a => a.category === 'media');
  const prodApps = ALL_APPS.filter(a => a.category === 'productivity');

  return (
    <div style={styles.container}>
      {/* Clock widget */}
      <div style={styles.clockWidget}>
        <div style={styles.timeDisplay}>{timeStr}</div>
        <div style={styles.dateDisplay}>{dateStr}</div>
      </div>

      {/* App grid sections */}
      {[
        { label: 'Suggestions', apps: systemApps.slice(0, 4) },
        { label: 'Utilities', apps: utilityApps },
        { label: 'Communication', apps: commApps },
        { label: 'Media', apps: mediaApps },
        { label: 'Productivity', apps: prodApps },
      ].map(section => (
        <div key={section.label} style={styles.section}>
          <div style={styles.sectionLabel}>{section.label}</div>
          <div style={styles.appGrid}>
            {section.apps.map(app => (
              <div
                key={app.id}
                style={styles.appItem}
                onClick={() => onOpenApp(app.id)}
              >
                <div style={{
                  ...styles.appIcon,
                  background: app.color,
                }}>
                  {getAppIcon(app.icon)}
                </div>
                <span style={styles.appName}>{app.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Bottom spacer for dock */}
      <div style={{ height: 100 }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 16px 140px',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  clockWidget: {
    textAlign: 'center',
    padding: '32px 0 20px',
  },
  timeDisplay: {
    fontSize: 64,
    fontWeight: 200,
    letterSpacing: -2,
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  dateDisplay: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    marginTop: 4,
    textTransform: 'capitalize' as const,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  appGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
  },
  appItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  appIcon: {
    width: 54,
    height: 54,
    borderRadius: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  appName: {
    fontSize: 11,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
    lineHeight: 1.2,
    maxWidth: 68,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
};
