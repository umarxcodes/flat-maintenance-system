// =====================  IMPORTS  ==========================
import jwt from "jsonwebtoken";
import { ApiError } from "./ApiError.js";
import { ERROR_CODES } from "../constants/error-codes.constant.js";

// =====================  TOKEN GENERATION  ==================
/**
 * Signs a short-lived Bearer Access Token (15-minute validity window).
 *
 * Security Boundary:
 * - Transported via `Authorization: Bearer <token>` header.
 * - Intended for rapid stateless verification by API gateway / OBAC middleware.
 * - Contains minimal claims: `sub`, `role`, `buildingIds`, `jti`.
 * - Never includes passwords, token hashes, or personal profile data.
 *
 * @param {Object} claims - Token claims.
 * @param {string} claims.sub - User ObjectId string.
 * @param {string} claims.role - User role string.
 * @param {Array<string>} [claims.buildingIds=[]] - Assigned building ObjectIds.
 * @param {string} claims.jti - Unique session / token identifier.
 * @returns {string} Signed JWT Access Token.
 */
export const generateAccessToken = ({ sub, role, buildingIds = [], jti }) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET environment variable is not defined");
  }

  const payload = {
    sub,
    role,
    buildingIds,
    jti,
  };

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
  });
};

/**
 * Signs a long-lived Refresh Token (7-day validity window).
 *
 * Security Boundary:
 * - Transported exclusively via HttpOnly, Secure, SameSite=Strict cookie.
 * - Single-use rotation: presented once, consumed, and replaced.
 * - Plaintext JWT is NEVER stored in MongoDB; only its SHA-256 hash is persisted.
 *
 * @param {Object} claims - Token claims.
 * @param {string} claims.sub - User ObjectId string.
 * @param {string} claims.familyId - Token family UUID string for theft tracking.
 * @param {string} claims.jti - Unique refresh token UUID string.
 * @returns {string} Signed JWT Refresh Token.
 */
export const generateRefreshToken = ({ sub, familyId, jti }) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not defined");
  }

  const payload = {
    sub,
    familyId,
    jti,
  };

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
  });
};

// =====================  TOKEN VERIFICATION  ================
/**
 * Verifies an Access JWT signature and expiration.
 *
 * @param {string} token - Raw JWT string.
 * @returns {Object} Decoded payload.
 * @throws {ApiError} 401 if invalid or expired.
 */
export const verifyAccessToken = (token) => {
  try {
    const secret = process.env.JWT_ACCESS_SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(
        401,
        "Authentication access token has expired",
        [],
        ERROR_CODES.TOKEN_EXPIRED
      );
    }
    throw new ApiError(
      401,
      "Invalid authentication token signature",
      [],
      ERROR_CODES.TOKEN_INVALID
    );
  }
};

/**
 * Verifies a Refresh JWT signature and expiration.
 *
 * @param {string} token - Raw refresh JWT string from cookie.
 * @returns {Object} Decoded payload with { sub, familyId, jti }.
 * @throws {ApiError} 401 if invalid or expired.
 */
export const verifyRefreshToken = (token) => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(
        401,
        "Refresh token has expired. Please authenticate again.",
        [],
        ERROR_CODES.TOKEN_EXPIRED
      );
    }
    throw new ApiError(
      401,
      "Invalid refresh token signature.",
      [],
      ERROR_CODES.TOKEN_INVALID
    );
  }
};
