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

const LOCATIONS = [
  { name: 'San José, CR', lat: 9.9281, lon: -84.0907 },
  { name: 'Heredia, CR', lat: 9.9985, lon: -84.1165 },
  { name: 'Cartago, CR', lat: 9.8644, lon: -83.9194 },
  { name: 'Alajuela, CR', lat: 10.0162, lon: -84.2131 },
];

export const UNIT = '°C';

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

function generateOffline(now: Date, location: string): WeatherReport {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const seed = Math.floor(dayStart / 86400000) + location.length;
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
    location,
    unit: UNIT,
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

export async function fetchWeather(): Promise<WeatherReport> {
  const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const params = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    hourly: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '7',
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
      location: loc.name,
      unit: UNIT,
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
    return generateOffline(new Date(), loc.name);
  }
}