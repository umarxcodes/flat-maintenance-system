// =====================  FLATS API SERVICE  ====================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const flatsApi = {
  getFlats: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.FLATS.BASE, { params });
  },

  getFlatById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.FLATS.BY_ID(id));
  },

  createFlat: async (data) => {
    return await apiClient.post(API_ENDPOINTS.FLATS.BASE, data);
  },

  updateFlatStatus: async (id, status) => {
    return await apiClient.patch(API_ENDPOINTS.FLATS.STATUS(id), { status });
  },
};

export default flatsApi;
