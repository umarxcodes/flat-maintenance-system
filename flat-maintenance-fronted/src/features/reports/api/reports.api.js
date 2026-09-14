// =====================  REPORTS API SERVICE  ==================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const reportsApi = {
  getMaintenanceCollections: async (params = {}) => {
    const cleanParams = {};
    if (params.buildingId) cleanParams.buildingId = params.buildingId;
    if (params.period) cleanParams.period = params.period;
    return await apiClient.get(API_ENDPOINTS.REPORTS.MAINTENANCE_COLLECTIONS, { params: cleanParams });
  },

  getStaffPerformance: async (params = {}) => {
    const cleanParams = {};
    if (params.buildingId) cleanParams.buildingId = params.buildingId;
    return await apiClient.get(API_ENDPOINTS.REPORTS.STAFF_PERFORMANCE, { params: cleanParams });
  },

  getComplaintSla: async (params = {}) => {
    const cleanParams = {};
    if (params.buildingId) cleanParams.buildingId = params.buildingId;
    return await apiClient.get(API_ENDPOINTS.REPORTS.COMPLAINT_SLA, { params: cleanParams });
  },
};

export default reportsApi;
