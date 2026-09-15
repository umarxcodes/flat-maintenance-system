// =====================  REVIEWS SERVICE  ========================
import { reviewsApi } from "../features/reviews/api/reviews.api.js";

/**
 * Service for staff evaluations and moderation.
 */
export const reviewsService = {
  getReviews: (params) => reviewsApi.getReviews(params),
  createReview: (payload) => reviewsApi.createReview(payload),
  moderateReview: (id, payload) => reviewsApi.moderateReview(id, payload),
};

export default reviewsService;
