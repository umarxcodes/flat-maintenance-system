// =====================  REVIEWS API SERVICE  ==================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const reviewsApi = {
  getReviews: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.REVIEWS.BASE, { params });
  },

  getReviewById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.REVIEWS.BY_ID(id));
  },

  createReview: async (data) => {
    return await apiClient.post(API_ENDPOINTS.REVIEWS.BASE, data);
  },

  moderateReview: async (id, data) => {
    return await apiClient.patch(API_ENDPOINTS.REVIEWS.MODERATE(id), data);
  },
};

export default reviewsApi;
