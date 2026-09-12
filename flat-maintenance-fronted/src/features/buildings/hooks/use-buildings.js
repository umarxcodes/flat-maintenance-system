// =====================  BUILDINGS QUERY & MUTATION HOOKS  ======
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buildingsApi } from "../api/buildings.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useBuildingsList = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.buildings.list(params),
    queryFn: () => buildingsApi.getBuildings(params),
  });
};

export const useBuildingDetail = (id) => {
  return useQuery({
    queryKey: queryKeys.buildings.detail(id),
    queryFn: () => buildingsApi.getBuildingById(id),
    enabled: Boolean(id),
  });
};

export const useCreateBuildingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => buildingsApi.createBuilding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all() });
    },
  });
};

export const useUpdateBuildingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => buildingsApi.updateBuilding(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buildings.all() });
    },
  });
};
