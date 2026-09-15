// =====================  COMPLAINTS SERVICE  =====================
import { complaintsApi } from "../features/complaints/api/complaints.api.js";

/**
 * Service for resident grievances and incident resolution.
 */
export const complaintsService = {
  getComplaints: (params) => complaintsApi.getComplaints(params),
  getComplaintById: (id) => complaintsApi.getComplaintById(id),
  createComplaint: (payload) => complaintsApi.createComplaint(payload),
  updateStatus: (id, payload) => complaintsApi.updateStatus(id, payload),
};

export default complaintsService;
