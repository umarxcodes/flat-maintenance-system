// =====================  ROLES API SERVICE  ====================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const rolesApi = {
  getRoles: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.ROLES.BASE, { params });
  },

  getRoleById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.ROLES.BY_ID(id));
  },
};

export default rolesApi;
