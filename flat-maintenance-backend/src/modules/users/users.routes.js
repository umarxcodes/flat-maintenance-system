// =====================  IMPORTS  ==========================
import { Router } from "express";
import {
  inviteUser,
  listUsers,
  getProfile,
  updateProfile,
  getUserById,
  updateUserStatus,
} from "./users.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  inviteUserSchema,
  listUsersQuerySchema,
  userIdParamSchema,
  updateUserStatusSchema,
  updateProfileSchema,
} from "./users.validation.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

// All user domain routes mandate an active authenticated identity
router.use(authenticate);

// =====================  USER PROVISIONING & DIRECTORY  =====
/**
 * Administrative User Provisioning
 * POST /api/v1/users/invite
 */
router.post(
  "/invite",
  authorize(PERMISSIONS.USER_CREATE),
  validate(inviteUserSchema),
  inviteUser
);

router.post(
  "/",
  authorize(PERMISSIONS.USER_CREATE),
  validate(inviteUserSchema),
  inviteUser
);

/**
 * Administrative User Directory
 * GET /api/v1/users
 */
router.get(
  "/",
  authorize(PERMISSIONS.USER_READ),
  validate(listUsersQuerySchema),
  listUsers
);

// =====================  SELF-SERVICE PROFILE  ==============
/**
 * Self-Service Profile Management
 * Invariant: Registered BEFORE /:id to prevent route shadowing
 * GET /api/v1/users/profile
 * PATCH /api/v1/users/profile
 */
router.get("/profile", getProfile);
router.patch("/profile", validate(updateProfileSchema), updateProfile);

// =====================  STATUS & DETAIL ROUTES  ============
/**
 * Specific User Profile & State Operations
 * GET /api/v1/users/:id
 * PATCH /api/v1/users/:id/status
 */
router.get(
  "/:id",
  authorize(PERMISSIONS.USER_READ),
  validate(userIdParamSchema),
  getUserById
);

router.patch(
  "/:id/status",
  authorize(PERMISSIONS.USER_STATUS_UPDATE),
  validate(updateUserStatusSchema),
  updateUserStatus
);

// =====================  EXPORTS  ===========================
export default router;
