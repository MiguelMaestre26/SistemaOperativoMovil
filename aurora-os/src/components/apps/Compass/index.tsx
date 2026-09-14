import { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import { Screen, AppHeader } from '../../ui';

function cardinal(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(deg / 45) % 8];
}

export default function CompassApp() {
  const [heading, setHeading] = useState(0);
  const [sensor, setSensor] = useState(false);
  const driftRef = useRef(0);

  useEffect(() => {
    let active = true;
    let last = 0;
    let fallback: ReturnType<typeof setInterval> | null = null;

    const handler = (e: DeviceOrientationEvent) => {
      if (!active) return;
      const webkit = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      const deg = e.alpha == null && webkit != null ? webkit : e.alpha;
      if (typeof deg === 'number') {
        setSensor(true);
        setHeading(deg);
      }
    };

    const enable = async () => {
      const DE = (window as unknown as {
        DeviceOrientationEvent?: typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<'granted' | 'denied'>;
        };
      }).DeviceOrientationEvent;

      if (DE && typeof DE.requestPermission === 'function') {
        try {
          const res = await DE.requestPermission();
          if (res !== 'granted') throw new Error('denied');
        } catch {
          startFallback();
          return;
        }
      }
      window.addEventListener('deviceorientation', handler, true);
      last = performance.now();
      fallback = setInterval(() => {
        if (performance.now() - last > 2000) startFallbackOnce();
      }, 2000);
    };

    const startFallback = () => {
      setSensor(false);
      if (fallback) clearInterval(fallback);
      fallback = setInterval(() => {
        driftRef.current = (driftRef.current + 0.08 + Math.random() * 0.05) % 360;
        setHeading(driftRef.current);
      }, 40);
    };

    let fallen = false;
    const startFallbackOnce = () => {
      if (!fallen) {
        fallen = true;
        startFallback();
      }
    };

    void enable();

    return () => {
      active = false;
      if (fallback) clearInterval(fallback);
      window.removeEventListener('deviceorientation', handler, true);
    };
  }, []);

  const rot = `rotate(${-heading}deg)`;
  const deg = Math.round(((heading % 360) + 360) % 360);

  return (
    <Screen scroll={false} padding="0">
      <AppHeader title="Brújula" />

      <div style={styles.body}>
        <div style={styles.dialWrap}>
          <div style={styles.dial}>
            {['N', 'E', 'S', 'O'].map((c, i) => (
              <span
                key={c}
                style={{
                  ...styles.card,
                  transform: `rotate(${i * 90}deg)`,
                  color: c === 'N' ? 'var(--danger)' : 'var(--text-secondary)',
                }}
              >
                <span style={{ ...styles.cardInner, transform: `rotate(${-i * 90}deg)` }}>{c}</span>
              </span>
            ))}
            {Array.from({ length: 24 }, (_, i) => i * 15).map(a => (
              <span
                key={a}
                style={{
                  ...styles.tick,
                  top: 100 + Math.sin((a * Math.PI) / 180) * 128,
                  left: 100 - Math.cos((a * Math.PI) / 180) * 128,
                  height: a % 45 === 0 ? 10 : 5,
                  background: a % 45 === 0 ? '#8E8E93' : '#D1D1D6',
                }}
              />
            ))}
          </div>

          <div style={{ ...styles.needle, transform: rot }}>
            <div style={styles.needleNorth} />
            <div style={styles.needleSouth} />
          </div>

          <div style={styles.circleCenter} />
        </div>

        <div style={styles.heading}>{deg}°</div>
        <div style={styles.cardLabel}>{cardinal(deg)}</div>

        <div style={styles.info}>
          <Info size={13} color="var(--text-secondary)" />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' as const }}>
            {sensor
              ? 'Usando el sensor de orientación del dispositivo. Gira tu teléfono.'
              : 'Simulación: el norte apunta hacia arriba de la pantalla en esta vista previa.'}
          </span>
        </div>
      </div>
    </Screen>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 14,
  },
  dialWrap: {
    position: 'relative',
    width: 260,
    height: 260,
    marginTop: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dial: {
    position: 'absolute',
    inset: 0,
    borderRadius: 130,
    background: 'radial-gradient(circle, #232A3F 0%, #181D30 70%)',
    boxShadow: 'inset 0 0 24px rgba(0,0,0,0.6), 0 8px 30px rgba(0,0,0,0.5)',
    transition: 'transform 0.05s linear',
  },
  card: {
    position: 'absolute',
    top: 12,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 24,
    fontSize: 17,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInner: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
  tick: {
    position: 'absolute',
    width: 2,
    borderRadius: 1,
    transform: 'translate(-1px, 0)',
    marginLeft: 1,
    marginTop: -1,
  },
  needle: {
    position: 'absolute',
    width: 8,
    height: 180,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'transform 0.05s linear',
  },
  needleNorth: {
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderBottom: '82px solid #FF3B30',
  },
  needleSouth: {
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderTop: '82px solid #fff',
  },
  circleCenter: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    background: '#fff',
    boxShadow: '0 0 0 4px #FF3B30',
  },
  heading: { fontSize: 56, fontWeight: 200, marginTop: 30, color: 'var(--text-primary)' },
  cardLabel: { fontSize: 20, fontWeight: 600, marginTop: 4, color: 'var(--text-primary)' },
  info: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
    margin: 'auto 24px 24px',
    padding: '10px 14px',
    borderRadius: 12,
    background: 'var(--surface-card)',
  },
};
