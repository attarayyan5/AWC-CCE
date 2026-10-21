// src/middleware/validate.js

// Zod-based request validation middleware factory

import AppError from '../utils/AppError.js';

/**
 * Creates validation middleware for a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return next(
        new AppError('Validation failed', 422, errors)
      );
    }

    // Store the validated and transformed data.
    if (source === 'query') {
      req.validatedQuery = result.data;
    } else if (source === 'params') {
      req.validatedParams = result.data;
    } else {
      req.body = result.data;
    }

    next();
  };
};

export default validate;