import { apiClient } from './apiClient';

export const sessionSummaryService = {
  getByAppointment: (appointmentId) => apiClient.get(`/appointments/${appointmentId}/summary`),
  save: (appointmentId, data) => apiClient.put(`/appointments/${appointmentId}/summary`, data),
};
