// =====================  TENANTS API SERVICE  =================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const tenantsApi = {
  getTenants: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.TENANTS.BASE, { params });
  },

  getTenantById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.TENANTS.BY_ID(id));
  },

  onboardTenant: async (data) => {
    return await apiClient.post(API_ENDPOINTS.TENANTS.BASE, data);
  },

  moveOutTenant: async (id, data) => {
    return await apiClient.patch(API_ENDPOINTS.TENANTS.MOVE_OUT(id), data);
  },
};

export default tenantsApi;
