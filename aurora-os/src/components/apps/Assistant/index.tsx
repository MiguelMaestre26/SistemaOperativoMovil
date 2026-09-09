import { useState, useRef, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import { assistantService } from "../../../core/assistant/service";
import type { AssistantMessage } from "../../../core/assistant/types";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

const SUGGESTIONS = [
  "Abrir Ajustes",
  "Sube el brillo a 80%",
  "Estado de batería",
  "Apaga el wifi",
  "Ayuda",
];

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "¡Hola! Soy Chocolate Plan, tu asistente integrado en AuroraOS. Pregúntame la hora, la batería, pídeme abrir apps o cambiar ajustes del teléfono.",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [provider, setProvider] = useState<string>("");
  const [model, setModel] = useState<string | null>(null);
  const [webOnline, setWebOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const upd = () => setWebOnline(assistantService.isOnline());
    upd();
    const iv = setInterval(upd, 3000);
    const on = () => upd();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      clearInterval(iv);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim();
      if (!text || isTyping) return;

      const userMsg: Message = {
        id: `u_${Date.now()}`,
        text,
        sender: "user",
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
      setInput("");
      setIsTyping(true);
      setStreamText("");

      try {
        const finalText = await assistantService.send(history, full => {
          setStreamText(full);
        });
        const assistantMsg: Message = {
          id: `a_${Date.now()}`,
          text: finalText,
          sender: "assistant",
          timestamp: new Date(),
        };

        setStreamText("");
        setMessages(prev => [...prev, assistantMsg]);
      } catch {
        setStreamText("");
        setMessages(prev => [
          ...prev,
          {
            id: `a_err_${Date.now()}`,
            text: "Ocurrió un error al procesar la solicitud. Inténtalo de nuevo.",
            sender: "assistant",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, messages, isTyping]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  const providerLabel = provider
    ? model
      ? `${provider} · ${model}`
      : provider
    : "Conectando…";

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.avatar}>🍫</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.title}>Chocolate Plan</div>
          <div style={styles.subtitle}>IA integrada · {providerLabel}</div>
        </div>
        <div
          style={{
            ...styles.statusPill,
            background: webOnline ? "rgba(76,175,80,0.28)" : "rgba(255,255,255,0.14)",
            color: webOnline ? "#C8E6C9" : "#bcaaa4",
          }}
          title={webOnline ? "Internet conectado: puedo buscar en la web" : "Sin internet: solo conocimiento local"}
        >
          {webOnline ? "En línea" : "Sin conexión"}
        </div>
      </div>

      <div style={styles.messagesArea}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              ...styles.messageRow,
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.sender === "assistant" && (
              <div style={styles.msgAvatar}>🍫</div>
            )}
            <div
              style={{
                ...(msg.sender === "user" ? styles.userBubble : styles.assistantBubble),
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
            <div style={styles.msgAvatar}>🍫</div>
            {streamText ? (
              <div
                style={{
                  ...styles.assistantBubble,
                  whiteSpace: "pre-wrap",
                }}
              >
                {streamText}
                <span style={styles.caret}>▌</span>
              </div>
            ) : (
              <div style={styles.typingBubble}>
                <span style={styles.dot} />
                <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
                <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!isTyping && (
        <div style={styles.suggestions}>
          {SUGGESTIONS.map(s => (
            <button key={s} style={styles.chip} onClick={() => handleSend(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={styles.inputArea}>
        <input
          ref={inputRef}
          style={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un comando…"
        />
        <button style={styles.sendBtn} onClick={() => handleSend()}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#3e2723",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    backgroundColor: "#4e342e",
    borderBottom: "1px solid #5d4037",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    backgroundColor: "#6d4c41",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  subtitle: {
    color: "#bcaaa4",
    fontSize: 11,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  statusPill: {
    flexShrink: 0,
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    scrollbarWidth: "thin" as const,
  },
  messageRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
  },
  msgAvatar: {
    width: 30,
    height: 30,
    minWidth: 30,
    borderRadius: "50%",
    backgroundColor: "#6d4c41",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
  },
  userBubble: {
    maxWidth: "78%",
    padding: "10px 14px",
    borderRadius: "18px 18px 4px 18px",
    backgroundColor: "#4caf50",
    color: "#fff",
    fontSize: 14,
    lineHeight: 1.4,
  },
  assistantBubble: {
    maxWidth: "78%",
    padding: "10px 14px",
    borderRadius: "18px 18px 18px 4px",
    backgroundColor: "#795548",
    color: "#fff",
    fontSize: 14,
    lineHeight: 1.4,
  },
  caret: {
    display: "inline-block",
    animation: "blink 1s steps(1) infinite",
    opacity: 0.8,
    marginLeft: 2,
  },
  typingBubble: {
    padding: "12px 16px",
    borderRadius: "18px 18px 18px 4px",
    backgroundColor: "#795548",
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    backgroundColor: "#d7ccc8",
    display: "inline-block",
    animation: "bounce 1.2s infinite ease-in-out",
  },
  suggestions: {
    display: "flex",
    gap: 8,
    padding: "8px 14px 0",
    overflowX: "auto",
    scrollbarWidth: "none" as const,
  },
  chip: {
    flexShrink: 0,
    background: "#4e342e",
    color: "#d7ccc8",
    border: "1px solid #6d4c41",
    borderRadius: 16,
    padding: "6px 12px",
    fontSize: 12,
    cursor: "pointer",
  },
  inputArea: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    backgroundColor: "#4e342e",
    borderTop: "1px solid #5d4037",
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    border: "1px solid #6d4c41",
    backgroundColor: "#3e2723",
    color: "#fff",
    padding: "0 16px",
    fontSize: 14,
    outline: "none",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#8d6e63",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
};