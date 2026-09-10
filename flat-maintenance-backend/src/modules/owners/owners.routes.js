// =====================  IMPORTS  ==========================
import { Router } from "express";
import { ownersController } from "./owners.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createOwnerSchema,
  listOwnersQuerySchema,
  getOwnerByIdSchema,
} from "./owners.validation.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

// =====================  ROUTES DEFINITION  =================
/**
 * @route   POST /api/v1/owners
 * @desc    Register property owner profile and link flat deeds
 * @access  Private (BUILDING_ADMIN / SUPER_ADMIN with OWNER_MANAGE permission)
 */
router.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.OWNER_MANAGE),
  validate(createOwnerSchema),
  ownersController.registerOwner
);

/**
 * @route   GET /api/v1/owners
 * @desc    Query owner registry with multi-dimensional flat/building filters
 * @access  Private (Actors with OWNER_MANAGE, BUILDING_READ, or USER_READ)
 */
router.get(
  "/",
  authenticate,
  authorize(
    PERMISSIONS.OWNER_MANAGE,
    PERMISSIONS.BUILDING_READ,
    PERMISSIONS.USER_READ
  ),
  validate(listOwnersQuerySchema),
  ownersController.listOwners
);

/**
 * @route   GET /api/v1/owners/:id
 * @desc    Retrieve individual owner profile and property portfolio
 * @access  Private (Actors with OWNER_MANAGE, BUILDING_READ, or USER_READ)
 */
router.get(
  "/:id",
  authenticate,
  authorize(
    PERMISSIONS.OWNER_MANAGE,
    PERMISSIONS.BUILDING_READ,
    PERMISSIONS.USER_READ
  ),
  validate(getOwnerByIdSchema),
  ownersController.getOwnerById
);

// =====================  EXPORTS  ===========================
export default router;
