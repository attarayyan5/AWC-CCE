// src/utils/logger.js
// Simple structured logger - never logs sensitive data

const isDev = process.env.NODE_ENV !== 'production';

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${JSON.stringify(meta)}`;
  }
  return base;
};

const logger = {
  info: (message, meta = {}) => {
    console.log(formatMessage('INFO', message, meta));
  },
  warn: (message, meta = {}) => {
    console.warn(formatMessage('WARN', message, meta));
  },
  error: (message, meta = {}) => {
    // Never log passwords, tokens, or secrets
    if (typeof meta === 'object' && meta !== null) {
      const sanitized = { ...meta };
      delete sanitized.password;
      delete sanitized.passwordHash;
      delete sanitized.token;
      delete sanitized.accessToken;
      delete sanitized.refreshToken;
      delete sanitized.secret;
      console.error(formatMessage('ERROR', message, sanitized));
    } else {
      console.error(formatMessage('ERROR', message, {}));
    }
  },
  debug: (message, meta = {}) => {
    if (isDev) {
      console.log(formatMessage('DEBUG', message, meta));
    }
  },
};

export default logger;
