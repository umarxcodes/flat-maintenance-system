// =====================  NOTIFICATIONS API SERVICE  ===========
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const notificationsApi = {
  getNotifications: async (params = {}) => {
    const cleanParams = Object.entries(params).reduce((acc, [key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        acc[key] = val;
      }
      return acc;
    }, {});
    return await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.BASE, { params: cleanParams });
  },

  markAsRead: async (id) => {
    return await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  markAllAsRead: async () => {
    return await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },
};

export default notificationsApi;
