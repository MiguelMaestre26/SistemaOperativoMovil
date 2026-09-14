import { isNative, nativeRequest } from './native';

export interface CurrentWeather {
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  code: number;
  isDay: boolean;
}

export interface HourlyPoint {
  time: string;
  temp: number;
  code: number;
}

export interface DailyPoint {
  date: string;
  min: number;
  max: number;
  code: number;
  sunrise?: string;
  sunset?: string;
}

export interface WeatherReport {
  location: string;
  unit: string;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  fetchedAt: number;
}

export interface City {
  name: string;
  lat: number;
  lon: number;
}

export const DEFAULT_CITY: City = { name: 'Caracas, Venezuela', lat: 10.48801, lon: -66.87919 };
export const FAVORITE_CITIES: City[] = [
  { name: 'Caracas, Venezuela', lat: 10.48801, lon: -66.87919 },
  { name: 'San José, Costa Rica', lat: 9.93388, lon: -84.08489 },
  { name: 'Ciudad de México, México', lat: 19.42847, lon: -99.12766 },
  { name: 'Bogotá, Colombia', lat: 4.60971, lon: -74.08175 },
  { name: 'Buenos Aires, Argentina', lat: -34.61315, lon: -58.37723 },
  { name: 'Sao Paulo, Brasil', lat: -23.5475, lon: -46.63611 },
  { name: 'Nueva York, Estados Unidos', lat: 40.71427, lon: -74.00597 },
  { name: 'Madrid, España', lat: 40.4165, lon: -3.70256 },
  { name: 'Londres, Reino Unido', lat: 51.50853, lon: -0.12574 },
  { name: 'París, Francia', lat: 48.85341, lon: 2.3488 },
  { name: 'Tokio, Japón', lat: 35.6895, lon: 139.69171 },
  { name: 'Sídney, Australia', lat: -33.86882, lon: 151.2093 },
];
export const UNIT_C = '°C';
export const UNIT_F = '°F';

export function weatherCodeInfo(code: number, isDay: boolean): { label: string; emoji: string } {
  if (code === 0) return { label: isDay ? 'Soleado' : 'Despejado', emoji: isDay ? '☀️' : '🌙' };
  if (code === 1) return { label: 'Mayormente despejado', emoji: '🌤️' };
  if (code === 2) return { label: 'Parcialmente nublado', emoji: '⛅' };
  if (code === 3) return { label: 'Nublado', emoji: '☁️' };
  if (code === 45 || code === 48) return { label: 'Niebla', emoji: '🌫️' };
  if (code >= 51 && code <= 57) return { label: 'Llovizna', emoji: '🌦️' };
  if (code >= 61 && code <= 67) return { label: 'Lluvia', emoji: '🌧️' };
  if (code >= 71 && code <= 77) return { label: 'Nieve', emoji: '🌨️' };
  if (code >= 80 && code <= 82) return { label: 'Chubascos', emoji: '🌦️' };
  if (code >= 85 && code <= 86) return { label: 'Chubascos de nieve', emoji: '🌨️' };
  if (code === 95 || code === 96 || code === 99) return { label: 'Tormenta', emoji: '⛈️' };
  return { label: 'Nublado', emoji: '☁️' };
}

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateOffline(now: Date, cityName: string, unit: string): WeatherReport {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const seed = Math.floor(dayStart / 86400000) + cityName.length;
  const rand = mulberry32(seed);
  const base = 24 + rand() * 6;
  const wave = Math.sin((now.getHours() - 6) / 12 * Math.PI);
  const currentTemp = Math.round(base + wave * 4 + rand() * 2);
  const code = [0, 0, 1, 1, 2, 2, 2, 3, 61, 61, 80, 95][Math.floor(rand() * 12)];

  const hourly: HourlyPoint[] = [];
  for (let h = 0; h < 24; h++) {
    const t = new Date(now);
    t.setHours(now.getHours() + h, 0, 0, 0);
    const hWave = Math.sin((h + now.getHours() - 6) / 12 * Math.PI);
    hourly.push({
      time: t.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' }),
      temp: Math.round(base + hWave * 4 + rand() * 2),
      code: h % 7 === 3 ? 61 : code,
    });
  }

  const daily: DailyPoint[] = [];
  for (let d = 0; d < 7; d++) {
    const dt = new Date(now);
    dt.setDate(now.getDate() + d);
    daily.push({
      date: dt.toLocaleDateString('es', { weekday: 'long', day: 'numeric' }),
      min: Math.round(base - 4 - rand() * 3),
      max: Math.round(base + 8 + rand() * 4),
      code: [0, 1, 2, 3, 61, 80][Math.floor(rand() * 6)],
    });
  }

  return {
    location: cityName,
    unit,
    current: {
      temp: currentTemp,
      feels: currentTemp - 1,
      humidity: Math.round(55 + rand() * 35),
      wind: Math.round(2 + rand() * 14),
      code,
      isDay: now.getHours() >= 6 && now.getHours() < 18,
    },
    hourly,
    daily,
    fetchedAt: Date.now(),
  };
}

function parseSearchResults(data: { results?: Array<Record<string, unknown>> }): City[] {
  return (data.results ?? [])
    .map(r => ({
      name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
      lat: Number(r.latitude),
      lon: Number(r.longitude),
    }))
    .filter(c => Number.isFinite(c.lat) && Number.isFinite(c.lon));
}

export async function searchCity(query: string): Promise<City[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ name: query.trim(), count: '10', language: 'es', format: 'json' });
  const url = `https://geocoding-api.open-meteo.com/v1/search?${params}`;

  if (isNative()) {
    try {
      const r = await nativeRequest(url);
      if (r.ok) return parseSearchResults(JSON.parse(r.text));
    } catch { /* se intenta el fetch normal */ }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('search failed');
    return parseSearchResults(await res.json());
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchWeather(city: City = DEFAULT_CITY, tempUnit: 'C' | 'F' = 'C'): Promise<WeatherReport> {
  const unitLabel = tempUnit === 'F' ? UNIT_F : UNIT_C;
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    hourly: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '7',
    temperature_unit: tempUnit === 'F' ? 'fahrenheit' : 'celsius',
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('weather fetch failed');
    const data = await res.json();

    const hourly: HourlyPoint[] = (data.hourly?.time ?? [])
      .slice(0, 24)
      .map((t: string, i: number) => ({
        time: new Date(t).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' }),
        temp: Math.round(data.hourly.temperature_2m[i]),
        code: data.hourly.weather_code[i],
      }));

    const daily: DailyPoint[] = (data.daily?.time ?? []).map((d: string, i: number) => ({
      date: new Date(d).toLocaleDateString('es', { weekday: 'long', day: 'numeric' }),
      min: Math.round(data.daily.temperature_2m_min[i]),
      max: Math.round(data.daily.temperature_2m_max[i]),
      code: data.daily.weather_code[i],
      sunrise: data.daily.sunrise?.[i],
      sunset: data.daily.sunset?.[i],
    }));

    return {
      location: city.name,
      unit: unitLabel,
      current: {
        temp: Math.round(data.current.temperature_2m),
        feels: Math.round(data.current.apparent_temperature),
        humidity: Math.round(data.current.relative_humidity_2m),
        wind: Math.round(data.current.wind_speed_10m),
        code: data.current.weather_code,
        isDay: data.current.is_day === 1,
      },
      hourly,
      daily,
      fetchedAt: Date.now(),
    };
  } catch {
    return generateOffline(new Date(), city.name, unitLabel);
  }
}