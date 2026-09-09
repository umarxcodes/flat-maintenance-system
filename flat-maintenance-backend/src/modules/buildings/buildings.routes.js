// =====================  IMPORTS  ==========================
import { Router } from "express";
import {
  createBuilding,
  listBuildings,
  getBuildingById,
  updateBuilding,
} from "./buildings.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  createBuildingSchema,
  listBuildingsQuerySchema,
  buildingIdParamSchema,
  updateBuildingSchema,
} from "./buildings.validation.js";

// =====================  ROUTER CONFIGURATION  =============
const router = Router();

// All building endpoints mandate active authentication (Gate 1)
router.use(authenticate);

// =====================  BUILDING ROUTES  ==================
/**
 * Provision New Complex
 * POST /api/v1/buildings
 * Sourced from BACKEND_TECHNICAL_DOCUMENTATION.md Section 35 & 63.
 * Minimum Role: SuperAdmin (or actors with BUILDING_CREATE permission).
 */
router.post(
  "/",
  authorize(PERMISSIONS.BUILDING_CREATE),
  validate(createBuildingSchema),
  createBuilding
);

/**
 * List Complexes within User Scope
 * GET /api/v1/buildings
 * Sourced from BACKEND_TECHNICAL_DOCUMENTATION.md Section 35 & 63.
 * Requires BUILDING_READ permission; scoped to assigned complexes.
 */
router.get(
  "/",
  authorize(PERMISSIONS.BUILDING_READ),
  validate(listBuildingsQuerySchema),
  listBuildings
);

/**
 * Retrieve Complex Details & Statistics
 * GET /api/v1/buildings/:id
 * Sourced from BACKEND_TECHNICAL_DOCUMENTATION.md Section 35 & 63.
 * Requires BUILDING_READ permission; IDOR scope verified.
 */
router.get(
  "/:id",
  authorize(PERMISSIONS.BUILDING_READ),
  validate(buildingIdParamSchema),
  getBuildingById
);

/**
 * Update Complex Settings
 * PATCH /api/v1/buildings/:id
 * Sourced from BACKEND_TECHNICAL_DOCUMENTATION.md Section 35 & 63.
 * Minimum Role: BuildingAdmin (or SuperAdmin); IDOR scope verified.
 */
router.patch(
  "/:id",
  authorize(PERMISSIONS.BUILDING_UPDATE),
  validate(updateBuildingSchema),
  updateBuilding
);

// =====================  EXPORTS  ============================
export default router;
