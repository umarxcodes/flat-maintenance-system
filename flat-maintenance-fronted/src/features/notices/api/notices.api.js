// =====================  NOTICES API SERVICE  ==================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const noticesApi = {
  getNotices: async (params = {}) => {
    const cleanParams = Object.entries(params).reduce((acc, [key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        acc[key] = val;
      }
      return acc;
    }, {});
    return await apiClient.get(API_ENDPOINTS.NOTICES.BASE, { params: cleanParams });
  },

  getNoticeById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.NOTICES.BY_ID(id));
  },

  publishNotice: async (data) => {
    return await apiClient.post(API_ENDPOINTS.NOTICES.BASE, data);
  },

  retractNotice: async (id) => {
    return await apiClient.delete(API_ENDPOINTS.NOTICES.BY_ID(id));
  },
};

export default noticesApi;
