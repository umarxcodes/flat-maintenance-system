import asyncHandler from "express-async-handler";
import { authService } from "./auth.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { AUTH_CONSTANTS, getRefreshCookieOptions } from "./auth.constants.js";

/**
 * Controller: Authenticates user credentials and sets HttpOnly refresh cookie.
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  const { accessToken, refreshToken, user } = await authService.login(
    req.body,
    context
  );

  res.cookie(
    AUTH_CONSTANTS.REFRESH_COOKIE_NAME,
    refreshToken,
    getRefreshCookieOptions()
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, { accessToken, user }, "Authentication successful")
    );
});

/**
 * Controller: Rotates single-use refresh token and issues fresh access token.
 * POST /api/v1/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const presentedToken = req.cookies?.[AUTH_CONSTANTS.REFRESH_COOKIE_NAME];
  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  try {
    const {
      accessToken,
      refreshToken: newRefreshToken,
      user,
    } = await authService.refreshToken(presentedToken, context);

    res.cookie(
      AUTH_CONSTANTS.REFRESH_COOKIE_NAME,
      newRefreshToken,
      getRefreshCookieOptions()
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken, user },
          "Session refreshed successfully"
        )
      );
  } catch (error) {
    // On failure or reuse detection, always clear the cookie on client
    res.clearCookie(
      AUTH_CONSTANTS.REFRESH_COOKIE_NAME,
      getRefreshCookieOptions({ maxAge: 0 })
    );
    throw error;
  }
});

/**
 * Controller: Revokes active refresh session and clears cookie.
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const presentedToken = req.cookies?.[AUTH_CONSTANTS.REFRESH_COOKIE_NAME];
  const userId = req.user?.id;
  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  if (userId) {
    await authService.logout(userId, presentedToken, context);
  }

  res.clearCookie(
    AUTH_CONSTANTS.REFRESH_COOKIE_NAME,
    getRefreshCookieOptions({ maxAge: 0 })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

/**
 * Controller: Returns authenticated user's sanitized identity profile.
 * GET /api/v1/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user identity retrieved"));
});

/**
 * Controller: Updates password and revokes previous sessions.
 * PATCH /api/v1/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  await authService.changePassword(req.user.id, req.body, context);

  res.clearCookie(
    AUTH_CONSTANTS.REFRESH_COOKIE_NAME,
    getRefreshCookieOptions({ maxAge: 0 })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Password changed successfully. Please log in with your new password."
      )
    );
});

/**
 * Controller: Generates password reset token without leaking email existence.
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  const result = await authService.forgotPassword(req.body, context);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "If an account with that email exists, password reset instructions have been dispatched."
      )
    );
});

/**
 * Controller: Consumes password reset token and sets new password.
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  await authService.resetPassword(req.body, context);

  res.clearCookie(
    AUTH_CONSTANTS.REFRESH_COOKIE_NAME,
    getRefreshCookieOptions({ maxAge: 0 })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Password has been reset successfully. You may now log in."
      )
    );
});

/**
 * Controller: Activates an invited account with single-use invitation token (FR-AUTH-04).
 * POST /api/v1/auth/activate-account
 */
export const activateAccount = asyncHandler(async (req, res) => {
  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  const result = await authService.activateAccount(req.body, context);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Account activated successfully. You may now log in."
      )
    );
});
