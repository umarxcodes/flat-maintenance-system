// =====================  MAINTENANCE REQUESTS API SERVICE  ====
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const maintenanceRequestsApi = {
  getRequests: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.buildingId) cleanParams.buildingId = params.buildingId;
    if (params.flatId) cleanParams.flatId = params.flatId;
    if (params.status) cleanParams.status = params.status;
    if (params.category) cleanParams.category = params.category;
    if (params.priority) cleanParams.priority = params.priority;
    if (params.assignedStaffId) cleanParams.assignedStaffId = params.assignedStaffId;
    return await apiClient.get(API_ENDPOINTS.MAINTENANCE_REQUESTS.BASE, { params: cleanParams });
  },

  getRequestById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.MAINTENANCE_REQUESTS.BY_ID(id));
  },

  createRequest: async (data) => {
    return await apiClient.post(API_ENDPOINTS.MAINTENANCE_REQUESTS.BASE, data);
  },

  assignRequest: async (id, data) => {
    return await apiClient.patch(API_ENDPOINTS.MAINTENANCE_REQUESTS.ASSIGN(id), data);
  },

  updateStatus: async (id, data) => {
    return await apiClient.patch(API_ENDPOINTS.MAINTENANCE_REQUESTS.STATUS(id), data);
  },

  verifyRequest: async (id, data) => {
    return await apiClient.patch(API_ENDPOINTS.MAINTENANCE_REQUESTS.VERIFY(id), data);
  },
};

export default maintenanceRequestsApi;
