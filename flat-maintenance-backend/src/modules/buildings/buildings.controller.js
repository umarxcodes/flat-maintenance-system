// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { buildingsService } from "./buildings.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  BUILDING CONTROLLERS  ==============
/**
 * Controller: Provisions a new building complex.
 * POST /api/v1/buildings
 */
export const createBuilding = asyncHandler(async (req, res) => {
  const building = await buildingsService.createBuilding({
    actor: req.user,
    input: req.body,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        building,
        "Building complex provisioned successfully"
      )
    );
});

/**
 * Controller: Lists buildings within user's authorized scope.
 * GET /api/v1/buildings
 */
export const listBuildings = asyncHandler(async (req, res) => {
  const { buildings, meta } = await buildingsService.listBuildings({
    actor: req.user,
    query: req.query,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, buildings, "Buildings retrieved successfully", meta)
    );
});

/**
 * Controller: Retrieves details for a specific building.
 * GET /api/v1/buildings/:id
 */
export const getBuildingById = asyncHandler(async (req, res) => {
  const building = await buildingsService.getBuildingById({
    actor: req.user,
    id: req.params.id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, building, "Building details retrieved successfully")
    );
});

/**
 * Controller: Updates building configuration and metadata.
 * PATCH /api/v1/buildings/:id
 */
export const updateBuilding = asyncHandler(async (req, res) => {
  const building = await buildingsService.updateBuilding({
    actor: req.user,
    id: req.params.id,
    input: req.body,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, building, "Building complex updated successfully")
    );
});
