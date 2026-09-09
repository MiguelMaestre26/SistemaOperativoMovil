import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Film, Eye } from 'lucide-react';
import { tonePlayer, parseMelody } from '../../../core/audio';

interface Clip {
  id: string;
  title: string;
  desc: string;
  duration: number;
  views: string;
  colors: string[];
  scene: 'ocean' | 'sunset' | 'city' | 'forest';
  bpm: number;
  melody: string[];
}

const CLIPS: Clip[] = [
  {
    id: 'v1', title: 'Amanecer en el Pacífico', desc: 'Paisajes costeros de Costa Rica grabados en 4K.',
    duration: 42, views: '128 mil', colors: ['#FF9A3C', '#FF5E62', '#2B3A67'], scene: 'sunset', bpm: 92,
    melody: ['C4', 'E4', 'G4', 'C5', 'B4', 'G4', 'E4', 'D4'],
  },
  {
    id: 'v2', title: 'Ciudad de noche en timelapse', desc: 'Las luces del Valle Central al ritmo de la ciudad.',
    duration: 64, views: '89 mil', colors: ['#1B2A52', '#4B6CB7', '#FBB034'], scene: 'city', bpm: 118,
    melody: ['A3', 'A3', 'C4', 'E4', 'A4', 'A4', 'G4', 'E4'],
  },
  {
    id: 'v3', title: 'Bosque nuboso: sonidos y flora', desc: 'Un paseo silencioso entre helechos y quetzales.',
    duration: 55, views: '210 mil', colors: ['#2F5D3A', '#6BA368', '#37474F'], scene: 'forest', bpm: 70,
    melody: ['E3', 'A3', 'C4', 'E4', 'D4', 'C4', 'A3', 'G3'],
  },
  {
    id: 'v4', title: 'Olas largas en la Playa Hermosa', desc: 'Surf, arena y la mejor luz del día.',
    duration: 38, views: '56 mil', colors: ['#0EA5E9', '#0277BD', '#B3E5FC'], scene: 'ocean', bpm: 100,
    melody: ['F3', 'A3', 'C4', 'F4', 'E4', 'C4', 'A3', 'F3'],
  },
];

export default function Videos() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [pos, setPos] = useState(0);
  const [session, setSession] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const posRef = useRef<number>(0);
  const playingRef = useRef(false);

  const clip = CLIPS.find(c => c.id === playingId) ?? null;

  const draw = (now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);
    const t = (now - startRef.current) / 1000;

    const colors = clip?.colors ?? ['#0EA5E9', '#0277BD'];
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const scene = clip?.scene ?? 'ocean';
    if (scene === 'ocean') {
      for (let i = 0; i < 5; i++) {
        const y = h * 0.5 + Math.sin(t * 1.2 + i) * 22 + i * 28;
        ctx.fillStyle = `rgba(255,255,255,${0.06 + i * 0.02})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 20) {
          ctx.lineTo(x, y + Math.sin(x * 0.02 + t * 3 + i) * 10);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();
      }
    } else if (scene === 'sunset') {
      ctx.fillStyle = 'rgba(255,200,80,0.85)';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.62, 60 + Math.sin(t) * 3, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.04 + i * 0.015})`;
        ctx.fillRect(0, h * 0.7 + i * (h * 0.04), w, h * 0.03 + Math.sin(t + i) * 8);
      }
    } else if (scene === 'city') {
      for (let i = 0; i < 14; i++) {
        const bw = w / 14;
        const bh = h * (0.25 + ((i * 37) % 50) / 100);
        ctx.fillStyle = ['#0F1B2D', '#16283F'][i % 2];
        ctx.fillRect(i * bw, h - bh, bw - 3, bh);
        ctx.fillStyle = `hsla(${(i * 35 + t * 40) % 360}, 90%, 60%, 0.9)`;
        const win = Math.floor(bh / 12);
        for (let wy = 0; wy < win; wy++) {
          if ((i + wy) % 3 === 0) ctx.fillRect(i * bw + 6, h - bh + 6 + wy * 12, 4, 4);
        }
      }
    } else {
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(255,255,255,${0.14 - i * 0.03})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 16) {
          const y = h * 0.35 + Math.sin((x + t * 60) * 0.01) * 28 * (i + 1) * 0.5 + i * 40;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(w * 0.7, h * 0.22, 18 + Math.sin(t * 2) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (playingRef.current) {
      const p = (now - startRef.current) / 1000;
      posRef.current = p;
      setPos(p);
      if (clip && p >= clip.duration) {
        setPlayingId(null);
        tonePlayer.pause();
        return;
      }
      rafRef.current = requestAnimationFrame(draw);
    }
  };

  useEffect(() => {
    if (!clip) return;
    startRef.current = performance.now() - posRef.current * 1000;
    playingRef.current = true;
    tonePlayer.setTempo(clip.bpm);
    tonePlayer.load(parseMelody(clip.melody));
    tonePlayer.resume();
    posRef.current = 0;
    setPos(0);
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      playingRef.current = false;
      cancelAnimationFrame(rafRef.current);
      tonePlayer.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingId, session]);

  const togglePause = () => {
    if (!clip) return;
    if (playingRef.current) {
      playingRef.current = false;
      cancelAnimationFrame(rafRef.current);
      tonePlayer.pause();
    } else {
      startRef.current = performance.now() - posRef.current * 1000;
      playingRef.current = true;
      tonePlayer.setTempo(clip.bpm);
      tonePlayer.load(parseMelody(clip.melody));
      tonePlayer.seek(posRef.current);
      tonePlayer.resume();
      rafRef.current = requestAnimationFrame(draw);
    }
  };

  const pct = clip ? Math.min(100, (pos / clip.duration) * 100) : 0;
  const finished = clip && pos >= clip.duration;

  if (clip) {
    return (
      <div style={styles.container}>
        <div style={styles.playerHeader}>
          <button style={styles.iconBtn} onClick={() => setPlayingId(null)} aria-label="Cerrar">
            <SkipBack size={20} color="#007AFF" />
          </button>
          <span style={styles.playerTitle}>{clip.title}</span>
          <span style={{ width: 30 }} />
        </div>

        <div style={styles.stage}>
          <canvas ref={canvasRef} style={styles.canvas} />
          {finished && (
            <div style={styles.replayOverlay}>
              <button style={styles.replayBtn} onClick={() => { posRef.current = 0; setPos(0); setSession(s => s + 1); }}>
                <Play size={28} color="#fff" />
              </button>
            </div>
          )}
          {!playingRef.current && !finished && (
            <div style={styles.pausedOverlay} onClick={togglePause}>
              <Play size={34} color="#fff" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }} />
            </div>
          )}
        </div>

        <div style={styles.playerInfo}>
          <div style={styles.vidTitle}>{clip.title}</div>
          <div style={styles.vidViews}>{clip.views} vistas · {clip.duration}s</div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${pct}%` }} />
          </div>
          <div style={styles.playerControls}>
            <button style={styles.ctlBtn} onClick={() => { posRef.current = Math.max(0, posRef.current - 5); startRef.current = performance.now() - posRef.current * 1000; }} aria-label="Retroceder">
              <SkipBack size={20} color="#fff" />
            </button>
            <button style={styles.playBtn} onClick={togglePause} aria-label="Reproducir/pausar">
              {playingRef.current ? <Pause size={22} color="#fff" /> : <Play size={22} color="#fff" style={{ marginLeft: 2 }} />}
            </button>
            <button style={styles.ctlBtn} onClick={() => { posRef.current = Math.min(clip.duration, posRef.current + 5); startRef.current = performance.now() - posRef.current * 1000; }} aria-label="Avanzar">
              <SkipForward size={20} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Film size={20} color="#FF3B30" />
        <span style={styles.title}>Videos</span>
      </div>
      <div style={styles.feed}>
        {CLIPS.map(c => (
          <button key={c.id} style={styles.card} onClick={() => { posRef.current = 0; setPlayingId(c.id); }}>
            <div style={{ ...styles.thumb, background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})` }}>
              <span style={styles.thumbIcon}>
                <Play size={22} color="#fff" />
              </span>
              <span style={styles.thumbDur}>{c.duration}s</span>
            </div>
            <div style={styles.cardMain}>
              <div style={styles.cardTitle}>{c.title}</div>
              <div style={styles.cardDesc}>{c.desc}</div>
              <div style={styles.cardViews}>
                <Eye size={12} color="#8E8E93" /> {c.views} vistas
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' },
  header: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 6px' },
  title: { fontSize: 22, fontWeight: 700, color: '#111' },
  feed: { flex: 1, overflowY: 'auto', padding: '0 16px 20px' },
  card: {
    width: '100%',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: 0,
    marginBottom: 18,
    textAlign: 'left' as const,
  },
  thumb: {
    width: '100%',
    aspectRatio: '16/9',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  thumbIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbDur: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 8,
  },
  cardMain: { padding: '10px 2px 0' },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#111' },
  cardDesc: { fontSize: 13, color: '#8E8E93', marginTop: 3, lineHeight: 1.4 },
  cardViews: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8E8E93', marginTop: 6 },
  playerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    borderBottom: '0.5px solid rgba(0,0,0,0.08)',
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerTitle: { fontSize: 14, fontWeight: 600, color: '#111' },
  stage: { position: 'relative', aspectRatio: '16/9', background: '#000', overflow: 'hidden' },
  canvas: { width: '100%', height: '100%', display: 'block' },
  pausedOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  replayOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.45)',
  },
  replayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    border: 'none',
    background: 'rgba(255,255,255,0.2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfo: { padding: '14px 16px', flex: 1 },
  vidTitle: { fontSize: 17, fontWeight: 700, color: '#111' },
  vidViews: { fontSize: 13, color: '#8E8E93', marginTop: 3 },
  progressTrack: { height: 5, borderRadius: 3, background: '#E5E5EA', marginTop: 14, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#FF3B30', borderRadius: 3 },
  playerControls: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: 16 },
  ctlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    border: 'none',
    background: '#FF3B30',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    border: 'none',
    background: '#FF3B30',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(255,59,48,0.4)',
  },
};