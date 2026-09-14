import { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, Search, X, Radio, Loader2, ListVideo } from 'lucide-react';
import { searchPodcasts, fetchPodcastEpisodes, artworkUrl, type ITunesPodcast, type PodcastEpisode } from '../../../core/streaming';
import { usePersistedState } from '../../../core/persistence';
import { Screen, AppHeader } from '../../ui';

export default function Podcasts() {
  const [query, setQuery] = useState('');
  const [shows, setShows] = useState<ITunesPodcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ITunesPodcast | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [epsLoading, setEpsLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ep, setEp] = useState<PodcastEpisode | null>(null);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [speed] = usePersistedState<number>('podcasts:speed', 1);
  const [played, setPlayed] = usePersistedState<Record<string, number>>('podcasts:played', {});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio();
    audioRef.current = a;
    const onTime = () => {
      setPos(a.currentTime);
      setDur(Number.isFinite(a.duration) ? a.duration : 0);
    };
    const onEnd = () => { setPlaying(false); setPos(0); };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onTime);
    a.addEventListener('ended', onEnd);
    a.addEventListener('play', () => setPlaying(true));
    a.addEventListener('pause', () => setPlaying(false));
    return () => {
      a.pause();
      a.removeAttribute('src');
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setShows([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        setShows(await searchPodcasts(query.trim()));
      } catch {
        setShows([]);
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const openShow = async (s: ITunesPodcast) => {
    setSelected(s);
    setEpisodes([]);
    setEpsLoading(true);
    try {
      setEpisodes(await fetchPodcastEpisodes(s.feedUrl ?? ''));
    } catch {
      setEpisodes([]);
    }
    setEpsLoading(false);
  };

  const playEpisode = async (e: PodcastEpisode) => {
    setEp(e);
    setPos(e.id === ep?.id ? played[e.id] ?? 0 : 0);
    const a = audioRef.current;
    if (!a) return;
    if (e.audioUrl) {
      a.src = e.audioUrl;
      a.playbackRate = speed;
      a.volume = 0.8;
      try {
        await a.play();
      } catch {
        setPlaying(false);
      }
    }
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !ep) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  const seekTo = (v: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = v;
    setPos(v);
    setPlayed(p => ({ ...p, [ep!.id]: v }));
  };

  useEffect(() => {
    if (!playing || !ep) return;
    const save = setInterval(() => {
      setPlayed(p => ({ ...p, [ep.id]: Math.max(p[ep.id] ?? 0, pos) }));
    }, 3000);
    return () => clearInterval(save);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  if (selected) {
    return (
      <Screen scroll={false} padding="0">
        <AppHeader
          variant="standard"
          title="Podcast"
          backLabel=""
          onBack={() => { audioRef.current?.pause(); setSelected(null); setEp(null); setPlaying(false); }}
        />

        <div style={styles.showHead}>
          <div style={styles.showArt}>
            {selected.artworkUrl100 ? (
              <img src={artworkUrl(selected.artworkUrl100)} alt="" className="no-invert" style={styles.showArtImg} />
            ) : (
              <Radio size={28} color="#fff" />
            )}
          </div>
          <div style={styles.showMain}>
            <div style={styles.showName}>{selected.collectionName}</div>
            <div style={styles.showBy}>{selected.artistName}</div>
            <div style={styles.showMeta}>
              {selected.primaryGenreName} · {selected.trackCount ?? 0} episodios
            </div>
          </div>
        </div>

        {ep && (
          <div style={styles.miniPlayer}>
            <div style={styles.epTitleMini}>{ep.title}</div>
            <input
              type="range"
              min={0}
              max={dur || ep.duration}
              value={Math.min(pos, dur || ep.duration)}
              onChange={e => seekTo(Number(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.miniCtlRow}>
              <span style={styles.timeTxt}>{fmtDur(pos)}</span>
              <button className="pressable" style={styles.miniPlay} onClick={toggle} aria-label="Reproducir/pausar">
                {playing ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" />}
              </button>
              <span style={styles.timeTxt}>-{fmtDur(Math.max(0, (dur || ep.duration) - pos))}</span>
            </div>
          </div>
        )}

        <div style={styles.epList}>
          {epsLoading ? (
            <div style={styles.centerBox}>
              <Loader2 size={24} color="var(--accent)" className="spin" />
              <span style={styles.centerText}>Cargando episodios…</span>
            </div>
          ) : episodes.length === 0 ? (
            <div style={styles.centerBox}>
              <ListVideo size={34} color="var(--bg-tertiary)" />
              <span style={styles.centerText}>Sin episodios disponibles</span>
            </div>
          ) : (
            episodes.map(e => (
              <button
                key={e.id}
                className="pressable"
                style={styles.ep}
                onClick={() => (ep?.id === e.id ? toggle() : void playEpisode(e))}
              >
                <div style={styles.epCover}>{e.date}</div>
                <div style={styles.epMain}>
                  <div style={styles.epSubTitle}>{e.title}</div>
                  <div style={styles.epMeta}>{showTxt(e)}</div>
                </div>
                <div style={styles.epPlay}>
                  {ep?.id === e.id && playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" />}
                </div>
              </button>
            ))
          )}
        </div>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padding="0">
      <AppHeader title="Podcasts" />

      <div style={styles.searchRow}>
        <div style={styles.searchBox}>
          <Search size={16} color="var(--text-secondary)" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar podcasts…"
            style={styles.searchInput}
          />
          {query && (
            <button className="pressable" style={styles.clearBtn} onClick={() => setQuery('')} aria-label="Limpiar">
              <X size={14} color="var(--text-secondary)" />
            </button>
          )}
        </div>
      </div>

      <div style={styles.list}>
        {loading ? (
          <div style={styles.centerBox}>
            <Loader2 size={26} color="var(--accent)" className="spin" />
            <span style={styles.centerText}>Buscando en iTunes…</span>
          </div>
        ) : query && shows.length === 0 ? (
          <div style={styles.centerBox}>
            <Radio size={40} color="var(--bg-tertiary)" />
            <span style={styles.centerText}>Sin resultados</span>
          </div>
        ) : !query ? (
          <div style={styles.centerBox}>
            <Radio size={40} color="var(--bg-tertiary)" />
            <span style={styles.centerText}>Busca un podcast para escuchar episodios reales</span>
          </div>
        ) : (
          shows.map(s => (
            <button key={s.collectionId} className="pressable" style={styles.showRow} onClick={() => void openShow(s)}>
              <div style={styles.showArtSm}>
                {s.artworkUrl100 ? (
                  <img src={artworkUrl(s.artworkUrl100)} alt="" className="no-invert" style={styles.artSmImg} />
                ) : (
                  <Radio size={18} color="#fff" />
                )}
              </div>
              <div style={styles.showMain}>
                <div style={styles.showName}>{s.collectionName}</div>
                <div style={styles.showBy}>{s.artistName}</div>
                <div style={styles.showMeta}>
                  {s.primaryGenreName} · {s.trackCount ?? 0} episodios
                </div>
              </div>
              <ChevronLeft size={18} color="var(--text-tertiary)" style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
            </button>
          ))
        )}
      </div>
    </Screen>
  );
}

function showTxt(e: PodcastEpisode): string {
  const len = e.duration > 0 ? fmtDur(e.duration) : '';
  return [e.date, len].filter(Boolean).join(' · ');
}

function fmtDur(s: number): string {
  if (!Number.isFinite(s) || s <= 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const styles: Record<string, React.CSSProperties> = {
  searchRow: { padding: '8px 16px 4px', flexShrink: 0 },
  searchBox: {
    height: 38,
    borderRadius: 12,
    background: 'var(--surface-input)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 14px',
  },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', background: 'none', fontFamily: 'inherit', userSelect: 'text' as const },
  clearBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  list: { flex: 1, overflowY: 'auto', padding: '4px 16px 20px' },
  centerBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0', textAlign: 'center' as const },
  centerText: { fontSize: 13, color: 'var(--text-secondary)' },
  showRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
    border: 'none',
    background: 'none',
    borderBottom: '0.5px solid var(--separator-cell)',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  showArtSm: {
    width: 52,
    height: 52,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #FFB6C1, #FF2D55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  artSmImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
  showMain: { flex: 1, minWidth: 0 },
  showName: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' },
  showBy: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
  showMeta: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 },
  showHead: { display: 'flex', gap: 14, padding: '16px' },
  showArt: {
    width: 74,
    height: 74,
    borderRadius: 14,
    background: 'linear-gradient(135deg, #FFB6C1, #FF2D55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  showArtImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
  miniPlayer: { margin: '0 16px 10px', padding: '12px 14px', borderRadius: 14, background: 'var(--surface-card)' },
  epTitleMini: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  slider: { width: '100%', accentColor: '#FF2D55', height: 4 },
  miniCtlRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  miniPlay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    border: 'none',
    background: '#FF2D55',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeTxt: { fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' as const },
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
    borderBottom: '0.5px solid var(--separator-cell)',
    textAlign: 'left' as const,
  },
  epCover: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #FF9500, #FF2D55)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    flexShrink: 0,
    lineHeight: 1.2,
  },
  epMain: { flex: 1, minWidth: 0 },
  epSubTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 },
  epMeta: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 },
  epPlay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    background: '#FF2D55',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};