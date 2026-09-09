import asyncHandler from "express-async-handler";
import { permissionsService } from "./permissions.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

/**
 * Controller: Returns the canonical platform permission registry.
 * GET /api/v1/permissions
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 34 & 63.
 * Delegates retrieval to the Permissions service so database access,
 * deterministic ordering, and permission serialization remain isolated
 * from the HTTP transport layer.
 */
export const getPermissions = asyncHandler(async (req, res) => {
  const permissions = await permissionsService.getPermissions();

  return res
    .status(200)
    .json(
      new ApiResponse(200, permissions, "Permissions retrieved successfully")
    );
});
