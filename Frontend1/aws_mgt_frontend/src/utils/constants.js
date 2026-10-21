export const ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
};

export const MEMBER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
};

export const ACTIVITY_CATEGORIES = [
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'SEMINAR', label: 'Seminar' },
  { value: 'LAB', label: 'Hands-on Lab' },
  { value: 'HACKATHON', label: 'Hackathon' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'OTHER', label: 'Other' },
];

export const ACTIVITY_STATUS = [
  { value: 'DRAFT', label: 'Draft', color: 'neutral' },
  { value: 'UPCOMING', label: 'Upcoming', color: 'info' },
  { value: 'COMPLETED', label: 'Completed', color: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error' },
];

export const IMPORT_STATUS = [
  { value: 'UPLOADED', label: 'Uploaded' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'VALIDATED', label: 'Validated' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const DOC_VISIBILITY = [
  { value: 'ADMIN_ONLY', label: 'Admin Only' },
  { value: 'CLUB_MEMBERS', label: 'Club Members' },
  { value: 'PUBLIC', label: 'Public' },
];

export const DOC_CATEGORIES = [
  { value: 'BANNER', label: 'Banner' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'PROFILE_IMAGE', label: 'Profile Image' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'OTHER', label: 'Other' },
];