// =====================  AUDIT LOGS QUERY HOOKS  ==============
import { useQuery } from "@tanstack/react-query";
import { auditLogsApi } from "../api/audit-logs.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useAuditLogsList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(params),
    queryFn: () => auditLogsApi.getAuditLogs(params),
  });
};
