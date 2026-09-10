// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { floorsService } from "./floors.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLERS  =======================
/**
 * Controller: Provisions a new residential floor level within a block.
 * POST /api/v1/floors
 */
export const createFloor = asyncHandler(async (req, res) => {
  const floor = await floorsService.createFloor({
    actor: req.user,
    input: req.body,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, floor, "Floor registered successfully"));
});

/**
 * Controller: Lists all active floor levels within a specified block.
 * GET /api/v1/floors?blockId=:id
 */
export const listFloors = asyncHandler(async (req, res) => {
  const blockId = req.validated?.query?.blockId || req.query.blockId;

  const floors = await floorsService.listFloorsByBlock({
    actor: req.user,
    blockId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, floors, "Floors retrieved successfully"));
});
