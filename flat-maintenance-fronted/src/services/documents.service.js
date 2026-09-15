// =====================  DOCUMENTS SERVICE  ======================
import { documentsApi } from "../features/documents/api/documents.api.js";

/**
 * Service for property documents, contracts, and role-scoped uploads.
 */
export const documentsService = {
  getDocuments: (params) => documentsApi.getDocuments(params),
  getDocumentById: (id) => documentsApi.getDocumentById(id),
  uploadDocument: (formData) => documentsApi.uploadDocument(formData),
  deleteDocument: (id) => documentsApi.deleteDocument(id),
};

export default documentsService;
