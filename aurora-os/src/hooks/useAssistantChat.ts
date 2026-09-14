import { useCallback, useEffect, useRef, useState } from 'react';
import { assistantService } from '../core/assistant/service';
import type { AssistantMessage } from '../core/assistant/types';
import { isSpeechSupported, startVoiceRecognition } from '../core/assistant/voice';
import { welcomeSeen } from '../core/assistant/welcome';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export const CHAT_SUGGESTIONS = [
  'Abre la cámara',
  'Busca en la web',
  'Estado de la batería',
  'Sube el brillo a 80%',
  'Ayuda',
];

const FIRST_TIME_WELCOME =
  '¡Hola! Soy Chocolate, tu asistente integrado en AuroraOS. Primera vez por aquí: puedo abrir aplicaciones (por ejemplo "abre la cámara"), buscar en la web, ajustar el sistema (brillo, wifi, no molestar), consultar la batería y dictar por voz. Solo escríbeme o toca el micrófono para comenzar.';

const RETURNING_WELCOME =
  '¡Hola! Soy Chocolate, tu asistente integrado en AuroraOS. Pide algo como "abre la cámara", "busca en la web noticias", ayuda a cambiar ajustes o usa el micrófono para dictar.';

export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: welcomeSeen() ? RETURNING_WELCOME : FIRST_TIME_WELCOME,
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState<string | null>(null);
  const [webOnline, setWebOnline] = useState(false);
  const [listening, setListening] = useState(false);
  const stopVoiceRef = useRef<(() => void) | null>(null);
  const isTypingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const upd = () => setWebOnline(assistantService.isOnline());
    upd();
    const iv = setInterval(upd, 3000);
    const on = () => upd();
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    return () => {
      clearInterval(iv);
      window.removeEventListener('online', on);
      window.removeEventListener('offline', on);
    };
  }, []);

  useEffect(() => {
    let active = true;
    assistantService.getActiveProvider().then(p => {
      if (active) {
        setProvider(p.name);
        setModel(p.getModel());
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText, isTyping]);

  const handleSend = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim();
      if (!text || isTypingRef.current) {
        setInput(text);
        return;
      }

      const userMsg: ChatMessage = {
        id: `u_${Date.now()}`,
        text,
        sender: 'user',
        timestamp: new Date(),
      };

      const history: AssistantMessage[] = [
        ...messages,
        userMsg,
      ]
        .slice(-12)
        .map(m => ({
          id: m.id,
          role: m.sender,
          text: m.text,
          timestamp: m.timestamp.getTime(),
        }));

      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);
      isTypingRef.current = true;
      setStreamText('');

      try {
        const finalText = await assistantService.send(history, full => {
          setStreamText(full);
        });
        const assistantMsg: ChatMessage = {
          id: `a_${Date.now()}`,
          text: finalText,
          sender: 'assistant',
          timestamp: new Date(),
        };
        setStreamText('');
        setMessages(prev => [...prev, assistantMsg]);
      } catch {
        setStreamText('');
        setMessages(prev => [
          ...prev,
          {
            id: `a_err_${Date.now()}`,
            text: 'Ocurrió un error al procesar la solicitud. Inténtalo de nuevo.',
            sender: 'assistant',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
        isTypingRef.current = false;
      }
    },
    [input, messages]
  );

  const toggleVoice = useCallback(() => {
    if (listening) {
      stopVoiceRef.current?.();
      stopVoiceRef.current = null;
      setListening(false);
      return;
    }
    if (!isSpeechSupported()) {
      const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
      setInput(
        isIOS
          ? 'La voz necesita Siri activado. Ve a Ajustes > Siri y búsqueda y actívala, luego vuelve a intentarlo.'
          : 'La voz no está disponible en este navegador. Pruébala en Chrome, Edge o en tu iPhone con Siri activado.'
      );
      return;
    }
    const navLang = (typeof navigator !== 'undefined' && navigator.language) || '';
    setListening(true);
    stopVoiceRef.current = startVoiceRecognition({
      lang: navLang.startsWith('es') ? navLang : 'es-ES',
      onInterim: text => setInput(text),
      onResult: text => {
        setInput(text);
        void handleSend(text);
      },
      onEnd: () => {
        stopVoiceRef.current = null;
        setListening(false);
      },
      onError: err => {
        stopVoiceRef.current = null;
        setListening(false);
        setMessages(prev => [
          ...prev,
          {
            id: `v_${Date.now()}`,
            text: `No pude escucharte: ${err.message}`,
            sender: 'assistant',
            timestamp: new Date(),
          },
        ]);
      },
    });
  }, [listening, handleSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') void handleSend();
    },
    [handleSend]
  );

  const providerLabel = provider
    ? model
      ? `${provider} · ${model}`
      : provider
    : 'Conectando…';

  return {
    messages,
    input,
    setInput,
    isTyping,
    streamText,
    listening,
    webOnline,
    providerLabel,
    handleSend,
    handleKeyDown,
    toggleVoice,
    messagesEndRef,
    inputRef,
  };
}