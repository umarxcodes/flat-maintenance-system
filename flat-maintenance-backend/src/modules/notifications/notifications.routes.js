// =====================  IMPORTS  ==========================
import { Router } from "express";
import {
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notifications.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  listNotificationsQuerySchema,
  markNotificationReadSchema,
  markAllNotificationsReadSchema,
} from "./notifications.validation.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

// =====================  NOTIFICATION ROUTES  ===============
/**
 * @route   GET /api/v1/notifications
 * @desc    Fetch personal in-app alert stream for authenticated user
 * @access  Private (Authenticated principal)
 */
router.get(
  "/",
  authenticate,
  validate(listNotificationsQuerySchema),
  listUserNotifications
);

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all unread personal notifications as read in a single atomic bulk update
 * @access  Private (Authenticated principal)
 * @note    Defined prior to /:id/read to prevent Express route parameter collision
 */
router.patch(
  "/read-all",
  authenticate,
  validate(markAllNotificationsReadSchema),
  markAllNotificationsRead
);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark a specific personal notification as read
 * @access  Private (Authenticated principal)
 */
router.patch(
  "/:id/read",
  authenticate,
  validate(markNotificationReadSchema),
  markNotificationRead
);

// =====================  EXPORTS  ===========================
export default router;
