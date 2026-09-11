// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { noticesService } from "./notices.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLERS  =======================
/**
 * Controller: Publishes an official society bulletin.
 * POST /api/v1/notices
 */
export const publishNotice = asyncHandler(async (req, res) => {
  const notice = await noticesService.publishNotice({
    actor: req.user,
    input: req.body,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, notice, "Society notice published successfully")
    );
});

/**
 * Controller: Queries active community bulletins relevant to authenticated user.
 * GET /api/v1/notices
 */
export const listActiveNotices = asyncHandler(async (req, res) => {
  const result = await noticesService.listActiveNotices({
    actor: req.user,
    query: req.query,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Active society notices retrieved successfully"
      )
    );
});

/**
 * Controller: Retracts an active society bulletin via soft deletion.
 * DELETE /api/v1/notices/:id
 */
export const retractNotice = asyncHandler(async (req, res) => {
  const notice = await noticesService.retractNotice({
    actor: req.user,
    id: req.params.id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, notice, "Society notice retracted successfully")
    );
});
