import type { AssistantMessage, AssistantProvider } from './types';
import { getSystemContext, internetOnline, parseToolTokens, tools } from './tools';
import { OllamaProvider } from './providers/ollama';
import { OfflineProvider } from './providers/offline';

const TOOL_GUIDE = tools
  .map(t => {
    const args = t.args.map(a => `${a.name}:${a.type}`.replace(':', ':')).join(' | ');
    return `::${t.name}::${args ? args : '-'}`;
  })
  .join('\n');

function buildSystemPrompt(context: string): string {
  return [
    'Eres Chocolate Plan, el asistente de inteligencia artificial integrado en AuroraOS, un teléfono simulado.',
    'Puedes hablar con el usuario, responder preguntas y CONTROLAR el teléfono de verdad.',
    '',
    'CONTEXTO ACTUAL DEL TELÉFONO:',
    context,
    '',
    'CONTROL DEL TELÉFONO:',
    'Si el usuario pide abrir/cerrar una app, cambiar un ajuste o consultar el estado, responde únicamente con el comando exacto que corresponda (uno por línea, sin texto adicional):',
    TOOL_GUIDE,
    '',
    'Ejemplos:',
    'Pregunta: "abre las notas" -> Respuesta: ::open_app::notes',
    'Pregunta: "sube el brillo" -> Respuesta: ::set_brightness::60',
    'Pregunta: "apaga el wifi" -> Respuesta: ::toggle_wifi::false',
    'Pregunta: "cómo está la batería" -> Respuesta: ::get_battery::',
    '',
    'Consulta el contexto con ::get_status:: para responder con datos reales.',
    'Para conversación normal (saludos, chiste, explicación), responde con texto breve y natural en el idioma del usuario.',
    '',
    'CONOCIMIENTO Y WEB:',
    'Tu conocimiento se corta en 2023 y no tienes datos en tiempo real. Si la pregunta requiere información posterior a 2023 o en tiempo real (noticias, deportes, precios, clima, hechos recientes, famosos, etc.), usa exactamente ::websearch::<consulta> y responde usando los resultados que recibas.',
    '::websearch:: solo funciona cuando hay internet. Si no hay conexión, indícalo al usuario y responde con tu conocimiento.',
  ].join('\n');
}

class AssistantService {
  private cached: AssistantProvider | null = null;
  private resolving = false;

  async resolve(): Promise<AssistantProvider> {
    if (this.cached) return this.cached;
    if (this.resolving) {
      await new Promise(r => setTimeout(r, 120));
      return this.resolve();
    }
    this.resolving = true;
    try {
      const ollama = new OllamaProvider();
      this.cached = (await ollama.isAvailable()) ? ollama : new OfflineProvider();
      return this.cached;
    } finally {
      this.resolving = false;
    }
  }

  async getActiveProvider(): Promise<AssistantProvider> {
    return this.resolve();
  }

  isOnline(): boolean {
    return internetOnline();
  }

  async send(
    history: AssistantMessage[],
    onDelta?: (fullText: string) => void
  ): Promise<string> {
    const provider = await this.resolve();
    const context = getSystemContext();
    const raw = await provider.send(buildSystemPrompt(context), history, onDelta);
    return this.finish(raw);
  }

  private async finish(raw: string): Promise<string> {
    const { text, confirmations } = await parseToolTokens(raw);
    if (confirmations.length === 0) return text;
    const body = text.length > 0 ? `${text}\n\n` : '';
    return body + confirmations.join('\n');
  }
}

export const assistantService = new AssistantService();