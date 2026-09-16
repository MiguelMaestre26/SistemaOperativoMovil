import { useState, useEffect, useCallback, useRef } from 'react';
import { useSystemStore } from './stores/useSystemStore';
import { useAppStore } from './stores/useAppStore';
import { batteryManager } from './core/BatteryManager';
import { isNative } from './core/native';
import { setOrientation, onOrientationChange } from './core/orientation';
import { usePersistedState } from './core/persistence';
import { powerManager } from './core/PowerManager';
import { backgroundSizeFor, backgroundPositionFor } from './core/wallpaper';
import StatusBar from './components/shell/StatusBar';
import HomeScreen from './components/shell/HomeScreen';
import Dock from './components/shell/Dock';
import AppSwitcher from './components/shell/AppSwitcher';
import NotificationCenter from './components/shell/NotificationCenter';
import AppDrawer from './components/shell/AppDrawer';
import PowerMenu from './components/shell/PowerMenu';
import AssistantOverlay from './components/shell/AssistantOverlay';
import RecordingIndicator from './components/shell/RecordingIndicator';
import LockScreen from './components/shell/LockScreen';
import BootSplash from './components/shell/BootSplash';
import PowerOffOverlay from './components/shell/PowerOffOverlay';
import DialogProvider from './components/ui/dialogs';
import ToastProvider from './components/ui/Toast';

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
import Pokedex from './components/apps/Pokedex';
import Youtube from './components/apps/Youtube';
import HboMax from './components/apps/HboMax';
import DisneyPlus from './components/apps/DisneyPlus';
import Netflix from './components/apps/Netflix';
import Gmail from './components/apps/Gmail';
import Snake from './components/apps/Snake';
import UjapEnLinea from './components/apps/UjapEnLinea';
import AcropolisUjap from './components/apps/AcropolisUjap';
import GeometryDash from './components/apps/GeometryDash';
import PdfViewer from './components/apps/PdfViewer';

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
  pokedex: Pokedex,
  telegram: Telegram,
  whatsapp: WhatsApp,
  youtube: Youtube,
  'hbo-max': HboMax,
  'disney-plus': DisneyPlus,
  netflix: Netflix,
  gmail: Gmail,
  snake: Snake,
  'ujap-en-linea': UjapEnLinea,
  'acropolis-ujap': AcropolisUjap,
  'geometry-dash': GeometryDash,
  'pdf-viewer': PdfViewer,
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
  const {
    isDarkMode, brightness, updateTime, wallpaper, wallpaperFit, wallpaperPosition,
    screenLocked, powerState, volume, setVolume, accent,
  } = useSystemStore();
  const { activeAppId, openApps, minimizeApp } = useAppStore();
  const [showAppSwitcher, setShowAppSwitcher] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showAppDrawer, setShowAppDrawer] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const [scale, setScale] = useState(1);
  const [landscape, setLandscape] = usePersistedState('auroraos:landscape', false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const powerRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; long: boolean }>({
    timer: null,
    long: false,
  });
  const bottomRef = useRef<{
    startY: number;
    dy: number;
    holdTimer: ReturnType<typeof setTimeout> | null;
    fired: 'none' | 'home' | 'switcher';
  } | null>(null);
  const edgeRef = useRef<{ startX: number; moved: boolean } | null>(null);
  const topRef = useRef<{ startY: number; moved: boolean } | null>(null);

  const native = isNative();
  const baseW = 390;
  const baseHp = native ? 944 : 844;
  const W = landscape ? baseHp : baseW;
  const H = landscape ? baseW : baseHp;

  // ─── Phone frame drag ────────────────────────────────────────
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
    if ((e.target as HTMLElement).closest('[data-screen]')) return;
    setOffset({ x: 0, y: 0 });
  };

  // ─── Power button ────────────────────────────────────────────
  const handlePowerDown = useCallback(() => {
    if (powerState !== 'on') {
      powerRef.current.timer = setTimeout(() => powerManager.powerOn(), 700);
      return;
    }
    powerRef.current.long = false;
    powerRef.current.timer = setTimeout(() => {
      powerRef.current.long = true;
      powerManager.reboot();
    }, 700);
  }, [powerState]);

  const handlePowerUp = useCallback(() => {
    if (powerRef.current.timer) {
      clearTimeout(powerRef.current.timer);
      powerRef.current.timer = null;
    }
    if (powerState !== 'on') return;
    if (!powerRef.current.long) setShowPowerMenu(p => !p);
  }, [powerState]);

  // ─── Volume buttons ──────────────────────────────────────────
  const handleVolDown = useCallback(() => setVolume(Math.max(0, volume - 10)), [volume, setVolume]);
  const handleVolUp = useCallback(() => setVolume(Math.min(100, volume + 10)), [volume, setVolume]);

  // ─── Home callback ───────────────────────────────────────────
  const handleHome = useCallback(() => {
    if (activeAppId) minimizeApp(activeAppId);
    setShowAppDrawer(false);
    setShowAppSwitcher(false);
    setShowPowerMenu(false);
  }, [activeAppId, minimizeApp]);

  // ─── Effects ─────────────────────────────────────────────────
  useEffect(() => {
    setOrientation(landscape);
    const off = onOrientationChange(v => setLandscape(v));
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

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  // ─── Derived state ───────────────────────────────────────────
  const isAppOpen = activeAppId !== null &&
    openApps.some(a => a.id === activeAppId && a.status !== 'terminated' && !a.minimized);
  const isHome = powerState === 'on' && !screenLocked && !isAppOpen && !showAppDrawer;

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
        {/* Bezel */}
        <div style={styles.bezel}>
          <div style={styles.dynamicIsland}>
            <div style={styles.dynamicIslandInner} />
          </div>
        </div>

        {/* Screen */}
        <div data-screen style={styles.screen}>
          {wallpaper && (
            <div
              className="screen-wallpaper"
              style={{
                ...styles.wallpaper,
                backgroundImage: `url(${wallpaper})`,
                backgroundSize: backgroundSizeFor(wallpaperFit),
                backgroundPosition: backgroundPositionFor(wallpaperPosition),
              }}
            />
          )}
          {wallpaper && isDarkMode && <div style={styles.wallpaperDim} />}

          {/* Status bar — only when system is on */}
          {powerState === 'on' && <StatusBar />}

          {/* Recording indicator (click para detener) */}
          {powerState === 'on' && !screenLocked && <RecordingIndicator />}

          {/* Main content area */}
          <div style={styles.contentArea}>
            {powerState === 'off' ? (
              <PowerOffOverlay />
            ) : powerState === 'booting' ? (
              <BootSplash />
            ) : screenLocked ? (
              <LockScreen />
            ) : showAppSwitcher ? (
              <AppSwitcher onClose={() => setShowAppSwitcher(false)} />
            ) : showAppDrawer ? (
              <AppDrawer onClose={() => setShowAppDrawer(false)} />
            ) : isAppOpen ? (
              <div style={styles.appWrapper} className="transition-app-open">
                <div style={styles.appContainer}>
                  <AppView appId={activeAppId!} />
                </div>
              </div>
            ) : (
              <HomeScreen
                onOpenApp={(id) => useAppStore.getState().openApp(id)}
                onOpenDrawer={() => setShowAppDrawer(true)}
              />
            )}
          </div>

          {/* Dock — only on home, when unlocked */}
          {isHome && (
            <Dock onOpenDrawer={() => setShowAppDrawer(true)} />
          )}

          {/* Home indicator */}
          <div style={styles.homeIndicatorContainer}>
            <div
              style={styles.homeIndicator}
              onClick={() => {
                if (showAppSwitcher || showAppDrawer || showPowerMenu || showNotificationCenter) {
                  setShowAppSwitcher(false);
                  setShowAppDrawer(false);
                  setShowPowerMenu(false);
                  setShowNotificationCenter(false);
                } else if (isAppOpen) {
                  handleHome();
                } else if (isHome) {
                  setShowAppSwitcher(true);
                }
              }}
            />
          </div>

          {/* Asistente Chocolate: siempre presente en el sistema */}
          {powerState === 'on' && !screenLocked && !showAppSwitcher && <AssistantOverlay />}

          {/* Bottom gesture zone — swipe up for home / hold for switcher */}
          {isAppOpen && !screenLocked && powerState === 'on' && (
            <div
              style={styles.bottomGestureZone}
              onPointerDown={e => {
                bottomRef.current = { startY: e.clientY, dy: 0, holdTimer: null, fired: 'none' };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={e => {
                const g = bottomRef.current;
                if (!g) return;
                const dy = g.startY - e.clientY;
                g.dy = dy;
                if (dy > 80 && g.fired === 'none' && !g.holdTimer) {
                  g.holdTimer = setTimeout(() => {
                    if (bottomRef.current && bottomRef.current.fired === 'none') {
                      bottomRef.current.fired = 'switcher';
                      setShowAppSwitcher(true);
                    }
                  }, 140);
                }
              }}
              onPointerUp={() => {
                const g = bottomRef.current;
                bottomRef.current = null;
                if (g?.holdTimer) clearTimeout(g.holdTimer);
                if (g && g.dy > 40 && g.fired === 'none') handleHome();
              }}
              onPointerCancel={() => {
                const g = bottomRef.current;
                bottomRef.current = null;
                if (g?.holdTimer) clearTimeout(g.holdTimer);
              }}
            >
              <div style={styles.homeIndicator} />
            </div>
          )}

          {/* Left edge swipe → back / home */}
          {isAppOpen && !screenLocked && powerState === 'on' && (
            <div
              style={styles.leftEdgeGesture}
              onPointerDown={e => {
                edgeRef.current = { startX: e.clientX, moved: false };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={e => {
                if (!edgeRef.current) return;
                if (e.clientX - edgeRef.current.startX > 30) {
                  edgeRef.current.moved = true;
                  handleHome();
                }
              }}
              onPointerUp={() => { edgeRef.current = null; }}
              onPointerCancel={() => { edgeRef.current = null; }}
            />
          )}

          {/* Top edge swipe down → notifications center */}
          {!screenLocked && powerState === 'on' && (
            <div
              style={styles.topGestureZone}
              onPointerDown={e => {
                topRef.current = { startY: e.clientY, moved: false };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={e => {
                if (!topRef.current) return;
                if (e.clientY - topRef.current.startY > 50 && !topRef.current.moved) {
                  topRef.current.moved = true;
                  setShowNotificationCenter(true);
                }
              }}
              onPointerUp={() => { topRef.current = null; }}
              onPointerCancel={() => { topRef.current = null; }}
            />
          )}

          {/* In-app power menu overlay */}
          {!screenLocked && powerState === 'on' && (
            <PowerMenu isOpen={showPowerMenu} onClose={() => setShowPowerMenu(false)} />
          )}

          {/* Notification center (constrained to the phone screen) */}
          {showNotificationCenter && powerState === 'on' && !screenLocked && (
            <NotificationCenter onClose={() => setShowNotificationCenter(false)} />
          )}

          {/* Brightness overlay */}
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

          {/* Shared app providers */}
          <DialogProvider />
          <ToastProvider />
        </div>

        {/* Physical side buttons (interactive) */}
        <div
          style={styles.sideButtonRight1}
          onPointerDown={handlePowerDown}
          onPointerUp={handlePowerUp}
          onPointerLeave={handlePowerUp}
          aria-label="Botón de encendido"
        />
        <div
          style={styles.sideButtonRight2}
          onPointerDown={handleVolUp}
          aria-label="Volumen arriba"
        />
        <div
          style={styles.sideButtonLeft}
          onPointerDown={handleVolDown}
          aria-label="Volumen abajo"
        />
      </div>

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
    background: 'linear-gradient(135deg, #1f2023 0%, #16171a 50%, #0f1012 100%)',
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
    zIndex: 0,
  },
  wallpaperDim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'var(--wallpaper-dim)',
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
    width: 5,
    height: 80,
    background: '#333',
    borderRadius: '0 3px 3px 0',
    zIndex: 99,
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  sideButtonRight2: {
    position: 'absolute',
    right: -6,
    top: 260,
    width: 5,
    height: 50,
    background: '#333',
    borderRadius: '0 3px 3px 0',
    zIndex: 99,
    cursor: 'pointer',
  },
  sideButtonLeft: {
    position: 'absolute',
    left: -6,
    top: 200,
    width: 5,
    height: 50,
    background: '#333',
    borderRadius: '3px 0 0 3px',
    zIndex: 99,
    cursor: 'pointer',
  },
  bottomGestureZone: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    zIndex: 91,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 8,
    cursor: 'pointer',
  },
  leftEdgeGesture: {
    position: 'absolute',
    top: 50,
    left: 0,
    bottom: 0,
    width: 16,
    zIndex: 91,
  },
  topGestureZone: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    height: 36,
    zIndex: 91,
  },
};