// =====================  IMPORTS  ==========================
import { Router } from "express";
import { complaintController } from "./complaints.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  createComplaintSchema,
  listComplaintsQuerySchema,
  resolveComplaintSchema,
} from "./complaints.validation.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

/**
 * @route   POST /api/v1/complaints
 * @desc    File a society grievance ticket
 * @access  Resident (Tenant for leased flat / Owner for owned flat) with COMPLAINT_CREATE
 */
router.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.COMPLAINT_CREATE),
  validate(createComplaintSchema),
  complaintController.createComplaint
);

/**
 * @route   GET /api/v1/complaints
 * @desc    Query complaints with status and type filters
 * @access  Authed with COMPLAINT_READ (scoped to building or flat)
 */
router.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.COMPLAINT_READ),
  validate(listComplaintsQuerySchema),
  complaintController.listComplaints
);

/**
 * @route   PATCH /api/v1/complaints/:id/resolve
 * @desc    Resolve complaint with formal notes
 * @access  Manager / Building Admin with COMPLAINT_RESOLVE
 */
router.patch(
  "/:id/resolve",
  authenticate,
  authorize(PERMISSIONS.COMPLAINT_RESOLVE),
  validate(resolveComplaintSchema),
  complaintController.resolveComplaint
);

export default router;
