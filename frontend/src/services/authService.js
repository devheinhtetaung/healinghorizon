import { apiClient } from './apiClient';

export const authService = {
  login: (body) => apiClient.post('/auth/login', body),
  register: (body) => apiClient.post('/auth/register', body),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: (token) => apiClient.post('/auth/refresh', { refreshToken: token }),
};
