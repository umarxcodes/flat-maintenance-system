// =====================  IMPORTS  ==========================
import { ApiError } from "../utils/ApiError.js";
import { ERROR_CODES } from "../constants/error-codes.constant.js";
import { ROLES } from "../constants/roles.constant.js";
import { ROLE_PERMISSIONS } from "../constants/permissions.constant.js";

// =====================  AUTHORIZATION MIDDLEWARE  =========
/**
 * Gate 2: RBAC Permission Authorization Middleware.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 13 (Three-Gate Pipeline):
 * - Gate 1: Authentication (`authenticate` attaches `req.user`).
 * - Gate 2: RBAC Permission check (`authorize(...permissions)`).
 * - Gate 3: OBAC Scope check (evaluated by domain services & scope helpers).
 *
 * Invariants:
 * - SUPER_ADMIN bypasses all permission checks (global platform governor).
 * - For non-SuperAdmins, the user's role must possess at least one of the specified permissions.
 * - Fails closed with HTTP 403 Forbidden if permissions are unsatisfied.
 *
 * @param {...string} requiredPermissions - Canonical permission tokens from PERMISSIONS.
 * @returns {import('express').RequestHandler} Express middleware function.
 */
export const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ApiError(
          401,
          "Authentication required prior to authorization check",
          [],
          ERROR_CODES.UNAUTHENTICATED
        )
      );
    }

    // Level 1: SUPER_ADMIN possesses global bypass
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasRequiredPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasRequiredPermission) {
      return next(
        new ApiError(
          403,
          `Access forbidden: role '${req.user.role}' lacks required permission (${requiredPermissions.join(", ")})`,
          [],
          ERROR_CODES.FORBIDDEN
        )
      );
    }

    next();
  };
};
