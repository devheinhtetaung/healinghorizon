import { apiClient } from './apiClient';

export const userService = {
  me: () => apiClient.get('/users/me'),
  updateProfile: (data) => apiClient.put('/users/me', data),
  changePassword: (data) => apiClient.put('/users/me/password', data),
};
