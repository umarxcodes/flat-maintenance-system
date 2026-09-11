// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { notificationsService } from "./notifications.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLERS  =======================
/**
 * Controller: Returns the authenticated user's personal notification feed.
 *
 * GET /api/v1/notifications
 */
export const listUserNotifications = asyncHandler(async (req, res) => {
  const query = req.validated?.query || req.query;
  const result = await notificationsService.listUserNotifications({
    actor: req.user,
    query,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Personal notifications retrieved successfully"
      )
    );
});

/**
 * Controller: Marks a single personal notification as read.
 *
 * PATCH /api/v1/notifications/:id/read
 */
export const markNotificationRead = asyncHandler(async (req, res) => {
  const result = await notificationsService.markNotificationRead({
    actor: req.user,
    id: req.params.id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Notification marked as read successfully")
    );
});

/**
 * Controller: Marks all unread personal notifications as read in a single bulk operation.
 *
 * PATCH /api/v1/notifications/read-all
 */
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await notificationsService.markAllNotificationsRead({
    actor: req.user,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "All notifications marked as read successfully"
      )
    );
});
