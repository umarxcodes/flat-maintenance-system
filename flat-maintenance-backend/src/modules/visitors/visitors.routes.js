// =====================  IMPORTS  ==========================
import { Router } from "express";
import {
  createVisitorPass,
  verifyVisitorPass,
  checkInVisitor,
  checkOutVisitor,
  listVisitors,
} from "./visitors.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  createVisitorPassSchema,
  verifyVisitorPassSchema,
  checkInVisitorSchema,
  checkOutVisitorSchema,
} from "./visitors.validation.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

// =====================  GATE VISITOR PASS ROUTES  ==========
/**
 * @route   GET /api/v1/visitors
 * @desc    Lists visitor records with building/role scoping and pagination
 * @access  Private (Authenticated users)
 */
router.get(
  "/",
  authenticate,
  listVisitors
);

/**
 * @route   POST /api/v1/visitors
 * @desc    Resident pre-generates digital visitor pass with cryptographic verification credentials
 * @access  Private (Resident OWNER / TENANT possessing VISITOR_PASS_GENERATE)
 */
router.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.VISITOR_PASS_GENERATE),
  validate(createVisitorPassSchema),
  createVisitorPass
);

/**
 * @route   GET /api/v1/visitors/verify/:passCode
 * @desc    Gate security personnel inspect pass validity and visitor details without mutating status
 * @access  Private (SECURITY_STAFF possessing VISITOR_CHECK_IN)
 */
router.get(
  "/verify/:passCode",
  authenticate,
  authorize(PERMISSIONS.VISITOR_CHECK_IN),
  validate(verifyVisitorPassSchema),
  verifyVisitorPass
);

/**
 * @route   PATCH /api/v1/visitors/:id/check-in
 * @desc    Gate security personnel record visitor physical entry arrival
 * @access  Private (SECURITY_STAFF possessing VISITOR_CHECK_IN)
 */
router.patch(
  "/:id/check-in",
  authenticate,
  authorize(PERMISSIONS.VISITOR_CHECK_IN),
  validate(checkInVisitorSchema),
  checkInVisitor
);

/**
 * @route   PATCH /api/v1/visitors/:id/check-out
 * @desc    Gate security personnel record visitor physical gate departure
 * @access  Private (SECURITY_STAFF possessing VISITOR_CHECK_OUT)
 */
router.patch(
  "/:id/check-out",
  authenticate,
  authorize(PERMISSIONS.VISITOR_CHECK_OUT),
  validate(checkOutVisitorSchema),
  checkOutVisitor
);

// =====================  EXPORTS  ===========================
export default router;
