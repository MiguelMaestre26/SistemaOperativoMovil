export interface ITunesSong {
  trackId: number;
  artistName: string;
  trackName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  releaseDate?: string;
  primaryGenreName?: string;
  trackTimeMillis?: number;
}

export interface ITunesPodcast {
  collectionId: number;
  artistName: string;
  collectionName: string;
  artworkUrl100?: string;
  primaryGenreName?: string;
  trackCount?: number;
  feedUrl?: string;
  releaseDate?: string;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  show: string;
  summary: string;
  duration: number;
  date: string;
  audioUrl: string;
}

async function itunesSearch(params: Record<string, string>): Promise<any[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const qs = new URLSearchParams({ limit: '25', ...params });
    const res = await fetch(`https://itunes.apple.com/search?${qs}`, { signal: controller.signal });
    if (!res.ok) throw new Error('itunes search failed');
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } finally {
    clearTimeout(timer);
  }
}

export async function searchSongs(term: string): Promise<ITunesSong[]> {
  const results = await itunesSearch({ term, entity: 'song' });
  return results.map((r: Record<string, unknown>) => ({
    trackId: Number(r.trackId),
    artistName: String(r.artistName ?? ''),
    trackName: String(r.trackName ?? ''),
    collectionName: String(r.collectionName ?? ''),
    artworkUrl100: String(r.artworkUrl100 ?? ''),
    previewUrl: String(r.previewUrl ?? ''),
    releaseDate: String(r.releaseDate ?? ''),
    primaryGenreName: String(r.primaryGenreName ?? ''),
    trackTimeMillis: Number(r.trackTimeMillis) || 0,
  }));
}

export async function searchPodcasts(term: string): Promise<ITunesPodcast[]> {
  const results = await itunesSearch({ term, entity: 'podcast' });
  return results.map((r: Record<string, unknown>) => ({
    collectionId: Number(r.collectionId),
    artistName: String(r.artistName ?? ''),
    collectionName: String(r.collectionName ?? ''),
    artworkUrl100: String(r.artworkUrl100 ?? ''),
    primaryGenreName: String(r.primaryGenreName ?? ''),
    trackCount: Number(r.trackCount) || 0,
    feedUrl: String(r.feedUrl ?? ''),
    releaseDate: String(r.releaseDate ?? ''),
  }));
}

export async function fetchPodcastEpisodes(feedUrl: string): Promise<PodcastEpisode[]> {
  if (!feedUrl) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=20`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error('rss failed');
    const data: { status?: string; items?: Array<Record<string, unknown>> } = await res.json();
    if (data?.status !== 'ok' || !Array.isArray(data.items)) throw new Error('bad rss');
    return data.items
      .map((it, i) => {
        const enclosure = it.enclosure as { link?: string } | undefined;
        const audioUrl = String(enclosure?.link ?? it.link ?? '').trim();
        if (!audioUrl) return null;
        const rawDur = Number(it.itunes_duration) || 0;
        const duration =
          rawDur ||
          (() => {
            const m = String(it.itunes_duration ?? '').split(':');
            if (m.length >= 2) return Number(m[0]) * 60 + Number(m[1]);
            return 1800;
          })();
        return {
          id: `${i}_${String(it.pubDate ?? it.guid ?? it.title ?? '').slice(0, 12)}`,
          title: String(it.title ?? 'Sin título'),
          show: String(it.author ?? ''),
          summary: String(it.description ?? '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 300),
          duration,
          date: new Date(String(it.pubDate ?? Date.now())).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
          audioUrl,
        };
      })
      .filter((e): e is PodcastEpisode => e !== null);
  } finally {
    clearTimeout(timer);
  }
}

export function artworkUrl(url: string | undefined): string {
  if (!url) return '';
  return url.replace('/100x100bb.jpg', '/300x300bb.jpg');
}