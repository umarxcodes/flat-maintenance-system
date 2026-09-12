// =====================  TENANTS QUERY & MUTATION HOOKS  =======
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantsApi } from "../api/tenants.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useTenantsList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.tenants.list(params),
    queryFn: () => tenantsApi.getTenants(params),
  });
};

export const useTenantDetail = (id) => {
  return useQuery({
    queryKey: queryKeys.tenants.detail(id),
    queryFn: () => tenantsApi.getTenantById(id),
    enabled: Boolean(id),
  });
};

export const useOnboardTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => tenantsApi.onboardTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.flats.all() });
    },
  });
};

export const useMoveOutTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => tenantsApi.moveOutTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.flats.all() });
    },
  });
};
