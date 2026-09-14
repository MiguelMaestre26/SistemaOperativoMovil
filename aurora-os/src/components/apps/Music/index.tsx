import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Search, X, Heart, Volume2, Music2, Loader2 } from 'lucide-react';
import { searchSongs, artworkUrl, type ITunesSong } from '../../../core/streaming';
import { usePersistedState } from '../../../core/persistence';
import { Screen, AppHeader, EmptyState } from '../../ui';

export default function Music() {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<ITunesSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<ITunesSong | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [liked, setLiked] = usePersistedState<string[]>('music:liked2', []);
  const [volume, setVolume] = usePersistedState<number>('music:volume', 0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const songsRef = useRef<ITunesSong[]>([]);
  songsRef.current = songs;

  useEffect(() => {
    const a = new Audio();
    audioRef.current = a;
    const onTime = () => {
      setProgress(a.currentTime);
      setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      const idx = songsRef.current.findIndex(s => current?.trackId === s.trackId);
      const nxt = songsRef.current[idx + 1];
      if (nxt) void play(nxt);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onTime);
    a.addEventListener('ended', onEnd);
    a.addEventListener('play', () => setPlaying(true));
    a.addEventListener('pause', () => setPlaying(false));
    a.addEventListener('error', () => setPlaying(false));
    return () => {
      a.pause();
      a.removeAttribute('src');
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSongs([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchSongs(query.trim());
        setSongs(res);
      } catch {
        setSongs([]);
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const play = async (s: ITunesSong) => {
    setCurrent(s);
    const a = audioRef.current;
    if (!a) return;
    if (!s.previewUrl) {
      setPlaying(false);
      return;
    }
    a.src = s.previewUrl;
    a.volume = volume;
    try {
      await a.play();
    } catch {
      setPlaying(false);
    }
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  const step = (dir: 1 | -1) => {
    if (songs.length === 0) return;
    const idx = songs.findIndex(s => s.trackId === current?.trackId);
    const next = songs[(idx + dir + songs.length) % songs.length];
    void play(next);
  };

  const toggleLiked = (id: number) => {
    setLiked(ls => (ls.includes(String(id)) ? ls.filter(x => x !== String(id)) : [...ls, String(id)]));
  };

  const onSeek = (v: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = v;
    setProgress(v);
  };

  return (
    <Screen scroll={false} padding="0">
      <AppHeader title="Música" />

      <div style={styles.searchRow}>
        <div className="pressable" style={styles.searchBox}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar canciones…"
            style={styles.searchInput}
          />
          {query && (
            <button style={styles.clearBtn} onClick={() => setQuery('')} aria-label="Limpiar">
              <X size={14} color="var(--text-secondary)" />
            </button>
          )}
        </div>
      </div>

      <div style={styles.library}>
        {loading ? (
          <div style={styles.centerBox}>
            <Loader2 size={26} color="var(--accent)" className="spin" />
            <span style={styles.centerText}>Buscando en iTunes…</span>
          </div>
        ) : query && songs.length === 0 ? (
          <EmptyState icon={<Music2 size={28} color="var(--text-secondary)" />} title="Sin resultados" />
        ) : !query ? (
          <EmptyState
            icon={<Music2 size={28} color="var(--text-secondary)" />}
            title="Busca una canción"
            subtitle="Escribe un artista o tema para reproducir su preview"
          />
        ) : (
          songs.map(s => {
            const active = s.trackId === current?.trackId;
            return (
              <button
                key={s.trackId}
                className="pressable"
                style={{ ...styles.track, ...(active ? styles.trackActive : {}) }}
                onClick={() => (active ? toggle() : void play(s))}
              >
                <div style={styles.albumArt}>
                  {s.artworkUrl100 ? (
                    <img src={artworkUrl(s.artworkUrl100)} alt="" className="no-invert" style={styles.artImg} />
                  ) : (
                    <Music2 size={16} color="#fff" />
                  )}
                </div>
                <div style={styles.trackMain}>
                  <div style={{ ...styles.trackTitle, color: active ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {s.trackName}
                  </div>
                  <div style={styles.trackMeta}>{s.artistName} · {s.collectionName}</div>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  style={styles.heart}
                  onClick={e => { e.stopPropagation(); toggleLiked(s.trackId); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      toggleLiked(s.trackId);
                    }
                  }}
                >
                  <Heart
                    size={17}
                    color={liked.includes(String(s.trackId)) ? '#FF2D55' : 'var(--text-tertiary)'}
                    fill={liked.includes(String(s.trackId)) ? '#FF2D55' : 'none'}
                  />
                </span>
              </button>
            );
          })
        )}
      </div>

      <div style={styles.nowPlaying}>
        <div style={styles.artLarge}>
          {current?.artworkUrl100 ? (
            <img src={artworkUrl(current.artworkUrl100)} alt="" className="no-invert" style={styles.artImgLarge} />
          ) : (
            <Music2 size={20} color="#fff" />
          )}
        </div>
        <div style={styles.nowMain}>
          <div style={styles.nowTitle}>{current?.trackName ?? 'Sin reproducir'}</div>
          <div style={styles.nowMeta}>{current ? `${current.artistName} · Preview` : 'Busca y toca una canción'}</div>
          <div style={styles.sliderWrap}>
            <input
              type="range"
              min={0}
              max={duration || 1}
              value={Math.min(progress, duration || 1)}
              onChange={e => onSeek(Number(e.target.value))}
              style={styles.slider}
              disabled={!current}
            />
            <div style={styles.times}>
              <span>{fmt(progress)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
          <div style={styles.controls}>
            <button style={styles.ctl} onClick={() => step(-1)} aria-label="Anterior">
              <SkipBack size={22} color="var(--text-primary)" />
            </button>
            <button style={styles.playBtn} onClick={toggle} aria-label="Reproducir/pausar">
              {playing ? <Pause size={26} color="#fff" /> : <Play size={26} color="#fff" style={{ marginLeft: 3 }} />}
            </button>
            <button style={styles.ctl} onClick={() => step(1)} aria-label="Siguiente">
              <SkipForward size={22} color="var(--text-primary)" />
            </button>
          </div>
          <div style={styles.volRow}>
            <Volume2 size={15} color="var(--text-secondary)" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={e => {
                const v = Number(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
              style={styles.slider}
            />
          </div>
        </div>
      </div>
    </Screen>
  );
}

function fmt(sec: number): string {
  if (!Number.isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles: Record<string, React.CSSProperties> = {
  searchRow: { width: '100%', boxSizing: 'border-box' as const, padding: '8px 16px', flexShrink: 0 },
  searchBox: {
    height: 38,
    borderRadius: 12,
    background: 'var(--surface-input)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 14px',
  },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 15, color: 'var(--text-primary)', background: 'none' },
  clearBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  library: { flex: 1, overflowY: 'auto', padding: '0 16px', display: 'flex', flexDirection: 'column' },
  centerBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0', textAlign: 'center' as const },
  centerText: { fontSize: 13, color: 'var(--text-secondary)' },
  track: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '9px 10px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    borderRadius: 14,
    borderBottom: '0.5px solid var(--separator-cell)',
  },
  trackActive: {
    background: 'var(--bg-tertiary)',
    borderRadius: 14,
    borderBottomColor: 'transparent',
    marginTop: -1,
  },
  albumArt: {
    width: 46,
    height: 46,
    borderRadius: 10,
    background: 'linear-gradient(135deg, var(--primary), #5AC8FA)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  artImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
  artImgLarge: { width: '100%', height: '100%', objectFit: 'cover' as const, borderRadius: 14 },
  trackMain: { flex: 1, minWidth: 0 },
  trackTitle: { fontSize: 15, fontWeight: 600 },
  trackMeta: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  heart: { cursor: 'pointer', padding: 6, display: 'flex' },
  nowPlaying: {
    display: 'flex',
    gap: 14,
    padding: '14px 16px 18px',
    background: 'var(--surface-card)',
    borderTop: '0.5px solid var(--separator-cell)',
  },
  artLarge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: 'linear-gradient(135deg, var(--tertiary), var(--primary))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  nowMain: { flex: 1, minWidth: 0 },
  nowTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' },
  nowMeta: { fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 },
  sliderWrap: { marginTop: 8 },
  slider: { width: '100%', accentColor: 'var(--primary)', height: 4 },
  times: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 },
  controls: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 8 },
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
    background: 'var(--accent)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-md)',
  },
  volRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 },
};