import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Send, X } from 'lucide-react';
import { useAssistantChat, CHAT_SUGGESTIONS } from '../../hooks/useAssistantChat';
import { playWelcomeSequence, stopWelcomeSequence } from '../../core/assistant/welcome';
import { eventBus } from '../../core/EventBus';
import { Chip, toast } from '../ui';

export default function AssistantOverlay() {
  const chat = useAssistantChat();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) chat.inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleBubble = () => {
    const next = !open;
    if (next) playWelcomeSequence();
    else stopWelcomeSequence();
    setOpen(next);
  };

  useEffect(() => {
    const off = eventBus.on('assistant:navigate', (msg) => {
      setOpen(false);
      if (typeof msg === 'string' && msg) toast(msg);
    });
    return off;
  }, []);

  return (
    <>
      <div style={styles.overlayZone} aria-hidden={!open}>
        <AnimatePresence>
          {open && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              style={styles.panel}
            >
              <div style={styles.header}>
                <div style={styles.avatar}>🍫</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.title}>Chocolate</div>
                  <div style={styles.subtitle}>
                    IA integrada · {chat.providerLabel}
                    {chat.listening && ' · escuchando…'}
                  </div>
                </div>
                <button
                  style={styles.closeBtn}
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar asistente"
                >
                  <X size={16} color="var(--text-secondary)" />
                </button>
              </div>

              <div style={styles.messagesArea}>
                {chat.messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      ...styles.messageRow,
                      justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {msg.sender === 'assistant' && (
                      <div style={styles.msgAvatar}>🍫</div>
                    )}
                    <div
                      style={{
                        ...(msg.sender === 'user' ? styles.userBubble : styles.assistantBubble),
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {chat.isTyping && (
                  <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                    <div style={styles.msgAvatar}>🍫</div>
                    {chat.streamText ? (
                      <div style={{ ...styles.assistantBubble, whiteSpace: 'pre-wrap' }}>
                        {chat.streamText}
                        <span style={styles.caret}>▌</span>
                      </div>
                    ) : (
                      <div style={styles.typingBubble}>
                        <span style={styles.dot} />
                        <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
                        <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
                      </div>
                    )}
                  </div>
                )}

                <div ref={chat.messagesEndRef} style={{ height: 1 }} />
              </div>

              {!chat.isTyping && (
                <div style={styles.suggestions}>
                  {CHAT_SUGGESTIONS.map(s => (
                    <Chip key={s} label={s} onClick={() => void chat.handleSend(s)} />
                  ))}
                </div>
              )}

              <div style={styles.inputArea}>
                <button
                  className="pressable"
                  style={{
                    ...styles.micBtn,
                    background: chat.listening ? 'var(--accent)' : 'var(--surface-input)',
                  }}
                  onClick={chat.toggleVoice}
                  aria-label={chat.listening ? 'Detener dictado' : 'Dictar por voz'}
                >
                  <Mic size={18} color={chat.listening ? 'var(--text-on-accent)' : 'var(--text-primary)'} />
                </button>
                <input
                  ref={chat.inputRef}
                  className="pressable"
                  style={styles.input}
                  value={chat.input}
                  onChange={e => chat.setInput(e.target.value)}
                  onKeyDown={chat.handleKeyDown}
                  placeholder="Escribe o dicta un comando…"
                  disabled={chat.listening}
                />
                <button className="pressable" style={styles.sendBtn} onClick={() => void chat.handleSend()}>
                  <Send size={18} color="var(--text-on-accent)" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        key="bubble"
        style={styles.bubble}
        onClick={toggleBubble}
        whileTap={{ scale: 0.9 }}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente Chocolate'}
        title="Chocolate — asistente"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'x' : 'choco'}
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.12 }}
            style={styles.bubbleIcon}
          >
            {open ? <X size={22} color="#fff" /> : '🍫'}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlayZone: {
    position: 'absolute',
    right: 10,
    bottom: 148,
    zIndex: 9100,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    pointerEvents: 'none',
  },
  panel: {
    width: 'min(340px, 88%)',
    height: 'min(460px, 56%)',
    maxHeight: 520,
    background: 'var(--bg-primary)',
    borderRadius: 24,
    border: '1px solid var(--separator-cell)',
    boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    backgroundColor: 'var(--bg-primary)',
    borderBottom: '0.5px solid var(--separator-cell)',
    flexShrink: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  title: {
    color: 'var(--text-primary)',
    fontSize: 15,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: 10.5,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: 'none',
    background: 'var(--surface-input)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    background: 'var(--bg-secondary)',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 6,
  },
  msgAvatar: {
    width: 26,
    height: 26,
    minWidth: 26,
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
  },
  userBubble: {
    maxWidth: '80%',
    padding: '8px 12px',
    borderRadius: '16px 16px 4px 16px',
    backgroundColor: 'var(--accent)',
    color: 'var(--text-on-accent)',
    fontSize: 13,
    lineHeight: 1.4,
  },
  assistantBubble: {
    maxWidth: '80%',
    padding: '8px 12px',
    borderRadius: '16px 16px 16px 4px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: 13,
    lineHeight: 1.4,
  },
  caret: {
    display: 'inline-block',
    animation: 'blink 1s steps(1) infinite',
    opacity: 0.8,
    marginLeft: 2,
  },
  typingBubble: {
    padding: '10px 14px',
    borderRadius: '16px 16px 16px 4px',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: 'var(--text-secondary)',
    display: 'inline-block',
    animation: 'bounce 1.2s infinite ease-in-out',
  },
  suggestions: {
    display: 'flex',
    gap: 6,
    padding: '7px 12px 0',
    overflowX: 'auto',
    scrollbarWidth: 'none' as const,
    background: 'var(--bg-secondary)',
  },
  inputArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    backgroundColor: 'var(--bg-primary)',
    borderTop: '0.5px solid var(--separator-cell)',
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '1px solid var(--separator-cell)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    border: '1px solid var(--separator-cell)',
    backgroundColor: 'var(--surface-input)',
    color: 'var(--text-primary)',
    padding: '0 12px',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    userSelect: 'text' as const,
    minWidth: 0,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'var(--accent)',
    color: 'var(--text-on-accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  bubble: {
    position: 'absolute',
    right: 12,
    bottom: 130,
    zIndex: 9100,
    width: 54,
    height: 54,
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #7a4a21, #8B5E3C)',
    boxShadow: '0 8px 22px rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  bubbleIcon: {
    fontSize: 24,
    display: 'flex',
    lineHeight: 1,
  },
};