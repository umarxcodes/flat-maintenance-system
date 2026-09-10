// =====================  IMPORTS  ==========================
import { Router } from "express";
import { staffController } from "./staff.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  createStaffSchema,
  listStaffQuerySchema,
  staffIdParamSchema,
} from "./staff.validation.js";

// =====================  ROUTER DEFINITION  =================
const router = Router();

/**
 * @route   POST /api/v1/staff
 * @desc    Onboard staff personnel and assign trade category
 * @access  Admin (BUILDING_ADMIN / SUPER_ADMIN with STAFF_MANAGE)
 */
router.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.STAFF_MANAGE),
  validate(createStaffSchema),
  staffController.createStaff
);

/**
 * @route   GET /api/v1/staff
 * @desc    List staff with trade, shift, category, and availability filters
 * @access  Manager / Admin (STAFF_ASSIGN or STAFF_MANAGE)
 */
router.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.STAFF_ASSIGN, PERMISSIONS.STAFF_MANAGE),
  validate(listStaffQuerySchema),
  staffController.listStaff
);

/**
 * @route   GET /api/v1/staff/:id
 * @desc    Retrieve technician performance card and rating history
 * @access  Manager / Admin / Operational Staff
 */
router.get(
  "/:id",
  authenticate,
  authorize(
    PERMISSIONS.STAFF_ASSIGN,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.BUILDING_READ,
    PERMISSIONS.USER_READ
  ),
  validate(staffIdParamSchema),
  staffController.getStaffById
);

// =====================  EXPORTS  ===========================
export default router;
