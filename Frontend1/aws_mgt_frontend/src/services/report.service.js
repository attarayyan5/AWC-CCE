import api from './api.js';

export const reportService = {
  getMemberReport: (params) => api.get('/reports/members', { params }),
  getActivityReport: (params) => api.get('/reports/activities', { params }),
  exportReport: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
};
