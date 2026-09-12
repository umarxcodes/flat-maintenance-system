// =====================  MAINTENANCE REQUESTS API SERVICE  ====
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const maintenanceRequestsApi = {
  getRequests: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.MAINTENANCE_REQUESTS.BASE, { params });
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
};

export default maintenanceRequestsApi;
