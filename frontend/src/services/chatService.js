import { apiClient } from './apiClient';

export const chatService = {
  send: (message, conversationId, history = []) =>
    apiClient.post('/chat/send', { message, conversationId, history }),
  getConversations: () => apiClient.get('/chat/conversations'),
  getMessages: (id) => apiClient.get(`/chat/conversations/${id}`),
  updateTitle: (id, title) => apiClient.patch(`/chat/conversations/${id}`, { title }),
};
