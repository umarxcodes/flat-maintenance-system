// =====================  IMPORTS  ==========================
import { Router } from "express";
import { createFloor, listFloors } from "./floors.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  createFloorSchema,
  listFloorsQuerySchema,
} from "./floors.validation.js";

// =====================  ROUTER CONFIGURATION  =============
const router = Router();

// All floor endpoints mandate active authentication (Gate 1)
router.use(authenticate);

// =====================  FLOOR ROUTES  =====================
/**
 * Register Floor Level in Block / Tower
 * POST /api/v1/floors
 * Sourced from BACKEND_TECHNICAL_DOCUMENTATION.md Section 37 & 63.
 * Minimum Role: BuildingAdmin (or SuperAdmin with FLOOR_MANAGE permission).
 */
router.post(
  "/",
  authorize(PERMISSIONS.FLOOR_MANAGE),
  validate(createFloorSchema),
  createFloor
);

/**
 * List Floors Belonging to Specified Block
 * GET /api/v1/floors?blockId=:id
 * Sourced from BACKEND_TECHNICAL_DOCUMENTATION.md Section 37 & 63.
 * Requires BUILDING_READ permission; scoped to assigned complexes.
 */
router.get(
  "/",
  authorize(PERMISSIONS.BUILDING_READ),
  validate(listFloorsQuerySchema),
  listFloors
);

// =====================  EXPORTS  ============================
export default router;
