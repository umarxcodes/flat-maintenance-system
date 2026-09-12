// =====================  OWNERS API SERVICE  ==================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const ownersApi = {
  getOwners: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.OWNERS.BASE, { params });
  },

  getOwnerById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.OWNERS.BY_ID(id));
  },

  registerOwner: async (data) => {
    return await apiClient.post(API_ENDPOINTS.OWNERS.BASE, data);
  },
};

export default ownersApi;
