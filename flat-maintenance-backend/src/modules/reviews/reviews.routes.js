// =====================  IMPORTS  ==========================
import { Router } from "express";
import {
  createReview,
  listReviews,
  moderateReview,
} from "./reviews.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import {
  createReviewSchema,
  listReviewsQuerySchema,
  moderateReviewSchema,
} from "./reviews.validation.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

/**
 * Middleware: Verifies actor role belongs to permitted list.
 *
 * @param  {...string} allowedRoles - Authorized role strings.
 * @returns {import('express').RequestHandler}
 */
const authorizeRoles =
  (...allowedRoles) =>
  (req, res, next) => {
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

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return next(
      new ApiError(
        403,
        `Access forbidden: role '${req.user.role}' is not authorized to perform moderation operations`,
        [],
        ERROR_CODES.FORBIDDEN
      )
    );
  };

// =====================  REVIEW ROUTES  =====================
/**
 * @route   POST /api/v1/reviews
 * @desc    Submit 1–5 star rating for completed work order
 * @access  Resident (Tenant for leased flat / Owner for owned flat) with REVIEW_CREATE
 */
router.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.REVIEW_CREATE),
  validate(createReviewSchema),
  createReview
);

/**
 * @route   GET /api/v1/reviews
 * @desc    Query published reviews by technician or building
 * @access  Authenticated user with REVIEW_READ
 */
router.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.REVIEW_READ),
  validate(listReviewsQuerySchema),
  listReviews
);

/**
 * @route   PATCH /api/v1/reviews/:id/moderate
 * @desc    Flag or hide reviews
 * @access  Manager / Administrator with REVIEW_READ and managerial role
 */
router.patch(
  "/:id/moderate",
  authenticate,
  authorize(PERMISSIONS.REVIEW_READ),
  authorizeRoles(ROLES.MANAGER, ROLES.BUILDING_ADMIN, ROLES.SUPER_ADMIN),
  validate(moderateReviewSchema),
  moderateReview
);

// =====================  EXPORTS  ===========================
export default router;
