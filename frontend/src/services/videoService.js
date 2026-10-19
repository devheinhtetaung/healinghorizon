import { apiClient } from './apiClient';

export const videoService = {
  getByRoom: (roomName) => apiClient.get(`/video/${roomName}`),
  leave: (appointmentId) => apiClient.post(`/appointments/${appointmentId}/leave`, {}),
  leaveBeacon: (appointmentId) => apiClient.beacon(`/appointments/${appointmentId}/leave`),
};
