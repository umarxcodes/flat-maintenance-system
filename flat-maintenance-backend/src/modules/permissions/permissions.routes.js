import { Router } from "express";
import { getPermissions } from "./permissions.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { getPermissionsQuerySchema } from "./permissions.validation.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";

const router = Router();

// All permission endpoints mandate active authentication (Gate 1)
router.use(authenticate);

/**
 * Platform Permissions Registry
 * GET /api/v1/permissions
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 34 & 63.
 * Minimum Role: SuperAdmin (or actors possessing ROLE_MANAGE permission).
 * Lists all granular platform permission codes categorized by domain module.
 */
router.get(
  "/",
  authorize(PERMISSIONS.ROLE_MANAGE),
  validate(getPermissionsQuerySchema),
  getPermissions
);

export default router;
