// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { flatsService } from "./flats.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLERS  =======================
/**
 * Controller: Provisions a new flat unit within building hierarchy.
 * POST /api/v1/flats
 */
export const createFlat = asyncHandler(async (req, res) => {
  const flat = await flatsService.createFlat({
    actor: req.user,
    input: req.body,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, flat, "Flat unit provisioned successfully"));
});

/**
 * Controller: Lists flat units matching filter parameters and tenant scope.
 * GET /api/v1/flats
 */
export const listFlats = asyncHandler(async (req, res) => {
  const result = await flatsService.listFlats({
    actor: req.user,
    query: req.query,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Flats retrieved successfully"));
});

/**
 * Controller: Fetches single flat unit by ObjectId.
 * GET /api/v1/flats/:id
 */
export const getFlatById = asyncHandler(async (req, res) => {
  const flat = await flatsService.getFlatById({
    actor: req.user,
    id: req.params.id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, flat, "Flat unit retrieved successfully"));
});

/**
 * Controller: Transitions flat unit occupancy state.
 * PATCH /api/v1/flats/:id/status
 */
export const updateFlatStatus = asyncHandler(async (req, res) => {
  const flat = await flatsService.updateFlatStatus({
    actor: req.user,
    id: req.params.id,
    status: req.body.status,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, flat, "Flat status updated successfully"));
});
