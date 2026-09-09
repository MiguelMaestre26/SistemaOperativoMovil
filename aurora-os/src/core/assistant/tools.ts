import { useAppStore } from '../../stores/useAppStore';
import { useSystemStore } from '../../stores/useSystemStore';
import { batteryManager } from '../BatteryManager';
import { memoryManager } from '../MemoryManager';
import { storageManager } from '../StorageManager';
import { isNative, nativeRequest } from '../native';
import { parseDdgHtml } from '../ddg';
import { openInOs } from '../browserSession';
import type { AssistantTool } from './types';

export const ACCENT = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function internetOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine && useSystemStore.getState().isWifiOn;
}

export function resolveAppId(query: string): string | null {
  const q = ACCENT(query);
  const apps = useAppStore.getState().installedApps;
  if (apps.length === 0) return null;

  const aliases: Record<string, string> = {
    ajustes: 'settings', configuracion: 'settings',
    notas: 'notes', nota: 'notes',
    telefono: 'phone', llamadas: 'phone', llamar: 'phone',
    mensajes: 'messages', sms: 'messages', chat: 'messages',
    fotos: 'gallery', galeria: 'gallery', imagenes: 'gallery',
    camara: 'camera', fotografia: 'camera',
    safari: 'browser', navegador: 'browser', internet: 'browser', web: 'browser',
    clima: 'weather', pronostico: 'weather',
    musica: 'music', reproductor: 'music',
    mail: 'email', correo: 'email',
    reloj: 'clock', alarma: 'clock', temporizador: 'clock',
    calculadora: 'calculator', calc: 'calculator',
    archivos: 'file-manager', ficheros: 'file-manager', explorar: 'file-manager',
    'chocolate plan': 'chocolate-plan', asistente: 'chocolate-plan',
    calendario: 'calendar', agenda: 'calendar',
    mapas: 'maps', mapa: 'maps',
    noticias: 'news', periodico: 'news',
    juegos: 'games', game: 'games',
    salud: 'health', fitness: 'health',
    podcasts: 'podcasts',
    libros: 'books',
    videos: 'videos',
    brujula: 'compass', compas: 'compass',
    telegram: 'telegram', whatsapp: 'whatsapp',
  };

  if (aliases[q]) return aliases[q];

  const byId = apps.find(a => a.id === q);
  if (byId) return byId.id;

  const byName = apps.find(a => ACCENT(a.name) === q);
  if (byName) return byName.id;

  const bySub = apps.find(a => ACCENT(a.name).includes(q));
  return bySub ? bySub.id : null;
}

export function listAppNames(): string {
  return useAppStore.getState().installedApps
    .map(a => `${a.id} (${a.name})`)
    .join(', ');
}

const appLabel = (id: string): string =>
  useAppStore.getState().installedApps.find(a => a.id === id)?.name ?? id;

export function getSystemContext(): string {
  const sys = useSystemStore.getState();
  const memFree = (memoryManager.getTotal() - memoryManager.getUsed()).toFixed(0);
  const stoPct = (storageManager.getUsed() / storageManager.getTotal() * 100).toFixed(1);
  return [
    `Teléfono simulado: AuroraOS.`,
    `Hora actual: ${new Date().toLocaleString('es')}.`,
    `Batería: ${batteryManager.getLevel()}%${batteryManager.isCharging() ? ' (cargando)' : ''}.`,
    `Memoria: ${memoryManager.getUsed()} MB usados, ${memFree} MB libres de ${memoryManager.getTotal()} MB.`,
    `Almacenamiento: ${storageManager.getUsed()} KB usados de ${storageManager.getTotal()} KB (${stoPct}%).`,
    `Wifi: ${sys.isWifiOn ? 'encendido' : 'apagado'}; Bluetooth: ${sys.isBluetoothOn ? 'encendido' : 'apagado'}; Internet: ${internetOnline() ? 'en línea' : 'sin conexión'}.`,
    `No molestar: ${sys.isDoNotDisturb ? 'activado' : 'desactivado'}; Concentración: ${sys.isFocusMode ? 'activada' : 'desactivada'}.`,
    `Modo oscuro: ${sys.isDarkMode ? 'activado' : 'desactivado'}. Brillo: ${sys.brightness}%. Volumen: ${sys.volume}%.`,
    `Apps instaladas: ${listAppNames()}.`,
  ].join('\n');
}

export const tools: AssistantTool[] = [
  {
    name: 'open_app',
    description: 'Abrir una aplicación del teléfono.',
    args: [{ name: 'app', type: 'string', description: 'Nombre o id de la aplicación' }],
    run: (args) => {
      const id = typeof args.app === 'string' ? resolveAppId(args.app) : null;
      if (!id) return `No encontré la app "${args.app}". Apps disponibles: ${listAppNames()}`;
      useAppStore.getState().openApp(id);
      return `Abrí la app ${appLabel(id)}.`;
    },
  },
  {
    name: 'close_app',
    description: 'Cerrar una aplicación abierta.',
    args: [{ name: 'app', type: 'string', description: 'Nombre o id de la aplicación' }],
    run: (args) => {
      const id = typeof args.app === 'string' ? resolveAppId(args.app) : null;
      if (!id) return `No encontré la app "${args.app}".`;
      useAppStore.getState().closeApp(id);
      return `Cerré la app ${appLabel(id)}.`;
    },
  },
  {
    name: 'set_brightness',
    description: 'Ajustar el brillo de la pantalla (0-100).',
    args: [{ name: 'percent', type: 'number', description: 'Valor de 0 a 100' }],
    run: (args) => {
      const v = clamp(Number(args.percent) || 50, 0, 100);
      useSystemStore.getState().setBrightness(v);
      return `Brillo ajustado a ${v}%.`;
    },
  },
  {
    name: 'set_volume',
    description: 'Ajustar el volumen del sistema (0-100).',
    args: [{ name: 'percent', type: 'number', description: 'Valor de 0 a 100' }],
    run: (args) => {
      const v = clamp(Number(args.percent) || 50, 0, 100);
      useSystemStore.getState().setVolume(v);
      return `Volumen ajustado a ${v}%.`;
    },
  },
  {
    name: 'toggle_wifi',
    description: 'Encender o apagar el Wi-Fi.',
    args: [{ name: 'on', type: 'boolean', description: 'true para encender, false para apagar' }],
    run: (args) => {
      const on = Boolean(args.on);
      useSystemStore.getState().setWifi(on);
      return `Wi-Fi ${on ? 'encendido' : 'apagado'}.`;
    },
  },
  {
    name: 'toggle_bluetooth',
    description: 'Encender o apagar el Bluetooth.',
    args: [{ name: 'on', type: 'boolean', description: 'true para encender, false para apagar' }],
    run: (args) => {
      const on = Boolean(args.on);
      useSystemStore.getState().setBluetooth(on);
      return `Bluetooth ${on ? 'encendido' : 'apagado'}.`;
    },
  },
  {
    name: 'toggle_dnd',
    description: 'Activar o desactivar No Molestar.',
    args: [{ name: 'on', type: 'boolean', description: 'true para activar, false para desactivar' }],
    run: (args) => {
      const on = Boolean(args.on);
      useSystemStore.getState().setDoNotDisturb(on);
      return `No molestar ${on ? 'activado' : 'desactivado'}.`;
    },
  },
  {
    name: 'toggle_focus',
    description: 'Activar o desactivar el modo concentración.',
    args: [{ name: 'on', type: 'boolean', description: 'true para activar, false para desactivar' }],
    run: (args) => {
      const on = Boolean(args.on);
      useSystemStore.getState().setFocusMode(on);
      return `Modo concentración ${on ? 'activado' : 'desactivado'}.`;
    },
  },
  {
    name: 'toggle_dark_mode',
    description: 'Activar o desactivar el modo oscuro.',
    args: [{ name: 'on', type: 'boolean', description: 'true para activar, false para desactivar' }],
    run: (args) => {
      const on = Boolean(args.on);
      useSystemStore.getState().setDarkMode(on);
      return `Modo oscuro ${on ? 'activado' : 'desactivado'}.`;
    },
  },
  {
    name: 'get_time',
    description: 'Consultar la hora actual.',
    args: [],
    run: () => `Son las ${new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}.`,
  },
  {
    name: 'get_battery',
    description: 'Consultar el estado de la batería.',
    args: [],
    run: () => {
      const lvl = batteryManager.getLevel();
      const state = lvl > 60 ? 'saludable' : lvl > 20 ? 'media' : 'crítica';
      return `La batería está al ${lvl}%, nivel ${state}${batteryManager.isCharging() ? ' y está cargando' : ''}.`;
    },
  },
  {
    name: 'get_status',
    description: 'Consultar el estado completo del sistema.',
    args: [],
    run: () => getSystemContext(),
  },
  {
    name: 'websearch',
    description: 'Buscar información actual en la web (resultados en vivo).',
    args: [{ name: 'query', type: 'string', description: 'Consulta a buscar en la web' }],
    run: async (args) => {
      if (!internetOnline()) {
        return 'La búsqueda web no está disponible: no hay conexión a internet o el wifi está apagado.';
      }
      const query = String(args.query ?? '').trim();
      if (!query) return 'Consulta vacía.';
      try {
        let items: { title?: string; url?: string; snippet?: string }[] = [];
        if (isNative()) {
          const r = await nativeRequest(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
          if (!r.ok) return `Error de búsqueda HTTP ${r.status}.`;
          items = parseDdgHtml(r.text);
        } else {
          const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
          if (!res.ok) return `Error de búsqueda HTTP ${res.status}.`;
          const data = await res.json();
          items = Array.isArray(data?.results) ? data.results : [];
        }
        if (items.length === 0) return `No encontré resultados para "${query}".`;
        return items
          .slice(0, 5)
          .map((r, i) => `${i + 1}. ${r.title ?? ''}\n   ${r.url ?? ''}\n   ${(r.snippet ?? '').slice(0, 220)}`)
          .join('\n');
      } catch (e) {
        return `Error al buscar en la web: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
  },
  {
    name: 'open_url',
    description: 'Abrir una página web en el navegador del teléfono.',
    args: [{ name: 'url', type: 'string', description: 'Dirección web completa con https://' }],
    run: (args) => {
      const url = String(args.url ?? '').trim();
      if (!/^https?:\/\//i.test(url)) return 'URL inválida: debe empezar con https://';
      openInOs(url);
      return `Abriendo ${url} en el navegador.`;
    },
  },
];

export async function parseToolTokens(raw: string): Promise<{ text: string; confirmations: string[] }> {
  const re = /::([a-z_]+)::([^\n]*)/g;
  const confirmations: string[] = [];
  let text = raw;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const name = m[1];
    const argRaw = m[2].trim();
    const tool = tools.find(t => t.name === name);
    if (tool) {
      const args: Record<string, string | number | boolean> = {};
      argRaw.split('|').forEach((pair, i) => {
        const toolArg = tool.args[i];
        if (!toolArg) return;
        const val = pair.trim();
        args[toolArg.name] =
          toolArg.type === 'number' ? Number(val) :
          toolArg.type === 'boolean' ? val === 'true' || val === '1' :
          val;
      });
      try {
        const res = await tool.run(args);
        if (res) confirmations.push(res);
      } catch {
        confirmations.push(`La herramienta ${name} falló.`);
      }
    }
    text = text.replace(m[0], '');
  }
  return {
    text: text.replace(/\n{3,}/g, '\n\n').trim(),
    confirmations,
  };
}