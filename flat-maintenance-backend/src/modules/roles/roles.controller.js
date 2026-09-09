// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { rolesService } from "./roles.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  ROLE CONTROLLERS  =================
/**
 * Controller: Retrieves the system role directory.
 * GET /api/v1/roles
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 33.
 * Delegates all retrieval logic to the Roles service so query behavior,
 * ordering, and role serialization remain outside the HTTP transport layer.
 */
export const getRoles = asyncHandler(async (req, res) => {
  const roles = await rolesService.getRoles();

  return res
    .status(200)
    .json(new ApiResponse(200, roles, "System roles retrieved successfully"));
});

/**
 * Controller: Retrieves details and permission list for a single role by ID.
 * GET /api/v1/roles/:id
 *
 * Validates role existence and returns sanitized role details.
 */
export const getRoleById = asyncHandler(async (req, res) => {
  const role = await rolesService.getRoleById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, role, "Role details retrieved successfully"));
});
