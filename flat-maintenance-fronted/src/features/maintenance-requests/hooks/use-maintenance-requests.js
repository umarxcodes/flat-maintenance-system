// =====================  MAINTENANCE REQUESTS HOOKS  ===========
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { maintenanceRequestsApi } from "../api/maintenance-requests.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useMaintenanceRequestsList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.maintenanceRequests.list(params),
    queryFn: () => maintenanceRequestsApi.getRequests(params),
  });
};

export const useMaintenanceRequestDetail = (id) => {
  return useQuery({
    queryKey: queryKeys.maintenanceRequests.detail(id),
    queryFn: () => maintenanceRequestsApi.getRequestById(id),
    enabled: Boolean(id),
  });
};

export const useCreateMaintenanceRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => maintenanceRequestsApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRequests.all() });
    },
  });
};

export const useAssignMaintenanceRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => maintenanceRequestsApi.assignRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRequests.all() });
    },
  });
};

export const useUpdateMaintenanceStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => maintenanceRequestsApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRequests.all() });
    },
  });
};

export const useVerifyMaintenanceRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => maintenanceRequestsApi.verifyRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceRequests.all() });
    },
  });
};
