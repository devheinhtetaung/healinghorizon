import { apiClient } from './apiClient';

export const surveyService = {
  list: () => apiClient.get('/admin/surveys'),
  create: (data) => apiClient.post('/admin/surveys', data),
  getResponses: (id) => apiClient.get(`/admin/surveys/${id}/responses`),
  submit: (id, answers) => apiClient.post(`/patient/surveys/${id}/responses`, { answers }),
};
