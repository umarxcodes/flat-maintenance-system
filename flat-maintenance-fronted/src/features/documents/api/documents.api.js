// =====================  DOCUMENTS API SERVICE  ===============
import apiClient from "../../../lib/api/axios-client.js";
import { API_ENDPOINTS } from "../../../lib/api/endpoints.js";

export const documentsApi = {
  getDocuments: async (params = {}) => {
    const allowedKeys = ["buildingId", "documentType", "visibility", "flatId"];
    const cleanParams = Object.entries(params).reduce((acc, [key, val]) => {
      if (allowedKeys.includes(key) && val !== undefined && val !== null && val !== "") {
        acc[key] = val;
      }
      return acc;
    }, {});
    return await apiClient.get(API_ENDPOINTS.DOCUMENTS.BASE, { params: cleanParams });
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
