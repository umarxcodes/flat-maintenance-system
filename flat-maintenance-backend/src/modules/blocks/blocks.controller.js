// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { blocksService } from "./blocks.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  BLOCK CONTROLLERS  =================
/**
 * Controller: Provisions a new block within a building.
 * POST /api/v1/blocks
 */
export const createBlock = asyncHandler(async (req, res) => {
  const block = await blocksService.createBlock({
    actor: req.user,
    input: req.body,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, block, "Block created successfully"));
});

/**
 * Controller: Lists blocks belonging to a specified building.
 * GET /api/v1/blocks?buildingId=:id
 */
export const listBlocks = asyncHandler(async (req, res) => {
  const blocks = await blocksService.listBlocksByBuilding({
    actor: req.user,
    buildingId: req.query.buildingId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, blocks, "Blocks retrieved successfully"));
});
