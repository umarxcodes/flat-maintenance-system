// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { reviewService } from "./reviews.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLERS  =======================
/**
 * Controller: Submits a new resident rating & review for an eligible maintenance request.
 * POST /api/v1/reviews
 */
export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview({
    actor: req.user,
    input: req.body,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, review, "Review submitted successfully"));
});

/**
 * Controller: Queries published reviews with optional staff and building filters.
 * GET /api/v1/reviews
 */
export const listReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.listReviews({
    actor: req.user,
    query: req.query,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Reviews retrieved successfully"));
});

/**
 * Controller: Flags or hides a review under facility manager supervision.
 * PATCH /api/v1/reviews/:id/moderate
 */
export const moderateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.moderateReview({
    actor: req.user,
    id: req.params.id,
    input: req.body,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, review, "Review moderated successfully"));
});
