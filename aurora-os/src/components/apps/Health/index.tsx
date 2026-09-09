import { useState, useEffect } from 'react';
import { Heart, Footprints, BedDouble, Droplet, Plus, TrendingUp } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';

function dayKey(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString('es');
}

export default function Health() {
  const [steps, setSteps] = usePersistedState<Record<string, number>>('health:steps', {});
  const [water, setWater] = usePersistedState<Record<string, number>>('health:water', {});
  const [sleep, setSleep] = usePersistedState<{ hours: number; on: string }>('health:sleep', { hours: 7.2, on: dayKey(-1) });
  const [hr, setHr] = useState(72);
  const today = dayKey();

  useEffect(() => {
    const t = setInterval(() => {
      setSteps(s => {
        const val = (s[today] ?? 0) + Math.floor(1 + Math.random() * 3);
        return { ...s, [today]: val };
      });
      setHr(h => {
        const target = 68 + Math.random() * 10;
        return Math.round(h + (target - h) * 0.2);
      });
    }, 1200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todaySteps = steps[today] ?? 0;
  const goalSteps = 10000;
  const todayWater = water[today] ?? 0;
  const waterGoal = 8;

  const logSleep = () => {
    const h = window.prompt('Horas de sueño de anoche (ej. 7.5):', String(sleep.hours));
    const val = parseFloat(h ?? '');
    if (!Number.isNaN(val) && val >= 0 && val <= 24) {
      setSleep({ hours: val, on: dayKey(-1) });
    }
  };

  const week = Array.from({ length: 7 }, (_, i) => {
    const key = dayKey(i - 6);
    return { label: new Date(`${key}T00:00`).toLocaleDateString('es', { weekday: 'short' }), value: steps[key] ?? 0 };
  });
  const maxWeek = Math.max(1, ...week.map(w => w.value));

  const ring = (_pct: number) => 2 * Math.PI * 54;

  return (
    <div style={styles.container}>
      <div style={styles.header}>Salud</div>

      <div style={styles.ringsRow}>
        {[
          { label: 'Pasos', value: Math.round((todaySteps / goalSteps) * 100), emoji: '👟', color: '#34C759' },
          { label: 'Ejercicio', value: Math.min(100, Math.round((minuteBurn() / 30) * 100)), emoji: '🔥', color: '#FF9500' },
          { label: 'Agua', value: Math.round((todayWater / waterGoal) * 100), emoji: '💧', color: '#0A84FF' },
        ].map(r => (
          <div key={r.label} style={styles.ringWrap}>
            <svg width="70" height="70" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="12" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={r.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={ring(r.value)}
                strokeDashoffset={ring(1) - ring(r.value) * (0.28 + r.value / 400)}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <text x="60" y="58" textAnchor="middle" fontSize="24" fontWeight="700" fill="#111">{r.value}%</text>
              <text x="60" y="76" textAnchor="middle" fontSize="10" fill="#8E8E93">{r.label}</text>
            </svg>
          </div>
        ))}
      </div>

      <div style={styles.hrCard}>
        <div style={styles.hrIcon}>
          <Heart size={20} color="#fff" fill="#fff" style={beatPulse} />
        </div>
        <div style={styles.hrMain}>
          <div style={styles.hrValue}>{hr} <span style={styles.hrUnit}>lpm</span></div>
          <div style={styles.hrLabel}>Latidos por minuto · en vivo</div>
        </div>
        <TrendingUp size={16} color="#34C759" />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <span style={styles.sectionTitle}>Pasos de hoy</span>
          <span style={styles.sectionVal}>{fmtNum(todaySteps)} / {fmtNum(goalSteps)}</span>
        </div>
        <div style={styles.track}>
          <div style={{ ...styles.fill, width: `${Math.min(100, (todaySteps / goalSteps) * 100)}%`, background: '#34C759' }} />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <span style={styles.sectionTitle}>Agua</span>
          <span style={styles.sectionVal}>{todayWater} / {waterGoal} vasos</span>
        </div>
        <div style={styles.waterRow}>
          {Array.from({ length: waterGoal }, (_, i) => (
            <button
              key={i}
              style={{
                ...styles.waterDrop,
                background: i < todayWater ? '#0A84FF' : '#E5E5EA',
                cursor: 'default',
              }}
              onClick={() => i === todayWater && setWater(w => ({ ...w, [today]: (w[today] ?? 0) + 1 }))}
              aria-label={`Vaso ${i + 1}`}
            >
              <Droplet size={16} color={i < todayWater ? '#fff' : '#B0B0B5'} />
            </button>
          ))}
          <button style={styles.waterAdd} onClick={() => setWater(w => ({ ...w, [today]: Math.min(waterGoal, (w[today] ?? 0) + 1) }))} aria-label="Agregar vaso">
            <Plus size={16} color="#0A84FF" />
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <span style={styles.sectionTitle}>Sueño · anoche</span>
          <button style={styles.sleepBtn} onClick={logSleep}>
            <BedDouble size={14} color="#579DFF" /> Registrar
          </button>
        </div>
        <div style={styles.sleepValue}>
          {sleep.hours} h
          <span style={{ fontSize: 13, color: '#8E8E93', marginLeft: 8 }}>de las 8 h recomendadas</span>
        </div>
        <div style={styles.track}>
          <div style={{ ...styles.fill, width: `${Math.min(100, (sleep.hours / 8) * 100)}%`, background: '#5856D6' }} />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <span style={styles.sectionTitle}>Últimos 7 días</span>
          <span style={styles.sectionVal}><Footprints size={12} color="#8E8E93" /> pasos</span>
        </div>
        <div style={styles.chart}>
          {week.map((w, i) => (
            <div key={i} style={styles.chartCol}>
              <div style={styles.chartBarWrap}>
                <div
                  style={{
                    ...styles.chartBar,
                    height: `${Math.max(4, (w.value / maxWeek) * 100)}%`,
                    background: i === 6 ? '#34C759' : 'rgba(52,199,89,0.45)',
                  }}
                />
              </div>
              <span style={styles.chartLabel}>{w.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function minuteBurn(): number {
  const mins = 16 + Math.floor(Date.now() / 1000 / 60 / 3) % 24;
  return Math.min(30, mins);
}

const beatPulse: React.CSSProperties = {
  animation: 'pulseBeat 1s ease-in-out infinite',
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    background: '#fff',
    padding: '12px 16px 24px',
  },
  header: { fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 4 },
  ringsRow: { display: 'flex', justifyContent: 'space-around', padding: '10px 0 4px' },
  ringWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  hrCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#fff',
    borderRadius: 16,
    padding: '14px 16px',
    margin: '12px 0 4px',
    border: '1px solid rgba(0,0,0,0.07)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  hrIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    background: '#FF2D55',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hrMain: { flex: 1 },
  hrValue: { fontSize: 24, fontWeight: 700, color: '#111' },
  hrUnit: { fontSize: 13, fontWeight: 400, color: '#8E8E93' },
  hrLabel: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  section: { marginTop: 14 },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#111' },
  sectionVal: { fontSize: 13, color: '#8E8E93', display: 'flex', alignItems: 'center', gap: 4 },
  track: { height: 8, borderRadius: 4, background: '#F0F0F2', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, transition: 'width 0.5s ease' },
  waterRow: { display: 'flex', gap: 8, alignItems: 'center' },
  waterDrop: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterAdd: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: '1px dashed rgba(10,132,255,0.6)',
    background: 'rgba(10,132,255,0.06)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 10px',
    borderRadius: 12,
    border: 'none',
    background: 'rgba(88,86,214,0.08)',
    color: '#579DFF',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  sleepValue: { fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 8, display: 'flex', alignItems: 'baseline' },
  chart: { display: 'flex', gap: 8, alignItems: 'flex-end', height: 90, marginTop: 6 },
  chartCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' },
  chartBarWrap: { flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 4, minHeight: 4, transition: 'height 0.4s ease' },
  chartLabel: { fontSize: 10, color: '#8E8E93', textTransform: 'capitalize' as const },
};