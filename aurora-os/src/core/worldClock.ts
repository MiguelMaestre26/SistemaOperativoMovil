export interface WorldTime {
  timezone: string;
  datetime: string;
  utc: string;
  offset: string;
  offsetHours: number;
  isDst: boolean;
  abbreviation: string;
  dayOfWeek: string;
}

// Open-Meteo (open source, AGPL-3.0, free, no API key, CORS enabled).
// A single request can resolve several IANA timezones at once and returns the
// offset (already adjusted for DST) and the current local wall time of each one.
// https://open-meteo.com/
const BASE = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL = 60_000;
const cache = new Map<string, { at: number; wt: WorldTime }>();

function offsetFromSeconds(seconds: number): string {
  const sign = seconds < 0 ? '-' : '+';
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function fetchWorldTime(timezone: string): Promise<WorldTime> {
  const entries = await fetchWorldTimes([timezone]);
  const wt = entries[timezone];
  if (!wt) throw new Error('world clock failed');
  return wt;
}

export async function fetchWorldTimes(timezones: string[]): Promise<Record<string, WorldTime>> {
  const now = Date.now();
  const result: Record<string, WorldTime> = {};
  const missing: string[] = [];
  for (const tz of timezones) {
    if (result[tz]) continue;
    const cached = cache.get(tz);
    if (cached && now - cached.at < CACHE_TTL) result[tz] = cached.wt;
    else missing.push(tz);
  }
  if (missing.length === 0) return result;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const coords = new Array(missing.length).fill('0').join(',');
    const zones = missing.map(z => encodeURIComponent(z)).join(',');
    const url = `${BASE}?latitude=${coords}&longitude=${coords}&current=temperature_2m&timeformat=iso8601&timezone=${zones}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('world clock failed');
    const data = await res.json();
    const list = Array.isArray(data) ? data : [data];
    const utcNow = new Date().toISOString();
    for (const item of list) {
      const tz = String(item.timezone ?? '');
      if (!tz) continue;
      const offsetSeconds = Number(item.utc_offset_seconds ?? 0);
      const offset = offsetFromSeconds(offsetSeconds);
      const wt: WorldTime = {
        timezone: tz,
        datetime: String(item.current?.time ?? ''),
        utc: utcNow,
        offset,
        offsetHours: offsetSeconds / 3600,
        isDst: false,
        abbreviation: `UTC${offset}`,
        dayOfWeek: '',
      };
      cache.set(tz, { at: Date.now(), wt });
      result[tz] = wt;
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}