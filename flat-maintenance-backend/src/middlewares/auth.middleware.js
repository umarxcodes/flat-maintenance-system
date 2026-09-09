import { verifyAccessToken } from "../utils/token.util.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ERROR_CODES } from "../constants/error-codes.constant.js";
import { ACCOUNT_STATUS } from "../constants/status.constant.js";

/**
 * Authentication Gatekeeper Middleware.
 *
 * Verifies short-lived Bearer Access JWT, confirms active account state in database,
 * and attaches authenticated principal context (id, email, role, assignedBuildingIds) to req.user.
 *
 * This establishes the security boundary for downstream RBAC and OBAC middleware.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Next middleware callback.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(
        401,
        "Authentication access token required in Authorization header",
        [],
        ERROR_CODES.UNAUTHENTICATED
      );
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ApiError(
        401,
        "Malformed Bearer token provided",
        [],
        ERROR_CODES.UNAUTHENTICATED
      );
    }

    // Cryptographic signature and expiration check
    const decoded = verifyAccessToken(token);

    // Verify user exists and maintains lawful active state
    const user = await User.findOne({
      _id: decoded.sub,
      isDeleted: false,
    });

    if (!user) {
      throw new ApiError(
        401,
        "User account associated with this token does not exist",
        [],
        ERROR_CODES.UNAUTHENTICATED
      );
    }

    if (user.status !== ACCOUNT_STATUS.ACTIVE) {
      throw new ApiError(
        403,
        "User account is not active. Access denied.",
        [],
        ERROR_CODES.ACCOUNT_NOT_ACTIVE
      );
    }

    // Attach authenticated identity context
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      assignedBuildingIds: (user.assignedBuildingIds || []).map((id) =>
        id.toString()
      ),
      sessionId: decoded.jti,
    };

    next();
  } catch (error) {
    next(error);
  }
};
