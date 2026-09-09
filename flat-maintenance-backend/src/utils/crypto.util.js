import crypto from "node:crypto";

/**
 * Computes a deterministic SHA-256 cryptographic digest of a token string.
 *
 * Security Boundary:
 * - Plaintext refresh tokens, invitation tokens, and password reset tokens
 *   are NEVER stored in MongoDB.
 * - Only the SHA-256 digest is persisted at rest.
 * - Comparing token digests prevents timing attacks and database compromise exposure.
 *
 * @param {string} token - Raw plaintext token.
 * @returns {string} Hexadecimal SHA-256 hash.
 */
export const hashToken = (token) => {
  if (!token || typeof token !== "string") {
    throw new Error("Cannot hash an invalid or empty token");
  }
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Generates a cryptographically strong pseudo-random hexadecimal token.
 *
 * Used for:
 * - Single-use account onboarding invitation tokens (minimum 32 bytes / 64 hex characters).
 * - Single-use password reset tokens (32 bytes / 64 hex characters).
 *
 * @param {number} [byteLength=32] - Number of random bytes to generate.
 * @returns {string} High-entropy hex string.
 */
export const generateCryptoToken = (byteLength = 32) => {
  return crypto.randomBytes(byteLength).toString("hex");
};

/**
 * Generates a cryptographically secure UUID v4 string.
 *
 * Used for:
 * - Session and refresh-token `jti` identifiers.
 * - Refresh-token rotation `familyId` identifiers.
 *
 * @returns {string} UUID v4 string.
 */
export const generateUUID = () => {
  return crypto.randomUUID();
};
