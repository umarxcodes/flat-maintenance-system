import { logger } from "../../utils/logger.util.js";

/**
 * Enumeration of security-relevant audit event types.
 */
export const AUTH_SECURITY_EVENTS = Object.freeze({
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILED: "AUTH_LOGIN_FAILED",
  AUTH_ACCOUNT_LOCKED: "AUTH_ACCOUNT_LOCKED",
  AUTH_REFRESH_SUCCESS: "AUTH_REFRESH_SUCCESS",
  AUTH_TOKEN_THEFT_DETECTED: "AUTH_TOKEN_THEFT_DETECTED",
  AUTH_LOGOUT: "AUTH_LOGOUT",
  AUTH_PASSWORD_CHANGED: "AUTH_PASSWORD_CHANGED",
  AUTH_FORGOT_PASSWORD_REQUEST: "AUTH_FORGOT_PASSWORD_REQUEST",
  AUTH_PASSWORD_RESET_SUCCESS: "AUTH_PASSWORD_RESET_SUCCESS",
  AUTH_ACCOUNT_ACTIVATED: "AUTH_ACCOUNT_ACTIVATED",
});

/**
 * Emits an authentication security event.
 *
 * Security Boundary:
 * Forwards structured telemetry to the system audit boundary.
 * Never includes plaintext tokens, hashes, or passwords in event metadata.
 *
 * @param {string} event - Event name from AUTH_SECURITY_EVENTS.
 * @param {Object} metadata - Safe contextual metadata (userId, email, ip, userAgent).
 */
export const emitAuthSecurityEvent = (event, metadata = {}) => {
  logger.security(event, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
};
