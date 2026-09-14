import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Search, X, Zap, Scale, Ruler, Loader2, Sparkles } from 'lucide-react';
import {
  fetchPokemonList,
  fetchPokemon,
  fetchTypes,
  fetchByType,
  fetchSpecies,
  fetchEvolutionChain,
  statLabel,
  spriteUrl,
  type PokemonListItem,
  type PokemonDetail,
  type TypeEntry,
  type ChainSpecies,
} from '../../../core/pokemon';
import { Screen, AppHeader } from '../../ui';

const PAGE_SIZE = 24;

export default function Pokedex() {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [items, setItems] = useState<PokemonListItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [types, setTypes] = useState<TypeEntry[]>([]);
  const [detail, setDetail] = useState<PokemonDetail | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loadTokenRef = useRef(0);

  const idFromUrl = (url: string): number => {
    const parts = url.split('/').filter(Boolean);
    return Number(parts[parts.length - 1]) || 0;
  };

  const loadPage = useCallback(async (fromType: string | null, nextOffset: number, token?: number) => {
    const stale = () => token !== undefined && token !== loadTokenRef.current;
    if (stale()) return;
    setLoading(true);
    try {
      let page: PokemonListItem[] = [];
      if (fromType) {
        page = await fetchByType(fromType, nextOffset);
        setHasMore(page.length >= 30);
      } else {
        page = await fetchPokemonList(nextOffset, PAGE_SIZE);
        setHasMore(page.length >= PAGE_SIZE);
      }
      if (stale()) return;
      setItems(prev => {
        const seen = new Set(prev.map(p => p.url));
        return [...prev, ...page.filter(p => !seen.has(p.url))];
      });
      setOffset(nextOffset + page.length);
    } catch {
      if (!stale()) setHasMore(false);
    } finally {
      if (!stale()) setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = ++loadTokenRef.current;
    setInitialLoading(true);
    setItems([]);
    setOffset(0);
    setHasMore(true);
    void loadPage(selectedType, 0, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  useEffect(() => {
    void fetchTypes()
      .then(setTypes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim()) {
      setSelectedType(null);
    }
  }, [query]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore || query.trim()) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300) {
      void loadPage(selectedType, offset);
    }
  };

  const filtered = query.trim()
    ? items.filter(p => p.name.includes(query.trim().toLowerCase())).slice(0, 60)
    : items;

  const openDetail = async (item: PokemonListItem) => {
    try {
      const d = await fetchPokemon(item.name);
      setDetail(d);
    } catch {
      // ignore
    }
  };

  return (
    <Screen scroll={false} padding="0">
      <AppHeader
        title="Pokédex"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={styles.headerIcon}>
              <Sparkles size={15} color="#fff" />
            </span>
            {items.length > 0 && <span style={styles.count}>{items.length} capturados</span>}
          </div>
        }
      />

      <div style={styles.searchBox}>
        <Search size={16} color="var(--text-secondary)" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar pokémon…"
          style={styles.searchInput}
        />
        {query && (
          <button className="pressable" style={styles.clearBtn} onClick={() => setQuery('')} aria-label="Limpiar">
            <X size={14} color="var(--text-secondary)" />
          </button>
        )}
      </div>

      <div style={styles.typeRow}>
        <button
          className="pressable"
          style={{ ...styles.typeChip, ...(selectedType === null ? styles.typeChipActive : {}) }}
          onClick={() => setSelectedType(null)}
        >
          Todos
        </button>
        {types.map(t => (
          <button
            key={t.name}
            className="pressable"
            style={{
              ...styles.typeChip,
              ...(selectedType === t.name ? styles.typeChipActive : {}),
              background: selectedType === t.name ? '#FF3B30' : 'var(--bg-tertiary)',
            }}
            onClick={() => setSelectedType(t.name)}
          >
            {t.name}
          </button>
        ))}
      </div>

      {detail ? (
        <DetailView pokemon={detail} onBack={() => setDetail(null)} onNavigate={openDetail} />
      ) : (
        <div style={styles.list} ref={scrollRef} onScroll={onScroll}>
          {initialLoading ? (
            <div style={styles.loadingBox}>
              <Loader2 size={28} color="#FF3B30" className="spin" />
              <span style={styles.loadingText}>Cargando pokédex…</span>
            </div>
          ) : (
            <>
              <div style={styles.grid}>
                {filtered.map(p => {
                  const id = idFromUrl(p.url);
                  return <Card key={p.url} id={id} name={p.name} onOpen={() => openDetail(p)} />;
                })}
              </div>
              {filtered.length === 0 && !loading && (
                <div style={styles.emptyBox}><span>Sin resultados</span></div>
              )}
              {hasMore && !query.trim() && (
                <button
                  className="pressable"
                  style={styles.moreBtn}
                  onClick={() => void loadPage(selectedType, offset)}
                  disabled={loading}
                >
                  {loading ? 'Cargando…' : 'Cargar más'}
                </button>
              )}
              {loading && items.length > 0 && (
                <div style={styles.loadingBox}>
                  <Loader2 size={22} color="#FF3B30" className="spin" />
                </div>
              )}
            </>
          )}
          <div style={{ height: 30 }} />
        </div>
      )}
    </Screen>
  );
}

function Card({ id, name, onOpen }: { id: number; name: string; onOpen: () => void }) {
  return (
    <button className="pressable" style={styles.card} onClick={onOpen}>
      <img
        src={spriteUrl(id)}
        alt={name}
        loading="lazy"
        className="no-invert"
        style={styles.cardSprite}
        onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }}
      />
      <span style={styles.cardNum}>#{String(id).padStart(3, '0')}</span>
      <span style={styles.cardName}>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
    </button>
  );
}

function DetailView({
  pokemon,
  onBack,
  onNavigate,
}: {
  pokemon: PokemonDetail;
  onBack: () => void;
  onNavigate: (item: PokemonListItem) => void;
}) {
  const [species, setSpecies] = useState<{ flavorText: string; genus: string } | null>(null);
  const [chain, setChain] = useState<ChainSpecies[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchSpecies(pokemon.id).then(s => {
      if (!cancelled) {
        setSpecies(s);
        if (s.evolutionChainUrl) {
          void fetchEvolutionChain(s.evolutionChainUrl)
            .then(c => { if (!cancelled) setChain(c); })
            .catch(() => {});
        }
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [pokemon.id]);

  const mainColor = pokemon.types[0]?.color ?? '#FF3B30';
  const maxStat = Math.max(...pokemon.stats.map(s => s.value), 100);

  return (
    <div style={styles.detailScroll}>
      <div style={{ ...styles.detailHero, background: `linear-gradient(160deg, ${mainColor} 0%, ${mainColor}cc 60%, transparent 140%)` }}>
        <button className="pressable" style={styles.detailBack} onClick={onBack} aria-label="Volver">
          <ChevronLeft size={22} color="#fff" />
        </button>
        <div style={styles.detailNum}>#{String(pokemon.id).padStart(3, '0')}</div>
        {pokemon.artwork ? (
          <img src={pokemon.artwork} alt={pokemon.name} className="no-invert" style={styles.detailArt} />
        ) : pokemon.sprite ? (
          <img src={pokemon.sprite} alt={pokemon.name} className="no-invert" style={styles.detailSprite} />
        ) : null}
        <div style={styles.detailName}>{pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</div>
        {species?.genus && <div style={styles.detailGenus}>{species.genus}</div>}
        <div style={styles.typeBadges}>
          {pokemon.types.map(t => (
            <span key={t.name} style={{ ...styles.typeBadge, background: t.color }}>
              {t.name}
            </span>
          ))}
        </div>
      </div>

      <div style={styles.detailBody}>
        <div style={styles.metaRow}>
          <div style={styles.metaItem}>
            <Ruler size={15} color="var(--text-secondary)" />
            <span style={styles.metaValue}>{(pokemon.height / 10).toFixed(1)} m</span>
            <span style={styles.metaLabel}>Altura</span>
          </div>
          <div style={styles.metaItem}>
            <Scale size={15} color="var(--text-secondary)" />
            <span style={styles.metaValue}>{(pokemon.weight / 10).toFixed(1)} kg</span>
            <span style={styles.metaLabel}>Peso</span>
          </div>
          <div style={styles.metaItem}>
            <Zap size={15} color="var(--text-secondary)" />
            <span style={styles.metaValue}>{pokemon.baseExperience}</span>
            <span style={styles.metaLabel}>Exp. base</span>
          </div>
        </div>

        <Divider title="Stats base" />
        <div style={styles.stats}>
          {pokemon.stats.map(s => {
            const pct = Math.round((s.value / maxStat) * 100);
            return (
              <div key={s.name} style={styles.statRow}>
                <span style={styles.statLabel}>{statLabel(s.name)}</span>
                <div style={styles.statBar}>
                  <div style={{ ...styles.statFill, width: `${pct}%`, background: mainColor }} />
                </div>
                <span style={styles.statValue}>{s.value}</span>
              </div>
            );
          })}
        </div>

        <Divider title="Habilidades" />
        <div style={styles.abilities}>
          {pokemon.abilities.map(a => (
            <span key={a.name} style={styles.abilityChip}>
              {a.name.replace(/-/g, ' ')}
              {a.hidden && <span style={styles.hiddenTag}>oculta</span>}
            </span>
          ))}
        </div>

        {species?.flavorText && (
          <>
            <Divider title="Descripción" />
            <p style={styles.flavor}>{species.flavorText}</p>
          </>
        )}

        {chain.length > 1 && (
          <>
            <Divider title="Evolución" />
            <div style={styles.chainRow}>
              {chain.map((c, i) => (
                <div key={c.id} style={styles.chainItem}>
                  {i > 0 && <span style={styles.chainArrow}>→</span>}
                  <button
                    className="pressable"
                    style={styles.chainBtn}
                    onClick={() => onNavigate({ name: c.name, url: `https://pokeapi.co/api/v2/pokemon/${c.id}/` })}
                  >
                    <img src={spriteUrl(c.id)} alt={c.name} className="no-invert" style={styles.chainSprite} />
                    <span style={styles.chainName}>{c.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}

function Divider({ title }: { title: string }) {
  return <div style={styles.divider}>{title}</div>;
}

const styles: Record<string, React.CSSProperties> = {
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    background: '#FF3B30',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' as const },
  searchBox: {
    margin: '8px 16px 6px',
    height: 38,
    borderRadius: 19,
    background: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 14px',
    flexShrink: 0,
  },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', background: 'none', fontFamily: 'inherit', userSelect: 'text' as const },
  clearBtn: { border: 'none', background: 'none', cursor: 'pointer' },
  typeRow: { display: 'flex', gap: 8, padding: '4px 16px 8px', overflowX: 'auto', flexShrink: 0 },
  typeChip: {
    padding: '6px 13px',
    borderRadius: 15,
    border: 'none',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: 12,
    textTransform: 'capitalize' as const,
    cursor: 'pointer',
    flexShrink: 0,
  },
  typeChipActive: { background: '#FF3B30', color: '#fff' },
  list: { flex: 1, overflowY: 'auto', padding: '0 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  card: {
    border: 'none',
    background: 'var(--surface-card)',
    borderRadius: 14,
    padding: '12px 6px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
  },
  cardSprite: { width: 64, height: 64, objectFit: 'contain' as const },
  cardNum: { fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 },
  cardName: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-primary)',
    textTransform: 'capitalize' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    maxWidth: '100%',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
    padding: '50px 0',
  },
  loadingText: { fontSize: 13, color: 'var(--text-secondary)' },
  emptyBox: { textAlign: 'center' as const, color: 'var(--text-tertiary)', fontSize: 14, padding: '40px 0' },
  moreBtn: {
    width: '100%',
    padding: '13px 0',
    marginTop: 14,
    borderRadius: 22,
    border: 'none',
    background: '#FF3B30',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  detailScroll: { flex: 1, overflowY: 'auto' },
  detailHero: {
    position: 'relative' as const,
    padding: '48px 16px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  detailBack: {
    position: 'absolute' as const,
    top: 10,
    left: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    border: 'none',
    background: 'rgba(0,0,0,0.18)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  detailNum: { fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  detailArt: { width: 180, height: 180, objectFit: 'contain' as const, marginTop: 6 },
  detailSprite: { width: 140, height: 140, objectFit: 'contain' as const, marginTop: 6 },
  detailName: {
    fontSize: 26,
    fontWeight: 800,
    color: '#fff',
    textTransform: 'capitalize' as const,
    marginTop: 6,
    textShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
  detailGenus: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  typeBadges: { display: 'flex', gap: 8, marginTop: 12 },
  typeBadge: {
    padding: '6px 16px',
    borderRadius: 14,
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize' as const,
  },
  detailBody: { padding: '6px 16px 0' },
  metaRow: { display: 'flex', justifyContent: 'space-around', padding: '14px 0', borderBottom: '0.5px solid var(--separator-cell)' },
  metaItem: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 },
  metaValue: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 },
  metaLabel: { fontSize: 11, color: 'var(--text-secondary)' },
  divider: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: 'var(--text-secondary)',
    padding: '16px 0 8px',
  },
  stats: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  statRow: { display: 'flex', alignItems: 'center', gap: 10 },
  statLabel: { width: 74, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' as const },
  statBar: { flex: 1, height: 8, borderRadius: 4, background: 'var(--bg-tertiary)', overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 4 },
  statValue: { width: 34, textAlign: 'right' as const, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' as const },
  abilities: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  abilityChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 16,
    background: 'var(--bg-tertiary)',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-primary)',
    textTransform: 'capitalize' as const,
  },
  hiddenTag: { fontSize: 9, fontWeight: 700, color: '#FF9500', textTransform: 'uppercase' as const },
  flavor: {
    fontSize: 14,
    lineHeight: 1.6,
    color: 'var(--text-primary)',
    background: 'var(--surface-card)',
    borderRadius: 12,
    padding: '13px 14px',
    marginTop: 2,
  },
  chainRow: { display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 4, paddingBottom: 8 },
  chainItem: { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 },
  chainArrow: { fontSize: 16, color: 'var(--text-tertiary)', margin: '0 2px' },
  chainBtn: {
    border: 'none',
    background: 'var(--bg-tertiary)',
    borderRadius: 14,
    padding: '10px 12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
  },
  chainSprite: { width: 56, height: 56, objectFit: 'contain' as const },
  chainName: { fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' as const },
};