// src/utils/sanitize.js
// Sanitization utilities for safe data handling

/**
 * Prevent spreadsheet formula injection in CSV/Excel exports.
 * Strips leading =, +, -, @, \t, \r characters from string values.
 */
export const sanitizeForSpreadsheet = (value) => {
  if (typeof value !== 'string') return value;
  // If string starts with formula injection characters, prepend a single quote
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
};

/**
 * Normalize email addresses for consistent storage and comparison.
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
};

/**
 * Normalize a student ID (trim whitespace, uppercase).
 */
export const normalizeStudentId = (id) => {
  if (!id || typeof id !== 'string') return '';
  return id.trim().toUpperCase();
};

/**
 * Strip HTML tags from a string (basic sanitation for user-provided text).
 */
export const stripHtml = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

/**
 * Safe paginate query params with defaults and limits.
 */
export const parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build a MongoDB ObjectId-safe filter. Prevents NoSQL injection by
 * ensuring only string primitives are passed as query values.
 */
export const safeStringFilter = (value) => {
  if (typeof value !== 'string') return undefined;
  return value.trim() || undefined;
};
