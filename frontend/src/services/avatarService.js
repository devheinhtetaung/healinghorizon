import { apiClient } from './apiClient';

export const avatarService = {
  upload: (file) => apiClient.upload('/users/me/avatar', file),
  remove: () => apiClient.delete('/users/me/avatar'),
};
