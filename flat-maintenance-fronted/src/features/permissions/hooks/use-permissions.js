// =====================  PERMISSIONS QUERY HOOKS  =============
import { useQuery } from "@tanstack/react-query";
import { permissionsApi } from "../api/permissions.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const usePermissionsList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.permissions.list(params),
    queryFn: () => permissionsApi.getPermissions(params),
  });
};
