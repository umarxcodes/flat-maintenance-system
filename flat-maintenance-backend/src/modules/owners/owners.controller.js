// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { ownersService } from "./owners.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLER IMPLEMENTATION  ========
/**
 * Thin HTTP Controller for Module 9: Owners (owners).
 *
 * Adheres strictly to thin-controller architectural invariants:
 * - Zero business logic.
 * - Dispatches input and authenticated principal context to domain service.
 * - Returns uniform ApiResponse envelopes.
 */
class OwnersController {
  /**
   * Registers a new property owner profile and binds flat deeds.
   * POST /api/v1/owners
   */
  registerOwner = asyncHandler(async (req, res) => {
    const owner = await ownersService.createOwner({
      actor: req.user,
      input: req.body,
    });

    res
      .status(201)
      .json(
        new ApiResponse(201, owner, "Owner profile registered successfully")
      );
  });

  /**
   * Retrieves paginated owner registry with multi-tenant filtering.
   * GET /api/v1/owners
   */
  listOwners = asyncHandler(async (req, res) => {
    const result = await ownersService.listOwners({
      actor: req.user,
      query: req.query,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, result, "Owner registry retrieved successfully")
      );
  });

  /**
   * Retrieves single owner profile and full property portfolio by ID.
   * GET /api/v1/owners/:id
   */
  getOwnerById = asyncHandler(async (req, res) => {
    const owner = await ownersService.getOwnerById({
      actor: req.user,
      id: req.params.id,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, owner, "Owner profile retrieved successfully")
      );
  });
}

// =====================  EXPORTS  ===========================
export const ownersController = new OwnersController();
export default ownersController;
