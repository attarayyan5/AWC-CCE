export const queryKeys = {
  auth: { me: ['auth', 'me'] },
  members: {
    all: ['members'],
    list: (params) => ['members', 'list', params],
    detail: (id) => ['members', 'detail', id],
    report: (id) => ['members', 'report', id],
    filters: ['members', 'filters'],
  },
  activities: {
    all: ['activities'],
    list: (params) => ['activities', 'list', params],
    detail: (id) => ['activities', 'detail', id],
    attendance: (id) => ['activities', 'attendance', id],
  },
  attendance: {
    all: ['attendance'],
    list: (params) => ['attendance', 'list', params],
    imports: (params) => ['attendance', 'imports', params],
    importDetail: (id) => ['attendance', 'import', id],
  },
  analytics: {
    overview: ['analytics', 'overview'],
    topMembers: (params) => ['analytics', 'topMembers', params],
    participation: ['analytics', 'participation'],
    trends: (params) => ['analytics', 'trends', params],
    departments: ['analytics', 'departments'],
    distribution: ['analytics', 'distribution'],
  },
  documents: {
    all: ['documents'],
    list: (params) => ['documents', 'list', params],
    detail: (id) => ['documents', 'detail', id],
  },
  auditLogs: {
    list: (params) => ['auditLogs', 'list', params],
  },
};
