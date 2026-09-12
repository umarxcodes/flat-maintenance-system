// =====================  REPORTS QUERY HOOKS  =================
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/reports.api.js";
import { queryKeys } from "../../../lib/query/query-keys.js";

export const useMaintenanceCollectionsReport = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.reports.maintenanceCollections(params),
    queryFn: () => reportsApi.getMaintenanceCollections(params),
    enabled: Boolean(params.buildingId),
  });
};

export const useStaffPerformanceReport = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.reports.staffPerformance(params),
    queryFn: () => reportsApi.getStaffPerformance(params),
    enabled: Boolean(params.buildingId),
  });
};

export const useComplaintSlaReport = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.reports.complaintSla(params),
    queryFn: () => reportsApi.getComplaintSla(params),
    enabled: Boolean(params.buildingId),
  });
};
