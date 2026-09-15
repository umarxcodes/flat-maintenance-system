// =====================  REVIEWS API SERVICE  ==================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const reviewsApi = {
  getReviews: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.buildingId) cleanParams.buildingId = params.buildingId;
    if (params.staffId) cleanParams.staffId = params.staffId;
    if (params.moderationStatus) cleanParams.moderationStatus = params.moderationStatus;
    return await apiClient.get(API_ENDPOINTS.REVIEWS.BASE, { params: cleanParams });
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
