import { apiClient } from './apiClient';

export const patientService = {
  // Note: patient self-profile is handled by userService.me()
  getDashboard: () => apiClient.get('/users/me'),
};
