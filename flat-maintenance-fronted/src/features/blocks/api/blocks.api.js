// =====================  BLOCKS API SERVICE  ==================
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const blocksApi = {
  getBlocks: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.BLOCKS.BASE, { params });
  },

  getBlockById: async (id) => {
    return await apiClient.get(API_ENDPOINTS.BLOCKS.BY_ID(id));
  },

  createBlock: async (data) => {
    return await apiClient.post(API_ENDPOINTS.BLOCKS.BASE, data);
  },
};

export default blocksApi;
