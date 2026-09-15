// =====================  VISITORS API SERVICE  ================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const visitorsApi = {
  getVisitors: async (params = {}) => {
    const cleanParams = Object.entries(params).reduce((acc, [key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        acc[key] = val;
      }
      return acc;
    }, {});
    return await apiClient.get(API_ENDPOINTS.VISITORS.BASE, { params: cleanParams });
  },

  createVisitorPass: async (data) => {
    return await apiClient.post(API_ENDPOINTS.VISITORS.BASE, data);
  },

  verifyVisitorPass: async (passCode) => {
    return await apiClient.get(`/visitors/verify/${passCode}`);
  },

  checkInVisitor: async (id, data = {}) => {
    const cleanData = {};
    if (data?.vehicleNumber?.trim()) {
      cleanData.vehicleNumber = data.vehicleNumber.trim();
    }
    return await apiClient.patch(`/visitors/${id}/check-in`, cleanData);
  },

  checkOutVisitor: async (id) => {
    return await apiClient.patch(`/visitors/${id}/check-out`, {});
  },
};

export default visitorsApi;
