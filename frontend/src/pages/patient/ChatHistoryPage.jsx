import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  MessageSquareDashed,
  History,
  Plus,
  ArrowRight,
  Clock,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import useToast from '../../components/ui/useToast';
import { chatService } from '../../services/chatService';
import './Chatbot.css';

function formatHistoryDate(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export default function ChatHistoryPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await chatService.getConversations();
        setConversations(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err.message);
        addToast({ type: 'error', title: 'Failed to load history', message: err.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleReopen = (id) => {
    navigate(`/patient/chatbot?conversation=${id}`);
  };

  return (
    <div className="chat-history">
      <header className="chat-history__head">
        <div className="chat-history__head-left">
          <span className="chat-history__head-icon" aria-hidden="true">
            <History />
          </span>
          <div>
            <h1 className="chat-history__title">Conversation History</h1>
            <p className="chat-history__subtitle">
              Your past chats with the AI Wellbeing Companion &mdash; pick one to continue where you left off.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          leftIcon={Plus}
          onClick={() => navigate('/patient/chatbot')}
          className="chat-history__new-btn"
        >
          New Chat
        </Button>
      </header>

      {loading ? (
        <div className="chat-history__loading">
          <Spinner />
        </div>
      ) : error ? (
        <Card className="chat-history__error">
          <p className="chat-history__error-text">Couldn&rsquo;t load your conversations.</p>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      ) : conversations.length === 0 ? (
        <Card className="chat-history__empty">
          <div className="chat-history__empty-icon" aria-hidden="true">
            <MessageSquareDashed />
          </div>
          <h2 className="chat-history__empty-title">No conversations yet</h2>
          <p className="chat-history__empty-desc">
            When you chat with your AI companion, each conversation is saved
            here so you can revisit the guidance and support you received.
          </p>
          <Link to="/patient/chatbot" className="chat-history__empty-cta">
            <Button variant="primary" leftIcon={MessageSquare}>
              Start Your First Chat
            </Button>
          </Link>
        </Card>
      ) : (
        <ul className="chat-history__list" aria-label="Past conversations">
          {conversations.map((c) => (
            <li key={c.conversationId}>
              <Card
                hover
                className="chat-history__item"
                onClick={() => handleReopen(c.conversationId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleReopen(c.conversationId);
                  }
                }}
                aria-label={`Open conversation: ${c.title || 'Conversation'}`}
              >
                <div className="chat-history__item-icon" aria-hidden="true">
                  <MessageSquare />
                </div>

                <div className="chat-history__item-body">
                  <p className="chat-history__item-title">{c.title || 'Conversation'}</p>
                  <p className="chat-history__item-snippet">
                    {c.lastMessage || 'No messages in this conversation yet.'}
                  </p>
                  <span className="chat-history__item-time">
                    <Clock className="chat-history__item-time-icon" aria-hidden="true" />
                    {formatHistoryDate(c.updatedAt || c.createdAt)}
                  </span>
                </div>

                <ArrowRight className="chat-history__item-arrow" aria-hidden="true" />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
