import { apiClient } from './apiClient';

export const donationService = {
  donate: (data) => apiClient.post('/donations', data),
  list: () => apiClient.get('/donations'),
};
