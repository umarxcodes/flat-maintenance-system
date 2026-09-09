// =====================  IMPORTS  ==========================
import { Router } from "express";
import { createBlock, listBlocks } from "./blocks.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  createBlockSchema,
  listBlocksQuerySchema,
} from "./blocks.validation.js";

// =====================  ROUTER CONFIGURATION  =============
const router = Router();

// All block endpoints mandate active authentication (Gate 1)
router.use(authenticate);

// =====================  BLOCK ROUTES  =====================
/**
 * Register Block / Tower in Building Complex
 * POST /api/v1/blocks
 * Sourced from BACKEND_TECHNICAL_DOCUMENTATION.md Section 36 & 63.
 * Minimum Role: BuildingAdmin (or SuperAdmin with BLOCK_MANAGE permission).
 */
router.post(
  "/",
  authorize(PERMISSIONS.BLOCK_MANAGE),
  validate(createBlockSchema),
  createBlock
);

/**
 * List Blocks Belonging to Specified Building Complex
 * GET /api/v1/blocks?buildingId=:id
 * Sourced from BACKEND_TECHNICAL_DOCUMENTATION.md Section 36 & 63.
 * Requires BUILDING_READ permission; scoped to assigned complexes.
 */
router.get(
  "/",
  authorize(PERMISSIONS.BUILDING_READ),
  validate(listBlocksQuerySchema),
  listBlocks
);

// =====================  EXPORTS  ============================
export default router;
