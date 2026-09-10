// =====================  IMPORTS  ==========================
import { Router } from "express";
import { maintenanceRequestController } from "./maintenance-requests.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  createMaintenanceRequestSchema,
  assignMaintenanceRequestSchema,
  updateStatusSchema,
  verifyMaintenanceRequestSchema,
  listMaintenanceRequestsQuerySchema,
} from "./maintenance-requests.validation.js";

// =====================  ROUTER DEFINITION  =================
const router = Router();

/**
 * @route   POST /api/v1/maintenance-requests
 * @desc    Submit maintenance ticket
 * @access  Resident (TENANT, OWNER) or Admin with COMPLAINT_CREATE
 */
router.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.COMPLAINT_CREATE),
  validate(createMaintenanceRequestSchema),
  maintenanceRequestController.createRequest
);

/**
 * @route   GET /api/v1/maintenance-requests
 * @desc    List maintenance work orders with role-filtered scope
 * @access  Authed with COMPLAINT_READ
 */
router.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.COMPLAINT_READ),
  validate(listMaintenanceRequestsQuerySchema),
  maintenanceRequestController.listRequests
);

/**
 * @route   PATCH /api/v1/maintenance-requests/:id/assign
 * @desc    Dispatch specialized technician to work order
 * @access  Manager / Admin with COMPLAINT_ASSIGN
 */
router.patch(
  "/:id/assign",
  authenticate,
  authorize(PERMISSIONS.COMPLAINT_ASSIGN),
  validate(assignMaintenanceRequestSchema),
  maintenanceRequestController.assignRequest
);

/**
 * @route   PATCH /api/v1/maintenance-requests/:id/status
 * @desc    Update task status and upload completion photos
 * @access  Maintenance Staff / Manager / Admin with COMPLAINT_UPDATE_STATUS
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize(PERMISSIONS.COMPLAINT_UPDATE_STATUS),
  validate(updateStatusSchema),
  maintenanceRequestController.updateStatus
);

/**
 * @route   PATCH /api/v1/maintenance-requests/:id/verify
 * @desc    Confirm satisfaction and sign-off (or reject for rework)
 * @access  Resident (TENANT, OWNER) or Admin with COMPLAINT_RESOLVE
 */
router.patch(
  "/:id/verify",
  authenticate,
  authorize(PERMISSIONS.COMPLAINT_RESOLVE),
  validate(verifyMaintenanceRequestSchema),
  maintenanceRequestController.verifyRequest
);

export default router;
