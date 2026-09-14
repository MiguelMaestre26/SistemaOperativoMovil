export interface CurrencyData {
  rates: Record<string, number>;
  updated: string;
}

export async function fetchRates(base: string): Promise<CurrencyData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`, { signal: controller.signal });
    if (!res.ok) throw new Error('rates failed');
    const data: { rates?: Record<string, number>; time_last_update_utc?: string; result?: string } = await res.json();
    if (data?.result !== 'success' || !data.rates) throw new Error('bad rates');
    return { rates: data.rates, updated: String(data.time_last_update_utc ?? '') };
  } finally {
    clearTimeout(timer);
  }
}

export const CURRENCIES = [
  { code: 'USD', name: 'Dólar estadounidense', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'CRC', name: 'Colón costarricense', flag: '🇨🇷' },
  { code: 'MXN', name: 'Peso mexicano', flag: '🇲🇽' },
  { code: 'COP', name: 'Peso colombiano', flag: '🇨🇴' },
  { code: 'ARS', name: 'Peso argentino', flag: '🇦🇷' },
  { code: 'CLP', name: 'Peso chileno', flag: '🇨🇱' },
  { code: 'BRL', name: 'Real brasileño', flag: '🇧🇷' },
  { code: 'PEN', name: 'Sol peruano', flag: '🇵🇪' },
  { code: 'GTQ', name: 'Quetzal', flag: '🇬🇹' },
  { code: 'HNL', name: 'Lempira', flag: '🇭🇳' },
  { code: 'NIO', name: 'Córdoba', flag: '🇳🇮' },
  { code: 'PAB', name: 'Balboa', flag: '🇵🇦' },
  { code: 'GBP', name: 'Libra esterlina', flag: '🇬🇧' },
  { code: 'JPY', name: 'Yen japonés', flag: '🇯🇵' },
  { code: 'KRW', name: 'Won surcoreano', flag: '🇰🇷' },
  { code: 'CNY', name: 'Yuan chino', flag: '🇨🇳' },
  { code: 'CAD', name: 'Dólar canadiense', flag: '🇨🇦' },
  { code: 'AUD', name: 'Dólar australiano', flag: '🇦🇺' },
  { code: 'CHF', name: 'Franco suizo', flag: '🇨🇭' },
];