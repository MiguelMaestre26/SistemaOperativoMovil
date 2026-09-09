import type { AssistantMessage, AssistantProvider } from '../types';
import { isNative, nativeRequest } from '../../native';

const OLLAMA_BASE = '/ollama';
const OLLAMA_URL = 'http://localhost:11434';

interface OllamaChatLine {
  message?: { content?: string };
  done?: boolean;
}

function parseModelsText(text: string): string[] {
  try {
    const data = JSON.parse(text);
    return Array.isArray(data.models) ? data.models.map((m: { name?: string }) => m.name ?? '').filter(Boolean) : [];
  } catch {
    return [];
  }
}

export class OllamaProvider implements AssistantProvider {
  readonly name = 'Ollama';
  private model: string | null = null;

  async isAvailable(): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    try {
      let models: string[];
      if (isNative()) {
        const r = await nativeRequest(`${OLLAMA_URL}/api/tags`);
        if (!r.ok) return false;
        models = parseModelsText(r.text);
      } else {
        const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: controller.signal });
        if (!res.ok) return false;
        const data = await res.json();
        models = Array.isArray(data.models)
          ? data.models.map((m: { name?: string }) => m.name ?? '').filter(Boolean)
          : [];
      }
      if (models.length === 0) return false;
      this.model =
        models.find(m => m.includes('llama3.2')) ??
        models.find(m => m.includes('llama3')) ??
        models.find(m => m.includes('mistral')) ??
        models.find(m => m.includes('qwen')) ??
        models[0];
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  getModel(): string | null {
    return this.model;
  }

  async send(
    prompt: string,
    history: AssistantMessage[],
    onDelta?: (fullText: string) => void
  ): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 150000);

    const messages = [
      { role: 'system', content: prompt },
      ...history.map(h => ({ role: h.role, content: h.text })),
    ];

    try {
      if (isNative()) {
        const r = await nativeRequest(`${OLLAMA_URL}/api/chat`, 'POST', {
          model: this.model ?? 'llama3.2',
          messages,
          stream: false,
          options: { temperature: 0.6 },
        });
        if (!r.ok) throw new Error(`Ollama error HTTP ${r.status}`);
        const data = JSON.parse(r.text) as { message?: { content?: string } };
        const content = data.message?.content ?? '';
        onDelta?.(content);
        return content;
      }

      const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model ?? 'llama3.2',
          messages,
          stream: true,
          options: { temperature: 0.6 },
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Ollama error HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const json: OllamaChatLine = JSON.parse(trimmed);
            if (json.message?.content) {
              acc += json.message.content;
              onDelta?.(acc);
            }
          } catch {
          }
        }
      }

      return acc;
    } finally {
      clearTimeout(timer);
    }
  }
}