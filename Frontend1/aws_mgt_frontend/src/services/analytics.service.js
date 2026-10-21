import api from './api.js';

export const analyticsService = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getTopMembers: (params) => api.get('/analytics/members', { params }),
  getActivityParticipation: (params) => api.get('/analytics/activities', { params }),
  getMonthlyTrends: (params) => api.get('/analytics/participation', { params }),
  getDepartmentStats: () => api.get('/analytics/departments'),
  getHoursDistribution: () => api.get('/analytics/distribution'),
};
