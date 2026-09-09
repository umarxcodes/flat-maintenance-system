// =====================  IMPORTS  ==========================
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { ERROR_CODES } from "../constants/error-codes.constant.js";
import { logger } from "../utils/logger.util.js";

// =====================  ERROR HANDLING MIDDLEWARE  ========
/**
 * Centralized Global Error Handling Middleware.
 *
 * Catches all domain exceptions, database collisions, validation failures,
 * and unhandled runtime rejections, normalizing them into the standard ApiError envelope:
 * {
 *   "success": false,
 *   "message": "...",
 *   "errors": [...],
 *   "data": null
 * }
 */
export const errorHandler = (err, req, res, _next) => {
  let error = err;

  // 1. Translate Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field:
        issue.path
          .filter((p) => p !== "body" && p !== "query" && p !== "params")
          .join(".") || issue.path.join("."),
      message: issue.message,
    }));

    error = new ApiError(
      400,
      "Validation failed on incoming request",
      formattedErrors,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  // 2. Translate Mongoose CastError (Invalid ObjectId)
  else if (err.name === "CastError") {
    error = new ApiError(
      400,
      `Invalid identifier format provided for field: ${err.path}`,
      [{ field: err.path, message: "Malformed identifier" }],
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  // 3. Translate MongoDB Unique Index Collision (Code 11000)
  else if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    const duplicateField = fields.length > 0 ? fields[0] : "resource";

    error = new ApiError(
      409,
      `Duplicate resource: ${duplicateField} already exists.`,
      [{ field: duplicateField, message: "Must be unique" }],
      ERROR_CODES.CONFLICT
    );
  }
  // 4. Translate JWT Errors
  else if (err.name === "JsonWebTokenError") {
    error = new ApiError(
      401,
      "Invalid authentication token signature",
      [],
      ERROR_CODES.TOKEN_INVALID
    );
  } else if (err.name === "TokenExpiredError") {
    error = new ApiError(
      401,
      "Authentication token has expired",
      [],
      ERROR_CODES.TOKEN_EXPIRED
    );
  }
  // 5. Catch-All for Non-ApiError Operational Errors
  else if (!(error instanceof ApiError)) {
    const statusCode = err.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" && statusCode === 500
        ? "Internal Server Error"
        : err.message || "Internal Server Error";

    error = new ApiError(
      statusCode,
      message,
      err.errors || [],
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      err.stack
    );
  }

  // Structured logging of operational vs unexpected errors
  if (error.statusCode >= 500) {
    logger.error(`[UnhandledException] ${error.message}`, {
      path: req.originalUrl,
      method: req.method,
      stack: error.stack,
    });
  }

  const responsePayload = {
    success: false,
    message: error.message,
    errors: error.errors || [],
    data: null,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(responsePayload);
};
