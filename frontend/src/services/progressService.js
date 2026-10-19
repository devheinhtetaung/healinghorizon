import { apiClient } from './apiClient';

export const progressService = {
  getByPatient: (patientId) => apiClient.get(`/patients/${patientId}/progress`),
  create: (patientId, data) => apiClient.post(`/patients/${patientId}/progress`, data),
  getLatest: () => apiClient.get('/patients/me/progress/latest'),
};
