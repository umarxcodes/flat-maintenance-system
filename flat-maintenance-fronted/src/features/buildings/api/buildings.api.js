// =====================  BUILDINGS API SERVICE  ================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const buildingsApi = {
  getBuildings: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.BUILDINGS.BASE, { params });
  },

  getBuildingById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.BUILDINGS.BY_ID(id));
  },

  createBuilding: async (data) => {
    return await apiClient.post(API_ENDPOINTS.BUILDINGS.BASE, data);
  },

  updateBuilding: async (id, data) => {
    return await apiClient.patch(API_ENDPOINTS.BUILDINGS.BY_ID(id), data);
  },
};

export default buildingsApi;
