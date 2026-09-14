import { useEffect } from 'react';
import { HelpCircle, Mic, Send } from 'lucide-react';
import { useAssistantChat, CHAT_SUGGESTIONS } from '../../../hooks/useAssistantChat';
import { playExplanation, playWelcomeSequence, stopWelcomeSequence } from '../../../core/assistant/welcome';
import { Screen, Chip } from '../../ui';

export default function Assistant() {
  const chat = useAssistantChat();

  useEffect(() => {
    playWelcomeSequence();
    return () => stopWelcomeSequence();
  }, []);

  return (
    <Screen scroll={false} padding="0">
      <div style={styles.header}>
        <div style={styles.avatar}>🍫</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.title}>Chocolate</div>
          <div style={styles.subtitle}>IA integrada · {chat.providerLabel}</div>
        </div>
        <div
          style={{
            ...styles.statusPill,
            background: chat.webOnline ? 'rgba(76,175,80,0.28)' : 'var(--bg-tertiary)',
            color: chat.webOnline ? '#C8E6C9' : 'var(--text-secondary)',
          }}
          title={
            chat.webOnline
              ? 'Internet conectado: puedo buscar en la web'
              : 'Sin internet: solo conocimiento local'
          }
        >
          {chat.webOnline ? 'En línea' : 'Sin conexión'}
        </div>
        <button
          className="pressable"
          style={styles.helpBtn}
          onClick={playExplanation}
          aria-label="Qué puede hacer Chocolate"
          title="Qué puede hacer Chocolate"
        >
          <HelpCircle size={18} color="var(--text-secondary)" />
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
              <div
                style={{
                  ...styles.assistantBubble,
                  whiteSpace: 'pre-wrap',
                }}
              >
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

        <div ref={chat.messagesEndRef} />
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
          title={chat.listening ? 'Detener dictado' : 'Dictar por voz'}
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
          placeholder={chat.listening ? 'Escuchando…' : 'Escribe o dicta un comando…'}
          disabled={chat.listening}
        />
        <button className="pressable" style={styles.sendBtn} onClick={() => void chat.handleSend()}>
          <Send size={20} color="var(--text-on-accent)" />
        </button>
      </div>
    </Screen>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    backgroundColor: 'var(--bg-primary)',
    borderBottom: '0.5px solid var(--separator-cell)',
    flexShrink: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
  },
  title: {
    color: 'var(--text-primary)',
    fontSize: 16,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: 11,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statusPill: {
    flexShrink: 0,
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  helpBtn: {
    flexShrink: 0,
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: 'none',
    background: 'var(--surface-input)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    background: 'var(--bg-secondary)',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgAvatar: {
    width: 30,
    height: 30,
    minWidth: 30,
    borderRadius: '50%',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
  },
  userBubble: {
    maxWidth: '78%',
    padding: '10px 14px',
    borderRadius: '18px 18px 4px 18px',
    backgroundColor: 'var(--accent)',
    color: 'var(--text-on-accent)',
    fontSize: 14,
    lineHeight: 1.4,
  },
  assistantBubble: {
    maxWidth: '78%',
    padding: '10px 14px',
    borderRadius: '18px 18px 18px 4px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: 14,
    lineHeight: 1.4,
  },
  caret: {
    display: 'inline-block',
    animation: 'blink 1s steps(1) infinite',
    opacity: 0.8,
    marginLeft: 2,
  },
  typingBubble: {
    padding: '12px 16px',
    borderRadius: '18px 18px 18px 4px',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    backgroundColor: 'var(--text-secondary)',
    display: 'inline-block',
    animation: 'bounce 1.2s infinite ease-in-out',
  },
  suggestions: {
    display: 'flex',
    gap: 8,
    padding: '8px 14px 0',
    overflowX: 'auto',
    scrollbarWidth: 'none' as const,
    background: 'var(--bg-secondary)',
  },
  inputArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    backgroundColor: 'var(--bg-primary)',
    borderTop: '0.5px solid var(--separator-cell)',
  },
  micBtn: {
    width: 42,
    height: 42,
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
    height: 42,
    borderRadius: 21,
    border: '1px solid var(--separator-cell)',
    backgroundColor: 'var(--surface-input)',
    color: 'var(--text-primary)',
    padding: '0 16px',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit' as const,
    userSelect: 'text' as const,
  },
  sendBtn: {
    width: 42,
    height: 42,
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
};