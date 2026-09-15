// =====================  STAFF SERVICE  ==========================
import { staffApi } from "../features/staff/api/staff.api.js";

/**
 * Service for staff rosters, duty shifts, and technician assignments.
 */
export const staffService = {
  getStaff: (params) => staffApi.getStaff(params),
  getStaffById: (id) => staffApi.getStaffById(id),
  createStaff: (payload) => staffApi.createStaff(payload),
  updateStaff: (id, payload) => staffApi.updateStaff(id, payload),
};

export default staffService;
