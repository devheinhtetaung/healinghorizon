import { apiClient } from './apiClient';

// Consultant self-service availability endpoints.
export const availabilityService = {
  getMine: () => apiClient.get('/consultant/availability'),
  saveWeekly: (days) => apiClient.put('/consultant/availability/weekly', { days }),
  upsertOverride: (date, data) => apiClient.put(`/consultant/availability/overrides/${encodeURIComponent(date)}`, data),
  deleteOverride: (date) => apiClient.delete(`/consultant/availability/overrides/${encodeURIComponent(date)}`),
};
