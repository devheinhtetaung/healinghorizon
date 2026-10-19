import { apiClient } from './apiClient';

export const referralService = {
  list: () => apiClient.get('/referrals'),
  create: (data) => apiClient.post('/referrals', data),
  getDirectory: () => apiClient.get('/directory/hospitals'),
  getPsychiatrists: (hospitalId) =>
    apiClient.get(`/directory/psychiatrists${hospitalId ? `?hospitalId=${hospitalId}` : ''}`),
};
