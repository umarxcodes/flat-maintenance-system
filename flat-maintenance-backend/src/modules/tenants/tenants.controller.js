// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { tenantsService } from "./tenants.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLER IMPLEMENTATION  ========
/**
 * Thin HTTP Controller for Module 10: Tenants (tenants).
 *
 * Adheres strictly to thin-controller architectural invariants:
 * - Zero business logic.
 * - Dispatches input and authenticated principal context to domain service.
 * - Returns uniform ApiResponse envelopes.
 */
class TenantsController {
  /**
   * Onboards a tenant lease contract and links to designated flat and owner.
   * POST /api/v1/tenants
   */
  onboardTenant = asyncHandler(async (req, res) => {
    const tenant = await tenantsService.createTenant({
      actor: req.user,
      input: req.body,
    });

    res
      .status(201)
      .json(
        new ApiResponse(201, tenant, "Tenant lease onboarded successfully")
      );
  });

  /**
   * Retrieves paginated tenant registry with multi-dimensional filtering.
   * GET /api/v1/tenants
   */
  listTenants = asyncHandler(async (req, res) => {
    const result = await tenantsService.listTenants({
      actor: req.user,
      query: req.query,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, result, "Tenant registry retrieved successfully")
      );
  });

  /**
   * Executes tenant checkout workflow, transitions status, and releases the flat.
   * PATCH /api/v1/tenants/:id/move-out
   */
  moveOutTenant = asyncHandler(async (req, res) => {
    const tenant = await tenantsService.moveOutTenant({
      actor: req.user,
      id: req.params.id,
      input: req.body,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          tenant,
          "Tenant checkout completed and flat released successfully"
        )
      );
  });
}

// =====================  EXPORTS  ===========================
export const tenantsController = new TenantsController();
export default tenantsController;
