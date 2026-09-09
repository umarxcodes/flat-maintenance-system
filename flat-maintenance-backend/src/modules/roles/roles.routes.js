import { Router } from "express";
import { getRoles, getRoleById } from "./roles.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { getRolesQuerySchema, getRoleByIdSchema } from "./roles.validation.js";

const router = Router();

// All role endpoints mandate an active authenticated identity (Gate 1)
router.use(authenticate);

/**
 * System Roles Directory
 * GET /api/v1/roles
 *
 * Lists all defined system roles and descriptions in deterministic hierarchical order.
 */
router.get("/", validate(getRolesQuerySchema), getRoles);

/**
 * Specific Role Details & Permissions
 * GET /api/v1/roles/:id
 *
 * Retrieves details and complete permission list for a single role by ObjectId.
 */
router.get("/:id", validate(getRoleByIdSchema), getRoleById);

export default router;
