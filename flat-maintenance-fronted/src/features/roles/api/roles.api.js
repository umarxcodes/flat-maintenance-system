// =====================  ROLES API SERVICE  ====================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const rolesApi = {
  getRoles: async (params = {}) => {
    // Backend GET /api/v1/roles strictly rejects any query parameters
    const queryParams = Object.keys(params).length > 0 ? undefined : undefined;
    return await apiClient.get(API_ENDPOINTS.ROLES.BASE, { params: queryParams });
  },

  getRoleById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.ROLES.BY_ID(id));
  },
};

export default rolesApi;
