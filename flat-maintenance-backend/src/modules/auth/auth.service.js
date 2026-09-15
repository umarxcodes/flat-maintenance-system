// =====================  IMPORTS  ==========================
import { User } from "./auth.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { AUTH_CONSTANTS } from "./auth.constants.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/token.util.js";
import {
  hashToken,
  generateCryptoToken,
  generateUUID,
} from "../../utils/crypto.util.js";
import { AUTH_SECURITY_EVENTS, emitAuthSecurityEvent } from "./auth.events.js";
import { sendPasswordResetEmail } from "../../utils/email.util.js";

// =====================  AUTHENTICATION SERVICE  =============
/**
 * Principal Authentication and Session Domain Service.
 *
 * Enforces all authentication business invariants:
 * - Bcrypt password verification (cost 12)
 * - Single-use refresh token rotation with race-condition safety
 * - Refresh-token replay / theft detection with family revocation
 * - 5-attempt failed login lockout protection (15-minute freeze)
 * - Privileged onboarding via single-use SHA-256 hashed invitation tokens
 * - Non-enumerating responses for public forgot-password flows
 */
class AuthService {
  /**
   * Authenticates user credentials and mints a new dual-token session family.
   *
   * Security Invariants:
   * - Checks lockout state and account status before password comparison.
   * - Tracks failed attempts and enforces 15-minute lock upon 5 consecutive failures.
   * - Generic error messages prevent account enumeration.
   * - Plaintext refresh token is NEVER persisted to MongoDB; only SHA-256 digest is stored.
   *
   * @param {Object} credentials
   * @param {string} credentials.email - Normalized lowercase email.
   * @param {string} credentials.password - Plaintext password candidate.
   * @param {Object} [context={}] - Safe request telemetry (ip, userAgent).
   * @returns {Promise<{ accessToken: string, refreshToken: string, user: Object }>}
   */
  async login({ email, password }, context = {}) {
    const normalizedEmail = email.toLowerCase().trim();

    // Query user including password and lock attributes
    const user = await User.findOne({
      email: normalizedEmail,
      isDeleted: false,
    }).select("+password");

    if (!user) {
      emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_LOGIN_FAILED, {
        email: normalizedEmail,
        reason: "User not found",
        ...context,
      });
      throw new ApiError(
        401,
        "Invalid email or password",
        [],
        ERROR_CODES.UNAUTHENTICATED
      );
    }

    // 1. Account Lockout Check
    if (user.isAccountLocked()) {
      emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_ACCOUNT_LOCKED, {
        userId: user._id.toString(),
        email: normalizedEmail,
        lockUntil: user.lockUntil,
        ...context,
      });
      throw new ApiError(
        401,
        "Invalid email or password or account is temporarily locked",
        [],
        ERROR_CODES.ACCOUNT_LOCKED
      );
    }

    // 2. Account Status Validation (FR-AUTH: inactive, pending, suspended accounts cannot authenticate)
    if (user.status !== ACCOUNT_STATUS.ACTIVE) {
      emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_LOGIN_FAILED, {
        userId: user._id.toString(),
        status: user.status,
        reason: "Account not in ACTIVE state",
        ...context,
      });
      throw new ApiError(
        403,
        "Account is not active. Please complete activation or contact administration.",
        [],
        ERROR_CODES.ACCOUNT_NOT_ACTIVE
      );
    }

    // 3. Bcrypt Password Comparison
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (
        user.failedLoginAttempts >= AUTH_CONSTANTS.MAX_FAILED_LOGIN_ATTEMPTS
      ) {
        user.lockUntil = new Date(
          Date.now() + AUTH_CONSTANTS.ACCOUNT_LOCK_DURATION_MS
        );
        emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_ACCOUNT_LOCKED, {
          userId: user._id.toString(),
          failedAttempts: user.failedLoginAttempts,
          lockUntil: user.lockUntil,
          ...context,
        });
      }

      await user.save();

      emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_LOGIN_FAILED, {
        userId: user._id.toString(),
        failedAttempts: user.failedLoginAttempts,
        reason: "Invalid password",
        ...context,
      });

      throw new ApiError(
        401,
        "Invalid email or password",
        [],
        ERROR_CODES.UNAUTHENTICATED
      );
    }

    // 4. Successful Authentication: Reset lockout counters
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // 5. Dual-Token Issuance
    const familyId = generateUUID();
    const jti = generateUUID();
    const sub = user._id.toString();

    const accessToken = generateAccessToken({
      sub,
      role: user.role,
      buildingIds: (user.assignedBuildingIds || []).map((id) => id.toString()),
      jti,
    });

    const refreshToken = generateRefreshToken({
      sub,
      familyId,
      jti,
    });

    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_MS
    );

    // Persist new refresh token session record
    user.refreshTokens.push({
      jti,
      tokenHash,
      familyId,
      isUsed: false,
      createdAt: new Date(),
      expiresAt,
    });

    // Prune expired sessions to prevent array bloat over time
    const now = new Date();
    user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > now);

    await user.save();

    emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_LOGIN_SUCCESS, {
      userId: sub,
      role: user.role,
      familyId,
      ...context,
    });

    return {
      accessToken,
      refreshToken,
      user: user.toSafeUser(),
    };
  }

  /**
   * Rotates an active refresh token with atomic race-condition safety.
   *
   * Critical Security Invariant (FR-AUTH-03):
   * Refresh tokens are one-time credentials.
   * Concurrency Safety:
   * Uses an atomic MongoDB findOneAndUpdate with `{ 'refreshTokens.isUsed': false }`
   * so simultaneous requests cannot both succeed. If an already-used token is presented,
   * theft detection revokes the ENTIRE token family and terminates all active sessions.
   *
   * @param {string} presentedToken - Plaintext refresh token from cookie.
   * @param {Object} [context={}] - Request telemetry.
   * @returns {Promise<{ accessToken: string, refreshToken: string, user: Object }>}
   */
  async refreshToken(presentedToken, context = {}) {
    if (!presentedToken) {
      throw new ApiError(
        401,
        "Refresh token cookie missing",
        [],
        ERROR_CODES.UNAUTHENTICATED
      );
    }

    // Verify JWT cryptographic signature and expiry
    const decoded = verifyRefreshToken(presentedToken);
    const { sub, familyId, jti } = decoded;
    const presentedTokenHash = hashToken(presentedToken);

    // ATOMIC COMPARE-AND-SWAP WITH $elemMatch:
    // $elemMatch guarantees that jti, tokenHash, isUsed: false, and expiration
    // are matched against the EXACT SAME subdocument in the refreshTokens array.
    // If two requests attempt to consume the same token simultaneously,
    // exactly ONE will match `isUsed: false`. The other will receive null.
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: sub,
        status: ACCOUNT_STATUS.ACTIVE,
        isDeleted: false,
        refreshTokens: {
          $elemMatch: {
            jti: jti,
            tokenHash: presentedTokenHash,
            isUsed: false,
            expiresAt: { $gt: new Date() },
          },
        },
      },
      {
        $set: {
          "refreshTokens.$.isUsed": true,
        },
      },
      { returnDocument: "after" }
    );

    // If atomic consumption failed, determine whether this is a theft/reuse incident
    if (!updatedUser) {
      const user = await User.findOne({ _id: sub, isDeleted: false });

      if (!user || user.status !== ACCOUNT_STATUS.ACTIVE) {
        throw new ApiError(
          401,
          "Invalid session or account is inactive",
          [],
          ERROR_CODES.UNAUTHENTICATED
        );
      }

      // Check if the presented token exists but was already consumed (isUsed: true)
      const collisionToken = user.refreshTokens.find(
        (t) => t.jti === jti && t.tokenHash === presentedTokenHash
      );

      if (collisionToken && collisionToken.isUsed) {
        // TOKEN REUSE / THEFT DETECTED!
        // Immediately revoke ALL tokens belonging to that family
        await User.updateOne(
          { _id: sub },
          {
            $set: {
              "refreshTokens.$[elem].isUsed": true,
            },
          },
          {
            arrayFilters: [{ "elem.familyId": familyId }],
          }
        );

        emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_TOKEN_THEFT_DETECTED, {
          userId: sub,
          familyId,
          jti,
          reason: "Presented refresh token had already been consumed",
          ...context,
        });

        throw new ApiError(
          401,
          "Security alert: Token reuse detected. All sessions in this family have been terminated.",
          [],
          ERROR_CODES.TOKEN_THEFT_DETECTED
        );
      }

      throw new ApiError(
        401,
        "Invalid or expired refresh token",
        [],
        ERROR_CODES.TOKEN_INVALID
      );
    }

    // Normal Rotation: Generate new token pair preserving familyId
    const newJti = generateUUID();
    const newRefreshToken = generateRefreshToken({
      sub,
      familyId,
      jti: newJti,
    });
    const newHashedToken = hashToken(newRefreshToken);
    const newExpiresAt = new Date(
      Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_MS
    );

    // Persist new refresh token record into the user document
    await User.updateOne(
      { _id: sub },
      {
        $push: {
          refreshTokens: {
            jti: newJti,
            tokenHash: newHashedToken,
            familyId,
            isUsed: false,
            createdAt: new Date(),
            expiresAt: newExpiresAt,
          },
        },
      }
    );

    const newAccessToken = generateAccessToken({
      sub,
      role: updatedUser.role,
      buildingIds: (updatedUser.assignedBuildingIds || []).map((id) =>
        id.toString()
      ),
      jti: newJti,
    });

    emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_REFRESH_SUCCESS, {
      userId: sub,
      familyId,
      newJti,
      ...context,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: updatedUser.toSafeUser(),
    };
  }

  /**
   * Revokes the current session and invalidates the active refresh token.
   *
   * @param {string} userId - Authenticated user ObjectId.
   * @param {string} [presentedToken] - Optional refresh token from cookie.
   * @param {Object} [context={}] - Request telemetry.
   * @returns {Promise<{ success: boolean }>}
   */
  async logout(userId, presentedToken, context = {}) {
    if (presentedToken) {
      try {
        const decoded = verifyRefreshToken(presentedToken);
        const tokenHash = hashToken(presentedToken);

        await User.updateOne(
          {
            _id: userId,
            refreshTokens: {
              $elemMatch: {
                jti: decoded.jti,
                tokenHash: tokenHash,
              },
            },
          },
          {
            $set: { "refreshTokens.$.isUsed": true },
          }
        );
      } catch {
        // Safe fail-closed: even if token verify errors, proceed with logout
      }
    }

    emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_LOGOUT, {
      userId,
      ...context,
    });

    return { success: true };
  }

  /**
   * Retrieves sanitized identity profile for the currently authenticated user.
   *
   * @param {string} userId - Authenticated user ObjectId.
   * @returns {Promise<Object>} Sanitized user identity.
   */
  async getCurrentUser(userId) {
    const user = await User.findOne({
      _id: userId,
      isDeleted: false,
    });

    if (!user || user.status !== ACCOUNT_STATUS.ACTIVE) {
      throw new ApiError(
        401,
        "User session is invalid or account is not active",
        [],
        ERROR_CODES.UNAUTHENTICATED
      );
    }

    return user.toSafeUser();
  }

  /**
   * Updates an authenticated user's password and revokes existing sessions.
   *
   * Security Boundary:
   * - Verifies current password using bcrypt.
   * - Enforces strong password criteria on new password.
   * - Invariant: Replaces password using bcrypt 12 and invalidates stale refresh sessions.
   *
   * @param {string} userId - Authenticated user ID.
   * @param {Object} payload
   * @param {string} payload.currentPassword
   * @param {string} payload.newPassword
   * @param {Object} [context={}]
   * @returns {Promise<{ success: boolean }>}
   */
  async changePassword(userId, { currentPassword, newPassword }, context = {}) {
    const user = await User.findOne({
      _id: userId,
      isDeleted: false,
    }).select("+password");

    if (!user) {
      throw new ApiError(
        404,
        "User account not found",
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    const isCurrentValid = await user.comparePassword(currentPassword);
    if (!isCurrentValid) {
      throw new ApiError(
        400,
        "Current password is incorrect",
        [],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Invalidate all active refresh token families to prevent session hijacking
    user.refreshTokens.forEach((t) => {
      t.isUsed = true;
    });

    user.password = newPassword;
    await user.save();

    emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_PASSWORD_CHANGED, {
      userId,
      ...context,
    });

    return { success: true };
  }

  /**
   * Dispatches password reset token generation without account enumeration.
   *
   * Security Boundary:
   * - Never confirms or denies whether an email exists in the system.
   * - Generates cryptographically random 32-byte hex token.
   * - Plaintext token is NEVER persisted in DB; only SHA-256 hash is saved.
   * - 15-minute expiration window.
   *
   * @param {Object} payload
   * @param {string} payload.email - Recipient email.
   * @param {Object} [context={}]
   * @returns {Promise<{ message: string, rawToken?: string }>}
   */
  async forgotPassword({ email }, context = {}) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({
      email: normalizedEmail,
      isDeleted: false,
      status: ACCOUNT_STATUS.ACTIVE,
    });

    let generatedRawToken = null;
    let emailResult = null;

    if (user) {
      const rawToken = generateCryptoToken(32);
      generatedRawToken = rawToken;
      user.passwordResetTokenHash = hashToken(rawToken);
      user.passwordResetExpiresAt = new Date(
        Date.now() + AUTH_CONSTANTS.PASSWORD_RESET_EXPIRY_MS
      );
      await user.save();

      emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_FORGOT_PASSWORD_REQUEST, {
        userId: user._id.toString(),
        email: normalizedEmail,
        ...context,
      });

      // Dispatch reset email with direct link
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      emailResult = await sendPasswordResetEmail({
        to: user.email,
        resetToken: rawToken,
        userName: fullName || user.email,
      });
    }

    // Generic safe response to prevent email enumeration
    return {
      message:
        "If an account with that email exists, password reset instructions have been dispatched.",
      ...(process.env.NODE_ENV !== "production" && emailResult?.resetUrl
        ? { devResetUrl: emailResult.resetUrl }
        : {}),
      // In non-production test environments, allow test harness to inspect rawToken if needed
      ...(process.env.NODE_ENV === "test" && generatedRawToken
        ? { testOnlyResetToken: generatedRawToken }
        : {}),
    };
  }

  /**
   * Consumes a single-use password reset token and updates the user's password.
   *
   * @param {Object} payload
   * @param {string} payload.token - Plaintext reset token.
   * @param {string} [payload.newPassword] - New plaintext password.
   * @param {string} [payload.password] - Alternative password key.
   * @param {Object} [context={}]
   * @returns {Promise<{ success: boolean }>}
   */
  async resetPassword({ token, newPassword, password }, context = {}) {
    const candidatePassword = newPassword || password;
    if (!candidatePassword) {
      throw new ApiError(
        400,
        "New password is required",
        [],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
      isDeleted: false,
    }).select("+passwordResetTokenHash");

    if (!user) {
      throw new ApiError(
        400,
        "Invalid or expired password reset token",
        [],
        ERROR_CODES.TOKEN_INVALID
      );
    }

    user.password = candidatePassword;
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;

    // Revoke all existing sessions
    user.refreshTokens.forEach((t) => {
      t.isUsed = true;
    });

    await user.save();

    emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_PASSWORD_RESET_SUCCESS, {
      userId: user._id.toString(),
      ...context,
    });

    return { success: true };
  }

  /**
   * Activates an invited user account with a cryptographic invitation token (FR-AUTH-04).
   *
   * Security Invariants:
   * - Role and building scope cannot be supplied or escalated by the client.
   * - Invitation token is single-use and invalidated upon activation.
   * - Account transitions from PENDING to ACTIVE.
   *
   * @param {Object} payload
   * @param {string} payload.invitationToken - Cryptographic invitation token.
   * @param {string} payload.password - User's chosen secure password.
   * @param {Object} [context={}]
   * @returns {Promise<{ success: boolean, user: Object }>}
   */
  async activateAccount({ invitationToken, password }, context = {}) {
    const tokenHash = hashToken(invitationToken);

    const user = await User.findOne({
      invitationTokenHash: tokenHash,
      invitationExpiresAt: { $gt: new Date() },
      status: ACCOUNT_STATUS.PENDING,
      isDeleted: false,
    }).select("+invitationTokenHash");

    if (!user) {
      throw new ApiError(
        400,
        "Invalid or expired invitation token",
        [],
        ERROR_CODES.TOKEN_INVALID
      );
    }

    user.password = password;
    user.status = ACCOUNT_STATUS.ACTIVE;
    user.invitationTokenHash = null;
    user.invitationExpiresAt = null;

    await user.save();

    emitAuthSecurityEvent(AUTH_SECURITY_EVENTS.AUTH_ACCOUNT_ACTIVATED, {
      userId: user._id.toString(),
      role: user.role,
      ...context,
    });

    return {
      success: true,
      user: user.toSafeUser(),
    };
  }
}

// =====================  EXPORTS  ===========================
export const authService = new AuthService();
export default authService;
