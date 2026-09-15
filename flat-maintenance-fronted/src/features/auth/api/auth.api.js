// =====================  AUTH API SERVICE  =====================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const authApi = {
  login: async (credentials) => {
    return await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  logout: async () => {
    return await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  forgotPassword: async (email) => {
    return await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  resetPassword: async (payload) => {
    return await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
  },

  getMe: async () => {
    return await apiClient.get(API_ENDPOINTS.AUTH.ME);
  },
};

export default authApi;
