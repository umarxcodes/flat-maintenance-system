// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { usersService } from "./users.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";

// =====================  ADMINISTRATIVE CONTROLLERS  =======
/**
 * Controller: Dispatches an invitation token for a new user account.
 * POST /api/v1/users/invite
 */
export const inviteUser = asyncHandler(async (req, res) => {
  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  const result = await usersService.inviteUser(
    {
      actor: req.user,
      input: req.body,
    },
    context
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result, "User invitation created successfully"));
});

/**
 * Controller: Lists paginated users filtered by role, building, and status.
 * GET /api/v1/users
 */
export const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await usersService.listUsers({
    actor: req.user,
    query: req.validated?.query || req.query,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users retrieved successfully", meta));
});

// =====================  SELF-SERVICE PROFILE  ==============
/**
 * Controller: Retrieves profile details of the authenticated principal.
 * GET /api/v1/users/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await usersService.getProfile(req.user.id);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile retrieved successfully"));
});

/**
 * Controller: Updates personal profile metadata of the authenticated principal.
 * PATCH /api/v1/users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  const user = await usersService.updateProfile(req.user.id, req.body, context);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully"));
});

// =====================  USER DETAIL & STATUS  ==============
/**
 * Controller: Retrieves profile details for a specific user ID.
 * GET /api/v1/users/:id
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await usersService.getUserById({
    actor: req.user,
    id: req.params.id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details retrieved successfully"));
});

/**
 * Controller: Updates account status (ACTIVE, SUSPENDED, INACTIVE).
 * PATCH /api/v1/users/:id/status
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  const user = await usersService.updateUserStatus(
    {
      actor: req.user,
      id: req.params.id,
      status: req.body.status,
    },
    context
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "User account status updated successfully")
    );
});

/**
 * Controller: Uploads personal avatar for authenticated user.
 * POST /api/v1/users/profile/avatar
 */
export const uploadProfileAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(
      400,
      "Please upload an image file (PNG, JPEG, WebP)",
      [{ field: "file", message: "File is required" }],
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  const user = await usersService.uploadAvatar(
    req.user.id,
    req.file.buffer,
    req.file.mimetype,
    context
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile picture updated successfully"));
});

/**
 * Controller: Deletes personal avatar for authenticated user.
 * DELETE /api/v1/users/profile/avatar
 */
export const deleteProfileAvatar = asyncHandler(async (req, res) => {
  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  const user = await usersService.deleteAvatar(req.user.id, context);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile picture removed successfully"));
});

/**
 * Controller: Uploads avatar for a specific user ID (Admin).
 * POST /api/v1/users/:id/avatar
 */
export const uploadUserAvatarById = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(
      400,
      "Please upload an image file (PNG, JPEG, WebP)",
      [{ field: "file", message: "File is required" }],
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const context = {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  const user = await usersService.uploadAvatar(
    req.params.id,
    req.file.buffer,
    req.file.mimetype,
    context
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"));
});
