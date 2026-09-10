// =====================  IMPORTS  ==========================
import { Router } from "express";
import { tenantsController } from "./tenants.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createTenantSchema,
  listTenantsQuerySchema,
  moveOutTenantSchema,
} from "./tenants.validation.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

// =====================  ROUTES DEFINITION  =================
/**
 * @route   POST /api/v1/tenants
 * @desc    Register new tenant lease contract and bind to flat & owner
 * @access  Private (BUILDING_ADMIN / MANAGER / SUPER_ADMIN with TENANT_MANAGE permission)
 */
router.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.TENANT_MANAGE),
  validate(createTenantSchema),
  tenantsController.onboardTenant
);

/**
 * @route   GET /api/v1/tenants
 * @desc    Query tenant registry with building, flat, status, and expiration filters
 * @access  Private (Actors with TENANT_MANAGE, BUILDING_READ, or USER_READ)
 */
router.get(
  "/",
  authenticate,
  authorize(
    PERMISSIONS.TENANT_MANAGE,
    PERMISSIONS.BUILDING_READ,
    PERMISSIONS.USER_READ
  ),
  validate(listTenantsQuerySchema),
  tenantsController.listTenants
);

/**
 * @route   PATCH /api/v1/tenants/:id/move-out
 * @desc    Complete tenant checkout and release flat back to VACANT status
 * @access  Private (BUILDING_ADMIN / MANAGER / SUPER_ADMIN with TENANT_MANAGE permission)
 */
router.patch(
  "/:id/move-out",
  authenticate,
  authorize(PERMISSIONS.TENANT_MANAGE),
  validate(moveOutTenantSchema),
  tenantsController.moveOutTenant
);

// =====================  EXPORTS  ===========================
export default router;
