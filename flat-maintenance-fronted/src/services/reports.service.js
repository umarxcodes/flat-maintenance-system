// =====================  REPORTS SERVICE  ========================
import { reportsApi } from "../features/reports/api/reports.api.js";

/**
 * Service for financial intelligence, operational metrics, and SLA analytics.
 */
export const reportsService = {
  getCollections: (params) => reportsApi.getCollections(params),
  getStaffPerformance: (params) => reportsApi.getStaffPerformance(params),
  getComplaintsSla: (params) => reportsApi.getComplaintsSla(params),
};

export default reportsService;
