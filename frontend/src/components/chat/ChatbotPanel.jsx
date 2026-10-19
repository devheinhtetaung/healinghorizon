import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  Plus,
  RotateCw,
  History,
  X,
  ArrowLeft,
} from 'lucide-react';
import Button from '../ui/Button';
import useToast from '../ui/useToast';
import { chatService } from '../../services/chatService';
import { playChatSound } from '../../utils/sound';
import './ChatbotWidget.css';

const INTRO_MESSAGE = {
  messageId: 0,
  sender: 'bot',
  message:
    "Hi, I'm here whenever you need to talk. Tell me what's on your mind, and I'll listen and help you find ways to cope. How are you feeling right now?",
};

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatHistoryDate(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export default function ChatbotPanel({ onClose, isOpen = true, initialConversationId = null }) {
  const [activeId, setActiveId] = useState(initialConversationId ?? null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [view, setView] = useState('chat');
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const { addToast } = useToast();

  const justCreatedIdRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [convError, setConvError] = useState(null);

  useEffect(() => {
    if (!activeId) {
      setMessages([{ ...INTRO_MESSAGE, createdAt: new Date().toISOString() }]);
      return;
    }
    if (justCreatedIdRef.current === activeId) {
      justCreatedIdRef.current = null;
      return;
    }
    (async () => {
      try {
        const data = await chatService.getMessages(activeId);
        setMessages(
          Array.isArray(data)
            ? data.map((m) => ({
                messageId: m.messageId,
                sender: m.sender,
                message: m.message,
                createdAt: m.createdAt ?? null,
                failed: false,
              }))
            : []
        );
      } catch (err) {
        addToast({ type: 'error', title: 'Failed to load', message: err.message });
      }
    })();
  }, [activeId]);

  const loadConversations = useCallback(async () => {
    setConvLoading(true);
    setConvError(null);
    try {
      const data = await chatService.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      setConvError(err.message || 'Failed to load conversations');
    } finally {
      setConvLoading(false);
    }
  }, []);

  // Refresh history when the active conversation changes so new threads show up.
  useEffect(() => {
    loadConversations();
  }, [activeId, loadConversations]);

  useEffect(() => {
    if (typeof endRef.current?.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing]);

  // Focus the composer whenever the panel opens.
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Auto-grow the composer: wrap to a new line past the first, capped at 120px.
  const resizeInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight + 2, 120)}px`;
  };

  // Re-run when the value changes OR when the view remounts the textarea
  // (history -> chat), so the composer is sized consistently in both cases.
  useEffect(() => {
    resizeInput();
  }, [input, view]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    resizeInput();
  };

  const doSend = async (text, conversationId) => {
    const recent = messages
      .filter((m) => m.messageId > 0)
      .map((m) => ({ sender: m.sender, text: m.message }));
    const data = await chatService.send(text, conversationId, recent);
    setMessages((prev) => [
      ...prev,
      { messageId: Date.now() + 1, sender: 'bot', message: data.reply, createdAt: new Date().toISOString(), failed: false },
    ]);
    playChatSound();
    if (!activeId && data.conversationId) {
      justCreatedIdRef.current = data.conversationId;
      setActiveId(data.conversationId);
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || typing) return;
    const msgId = Date.now();
    setMessages((prev) => [
      ...prev,
      { messageId: msgId, sender: 'patient', message: trimmed, createdAt: new Date().toISOString(), failed: false },
    ]);
    setInput('');
    setTyping(true);
    try {
      await doSend(trimmed, activeId);
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.messageId === msgId ? { ...m, failed: true } : m))
      );
      addToast({ type: 'error', title: 'Chat error', message: err.message || 'Failed to send message' });
    } finally {
      setTyping(false);
    }
  };

  const retryMessage = async (msg) => {
    setMessages((prev) =>
      prev.map((m) => (m.messageId === msg.messageId ? { ...m, failed: false } : m))
    );
    setTyping(true);
    try {
      await doSend(msg.message, activeId);
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.messageId === msg.messageId ? { ...m, failed: true } : m))
      );
      addToast({ type: 'error', title: 'Retry failed', message: err.message || 'Still unable to send' });
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    setActiveId(null);
    setInput('');
    setView('chat');
  };

  const openConversation = (id) => {
    setView('chat');
    if (id === activeId) return;
    setActiveId(id);
  };

  const renderHistoryList = () => {
    if (convLoading) {
      return (
        <div className="chatbot__history-skeleton" aria-hidden="true">
          <span className="chatbot__history-skeleton-line" />
          <span className="chatbot__history-skeleton-line" />
          <span className="chatbot__history-skeleton-line chatbot__history-skeleton-line--short" />
        </div>
      );
    }
    if (convError) {
      return (
        <div className="chatbot__history-error">
          <p className="chatbot__history-error-text">Couldn&rsquo;t load your history.</p>
          <button type="button" className="chatbot__history-error-retry" onClick={loadConversations}>
            <RotateCw aria-hidden="true" /> Retry
          </button>
        </div>
      );
    }
    if (conversations.length === 0) {
      return (
        <div className="chatbot__history-empty">
          <p className="chatbot__history-empty-title">No conversations yet</p>
          <p className="chatbot__history-empty-desc">
            Your past chats will appear here so you can pick up where you left off.
          </p>
        </div>
      );
    }
    return conversations.map((c) => {
      const isActive = activeId === c.conversationId;
      return (
        <button
          key={c.conversationId}
          type="button"
          className={`chatbot__history-item${isActive ? ' chatbot__history-item--active' : ''}`}
          onClick={() => openConversation(c.conversationId)}
          aria-current={isActive ? 'true' : undefined}
        >
          <span className="chatbot__history-item-title">{c.title || 'Conversation'}</span>
          <span className="chatbot__history-item-snippet">{c.lastMessage || 'No messages yet.'}</span>
          <span className="chatbot__history-item-time">{formatHistoryDate(c.updatedAt || c.createdAt)}</span>
        </button>
      );
    });
  };

  return (
    <div className="chatbot-panel">
      <header className="chatbot__header">
        {view === 'history' ? (
          <div className="chatbot__header-title-row">
            <button
              type="button"
              className="chatbot__icon-btn"
              onClick={() => setView('chat')}
              aria-label="Back to chat"
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <h1 className="chatbot__header-title">Conversations</h1>
          </div>
        ) : (
          <div className="chatbot__header-title-row">
            <h1 className="chatbot__header-title">Aura</h1>
            <span className="chatbot__online-dot" aria-hidden="true" />
          </div>
        )}

        <div className="chatbot__header-controls">
          {view === 'history' ? (
            <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleNewChat}>
              New Chat
            </Button>
          ) : (
            <button
              type="button"
              className="chatbot__history-toggle"
              onClick={() => setView('history')}
              aria-label="Conversation history"
            >
              <History aria-hidden="true" />
            </button>
          )}
          {onClose && (
            <button type="button" className="chatbot__close" onClick={onClose} aria-label="Close chat">
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {view === 'history' ? (
        <div className="chatbot__history-view">
          <div className="chatbot__history-list" aria-label="Past conversations">
            {renderHistoryList()}
          </div>
        </div>
      ) : (
        <>
          <div className="chatbot__window">
            <div className="chatbot__messages" role="log" aria-live="polite">
              {messages.map((m) =>
                m.sender === 'bot' ? (
                  <div key={m.messageId} className="chatbot__row chatbot__row--bot">
                    <div className="chatbot__bot-avatar" aria-hidden="true">
                      <Bot />
                    </div>
                    <div className="chatbot__bot-msg">
                      <p className="chatbot__bot-text">{m.message}</p>
                      {m.createdAt && (
                        <time className="chatbot__time" dateTime={m.createdAt}>
                          {formatMessageTime(m.createdAt)}
                        </time>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    key={m.messageId}
                    className={`chatbot__row chatbot__row--user${
                      m.failed ? ' chatbot__row--failed' : ''
                    }`}
                  >
                    <div className="chatbot__user-msg">
                      <div className="chatbot__bubble chatbot__bubble--user">{m.message}</div>
                      <div className="chatbot__user-meta">
                        {m.createdAt && (
                          <time className="chatbot__time" dateTime={m.createdAt}>
                            {formatMessageTime(m.createdAt)}
                          </time>
                        )}
                        {m.failed && (
                          <button
                            type="button"
                            className="chatbot__retry"
                            onClick={() => retryMessage(m)}
                            aria-label="Retry sending message"
                          >
                            <RotateCw aria-hidden="true" /> Retry
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}

              {typing && (
                <div className="chatbot__row chatbot__row--bot">
                  <div className="chatbot__bot-avatar" aria-hidden="true">
                    <Bot />
                  </div>
                  <div className="chatbot__bot-msg">
                    <div className="chatbot__typing" aria-label="Assistant is typing">
                      <span className="chatbot__dot" />
                      <span className="chatbot__dot" />
                      <span className="chatbot__dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            <form
              className="chatbot__composer"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <textarea
                ref={inputRef}
                className="chatbot__input"
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Message"
              />
              <button
                type="submit"
                className="chatbot__send"
                disabled={!input.trim() || typing}
                aria-label="Send message"
              >
                <Send aria-hidden="true" />
              </button>
            </form>
          </div>
          <p className="chatbot__disclaimer">
            Not a substitute for professional care. In a crisis, contact emergency services.
          </p>
        </>
      )}
    </div>
  );
}
