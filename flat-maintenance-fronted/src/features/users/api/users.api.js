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
    return await apiClient.post(API_ENDPOINTS.USERS.INVITE, userData);
  },

  getProfile: async () => {
    const res = await apiClient.get(API_ENDPOINTS.USERS.PROFILE);
    return res.data?.data || res.data;
  },

  updateProfile: async (data) => {
    const res = await apiClient.patch(API_ENDPOINTS.USERS.PROFILE, data);
    return res.data?.data || res.data;
  },

  uploadAvatar: async (formData) => {
    const res = await apiClient.post(API_ENDPOINTS.USERS.PROFILE_AVATAR, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data || res.data;
  },

  deleteAvatar: async () => {
    const res = await apiClient.delete(API_ENDPOINTS.USERS.PROFILE_AVATAR);
    return res.data?.data || res.data;
  },

  uploadUserAvatar: async (id, formData) => {
    const res = await apiClient.post(API_ENDPOINTS.USERS.USER_AVATAR(id), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data || res.data;
  },
};

export default usersApi;
