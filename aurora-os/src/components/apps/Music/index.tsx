import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music2, Heart, Volume2 } from 'lucide-react';
import { tonePlayer, parseMelody } from '../../../core/audio';
import { usePersistedState } from '../../../core/persistence';

interface Track {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  melody: string[];
  duration: number;
}

function makeTracks(): Track[] {
  const defs: Array<[string, string, number, string[]]> = [
    ['Amanecer', 'Chill Pop', 92, ['C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'E4', 'C4', 'E4', 'G4', 'B4', 'A4', 'G4', 'E4', 'D4']],
    ['Neones', 'Synthwave', 110, ['A3', 'C4', 'E4', 'A4', 'G4', 'E4', 'C4', 'A3', 'D4', 'F4', 'A4', 'C5', 'B4', 'A4', 'F4', 'D4']],
    ['Bosque', 'Ambient', 70, ['E3', 'A3', 'C4', 'E4', 'D4', 'C4', 'A3', 'G3', 'F3', 'A3', 'C4', 'F4', 'E4', 'C4', 'A3', 'G3']],
    ['Ritmo', 'House', 124, ['F3', 'A3', 'C4', 'F4', 'E4', 'C4', 'A3', 'F3', 'G3', 'B3', 'D4', 'G4', 'F4', 'D4', 'B3', 'G3']],
    ['Estrellas', 'Balada', 78, ['C4', 'E4', 'G4', 'C5', 'B4', 'G4', 'E4', 'D4', 'A3', 'C4', 'E4', 'A4', 'G4', 'E4', 'D4', 'C4']],
    ['Frecuencia', 'Electrónica', 132, ['A3', 'A3', 'C4', 'E4', 'A4', 'A4', 'G4', 'E4', 'D4', 'D4', 'F4', 'A4', 'C5', 'C5', 'B4', 'A4']],
  ];
  return defs.map(([title, genre, bpm, melody]) => ({
    id: title.toLowerCase().replace(/\s/g, '-'),
    title,
    genre,
    bpm,
    melody,
    duration: Math.round(melody.length * (60 / bpm)),
  }));
}

export default function Music() {
  const tracksRef = useRef<Track[]>(makeTracks());
  const tracks = tracksRef.current;
  const [liked, setLiked] = usePersistedState<string[]>('music:liked', []);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(1);
  const [volume, setVolume] = usePersistedState<number>('music:volume', 0.7);

  const current = tracks.find(t => t.id === currentId) ?? null;

  useEffect(() => {
    tonePlayer.onProgress = (pos, tot) => {
      setProgress(pos);
      setTotal(tot);
      if (currentId && pos >= tot - 0.25 && tonePlayer.playing) {
        const cur = tracksRef.current.find(x => x.id === currentId);
        if (cur) {
          const idx = tracksRef.current.findIndex(x => x.id === cur.id);
          const nxt = tracksRef.current[(idx + 1) % tracksRef.current.length];
          tonePlayer.stop();
          tonePlayer.setTempo(nxt.bpm);
          tonePlayer.load(parseMelody(nxt.melody));
          tonePlayer.resume();
          setCurrentId(nxt.id);
          setProgress(0);
          setTotal(tonePlayer.getTotal());
        }
      }
    };
    return () => {
      tonePlayer.pause();
      tonePlayer.onProgress = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  useEffect(() => {
    setPlaying(tonePlayer.playing);
  }, [playing]);

  const playTrack = (id: string) => {
    const t = tracks.find(x => x.id === id);
    if (!t) return;
    setCurrentId(id);
    tonePlayer.setTempo(t.bpm);
    tonePlayer.load(parseMelody(t.melody));
    tonePlayer.setVolume(volume);
    tonePlayer.resume();
    setProgress(0);
    setTotal(tonePlayer.getTotal());
    setPlaying(true);
  };

  const toggle = () => {
    if (!current) {
      playTrack(tracks[0]?.id);
      return;
    }
    tonePlayer.toggle();
    setPlaying(tonePlayer.playing);
  };

  const next = () => {
    if (!current) return;
    const idx = tracks.findIndex(t => t.id === current.id);
    playTrack(tracks[(idx + 1) % tracks.length].id);
  };

  const prev = () => {
    if (tonePlayer.getPosition() > 3) {
      tonePlayer.seek(0);
      return;
    }
    if (!current) return;
    const idx = tracks.findIndex(t => t.id === current.id);
    playTrack(tracks[(idx - 1 + tracks.length) % tracks.length].id);
  };

  const toggleLiked = (id: string) => {
    setLiked(ls => (ls.includes(id) ? ls.filter(x => x !== id) : [...ls, id]));
  };

  const onSeek = (v: number) => {
    tonePlayer.seek(v);
    setProgress(v);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Música</span>
      </div>

      <div style={styles.library}>
        {tracks.map(t => (
          <button
            key={t.id}
            style={{ ...styles.track, ...(t.id === currentId ? styles.trackActive : {}) }}
            onClick={() => (currentId === t.id ? toggle() : playTrack(t.id))}
          >
            <div style={styles.albumArt}>
              {currentId === t.id && playing ? (
                <span style={styles.eq}>
                  <span style={styles.eqBar} /><span style={{ ...styles.eqBar, animationDelay: '0.2s' }} /><span style={{ ...styles.eqBar, animationDelay: '0.4s' }} />
                </span>
              ) : t.id === currentId ? (
                <Pause size={16} color="#fff" />
              ) : (
                <Music2 size={16} color="#fff" />
              )}
            </div>
            <div style={styles.trackMain}>
              <div style={styles.trackTitle}>{t.title}</div>
              <div style={styles.trackMeta}>{t.genre} · {t.bpm} bpm · {t.duration}s</div>
            </div>
            <span
              role="button"
              tabIndex={0}
              style={styles.heart}
              onClick={e => { e.stopPropagation(); toggleLiked(t.id); }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  toggleLiked(t.id);
                }
              }}
            >
              <Heart size={17} color={liked.includes(t.id) ? '#FF2D55' : '#D1D1D6'} fill={liked.includes(t.id) ? '#FF2D55' : 'none'} />
            </span>
          </button>
        ))}
      </div>

      <div style={styles.nowPlaying}>
        <div style={styles.artLarge}>
          {current ? (
            <span style={styles.eq}>
              <span style={styles.eqBar} /><span style={{ ...styles.eqBar, animationDelay: '0.2s' }} /><span style={{ ...styles.eqBar, animationDelay: '0.4s' }} />
            </span>
          ) : (
            <Music2 size={20} color="#fff" />
          )}
        </div>
        <div style={styles.nowMain}>
          <div style={styles.nowTitle}>{current?.title ?? 'Sin reproducir'}</div>
          <div style={styles.nowMeta}>{current ? `${current.genre} · ${current.bpm} bpm` : 'Toca una canción para empezar'}</div>
          <div style={styles.sliderWrap}>
            <input
              type="range"
              min={0}
              max={total}
              value={Math.min(progress, total)}
              onChange={e => onSeek(Number(e.target.value))}
              style={styles.slider}
              disabled={!current}
            />
            <div style={styles.times}>
              <span>{fmt(progress)}</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
          <div style={styles.controls}>
            <button style={styles.ctl} onClick={prev} aria-label="Anterior">
              <SkipBack size={22} color="#111" />
            </button>
            <button style={styles.playBtn} onClick={toggle} aria-label="Reproducir/pausar">
              {playing ? <Pause size={26} color="#fff" /> : <Play size={26} color="#fff" style={{ marginLeft: 3 }} />}
            </button>
            <button style={styles.ctl} onClick={next} aria-label="Siguiente">
              <SkipForward size={22} color="#111" />
            </button>
          </div>
          <div style={styles.volRow}>
            <Volume2 size={15} color="#8E8E93" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={e => {
                const v = Number(e.target.value);
                setVolume(v);
                tonePlayer.setVolume(v);
              }}
              style={styles.slider}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
  },
  header: {
    padding: '12px 16px 6px',
  },
  title: { fontSize: 22, fontWeight: 700, color: '#111' },
  library: { flex: 1, overflowY: 'auto', padding: '4px 16px' },
  track: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '9px 0',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    borderBottom: '0.5px solid rgba(0,0,0,0.05)',
  },
  trackActive: {},
  albumArt: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #007AFF, #5AC8FA)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trackMain: { flex: 1, minWidth: 0 },
  trackTitle: { fontSize: 15, fontWeight: 600, color: '#111' },
  trackMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  heart: { cursor: 'pointer', padding: 6, display: 'flex' },
  nowPlaying: {
    display: 'flex',
    gap: 14,
    padding: '14px 16px 18px',
    background: '#F7F7F9',
    borderTop: '0.5px solid rgba(0,0,0,0.08)',
  },
  artLarge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: 'linear-gradient(135deg, #5856D6, #007AFF)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nowMain: { flex: 1, minWidth: 0 },
  nowTitle: { fontSize: 15, fontWeight: 700, color: '#111' },
  nowMeta: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  sliderWrap: { marginTop: 8 },
  slider: {
    width: '100%',
    accentColor: '#007AFF',
    height: 4,
  },
  times: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    marginTop: 8,
  },
  ctl: {
    width: 38,
    height: 38,
    borderRadius: 19,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    border: 'none',
    background: '#007AFF',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,122,255,0.35)',
  },
  volRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  eq: { display: 'flex', gap: 2, alignItems: 'flex-end', height: 16 },
  eqBar: {
    width: 3,
    height: 16,
    borderRadius: 1,
    background: '#fff',
    animation: 'blink 0.9s infinite ease-in-out',
  },
};