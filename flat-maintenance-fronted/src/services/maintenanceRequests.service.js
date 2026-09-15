// =====================  MAINTENANCE REQUESTS SERVICE  ===========
import { maintenanceRequestsApi } from "../features/maintenance-requests/api/maintenance-requests.api.js";

/**
 * Service for work orders, field triage, and technician workflows.
 */
export const maintenanceRequestsService = {
  getRequests: (params) => maintenanceRequestsApi.getRequests(params),
  getRequestById: (id) => maintenanceRequestsApi.getRequestById(id),
  createRequest: (payload) => maintenanceRequestsApi.createRequest(payload),
  updateRequest: (id, payload) => maintenanceRequestsApi.updateRequest(id, payload),
  assignStaff: (id, payload) => maintenanceRequestsApi.assignStaff(id, payload),
  updateStatus: (id, payload) => maintenanceRequestsApi.updateStatus(id, payload),
  verifyRequest: (id, payload) => maintenanceRequestsApi.verifyRequest(id, payload),
};

export default maintenanceRequestsService;
