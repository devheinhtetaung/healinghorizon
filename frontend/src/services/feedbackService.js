import { apiClient } from './apiClient';

export const feedbackService = {
  create: (data) => apiClient.post('/feedback', data),
  forConsultant: (id) => apiClient.get(`/consultants/${id}/feedback`),
};
