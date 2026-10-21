// src/utils/apiResponse.js
// Standardized API response helpers

/**
 * Send a success response
 */
export const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, pagination = null } = {}) => {
  const body = {
    success: true,
    message,
  };

  if (data !== null) body.data = data;
  if (pagination !== null) body.pagination = pagination;

  return res.status(statusCode).json(body);
};

/**
 * Send an error response
 */
export const sendError = (res, { statusCode = 500, message = 'An error occurred', errors = null } = {}) => {
  const body = {
    success: false,
    message,
  };

  if (errors !== null) body.errors = errors;

  return res.status(statusCode).json(body);
};
