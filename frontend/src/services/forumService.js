import { apiClient } from './apiClient';

export const forumService = {
  list: (sort = 'recent', page = 1) =>
    apiClient.get(`/forum/posts?sort=${sort}&page=${page}`),
  getPost: (id) => apiClient.get(`/forum/posts/${id}`),
  create: (data) => apiClient.post('/forum/posts', data),
  upvote: (id) => apiClient.post(`/forum/posts/${id}/upvote`),
  report: (id, reason) => apiClient.post(`/forum/posts/${id}/report`, { reason }),
  getComments: (id) => apiClient.get(`/forum/posts/${id}/comments`),
  addComment: (id, comment) => apiClient.post(`/forum/posts/${id}/comments`, { comment }),
};
