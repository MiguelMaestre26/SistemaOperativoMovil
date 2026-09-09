import { useState, useEffect, useCallback, useRef } from 'react';
import { useSystemStore } from './stores/useSystemStore';
import { useAppStore } from './stores/useAppStore';
import { batteryManager } from './core/BatteryManager';
import { isNative } from './core/native';
import { setOrientation, onOrientationChange } from './core/orientation';
import { usePersistedState } from './core/persistence';
import StatusBar from './components/shell/StatusBar';
import Launcher from './components/shell/Launcher';
import Dock from './components/shell/Dock';
import TaskSwitcher from './components/shell/TaskSwitcher';
import NotificationCenter from './components/shell/NotificationCenter';
import AppDrawer from './components/shell/AppDrawer';
import AppBackBar from './components/shell/AppBackBar';

import Calculator from './components/apps/Calculator';
import Clock from './components/apps/Clock';
import Notes from './components/apps/Notes';
import Settings from './components/apps/Settings';
import FileManager from './components/apps/FileManager';
import Camera from './components/apps/Camera';
import Gallery from './components/apps/Gallery';
import Browser from './components/apps/Browser';
import Phone from './components/apps/Phone';
import Messages from './components/apps/Messages';
import Weather from './components/apps/Weather';
import Music from './components/apps/Music';
import Email from './components/apps/Email';
import Assistant from './components/apps/Assistant';
import Calendar from './components/apps/Calendar';
import Maps from './components/apps/Maps';
import Podcasts from './components/apps/Podcasts';
import Books from './components/apps/Books';
import Videos from './components/apps/Videos';
import Compass from './components/apps/Compass';
import News from './components/apps/News';
import Health from './components/apps/Health';
import Games from './components/apps/Games';
import Telegram from './components/apps/Telegram';
import WhatsApp from './components/apps/WhatsApp';

const APP_COMPONENTS: Record<string, React.ComponentType> = {
  calculator: Calculator,
  clock: Clock,
  notes: Notes,
  settings: Settings,
  'file-manager': FileManager,
  camera: Camera,
  gallery: Gallery,
  browser: Browser,
  phone: Phone,
  messages: Messages,
  weather: Weather,
  music: Music,
  email: Email,
  'chocolate-plan': Assistant,
  calendar: Calendar,
  maps: Maps,
  podcasts: Podcasts,
  books: Books,
  videos: Videos,
  compass: Compass,
  news: News,
  health: Health,
  games: Games,
  telegram: Telegram,
  whatsapp: WhatsApp,
};

function AppView({ appId }: { appId: string }) {
  const AppComponent = APP_COMPONENTS[appId];
  const closeApp = useAppStore(s => s.closeApp);

  if (!AppComponent) {
    return (
      <div style={styles.placeholder}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>📱</div>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>App not available</div>
        <button onClick={() => closeApp(appId)} style={styles.backBtn}>Back to Home</button>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <AppComponent />
    </div>
  );
}

export default function App() {
  const { isDarkMode, brightness, updateTime, wallpaper } = useSystemStore();
  const { activeAppId, openApps, minimizeApp, closeApp } = useAppStore();
  const [showTaskSwitcher, setShowTaskSwitcher] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showAppDrawer, setShowAppDrawer] = useState(false);
  const [scale, setScale] = useState(1);
  const [landscape, setLandscape] = usePersistedState('auroraos:landscape', false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const native = isNative();

  const baseW = 390;
  const baseHp = native ? 944 : 844;
  const W = landscape ? baseHp : baseW;
  const H = landscape ? baseW : baseHp;

  const handleDragStart = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest('[data-screen]')) return;
    const isFrameHit = Boolean(t.closest('[data-frame]'));
    const isWrapperHit = e.currentTarget === e.target;
    if (!isFrameHit && !isWrapperHit) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
    document.body.style.cursor = 'grabbing';
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    setOffset({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
  };

  const handleDragEnd = () => {
    dragRef.current = null;
    document.body.style.cursor = '';
  };

  const handleReset = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-screen]')) return;
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    setOrientation(landscape);
    const off = onOrientationChange((v) => setLandscape(v));
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fitPhone = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.min(vw / W, vh / H);
      setScale(Math.min(s, 1.2));
    };
    fitPhone();
    window.addEventListener('resize', fitPhone);
    return () => window.removeEventListener('resize', fitPhone);
  }, [W, H]);

  useEffect(() => {
    batteryManager.start();
    const timer = setInterval(() => updateTime(), 1000);
    return () => {
      batteryManager.stop();
      clearInterval(timer);
    };
  }, [updateTime]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Reglas CSS del modo oscuro: invierte la UI pero re-invierte la imagen de
  // fondo, las imágenes, vídeos y los webviews para que se vean con colores normales.
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .aurora-dark { filter: invert(1) hue-rotate(180deg); background: #000; }
      .aurora-dark .screen-wallpaper,
      .aurora-dark img,
      .aurora-dark video,
      .aurora-dark canvas,
      .aurora-dark webview { filter: invert(1) hue-rotate(180deg); }
      .aurora-dark .screen-brightness { filter: invert(1); }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const isAppOpen = activeAppId !== null &&
    openApps.some(a => a.id === activeAppId && a.status !== 'terminated' && !a.minimized);

  const activeAppName =
    openApps.find(a => a.id === activeAppId)?.definition.name ?? 'App';

  const handleHome = useCallback(() => {
    if (activeAppId) {
      minimizeApp(activeAppId);
    }
    setShowAppDrawer(false);
    setShowNotificationCenter(false);
    setShowTaskSwitcher(false);
  }, [activeAppId, minimizeApp]);

  return (
    <div
      style={styles.pageWrapper}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerLeave={handleDragEnd}
      onDoubleClick={handleReset}
    >
      <div
        data-frame
        style={{ ...styles.phoneFrame, width: W, height: H, transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
      >
        {/* Phone bezel */}
        <div style={styles.bezel}>
          {/* Dynamic Island */}
          <div style={styles.dynamicIsland}>
            <div style={styles.dynamicIslandInner} />
          </div>
        </div>

        {/* Screen */}
        <div data-screen style={styles.screen} className={isDarkMode ? 'aurora-dark' : ''}>
          {wallpaper && <div className="screen-wallpaper" style={{ ...styles.wallpaper, backgroundImage: `url(${wallpaper})` }} />}

          {/* Status Bar */}
          <StatusBar />

          {/* Main content area */}
          <div style={styles.contentArea}>
            {isAppOpen ? (
              <div style={styles.appWrapper} className="transition-app-open">
                <AppBackBar
                  appName={activeAppName}
                  onBack={handleHome}
                  onClose={() => closeApp(activeAppId!)}
                />
                <div style={styles.appContainer}>
                  <AppView appId={activeAppId!} />
                </div>
              </div>
            ) : showAppDrawer ? (
              <AppDrawer onClose={() => setShowAppDrawer(false)} />
            ) : (
              <Launcher onOpenApp={(id) => useAppStore.getState().openApp(id)} />
            )}
          </div>

          {/* Dock - only show on home screen */}
          {!isAppOpen && !showAppDrawer && (
            <Dock />
          )}

          {/* Home indicator */}
          <div style={styles.homeIndicatorContainer}>
            <div
              style={styles.homeIndicator}
              onClick={() => {
                if (showTaskSwitcher || showNotificationCenter || showAppDrawer) {
                  setShowTaskSwitcher(false);
                  setShowNotificationCenter(false);
                  setShowAppDrawer(false);
                } else if (isAppOpen) {
                  handleHome();
                } else {
                  setShowTaskSwitcher(true);
                }
              }}
            />
          </div>

          {/* Brillo real: oscurece la pantalla según el slider de Ajustes */}
          <div
            className="screen-brightness"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10000,
              background: '#000',
              opacity: (100 - brightness) / 100,
              pointerEvents: 'none',
              borderRadius: 46,
            }}
          />
        </div>

        {/* Side buttons visual */}
        <div style={styles.sideButtonRight1} />
        <div style={styles.sideButtonRight2} />
        <div style={styles.sideButtonLeft} />
      </div>

      {/* Overlays rendered outside phone frame */}
      {showTaskSwitcher && (
        <TaskSwitcher onClose={() => setShowTaskSwitcher(false)} />
      )}
      {showNotificationCenter && (
        <NotificationCenter onClose={() => setShowNotificationCenter(false)} />
      )}

      {native && (
        <div style={styles.moveHint}>
          <span style={styles.moveHintText}>
            Arrastra el fondo o el marco para mover el teléfono · doble clic para centrar
          </span>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
    overflow: 'hidden',
    userSelect: 'none',
  },
  moveHint: {
    position: 'fixed',
    bottom: 14,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    padding: '6px 14px',
    pointerEvents: 'none',
    zIndex: 300,
  },
  moveHintText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' },
  phoneFrame: {
    position: 'relative',
    width: 390,
    height: 844,
    flexShrink: 0,
    transformOrigin: 'center',
  },
  bezel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    border: '4px solid #2a2a2a',
    boxShadow: '0 0 0 2px #1a1a1a, 0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)',
    background: 'transparent',
    zIndex: 100,
    pointerEvents: 'none',
  },
  dynamicIsland: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 126,
    height: 36,
    borderRadius: 20,
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 101,
  },
  dynamicIslandInner: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#111',
    border: '1px solid #222',
  },
  screen: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 46,
    overflow: 'hidden',
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
  },
  wallpaper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0,
  },
  contentArea: {
    flex: 1,
    marginTop: 50,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  appWrapper: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  appContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  },
  homeIndicatorContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    zIndex: 90,
    paddingBottom: 4,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    background: 'rgba(255,255,255,0.3)',
    cursor: 'pointer',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    gap: 12,
  },
  backBtn: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '10px 24px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  sideButtonRight1: {
    position: 'absolute',
    right: -6,
    top: 160,
    width: 4,
    height: 80,
    background: '#333',
    borderRadius: '0 3px 3px 0',
    zIndex: 99,
  },
  sideButtonRight2: {
    position: 'absolute',
    right: -6,
    top: 260,
    width: 4,
    height: 50,
    background: '#333',
    borderRadius: '0 3px 3px 0',
    zIndex: 99,
  },
  sideButtonLeft: {
    position: 'absolute',
    left: -6,
    top: 200,
    width: 4,
    height: 50,
    background: '#333',
    borderRadius: '3px 0 0 3px',
    zIndex: 99,
  },
};
