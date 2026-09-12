// =====================  STAFF API SERVICE  ====================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const staffApi = {
  getStaff: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.STAFF.BASE, { params });
  },

  getStaffById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.STAFF.BY_ID(id));
  },

  createStaff: async (data) => {
    return await apiClient.post(API_ENDPOINTS.STAFF.BASE, data);
  },
};

export default staffApi;
