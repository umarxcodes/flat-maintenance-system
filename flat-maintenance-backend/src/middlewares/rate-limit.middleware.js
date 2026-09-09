import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError.js";
import { ERROR_CODES } from "../constants/error-codes.constant.js";

const isTestEnv =
  process.env.NODE_ENV === "test" ||
  process.env.npm_lifecycle_event?.includes("test") ||
  process.argv.some((arg) => arg.includes("test"));

/**
 * Strict Rate Limiting for Authentication Endpoints.
 *
 * Defense-in-depth against automated brute-force attacks and credential stuffing:
 * Limits clients to 15 requests per 15-minute window per IP in production/dev.
 * Relaxed to 10,000 requests during test execution.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestEnv ? 10000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        "Too many authentication attempts from this IP. Please try again after 15 minutes.",
        [],
        ERROR_CODES.RATE_LIMIT_EXCEEDED
      )
    );
  },
});
