// =====================  COMPLAINTS QUERY & MUTATION HOOKS  ====
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintsApi } from "../api/complaints.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useComplaintsList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.complaints.list(params),
    queryFn: () => complaintsApi.getComplaints(params),
  });
};

export const useComplaintDetail = (id) => {
  return useQuery({
    queryKey: queryKeys.complaints.detail(id),
    queryFn: () => complaintsApi.getComplaintById(id),
    enabled: Boolean(id),
  });
};

export const useCreateComplaintMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => complaintsApi.createComplaint(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints.all() });
    },
  });
};

export const useResolveComplaintMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => complaintsApi.resolveComplaint(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints.all() });
    },
  });
};
