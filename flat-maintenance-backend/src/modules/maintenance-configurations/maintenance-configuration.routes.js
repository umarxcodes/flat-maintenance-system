// =====================  IMPORTS  ==========================
import { Router } from "express";
import { maintenanceConfigurationController } from "./maintenance-configuration.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  createConfigurationSchema,
  activeConfigurationQuerySchema,
  historyConfigurationQuerySchema,
} from "./maintenance-configuration.validation.js";

// =====================  ROUTER DEFINITION  =================
const router = Router();

/**
 * @route   POST /api/v1/maintenance-configurations
 * @desc    Publish new maintenance billing rate formula and components
 * @access  Accountant / Building Admin / Super Admin (BILLING_CONFIG_MANAGE)
 */
router.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.BILLING_CONFIG_MANAGE),
  validate(createConfigurationSchema),
  maintenanceConfigurationController.publishConfiguration
);

/**
 * @route   GET /api/v1/maintenance-configurations/active?buildingId=:id
 * @desc    Fetch currently active maintenance formula for building
 * @access  Authorized Financial Controllers / Admins (BILLING_CONFIG_MANAGE, BUILDING_READ)
 */
router.get(
  "/active",
  authenticate,
  authorize(PERMISSIONS.BILLING_CONFIG_MANAGE, PERMISSIONS.BUILDING_READ),
  validate(activeConfigurationQuerySchema),
  maintenanceConfigurationController.getActiveConfiguration
);

/**
 * @route   GET /api/v1/maintenance-configurations/history?buildingId=:id
 * @desc    Audit historical rate formulas with pagination
 * @access  Authorized Financial Controllers / Admins (BILLING_CONFIG_MANAGE, BUILDING_READ)
 */
router.get(
  "/history",
  authenticate,
  authorize(PERMISSIONS.BILLING_CONFIG_MANAGE, PERMISSIONS.BUILDING_READ),
  validate(historyConfigurationQuerySchema),
  maintenanceConfigurationController.getConfigurationHistory
);

export default router;
