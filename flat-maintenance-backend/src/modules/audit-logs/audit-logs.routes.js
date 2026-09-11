// =====================  IMPORTS  ==========================
import { Router } from "express";
import { listAuditLogs } from "./audit-logs.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import { listAuditLogsQuerySchema } from "./audit-logs.validation.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

// =====================  AUDIT LOG ROUTES  ==================
/**
 * @route   GET /api/v1/audit-logs
 * @desc    Query immutable audit trail with resource, actor, and date filters
 * @access  Private (BUILDING_ADMIN, SUPER_ADMIN possessing AUDIT_READ)
 */
router.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.AUDIT_READ),
  validate(listAuditLogsQuerySchema),
  listAuditLogs
);

// =====================  EXPORTS  ===========================
export default router;
