// =====================  DOCUMENTS QUERY & MUTATION HOOKS  ====
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "../api/documents.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useDocumentsList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.documents.list(params),
    queryFn: () => documentsApi.getDocuments(params),
  });
};

export const useUploadDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => documentsApi.uploadDocument(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all() });
    },
  });
};

export const useDeleteDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => documentsApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all() });
    },
  });
};
