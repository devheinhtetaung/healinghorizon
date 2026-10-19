import { apiClient } from './apiClient';

export const consultantService = {
  list: (search = '') => apiClient.get(`/consultants${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getById: (id) => apiClient.get(`/consultants/${id}`),
  getFeedback: (id) => apiClient.get(`/consultants/${id}/feedback`),
  getAvailability: (id, date) => apiClient.get(`/consultants/${id}/availability?date=${encodeURIComponent(date)}`),

  // Consultant self
  getProfile: () => apiClient.get('/users/me'),
  updateProfile: (data) => apiClient.put('/users/me', data),
  getStats: () => Promise.reject(new Error('Consultant stats not available via REST — use dashboard aggregation later.')),
  getAppointments: () => apiClient.get('/appointments'),
  getAlerts: () => Promise.reject(new Error('Alerts are UI-only aggregation for now.')),
};
