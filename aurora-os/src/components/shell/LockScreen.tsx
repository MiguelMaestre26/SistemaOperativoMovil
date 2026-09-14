import { useState, useEffect, useRef } from 'react';
import { useSystemStore } from '../../stores/useSystemStore';
import { powerManager } from '../../core/PowerManager';
import { backgroundSizeFor, backgroundPositionFor } from '../../core/wallpaper';
import { Lock, ChevronUp, Delete } from 'lucide-react';

export default function LockScreen() {
  const wallpaper = useSystemStore(s => s.wallpaper);
  const wallpaperFit = useSystemStore(s => s.wallpaperFit);
  const wallpaperPosition = useSystemStore(s => s.wallpaperPosition);
  const pinCode = useSystemStore(s => s.pinCode);
  const [now, setNow] = useState(new Date());
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const dragRef = useRef<{ startY: number; dy: number } | null>(null);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const attemptUnlock = (attempt: string) => {
    if (attempt === pinCode) {
      powerManager.unlock();
      return;
    }
    setError(true);
    setShake(true);
    setPin('');
    setTimeout(() => {
      setError(false);
      setShake(false);
    }, 600);
  };

  const pressKey = (digit: string) => {
    if (pin.length >= 4) return;
    setError(false);
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) attemptUnlock(next);
  };

  const handleUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && d.dy < -70) setShowPin(true);
    setLift(0);
  };

  return (
    <div style={styles.overlay}>
      {wallpaper ? (
        <div
          style={{
            ...styles.wallpaper,
            backgroundImage: `url(${wallpaper})`,
            backgroundSize: backgroundSizeFor(wallpaperFit),
            backgroundPosition: backgroundPositionFor(wallpaperPosition),
          }}
        />
      ) : (
        <div style={styles.gradients} />
      )}

      <div style={styles.darkOverlay} />

      <div style={styles.contentTop}>
        <div style={styles.timeWrap}>
          <span style={styles.time}>{time}</span>
          <span style={styles.date}>{date}</span>
        </div>
      </div>

      {!showPin ? (
        <div style={styles.bottomArea}>
          <div
            style={styles.swipeArea}
            onPointerDown={e => {
              dragRef.current = { startY: e.clientY, dy: 0 };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={e => {
              const d = dragRef.current;
              if (!d) return;
              const dy = e.clientY - d.startY;
              d.dy = dy;
              if (dy < 0) setLift(Math.max(-60, dy));
            }}
            onPointerUp={handleUp}
            onPointerCancel={handleUp}
          >
            <div style={{ transform: `translateY(${lift}px)`, transition: lift === 0 ? 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none' }}>
              <div style={styles.lockIconWrap}>
                <Lock size={18} color="#fff" />
              </div>
              <ChevronUp size={22} color="rgba(255,255,255,0.7)" className="lock-swipe-hint" />
              <span style={styles.swipeLabel}>Desliza para desbloquear</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.pinCenter}>
          <div style={styles.pinArea}>
            <div style={styles.pinLabel}>Introduce la contraseña</div>
            <div
              style={{
                ...styles.dots,
                animation: shake ? 'pin-shake 0.4s ease' : undefined,
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    ...styles.dot,
                    background: i < pin.length ? '#fff' : 'rgba(255,255,255,0.25)',
                  }}
                />
              ))}
              {error && <div style={styles.errorText}>Contraseña incorrecta</div>}
            </div>

            <div style={styles.keypad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
                <button
                  key={n}
                  className="pressable"
                  onClick={() => pressKey(n)}
                  style={styles.key}
                >
                  {n}
                </button>
              ))}
              <div aria-hidden style={styles.key} />
              <button
                key="0"
                className="pressable"
                onClick={() => pressKey('0')}
                style={styles.key}
              >
                0
              </button>
              <button
                className="pressable"
                onClick={() => setPin(prev => prev.slice(0, -1))}
                style={styles.key}
                aria-label="Borrar"
              >
                <Delete size={22} color="rgba(255,255,255,0.75)" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: 46,
    overflow: 'hidden',
    zIndex: 9600,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  wallpaper: {
    position: 'absolute',
    inset: 0,
  },
  gradients: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(145deg, #1a1a2e 0%, #0f0f23 30%, #16213e 70%, #0f0f23 100%)',
  },
  darkOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
  },
  contentTop: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 64,
  },
  timeWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 68,
    fontWeight: 600,
    letterSpacing: -2,
    color: '#fff',
    textShadow: '0 2px 16px rgba(0,0,0,0.4)',
    lineHeight: 1,
  },
  date: {
    fontSize: 16,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'capitalize' as const,
    textShadow: '0 1px 6px rgba(0,0,0,0.4)',
  },
  bottomArea: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 24,
  },
  swipeArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    touchAction: 'pan-y',
    cursor: 'pointer',
    minHeight: 80,
  },
  lockIconWrap: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.16)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  swipeLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.65)',
  },
  pinCenter: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  pinArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.85)',
  },
  dots: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    flexDirection: 'row' as const,
    minHeight: 16,
    position: 'relative' as const,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    transition: 'background 0.15s ease',
  },
  errorText: {
    position: 'absolute',
    top: 24,
    fontSize: 12,
    color: '#ff6b6b',
    width: 'max-content',
  },
  keypad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 76px)',
    gap: 18,
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#fff',
    fontSize: 26,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    outline: 'none',
    touchAction: 'manipulation' as const,
    WebkitTapHighlightColor: 'transparent',
  },
};