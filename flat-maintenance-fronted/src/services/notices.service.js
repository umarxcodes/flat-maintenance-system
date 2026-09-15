// =====================  NOTICES SERVICE  ========================
import { noticesApi } from "../features/notices/api/notices.api.js";

/**
 * Service for community broadcasts and emergency announcements.
 */
export const noticesService = {
  getNotices: (params) => noticesApi.getNotices(params),
  getNoticeById: (id) => noticesApi.getNoticeById(id),
  createNotice: (payload) => noticesApi.createNotice(payload),
  updateNotice: (id, payload) => noticesApi.updateNotice(id, payload),
  deleteNotice: (id) => noticesApi.deleteNotice(id),
};

export default noticesService;
