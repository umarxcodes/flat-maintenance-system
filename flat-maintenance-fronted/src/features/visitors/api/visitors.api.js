// =====================  VISITORS API SERVICE  ================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const visitorsApi = {
  getVisitors: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.VISITORS.BASE, { params });
  },

  createVisitorPass: async (data) => {
    return await apiClient.post(API_ENDPOINTS.VISITORS.BASE, data);
  },

  verifyVisitorPass: async (passCode) => {
    return await apiClient.get(`/visitors/verify/${passCode}`);
  },

  checkInVisitor: async (id) => {
    return await apiClient.patch(`/visitors/${id}/check-in`);
  },

  checkOutVisitor: async (id) => {
    return await apiClient.patch(`/visitors/${id}/check-out`);
  },
};

export default visitorsApi;
