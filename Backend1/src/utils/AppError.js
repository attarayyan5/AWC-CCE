// src/utils/AppError.js
// Custom operational error class

class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors; // array of field-level errors from Zod etc.

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
