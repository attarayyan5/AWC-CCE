import api from './api.js';

export const activityService = {
  getActivities: (params) => api.get('/activities', { params }),
  getActivity: (id) => api.get(`/activities/${id}`),
  createActivity: (data) => api.post('/activities', data),
  updateActivity: (id, data) => api.patch(`/activities/${id}`, data),
  updateActivityStatus: (id, data) => api.patch(`/activities/${id}/status`, data),
  getActivityAttendance: (id, params) => api.get(`/activities/${id}/attendance`, { params }),
};
