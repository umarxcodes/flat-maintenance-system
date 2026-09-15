// =====================  IMPORTS  ==========================
import { Router } from "express";
import {
  getMaintenanceCollections,
  getStaffPerformance,
  getComplaintSla,
} from "./reports.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  maintenanceCollectionsQuerySchema,
  staffPerformanceQuerySchema,
  complaintSlaQuerySchema,
} from "./reports.validation.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

// =====================  REPORT ROUTES  =====================
/**
 * @route   GET /api/v1/reports/maintenance-collections?buildingId=:id&period=YYYY-MM
 * @desc    Aggregate building-scoped maintenance collection financial analytics
 * @access  Private (ACCOUNTANT, BUILDING_ADMIN, SUPER_ADMIN possessing INVOICE_READ)
 */
router.get(
  "/maintenance-collections",
  authenticate,
  authorize(PERMISSIONS.INVOICE_READ),
  validate(maintenanceCollectionsQuerySchema),
  getMaintenanceCollections
);

/**
 * @route   GET /api/v1/reports/staff-performance?buildingId=:id
 * @desc    Aggregate building-scoped technician resolution velocity, SLA compliance, and reviews
 * @access  Private (MANAGER, BUILDING_ADMIN, SUPER_ADMIN possessing STAFF_ASSIGN)
 */
router.get(
  "/staff-performance",
  authenticate,
  authorize(PERMISSIONS.STAFF_ASSIGN),
  validate(staffPerformanceQuerySchema),
  getStaffPerformance
);

/**
 * @route   GET /api/v1/reports/complaint-sla?buildingId=:id
 * @desc    Aggregate building-scoped complaint resolution velocity and turnaround analytics
 * @access  Private (MANAGER, BUILDING_ADMIN, SUPER_ADMIN possessing COMPLAINT_READ)
 */
router.get(
  "/complaint-sla",
  authenticate,
  authorize(PERMISSIONS.COMPLAINT_READ),
  validate(complaintSlaQuerySchema),
  getComplaintSla
);

// =====================  EXPORTS  ===========================
export default router;
