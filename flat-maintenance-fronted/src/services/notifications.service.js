// =====================  NOTIFICATIONS SERVICE  ==================
import { notificationsApi } from "../features/notifications/api/notifications.api.js";

/**
 * Service for in-app alert subscriptions and unread badge tracking.
 */
export const notificationsService = {
  getNotifications: (params) => notificationsApi.getNotifications(params),
  markAsRead: (id) => notificationsApi.markAsRead(id),
  markAllAsRead: () => notificationsApi.markAllAsRead(),
};

export default notificationsService;
