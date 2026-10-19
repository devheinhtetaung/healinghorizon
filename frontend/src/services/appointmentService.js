import { apiClient } from './apiClient';

export const appointmentService = {
  list: () => apiClient.get('/appointments'),
  getById: (id) => apiClient.get(`/appointments/${id}`),
  book: (data) => apiClient.post('/appointments', data),
  updateStatus: (id, status, declineReason = '') =>
    apiClient.patch(`/appointments/${id}/status`, { status, declineReason }),
  createVideo: (id) => apiClient.post(`/appointments/${id}/video`),
};
