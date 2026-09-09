/**
 * Structured Security Logger.
 *
 * Security Invariant:
 * Logs MUST NEVER contain:
 * - Passwords or password hashes
 * - Plaintext or hashed JWTs
 * - Plaintext or hashed reset tokens
 * - Plaintext or hashed invitation tokens
 * - Sensitive cookie headers
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "currentpassword",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "tokenhash",
  "invitationtoken",
  "invitationtokenhash",
  "resettoken",
  "passwordresettokenhash",
  "cookie",
  "authorization",
]);

/**
 * Recursively redacts sensitive keys from log payloads.
 *
 * @param {any} data - Input payload.
 * @returns {any} Sanitized payload.
 */
const sanitizeLogData = (data) => {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const logger = {
  info: (message, meta = {}) => {
    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message,
        ...sanitizeLogData(meta),
      })
    );
  },

  warn: (message, meta = {}) => {
    console.warn(
      JSON.stringify({
        level: "warn",
        timestamp: new Date().toISOString(),
        message,
        ...sanitizeLogData(meta),
      })
    );
  },

  error: (message, meta = {}) => {
    console.error(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message,
        ...sanitizeLogData(meta),
      })
    );
  },

  /**
   * Dedicated security and audit logger for high-priority security boundary events.
   *
   * @param {string} event - Unique security event identifier (e.g. AUTH_TOKEN_THEFT_DETECTED).
   * @param {Object} details - Event details (safe metadata only).
   */
  security: (event, details = {}) => {
    console.warn(
      JSON.stringify({
        level: "security_audit",
        timestamp: new Date().toISOString(),
        event,
        ...sanitizeLogData(details),
      })
    );
  },
};
