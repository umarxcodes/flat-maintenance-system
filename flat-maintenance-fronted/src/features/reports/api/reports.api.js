// =====================  REPORTS API SERVICE  ==================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const reportsApi = {
  getMaintenanceCollections: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.REPORTS.MAINTENANCE_COLLECTIONS, { params });
  },

  getStaffPerformance: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.REPORTS.STAFF_PERFORMANCE, { params });
  },

  getComplaintSla: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.REPORTS.COMPLAINT_SLA, { params });
  },
};

export default reportsApi;
