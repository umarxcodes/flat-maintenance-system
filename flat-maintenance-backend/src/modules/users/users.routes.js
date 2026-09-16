import { Router } from "express";
import multer from "multer";
import {
  inviteUser,
  listUsers,
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  deleteProfileAvatar,
  getUserById,
  updateUserStatus,
  uploadUserAvatarById,
} from "./users.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import {
  inviteUserSchema,
  listUsersQuerySchema,
  userIdParamSchema,
  updateUserStatusSchema,
  updateProfileSchema,
} from "./users.validation.js";

// =====================  MULTER MEMORY CONFIGURATION  =======
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile picture
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        new ApiError(
          400,
          "Invalid file format. Only JPEG, PNG, and WebP images are allowed.",
          [{ field: "file", message: "Only image files permitted" }],
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }
    cb(null, true);
  },
});

/**
 * Middleware adapter: Safely extracts single 'file' or 'avatar' field into RAM buffer.
 */
const uploadSingleAvatar = (req, res, next) => {
  const uploader = upload.fields([
    { name: "file", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
  ]);

  uploader(req, res, (err) => {
    if (err) {
      if (err instanceof ApiError) {
        return next(err);
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new ApiError(
            400,
            "Profile picture exceeds 5MB limit",
            [{ field: "file", message: "Image exceeds 5MB" }],
            ERROR_CODES.VALIDATION_ERROR
          )
        );
      }
      return next(
        new ApiError(
          400,
          err.message || "File upload failed",
          [{ field: "file", message: err.message }],
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }

    // Normalize req.file from either 'file' or 'avatar'
    if (!req.file) {
      if (req.files?.file?.[0]) {
        req.file = req.files.file[0];
      } else if (req.files?.avatar?.[0]) {
        req.file = req.files.avatar[0];
      }
    }

    next();
  });
};

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
 * POST /api/v1/users/profile/avatar
 * DELETE /api/v1/users/profile/avatar
 */
router.get("/profile", getProfile);
router.patch("/profile", validate(updateProfileSchema), updateProfile);
router.post("/profile/avatar", uploadSingleAvatar, uploadProfileAvatar);
router.delete("/profile/avatar", deleteProfileAvatar);

// =====================  STATUS & DETAIL ROUTES  ============
/**
 * Specific User Profile & State Operations
 * GET /api/v1/users/:id
 * PATCH /api/v1/users/:id/status
 * POST /api/v1/users/:id/avatar
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

router.post(
  "/:id/avatar",
  authorize(PERMISSIONS.USER_UPDATE),
  validate(userIdParamSchema),
  uploadSingleAvatar,
  uploadUserAvatarById
);

// =====================  EXPORTS  ===========================
export default router;
