import { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, SkipForward, RotateCcw, Radio } from 'lucide-react';
import { usePersistedState } from '../../../core/persistence';
import { tonePlayer } from '../../../core/audio';

interface Episode {
  id: string;
  title: string;
  show: string;
  summary: string;
  duration: number;
  date: string;
}

const EPISODES: Episode[] = [
  {
    id: 'e1',
    title: 'El origen de la ciudad',
    show: 'Historias de San José',
    summary: 'Cómo un pueblo rural se convirtió en la capital moderna: cafetales, trenes y arquitectura.',
    duration: 1840,
    date: '2 sep',
  },
  {
    id: 'e2',
    title: 'Café: de la finca a la taza',
    show: 'Sabores de Costa Rica',
    summary: 'Recorremos los procesos de cultivo, tueste y las notas que distinguen al café tico.',
    duration: 2210,
    date: '29 ago',
  },
  {
    id: 'e3',
    title: 'Inteligencia artificial explicada',
    show: 'Tecnología para todos',
    summary: 'Sin jerga: qué es un modelo de lenguaje, cómo aprende y qué significa para tu día a día.',
    duration: 1960,
    date: '25 ago',
  },
  {
    id: 'e4',
    title: 'Volcanes y biodiversidad',
    show: 'Naturaleza Viva',
    summary: 'Poás, Arenal y la riqueza natural que convierte al país en laboratorio del mundo.',
    duration: 2500,
    date: '21 ago',
  },
  {
    id: 'e5',
    title: 'Música que nadie escucha',
    show: 'Curiosidades',
    summary: 'El impacto de los sintetizadores, la patrona digital y cómo tu teléfono hace sonidos.',
    duration: 1530,
    date: '18 ago',
  },
];

function fmtDur(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function Podcasts() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [played, setPlayed] = usePersistedState<Record<string, number>>('podcasts:played', {});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ep = EPISODES.find(e => e.id === openId) ?? null;
  const pos = ep ? played[ep.id] ?? 0 : 0;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      tonePlayer.pause();
    };
  }, []);

  const startAmbient = () => {
    tonePlayer.setVolume(0.06);
    tonePlayer.setTempo(72);
    tonePlayer.load([196.0, 196.0, 220.0, 220.0, 174.61, 174.61, 220.0, 220.0]);
    tonePlayer.resume();
  };

  const toggle = () => {
    if (!ep) return;
    if (playing) {
      tonePlayer.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setPlaying(false);
    } else {
      startAmbient();
      timerRef.current = setInterval(() => {
        setPlayed(p => {
          const cur = p[ep.id] ?? 0;
          return { ...p, [ep.id]: cur + 1 * speed };
        });
      }, 1000);
      setPlaying(true);
    }
  };

  useEffect(() => {
    if (!playing || !ep) return;
    if (pos >= ep.duration) {
      tonePlayer.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setPlaying(false);
    }
  }, [pos, playing, ep, speed]);

  const seekTo = (v: number) => {
    if (!ep) return;
    setPlayed(p => ({ ...p, [ep.id]: Math.max(0, Math.min(ep.duration, v)) }));
  };

  if (ep) {
    return (
      <div style={styles.container}>
        <div style={styles.playerHeader}>
          <button style={styles.iconBtn} onClick={() => { tonePlayer.pause(); setOpenId(null); }} aria-label="Volver">
            <ChevronLeft size={22} color="#007AFF" />
          </button>
          <span style={styles.playerBrand}>Aurora Podcasts</span>
          <span style={{ width: 32 }} />
        </div>

        <div style={styles.playerBody}>
          <div style={styles.cover}>
            <Radio size={40} color="#fff" />
          </div>
          <div style={styles.epTitle}>{ep.title}</div>
          <div style={styles.epShow}>{ep.show} · {ep.date}</div>

          <div style={styles.progressArea}>
            <input
              type="range"
              min={0}
              max={ep.duration}
              value={Math.min(pos, ep.duration)}
              onChange={e => seekTo(Number(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.times}>
              <span>{fmtDur(pos)}</span>
              <span>-{fmtDur(Math.max(0, ep.duration - pos))}</span>
            </div>
          </div>

          <div style={styles.controls}>
            <button style={styles.ctlBtn} onClick={() => seekTo(Math.max(0, pos - 15))} aria-label="Retroceder 15 s">
              <RotateCcw size={22} color="#111" />
            </button>
            <button style={styles.playBtn} onClick={toggle} aria-label="Reproducir/pausar">
              {playing ? <Pause size={26} color="#fff" /> : <Play size={26} color="#fff" style={{ marginLeft: 3 }} />}
            </button>
            <button style={styles.ctlBtn} onClick={() => seekTo(Math.min(ep.duration, pos + 15))} aria-label="Avanzar 15 s">
              <SkipForward size={22} color="#111" />
            </button>
          </div>

          <div style={styles.speedRow}>
            {[0.75, 1, 1.25, 1.5, 2].map(s => (
              <button
                key={s}
                style={{
                  ...styles.speedBtn,
                  ...(s === speed ? styles.speedBtnActive : {}),
                  opacity: s === speed ? 1 : 0.55,
                }}
                onClick={() => setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>

          {playing && (
            <div style={styles.eqRow}>
              <span style={styles.eqBar} /><span style={{ ...styles.eqBar, animationDelay: '0.25s' }} /><span style={{ ...styles.eqBar, animationDelay: '0.5s' }} />
              <span style={styles.playingLabel}>Reproduciendo…</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Podcasts</span>
      </div>
      <div style={styles.banner}>
        <Radio size={24} color="#fff" />
        <div>
          <div style={styles.bannerTitle}>Historias de Aurora</div>
          <div style={styles.bannerSub}>5 episodios · Español</div>
        </div>
      </div>
      <div style={styles.epList}>
        {EPISODES.map(e => (
          <button key={e.id} style={styles.ep} onClick={() => { setOpenId(e.id); setPlaying(false); setSpeed(1); }}>
            <div style={styles.epCover}>
              {e.title.charAt(0)}
            </div>
            <div style={styles.epMain}>
              <div style={styles.epShow}>{e.show}</div>
              <div style={styles.epTitleSm}>{e.title}</div>
              <div style={styles.epMeta}>{e.date} · {fmtDur(e.duration)}{(played[e.id] ?? 0) > 0 ? ' · Progreso' : ''}</div>
            </div>
            <div style={styles.epPlay}>
              <Play size={18} color="#007AFF" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' },
  header: { padding: '12px 16px 6px' },
  title: { fontSize: 22, fontWeight: 700, color: '#111' },
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '8px 16px 14px',
    padding: '16px',
    borderRadius: 16,
    background: 'linear-gradient(135deg, #5856D6, #007AFF)',
    color: '#fff',
  },
  bannerTitle: { fontSize: 16, fontWeight: 700 },
  bannerSub: { fontSize: 12, opacity: 0.85, marginTop: 2 },
  epList: { flex: 1, overflowY: 'auto', padding: '0 16px 20px' },
  ep: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    border: 'none',
    background: 'none',
    padding: '12px 0',
    cursor: 'pointer',
    borderBottom: '0.5px solid rgba(0,0,0,0.05)',
    textAlign: 'left' as const,
  },
  epCover: {
    width: 46,
    height: 46,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #FF9500, #FF2D55)',
    color: '#fff',
    fontSize: 20,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  epMain: { flex: 1, minWidth: 0 },
  epTitleSm: { fontSize: 15, fontWeight: 600, color: '#111', marginTop: 2 },
  epMeta: { fontSize: 12, color: '#8E8E93', marginTop: 3 },
  epPlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    background: 'rgba(0,122,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  playerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderBottom: '0.5px solid rgba(0,0,0,0.08)',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBrand: { fontSize: 15, fontWeight: 600, color: '#111' },
  playerBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '28px 24px',
  },
  cover: {
    width: 150,
    height: 150,
    borderRadius: 24,
    background: 'linear-gradient(135deg, #5856D6, #AF52DE)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 12px 32px rgba(88,86,214,0.35)',
  },
  epTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#111',
    textAlign: 'center' as const,
    marginTop: 24,
    lineHeight: 1.3,
  },
  epShow: { fontSize: 14, color: '#8E8E93', marginTop: 6 },
  progressArea: { width: '100%', marginTop: 26 },
  slider: {
    width: '100%',
    accentColor: '#007AFF',
    height: 4,
  },
  times: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    fontVariantNumeric: 'tabular-nums' as const,
  },
  controls: { display: 'flex', alignItems: 'center', gap: 34, marginTop: 20 },
  ctlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    border: 'none',
    background: 'rgba(0,122,255,0.08)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    border: 'none',
    background: '#007AFF',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(0,122,255,0.4)',
  },
  speedRow: { display: 'flex', gap: 8, marginTop: 22 },
  speedBtn: {
    padding: '7px 14px',
    borderRadius: 16,
    border: '1px solid rgba(0,122,255,0.35)',
    background: 'none',
    color: '#007AFF',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  speedBtnActive: { background: '#007AFF', color: '#fff', borderColor: '#007AFF' },
  eqRow: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 18 },
  eqBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    background: '#007AFF',
    animation: 'blink 1s infinite ease-in-out',
  },
  playingLabel: { fontSize: 13, color: '#8E8E93', marginLeft: 8 },
};