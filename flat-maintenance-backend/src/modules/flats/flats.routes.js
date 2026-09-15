// =====================  IMPORTS  ==========================
import { Router } from "express";
import {
  createFlat,
  listFlats,
  getFlatById,
  updateFlatStatus,
} from "./flats.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  createFlatSchema,
  listFlatsQuerySchema,
  getFlatByIdSchema,
  updateFlatStatusSchema,
} from "./flats.validation.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

// All flat endpoints require authenticated user session (Gate 1)
router.use(authenticate);

// =====================  FLAT ROUTES  =======================
/**
 * Provision New Flat Unit
 * POST /api/v1/flats
 * Authorized: SuperAdmin, BuildingAdmin with FLAT_CREATE permission.
 */
router.post(
  "/",
  authorize(PERMISSIONS.FLAT_CREATE),
  validate(createFlatSchema),
  createFlat
);

/**
 * List Flat Units (Paginated and Filtered)
 * GET /api/v1/flats
 * Authorized: FLAT_READ permission (SuperAdmin, BuildingAdmin, Manager, Owner, Tenant).
 */
router.get(
  "/",
  authorize(PERMISSIONS.FLAT_READ),
  validate(listFlatsQuerySchema),
  listFlats
);

/**
 * Get Flat Unit By ID
 * GET /api/v1/flats/:id
 * Authorized: FLAT_READ permission (Scoped to building / lease).
 */
router.get(
  "/:id",
  authorize(PERMISSIONS.FLAT_READ),
  validate(getFlatByIdSchema),
  getFlatById
);

/**
 * Transition Flat Occupancy Status
 * PATCH /api/v1/flats/:id/status
 * Authorized: FLAT_UPDATE permission (SuperAdmin, BuildingAdmin, Manager).
 */
router.patch(
  "/:id/status",
  authorize(PERMISSIONS.FLAT_UPDATE),
  validate(updateFlatStatusSchema),
  updateFlatStatus
);

// =====================  EXPORTS  ===========================
export default router;
