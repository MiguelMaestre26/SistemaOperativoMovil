export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface ToolArg {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
}

export interface AssistantTool {
  name: string;
  description: string;
  args: ToolArg[];
  run: (args: Record<string, string | number | boolean>) => string | null | Promise<string | null>;
}

export interface AssistantProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  getModel(): string | null;
  send(
    prompt: string,
    history: AssistantMessage[],
    onDelta?: (fullText: string) => void
  ): Promise<string>;
}