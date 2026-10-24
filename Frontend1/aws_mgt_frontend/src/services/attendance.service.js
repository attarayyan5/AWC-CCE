import api from './api.js';

export const attendanceService = {
  uploadImport: (formData) => api.post('/attendance/imports', formData, {
    headers: { 'Content-Type': undefined },
  }),
  getImports: (params) => api.get('/attendance/imports', { params }),
  getImport: (id) => api.get(`/attendance/imports/${id}`),
  validateImport: (id, data) => api.post(`/attendance/imports/${id}/validate`, data),
  confirmImport: (id) => api.post(`/attendance/imports/${id}/confirm`),
  cancelImport: (id) => api.post(`/attendance/imports/${id}/cancel`),
  getAttendance: (params) => api.get('/attendance', { params }),
  recordManualAttendance: (data) => api.post('/attendance', data),
  correctAttendance: (id, data) => api.patch(`/attendance/${id}`, data),
  deleteAttendance: (id) => api.delete(`/attendance/${id}`),
};
