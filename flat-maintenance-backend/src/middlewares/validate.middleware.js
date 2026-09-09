/**
 * Zero-Trust Request Validation Middleware.
 *
 * Validates incoming request body, query parameters, and route parameters
 * against a strict Zod schema before controllers are invoked.
 *
 * Compatible with Express 5 request prototypes (req.query getter).
 *
 * @param {import('zod').ZodSchema} schema - Zod validation schema.
 * @returns {import('express').RequestHandler} Express middleware function.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (validated.body !== undefined) {
      req.body = validated.body;
    }
    if (validated.query !== undefined && req.query) {
      Object.assign(req.query, validated.query);
    }
    if (validated.params !== undefined && req.params) {
      Object.assign(req.params, validated.params);
    }
    req.validated = validated;
    next();
  } catch (error) {
    next(error);
  }
};
