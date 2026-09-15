// =====================  STAFF API SERVICE  ====================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const staffApi = {
  getStaff: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.buildingId) cleanParams.buildingId = params.buildingId;
    if (params.category) cleanParams.category = params.category;
    if (params.subCategory) cleanParams.subCategory = params.subCategory;
    if (params.assignedShift) cleanParams.assignedShift = params.assignedShift;
    if (params.status) cleanParams.status = params.status;
    if (params.availability) cleanParams.availability = params.availability;
    if (params.search) cleanParams.search = params.search;
    return await apiClient.get(API_ENDPOINTS.STAFF.BASE, { params: cleanParams });
  },

  getStaffById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.STAFF.BY_ID(id));
  },

  createStaff: async (data) => {
    return await apiClient.post(API_ENDPOINTS.STAFF.BASE, data);
  },
};

export default staffApi;
