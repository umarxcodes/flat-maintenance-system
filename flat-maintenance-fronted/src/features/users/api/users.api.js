// =====================  USERS API SERVICE  ====================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const usersApi = {
  getUsers: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.USERS.BASE, { params });
  },

  getUserById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.USERS.BY_ID(id));
  },

  updateUserStatus: async (id, status) => {
    return await apiClient.patch(API_ENDPOINTS.USERS.STATUS(id), { status });
  },

  inviteUser: async (userData) => {
    return await apiClient.post(API_ENDPOINTS.USERS.BASE, userData);
  },
};

export default usersApi;
