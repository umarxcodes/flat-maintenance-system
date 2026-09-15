// =====================  AUDIT LOGS API SERVICE  ==============
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

/**
 * Client service for querying Module 24 Audit Logs.
 * Adheres strictly to Zero-Trust parameter sanitization avoiding backend Zod .strict() rejection.
 */
export const auditLogsApi = {
  getAuditLogs: async (params = {}) => {
    const cleanParams = {};

    if (params.page !== undefined && params.page !== null && params.page !== "") {
      cleanParams.page = Math.max(1, parseInt(params.page, 10) || 1);
    }
    if (params.limit !== undefined && params.limit !== null && params.limit !== "") {
      cleanParams.limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    }
    if (params.buildingId && typeof params.buildingId === "string" && params.buildingId.trim()) {
      cleanParams.buildingId = params.buildingId.trim();
    }
    if (params.resourceType && typeof params.resourceType === "string" && params.resourceType.trim()) {
      cleanParams.resourceType = params.resourceType.trim().toUpperCase();
    }
    if (params.resourceId && typeof params.resourceId === "string" && params.resourceId.trim()) {
      cleanParams.resourceId = params.resourceId.trim();
    }
    if (params.actorUserId && typeof params.actorUserId === "string" && params.actorUserId.trim()) {
      cleanParams.actorUserId = params.actorUserId.trim();
    }
    if (params.action && typeof params.action === "string" && params.action.trim()) {
      cleanParams.action = params.action.trim().toUpperCase();
    }
    if (params.from && typeof params.from === "string" && params.from.trim()) {
      cleanParams.from = params.from.trim();
    }
    if (params.to && typeof params.to === "string" && params.to.trim()) {
      cleanParams.to = params.to.trim();
    }

    return await apiClient.get(API_ENDPOINTS.AUDIT_LOGS.BASE, { params: cleanParams });
  },
};

export default auditLogsApi;
