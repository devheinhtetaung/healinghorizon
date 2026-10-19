import { useState, useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import ChatbotPanel from './ChatbotPanel';
import './ChatbotWidget.css';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const close = () => setOpen(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Close when clicking outside the widget or the FAB
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={rootRef}>
      <div
        className={`chatbot-widget${open ? ' chatbot-widget--open' : ''}`}
        role="dialog"
        aria-label="Aura chat"
      >
        <ChatbotPanel onClose={close} isOpen={open} />
      </div>

      <button
        type="button"
        className="chatbot-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Aura"
        aria-expanded={open}
      >
        <Bot aria-hidden="true" />
      </button>
    </div>
  );
}
