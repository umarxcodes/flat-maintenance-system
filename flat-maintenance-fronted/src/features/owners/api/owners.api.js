// =====================  OWNERS API SERVICE  ==================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const ownersApi = {
  getOwners: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.buildingId) cleanParams.buildingId = params.buildingId;
    if (params.flatId) cleanParams.flatId = params.flatId;
    if (params.isResidingInBuilding !== undefined && params.isResidingInBuilding !== "") {
      cleanParams.isResidingInBuilding = String(params.isResidingInBuilding);
    }
    return await apiClient.get(API_ENDPOINTS.OWNERS.BASE, { params: cleanParams });
  },

  getOwnerById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.OWNERS.BY_ID(id));
  },

  registerOwner: async (data) => {
    return await apiClient.post(API_ENDPOINTS.OWNERS.BASE, data);
  },
};

export default ownersApi;
