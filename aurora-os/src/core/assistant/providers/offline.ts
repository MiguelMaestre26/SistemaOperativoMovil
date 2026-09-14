import { useSystemStore } from '../../../stores/useSystemStore';
import type { AssistantMessage, AssistantProvider } from '../types';
import { ACCENT, resolveAppId, listAppNames } from '../tools';

const HELP = [
  'Puedo hacer esto:',
  '• Abrir/cerrar apps: "abre notas", "cierra la calculadora"',
  '• Cambiar ajustes: "sube el brillo al 80%", "apaga el wifi"',
  '• Consultas: "hora", "batería", "estado del sistema"',
  '• Buscar en la web: "busca recetas de pasta", "busca en internet el clima en Madrid"',
  '• "modo oscuro", "no molestar", "concentración"',
  '• "ayuda" para ver este mensaje',
].join('\n');

export const FALLBACK_ANSWER =
  'No entendí eso. Soy Chocolate, tu asistente integrado. Escribe "ayuda" para ver lo que sé hacer o pídeme algo como "abre la cámara" o "busca en la web".';

/**
 * Intenta responder una consulta de forma instantánea sin pasar por el LLM.
 * Devuelve null si no reconoce la instrucción y debería resolverla el modelo.
 */
export function answer(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const t = ACCENT(raw);

  if (/^(hola|hi|hello|hey|buenas|buenos dias|buenas tardes|buenas noches)/.test(t)) {
    return `¡Hola! Soy Chocolate, tu asistente integrado en AuroraOS. ¿En qué puedo ayudarte?`;
  }

  if (/(^|\s)(ayuda|help|comandos|que puedes hacer|opciones)$/.test(t) || t.includes('ayuda') || t === 'help') {
    return HELP;
  }

  if (/gracias|thank/.test(t)) {
    return '¡De nada! Aquí estoy cuando me necesites.';
  }

  if (/(tiempo|clima|pronostico|temperatura)/.test(t) && !/(hora|que hora)/.test(t)) {
    return 'Ahora mismo en San José, Costa Rica: 22°C, parcialmente nublado con brisa suave. (Clima simulado)';
  }

  if (/que hora|la hora|hora exacta/.test(t) || t === 'hora' || t === 'time') {
    return '::get_time::';
  }

  if (/bateri|energia|energía|carga|battery/.test(t) && !/estado del sistema/.test(t)) {
    return '::get_battery::';
  }

  if (/estado|resumen|sistema|memoria|almacenamiento|spec|status/.test(t)) {
    return '::get_status::';
  }

  const closeM = t.match(/(?:cierra|cerrar|cerra|close|salir de|sale de)\s+(?:(?:las|los|una|de|la|el|un)\s*)?(.+)/);
  if (closeM) {
    const id = resolveAppId(closeM[1]);
    if (id) return `::close_app::${id}`;
    return `No encontré la app "${closeM[1]}". Disponibles: ${listAppNames()}`;
  }

  // Búsqueda web rápida, con o sin mención del navegador:
  //   "busca X"             → respuesta inline (herramienta websearch)
  //   "busca X en safari"   → abre Safari con esa búsqueda
  //   "abre safari y busca X" → abre Safari directamente en el tema X
  const buscaM = t.match(/(?:busc\w*|busqu\w*|investig\w*)\s+(.+)/);
  if (buscaM) {
    const q = buscaM[1]
      .replace(
        /\b(?:en\s+(?:el\s+|la\s+|los\s+|las\s+)?(?:safari|navegador|browser|web|internet)|por\s+favor|ahora|para mi)\b/g,
        ' '
      )
      .replace(/\s+/g, ' ')
      .trim();
    if (q) {
      if (/(?:safari|navegador|browser|(?:la\s+)?web|internet)/.test(t)) {
        return `::open_search::${q}`;
      }
      return `::websearch::${q}`;
    }
  }

  const openM = t.match(/(?:abre|abrir|open|ejecuta|ejecutar|lanzar|inicia|iniciar)\s+(?:(?:las|los|una|de|la|el|un)\s*)?(.+)/);
  if (openM) {
    const id = resolveAppId(openM[1]);
    if (id) return `::open_app::${id}`;
    return `No encontré la app "${openM[1]}". Disponibles: ${listAppNames()}`;
  }

  // Modo oscuro
  if (/modo oscuro|tema oscuro|oscuro|dark/.test(t)) {
    const on = !/(apaga|apagar|desactiv|off|quita|quitar)/.test(t);
    return `::toggle_dark_mode::${on ? 'true' : 'false'}`;
  }

  // No molestar
  if (/no molestar|no molesten|dnd|silencio/.test(t)) {
    const on = !/(apaga|apagar|desactiv|off|quita|quitar)/.test(t);
    return `::toggle_dnd::${on ? 'true' : 'false'}`;
  }

  // Concentración / focus
  if (/concentrac|focus|enfocar/.test(t)) {
    const on = !/(apaga|apagar|desactiv|off|quita|quitar)/.test(t);
    return `::toggle_focus::${on ? 'true' : 'false'}`;
  }

  // Wi-Fi
  if (/wifi|wi-fi|wi fi/.test(t)) {
    const on = !/(apaga|apagar|desactiv|off|quita|quitar|abajo)/.test(t);
    return `::toggle_wifi::${on ? 'true' : 'false'}`;
  }

  // Bluetooth
  if (/bluetooth|bt|bluetooh/.test(t)) {
    const on = !/(apaga|apagar|desactiv|off|quita|quitar|abajo)/.test(t);
    return `::toggle_bluetooth::${on ? 'true' : 'false'}`;
  }

  // Volumen
  const volM = t.match(/(?:volumen|volume)\s*(?:a|al)?\s*(\d{1,3})/);
  if (volM || /volumen|volume/.test(t)) {
    if (volM) return `::set_volume::${volM[1]}`;
    return `El volumen está al ${useSystemStore.getState().volume}%.`;
  }

  // Brillo
  const briM = t.match(/(?:brillo|brightness)\s*(?:a|al)?\s*(\d{1,3})/);
  if (briM) return `::set_brightness::${briM[1]}`;

  if (/sube|subir|aumenta|aumentar|mas arriba/.test(t) && /brillo/.test(t)) {
    return `::set_brightness::${Math.min(100, useSystemStore.getState().brightness + 10)}`;
  }

  if (/baja|bajar|disminuye/.test(t) && /brillo/.test(t)) {
    return `::set_brightness::${Math.max(0, useSystemStore.getState().brightness - 10)}`;
  }

  if (/brillo|brightness/.test(t)) {
    return `El brillo está al ${useSystemStore.getState().brightness}%.`;
  }

  return null;
}

export class OfflineProvider implements AssistantProvider {
  readonly name = 'Modo offline';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  getModel(): string | null {
    return null;
  }

  async send(_prompt: string, history: AssistantMessage[]): Promise<string> {
    const last = [...history].reverse().find(m => m.role === 'user');
    return answer(last ? last.text : '') ?? FALLBACK_ANSWER;
  }
}