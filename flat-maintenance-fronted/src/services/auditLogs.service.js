// =====================  AUDIT LOGS SERVICE  ====================
import { auditLogsApi } from "../features/audit-logs/api/audit-logs.api.js";

/**
 * Service for immutable append-only event trail and security mutation records.
 */
export const auditLogsService = {
  getAuditLogs: (params) => auditLogsApi.getAuditLogs(params),
};

export default auditLogsService;
