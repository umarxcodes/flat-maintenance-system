// =====================  STAFF QUERY & MUTATION HOOKS  =========
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi } from "../api/staff.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useStaffList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.staff.list(params),
    queryFn: () => staffApi.getStaff(params),
  });
};

export const useStaffDetail = (id) => {
  return useQuery({
    queryKey: queryKeys.staff.detail(id),
    queryFn: () => staffApi.getStaffById(id),
    enabled: Boolean(id),
  });
};

export const useCreateStaffMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => staffApi.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all() });
    },
  });
};
