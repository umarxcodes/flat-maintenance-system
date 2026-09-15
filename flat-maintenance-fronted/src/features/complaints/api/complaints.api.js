// =====================  COMPLAINTS API SERVICE  ==============
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const complaintsApi = {
  getComplaints: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.buildingId) cleanParams.buildingId = params.buildingId;
    if (params.flatId) cleanParams.flatId = params.flatId;
    if (params.status) cleanParams.status = params.status;
    if (params.type) cleanParams.type = params.type;
    return await apiClient.get(API_ENDPOINTS.COMPLAINTS.BASE, { params: cleanParams });
  },

  getComplaintById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.COMPLAINTS.BY_ID(id));
  },

  createComplaint: async (data) => {
    return await apiClient.post(API_ENDPOINTS.COMPLAINTS.BASE, data);
  },

  resolveComplaint: async (id, data) => {
    return await apiClient.patch(API_ENDPOINTS.COMPLAINTS.RESOLVE(id), data);
  },
};

export default complaintsApi;
