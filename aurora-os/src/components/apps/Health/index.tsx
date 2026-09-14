import { useState, useEffect } from 'react';
import { Heart, Footprints, BedDouble, Droplet, Plus, TrendingUp } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import {
  Screen, AppHeader, Card, ProgressRing, ProgressBar, Button,
  openPrompt,
} from '../../ui';

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

  const logSleep = async () => {
    const h = await openPrompt({
      title: 'Horas de sueño de anoche',
      message: 'Ej. 7.5',
      value: String(sleep.hours),
      kind: 'number',
      confirmText: 'Guardar',
    });
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

  const minuteBurn = (): number => {
    const mins = 16 + Math.floor(Date.now() / 1000 / 60 / 3) % 24;
    return Math.min(30, mins);
  };

  return (
    <Screen padding="0 16px 24px">
      <AppHeader title="Salud" />

      <Card style={{ padding: '16px 8px', marginBottom: 12 }}>
        <div style={styles.ringsRow}>
          {[
            { label: 'Pasos', value: Math.round((todaySteps / goalSteps) * 100), color: 'var(--success)' },
            { label: 'Ejercicio', value: Math.min(100, Math.round((minuteBurn() / 30) * 100)), color: 'var(--warning)' },
            { label: 'Agua', value: Math.round((todayWater / waterGoal) * 100), color: 'var(--primary)' },
          ].map(r => (
            <ProgressRing
              key={r.label}
              value={r.value / 100}
              size={70}
              strokeWidth={10}
              color={r.color}
              trackColor="var(--bg-tertiary)"
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{r.value}%</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{r.label}</div>
              </div>
            </ProgressRing>
          ))}
        </div>
      </Card>

      <Card style={{ ...styles.hrCard, marginBottom: 12 }}>
        <div style={styles.hrIcon}>
          <Heart size={20} color="#fff" fill="#fff" style={beatPulse} />
        </div>
        <div style={styles.hrMain}>
          <div style={styles.hrValue}>{hr} <span style={styles.hrUnit}>lpm</span></div>
          <div style={styles.hrLabel}>Latidos por minuto · en vivo</div>
        </div>
        <TrendingUp size={16} color="var(--success)" />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <div style={styles.sectionHead}>
          <span style={styles.sectionTitle}>Pasos de hoy</span>
          <span style={styles.sectionVal}>{fmtNum(todaySteps)} / {fmtNum(goalSteps)}</span>
        </div>
        <ProgressBar value={Math.min(1, todaySteps / goalSteps)} color="var(--success)" />
      </Card>

      <Card style={{ marginBottom: 12 }}>
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
                background: i < todayWater ? 'var(--primary)' : 'var(--bg-tertiary)',
                cursor: 'default',
              }}
              onClick={() => i === todayWater && setWater(w => ({ ...w, [today]: (w[today] ?? 0) + 1 }))}
              aria-label={`Vaso ${i + 1}`}
            >
              <Droplet size={16} color={i < todayWater ? '#fff' : 'var(--text-tertiary)'} />
            </button>
          ))}
          <button className="pressable" style={styles.waterAdd} onClick={() => setWater(w => ({ ...w, [today]: Math.min(waterGoal, (w[today] ?? 0) + 1) }))} aria-label="Agregar vaso">
            <Plus size={16} color="var(--accent)" />
          </button>
        </div>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <div style={styles.sectionHead}>
          <span style={styles.sectionTitle}>Sueño · anoche</span>
          <Button size="sm" variant="secondary" onClick={logSleep} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <BedDouble size={14} color="#579DFF" /> Registrar
          </Button>
        </div>
        <div style={styles.sleepValue}>
          {sleep.hours} h
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 8 }}>de las 8 h recomendadas</span>
        </div>
        <ProgressBar value={Math.min(1, sleep.hours / 8)} color="var(--tertiary)" />
      </Card>

      <Card>
        <div style={styles.sectionHead}>
          <span style={styles.sectionTitle}>Últimos 7 días</span>
          <span style={styles.sectionVal}><Footprints size={12} color="var(--text-secondary)" /> pasos</span>
        </div>
        <div style={styles.chart}>
          {week.map((w, i) => (
            <div key={i} style={styles.chartCol}>
              <div style={styles.chartBarWrap}>
                <div
                  style={{
                    ...styles.chartBar,
                    height: `${Math.max(4, (w.value / maxWeek) * 100)}%`,
                    background: i === 6 ? 'var(--success)' : 'rgba(52,199,89,0.45)',
                  }}
                />
              </div>
              <span style={styles.chartLabel}>{w.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </Screen>
  );
}

const beatPulse: React.CSSProperties = {
  animation: 'pulseBeat 1s ease-in-out infinite',
};

const styles: Record<string, React.CSSProperties> = {
  ringsRow: { display: 'flex', justifyContent: 'space-around', padding: '4px 0' },
  hrCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
  },
  hrIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    background: '#FF2D55',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  hrMain: { flex: 1, minWidth: 0 },
  hrValue: { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' },
  hrUnit: { fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)' },
  hrLabel: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' },
  sectionVal: { fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 },
  waterRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
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
    border: '1px dashed var(--accent)',
    background: 'rgba(10,132,255,0.08)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sleepValue: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'baseline' },
  chart: { display: 'flex', gap: 8, alignItems: 'flex-end', height: 90, marginTop: 6 },
  chartCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' },
  chartBarWrap: { flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 4, minHeight: 4, transition: 'height 0.4s ease' },
  chartLabel: { fontSize: 10, color: 'var(--text-secondary)', textTransform: 'capitalize' as const },
};