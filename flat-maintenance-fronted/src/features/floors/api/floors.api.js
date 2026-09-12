// =====================  FLOORS API SERVICE  ==================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const floorsApi = {
  getFloors: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.FLOORS.BASE, { params });
  },

  getFloorById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.FLOORS.BY_ID(id));
  },

  createFloor: async (data) => {
    return await apiClient.post(API_ENDPOINTS.FLOORS.BASE, data);
  },
};

export default floorsApi;
