// =====================  AUDIT LOGS API SERVICE  ==============
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const auditLogsApi = {
  getAuditLogs: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.AUDIT_LOGS.BASE, { params });
  },
};

export default auditLogsApi;
