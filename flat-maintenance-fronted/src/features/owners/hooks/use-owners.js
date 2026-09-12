// =====================  OWNERS QUERY & MUTATION HOOKS  ========
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ownersApi } from "../api/owners.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useOwnersList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.owners.list(params),
    queryFn: () => ownersApi.getOwners(params),
  });
};

export const useOwnerDetail = (id) => {
  return useQuery({
    queryKey: queryKeys.owners.detail(id),
    queryFn: () => ownersApi.getOwnerById(id),
    enabled: Boolean(id),
  });
};

export const useRegisterOwnerMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => ownersApi.registerOwner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.owners.all() });
    },
  });
};
