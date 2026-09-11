// =====================  IMPORTS  ==========================
import { Router } from "express";
import {
  publishNotice,
  listActiveNotices,
  retractNotice,
} from "./notices.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  createNoticeSchema,
  listNoticesQuerySchema,
  retractNoticeSchema,
} from "./notices.validation.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

// =====================  NOTICE ROUTES  =====================
/**
 * @route   POST /api/v1/notices
 * @desc    Publish an official society bulletin or emergency announcement
 * @access  Private (BUILDING_ADMIN, MANAGER, SUPER_ADMIN possessing NOTICE_CREATE)
 */
router.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.NOTICE_CREATE),
  validate(createNoticeSchema),
  publishNotice
);

/**
 * @route   GET /api/v1/notices
 * @desc    Query active community bulletins tailored to caller's authoritative scope & audience
 * @access  Private (Authenticated users possessing NOTICE_READ)
 */
router.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.NOTICE_READ),
  validate(listNoticesQuerySchema),
  listActiveNotices
);

/**
 * @route   DELETE /api/v1/notices/:id
 * @desc    Retract an active society bulletin via soft deletion
 * @access  Private (BUILDING_ADMIN, MANAGER, SUPER_ADMIN possessing NOTICE_CREATE)
 */
router.delete(
  "/:id",
  authenticate,
  authorize(PERMISSIONS.NOTICE_CREATE),
  validate(retractNoticeSchema),
  retractNotice
);

// =====================  EXPORTS  ===========================
export default router;
