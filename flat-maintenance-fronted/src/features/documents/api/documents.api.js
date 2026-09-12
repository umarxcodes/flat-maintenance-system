// =====================  DOCUMENTS API SERVICE  ===============
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const documentsApi = {
  getDocuments: async (params = {}) => {
    return await apiClient.get(API_ENDPOINTS.DOCUMENTS.BASE, { params });
  },

  uploadDocument: async (formData) => {
    return await apiClient.post(API_ENDPOINTS.DOCUMENTS.BASE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteDocument: async (id) => {
    return await apiClient.delete(API_ENDPOINTS.DOCUMENTS.BY_ID(id));
  },
};

export default documentsApi;
