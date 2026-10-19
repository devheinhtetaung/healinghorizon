import { useSearchParams } from 'react-router-dom';
import ChatbotPanel from '../../components/chat/ChatbotPanel';
import '../../components/chat/ChatbotWidget.css';

// Deep-link / fallback page. The floating widget is the primary access point;
// this route keeps /patient/chatbot (and /patient/chatbot?conversation=N)
// working for bookmarks by rendering the same panel full-width.
export default function ChatbotPage() {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');

  return (
    <div className="chatbot-page">
      <ChatbotPanel
        initialConversationId={conversationId ? Number(conversationId) : null}
      />
    </div>
  );
}
