export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonType {
  name: string;
  color: string;
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  baseExperience: number;
  types: PokemonType[];
  abilities: Array<{ name: string; hidden: boolean }>;
  stats: Array<{ name: string; value: number }>;
  sprite: string;
  backSprite: string | null;
  shinySprite: string | null;
  artwork: string;
}

export interface SpeciesInfo {
  flavorText: string;
  genus: string;
  evolutionChainUrl: string | null;
  color: string;
}

export interface ChainSpecies {
  id: number;
  name: string;
}

export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

interface RawPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience?: number;
  stats?: Array<{ base_stat: number; stat: { name: string } }>;
  types?: Array<{ slot: number; type: { name: string } }>;
  abilities?: Array<{ ability: { name: string }; is_hidden: boolean }>;
  sprites?: {
    front_default?: string | null;
    back_default?: string | null;
    front_shiny?: string | null;
    other?: { 'official-artwork'?: { front_default?: string | null } };
  };
}

const BASE = 'https://pokeapi.co/api/v2';
const detailCache = new Map<string, PokemonDetail>();

async function getJson<T>(url: string, timeout = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export async function fetchPokemonList(offset: number, limit = 24): Promise<PokemonListItem[]> {
  const data = await getJson<{ results?: PokemonListItem[] }>(`${BASE}/pokemon?offset=${offset}&limit=${limit}`);
  return data.results ?? [];
}

export async function fetchPokemon(idOrName: number | string): Promise<PokemonDetail> {
  const key = String(idOrName).toLowerCase();
  const cached = detailCache.get(key);
  if (cached) return cached;
  const raw = await getJson<RawPokemon>(`${BASE}/pokemon/${key}`);
  const sprite = raw.sprites?.front_default ?? '';
  const detail: PokemonDetail = {
    id: raw.id,
    name: raw.name,
    height: raw.height,
    weight: raw.weight,
    baseExperience: raw.base_experience ?? 0,
    types: (raw.types ?? []).map(t => ({ name: t.type.name, color: TYPE_COLORS[t.type.name] ?? '#999' })),
    abilities: (raw.abilities ?? []).map(a => ({ name: a.ability.name, hidden: a.is_hidden })),
    stats: (raw.stats ?? []).map(s => ({ name: s.stat.name, value: s.base_stat })),
    sprite,
    backSprite: raw.sprites?.back_default ?? null,
    shinySprite: raw.sprites?.front_shiny ?? null,
    artwork: raw.sprites?.other?.['official-artwork']?.front_default ?? sprite,
  };
  detailCache.set(String(raw.id), detail);
  detailCache.set(raw.name, detail);
  return detail;
}

export interface TypeEntry {
  name: string;
  url: string;
}

export async function fetchTypes(): Promise<TypeEntry[]> {
  const data = await getJson<{ results?: TypeEntry[] }>(`${BASE}/type`);
  return (data.results ?? []).filter(t => t.name !== 'unknown' && t.name !== 'shadow');
}

export async function fetchByType(type: string, offset = 0, limit = 30): Promise<PokemonListItem[]> {
  const data = await getJson<{ pokemon?: Array<{ pokemon: PokemonListItem }> }>(`${BASE}/type/${type}`);
  return (data.pokemon ?? []).slice(offset, offset + limit).map(p => p.pokemon);
}

export async function fetchSpecies(id: number): Promise<SpeciesInfo> {
  const data = await getJson<{
    flavor_text_entries?: Array<{ flavor_text: string; language: { name: string } }>;
    genera?: Array<{ genus: string; language: { name: string } }>;
    evolution_chain?: { url: string };
    color?: { name: string };
  }>(`${BASE}/pokemon-species/${id}`);
  const es = data.flavor_text_entries?.find(e => e.language.name === 'es') ?? null;
  const en = data.flavor_text_entries?.find(e => e.language.name === 'en') ?? null;
  const genus =
    data.genera?.find(g => g.language.name === 'es')?.genus ??
    data.genera?.find(g => g.language.name === 'en')?.genus ??
    '';
  return {
    flavorText: (es ?? en) ? (es ?? en)!.flavor_text.replace(/\f|\n/g, ' ') : '',
    genus,
    evolutionChainUrl: data.evolution_chain?.url ?? null,
    color: data.color?.name ?? 'gray',
  };
}

export async function fetchEvolutionChain(url: string): Promise<ChainSpecies[]> {
  const data = await getJson<{
    chain: { species: { name: string; url: string }; evolves_to?: any[] };
  }>(url);
  const result: ChainSpecies[] = [];
  const walk = (node: { species: { name: string; url: string }; evolves_to?: any[] }) => {
    const parts = node.species.url.split('/').filter(Boolean);
    const id = Number(parts[parts.length - 1]);
    if (id) result.push({ id, name: node.species.name });
    for (const child of node.evolves_to ?? []) walk(child);
  };
  walk(data.chain);
  return result;
}

export function statLabel(name: string): string {
  const map: Record<string, string> = {
    hp: 'HP',
    attack: 'Ataque',
    defense: 'Defensa',
    'special-attack': 'Sp. Atk',
    'special-defense': 'Sp. Def',
    speed: 'Velocidad',
  };
  return map[name] ?? name.replace(/-/g, ' ');
}