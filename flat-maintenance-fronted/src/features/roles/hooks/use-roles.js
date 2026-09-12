// =====================  ROLES QUERY HOOKS  ===================
import { useQuery } from "@tanstack/react-query";
import { rolesApi } from "../api/roles.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useRolesList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.roles.list(params),
    queryFn: () => rolesApi.getRoles(params),
  });
};

export const useRoleDetail = (id) => {
  return useQuery({
    queryKey: queryKeys.roles.detail(id),
    queryFn: () => rolesApi.getRoleById(id),
    enabled: Boolean(id),
  });
};
