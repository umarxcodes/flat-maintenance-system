// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { auditLogService } from "./audit-logs.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLERS  =======================
/**
 * Controller: Queries building-scoped immutable forensic audit logs.
 *
 * GET /api/v1/audit-logs
 */
export const listAuditLogs = asyncHandler(async (req, res) => {
  const query = req.validated?.query || req.query;

  const result = await auditLogService.listAuditLogs(query, req.user);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.auditLogs,
        "Audit logs retrieved successfully",
        result.meta
      )
    );
});

// =====================  EXPORTS  ===========================
export const auditLogController = {
  listAuditLogs,
};
export default auditLogController;
