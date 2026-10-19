import { apiClient } from './apiClient';

export const adminService = {
  // Stats: client aggregates from individual lists for now, not a dedicated endpoint
  getUsers: (search = '') => apiClient.get(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  banUser: (id, banReason) => apiClient.patch(`/admin/users/${id}/ban`, { banReason }),
  unbanUser: (id) => apiClient.patch(`/admin/users/${id}/unban`),

  getConsultants: () => apiClient.get('/admin/consultants'),
  createConsultant: (data) => apiClient.post('/admin/consultants', data),
  verifyConsultant: (id) => apiClient.patch(`/admin/consultants/${id}/verify`),
  removeConsultant: (id) => apiClient.delete(`/admin/consultants/${id}`),

  getDonations: () => apiClient.get('/donations'),

  getFeedback: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.consultantId) qs.set('consultantId', params.consultantId);
    if (params.rating) qs.set('rating', params.rating);
    if (params.search) qs.set('search', params.search);
    const str = qs.toString();
    return apiClient.get(`/admin/feedback${str ? `?${str}` : ''}`);
  },
  removeFeedback: (id) => apiClient.delete(`/admin/feedback/${id}`),

  // Post reports (moderation queue)
  getReports: (status = '') =>
    apiClient.get(`/admin/reports${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  updateReportStatus: (id, status) =>
    apiClient.patch(`/admin/reports/${id}/status`, { status }),

  getSurveys: () => apiClient.get('/admin/surveys'),
  createSurvey: (data) => apiClient.post('/admin/surveys', data),
  getSurveyResponses: (id) => apiClient.get(`/admin/surveys/${id}/responses`),

  // Dashboard metrics (admin-only aggregation endpoints)
  getUserGrowth: (days = 90) => apiClient.get(`/admin/metrics/user-growth?days=${days}`),
  getSessionVolume: (days = 90) => apiClient.get(`/admin/metrics/session-volume?days=${days}`),
  getConsultantRatings: () => apiClient.get('/admin/metrics/consultant-ratings'),
  getDonationRevenue: (days = 90) => apiClient.get(`/admin/metrics/donation-revenue?days=${days}`),
  getModeration: (days = 30) => apiClient.get(`/admin/metrics/moderation?days=${days}`),

  getHospitals: (city = '') => apiClient.get(`/directory/hospitals${city ? `?city=${encodeURIComponent(city)}` : ''}`),
  createHospital: (data) => apiClient.post('/admin/directory/hospitals', data),
  getPsychiatrists: (hospitalId) =>
    apiClient.get(`/directory/psychiatrists${hospitalId ? `?hospitalId=${hospitalId}` : ''}`),
  createPsychiatrist: (data) => apiClient.post('/admin/directory/psychiatrists', data),
};
