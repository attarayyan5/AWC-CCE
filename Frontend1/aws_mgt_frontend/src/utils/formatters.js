export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatHours = (hours) => {
  if (hours === null || hours === undefined) return '0';
  return Number(hours).toFixed(1);
};

export const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

export const getStatusColor = (status) => {
  const map = {
    ACTIVE: 'success', INACTIVE: 'error',
    UPCOMING: 'info', COMPLETED: 'success', CANCELLED: 'error', DRAFT: 'neutral',
    PRESENT: 'success', ABSENT: 'error', CORRECTED: 'warning',
    VALID: 'success', DUPLICATE: 'warning', UNKNOWN_MEMBER: 'error',
    EMAIL_MISMATCH: 'warning', INVALID: 'error', ALREADY_IMPORTED: 'neutral',
    UPLOADED: 'info', PROCESSING: 'warning', VALIDATED: 'info', CONFIRMED: 'success', FAILED: 'error',
  };
  return map[status] || 'neutral';
};
