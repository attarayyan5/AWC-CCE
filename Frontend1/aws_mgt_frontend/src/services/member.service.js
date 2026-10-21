import api from './api.js';

export const memberService = {
  getMembers: (params) => api.get('/members', { params }),
  getMember: (id) => api.get(`/members/${id}`),
  createMember: (data) => api.post('/members', data),
  updateMember: (id, data) => api.patch(`/members/${id}`, data),
  updateMemberStatus: (id, data) => api.patch(`/members/${id}/status`, data),
  getMemberReport: (id) => api.get(`/members/${id}/report`),
  getFilters: () => api.get('/members/filters'),
};
