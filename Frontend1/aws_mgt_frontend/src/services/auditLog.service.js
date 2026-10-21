import api from './api.js';

export const auditLogService = {
  getLogs: (params) => api.get('/audit-logs', { params }),
};
