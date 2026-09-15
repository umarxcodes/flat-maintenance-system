// =====================  PERMISSIONS API SERVICE  ==============
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const permissionsApi = {
  getPermissions: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.PERMISSIONS.BASE, { params });
  },
};

export default permissionsApi;
