// =====================  TENANTS API SERVICE  =================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const tenantsApi = {
  getTenants: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.buildingId) cleanParams.buildingId = params.buildingId;
    if (params.flatId) cleanParams.flatId = params.flatId;
    if (params.status) cleanParams.status = params.status;
    if (params.policeVerificationStatus) cleanParams.policeVerificationStatus = params.policeVerificationStatus;
    if (params.leaseExpiringBefore) cleanParams.leaseExpiringBefore = params.leaseExpiringBefore;
    return await apiClient.get(API_ENDPOINTS.TENANTS.BASE, { params: cleanParams });
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
