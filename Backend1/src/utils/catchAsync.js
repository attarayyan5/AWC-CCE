// src/utils/catchAsync.js
// Wraps async route handlers to forward errors to Express error handler

const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
