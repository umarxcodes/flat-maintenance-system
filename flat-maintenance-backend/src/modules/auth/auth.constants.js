/**
 * Authentication and Session Domain Constants.
 *
 * Security Invariants:
 * - Refresh tokens are stored in HttpOnly cookies with SameSite=Strict and Path=/.
 * - In production environments, secure flag must always be true.
 * - Brute force threshold: 5 failed attempts locks the account for 15 minutes.
 * - Single-use invitation tokens expire after 72 hours.
 * - Single-use password reset tokens expire after 15 minutes.
 */

export const AUTH_CONSTANTS = Object.freeze({
  REFRESH_COOKIE_NAME: "refreshToken",
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCK_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  INVITATION_EXPIRY_MS: 72 * 60 * 60 * 1000, // 72 hours
  PASSWORD_RESET_EXPIRY_MS: 15 * 60 * 1000, // 15 minutes
  ACCESS_TOKEN_EXPIRY_MS: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  BCRYPT_SALT_ROUNDS: 12,
});

/**
 * Generates deterministic cookie configuration options based on environment.
 *
 * @param {Object} [overrides={}] - Optional property overrides.
 * @returns {import('express').CookieOptions} Secure Express cookie options.
 */
export const getRefreshCookieOptions = (overrides = {}) => {
  const isProduction = process.env.NODE_ENV === "production";
  const explicitSecure = process.env.COOKIE_SECURE === "true";

  return {
    httpOnly: true,
    secure: isProduction || explicitSecure,
    sameSite: "strict",
    path: "/",
    maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_MS,
    ...overrides,
  };
};
