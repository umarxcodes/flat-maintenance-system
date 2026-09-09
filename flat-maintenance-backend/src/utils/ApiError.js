// =====================  IMPORTS  ==========================
import { ERROR_CODES } from "../constants/error-codes.constant.js";

// =====================  ERROR HANDLING  ====================
/**
 * Standardized operational error class for all HTTP and domain failures.
 *
 * Adheres strictly to the documented ApiError envelope:
 * {
 *   "success": false,
 *   "message": "...",
 *   "errors": [...],
 *   "data": null
 * }
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 409, 500).
   * @param {string} message - Human-readable error explanation.
   * @param {Array<Object>} [errors=[]] - Itemized field-level error details.
   * @param {string} [errorCode=ERROR_CODES.INTERNAL_SERVER_ERROR] - Machine-readable error code.
   * @param {string} [stack=""] - Optional error stack trace.
   */
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    stack = ""
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.errorCode = errorCode;
    this.data = null;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// =====================  EXPORTS  ===========================
export default ApiError;
