// =====================  MAINTENANCE CONFIG QUERY HOOKS  ======
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { maintenanceConfigApi } from "../api/maintenance-configurations.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useActiveMaintenanceConfig = (buildingId) => {
  return useQuery({
    queryKey: queryKeys.maintenanceConfigurations.active(buildingId),
    queryFn: () => maintenanceConfigApi.getActiveConfig(buildingId),
    enabled: Boolean(buildingId),
  });
};

export const useMaintenanceConfigHistory = (buildingId, params = {}) => {
  return useQuery({
    queryKey: queryKeys.maintenanceConfigurations.history(buildingId),
    queryFn: () => maintenanceConfigApi.getHistory(buildingId, params),
    enabled: Boolean(buildingId),
  });
};

export const usePublishMaintenanceConfigMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => maintenanceConfigApi.publishConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.maintenanceConfigurations.all(),
      });
    },
  });
};
