// =====================  MAINTENANCE CONFIG API SERVICE  ======
import apiClient from "../../../lib/api/axios-client.js";

export const maintenanceConfigApi = {
  getActiveConfig: async (buildingId) => {
    return await apiClient.get("/maintenance-configurations/active", {
      params: { buildingId },
    });
  },

  getHistory: async (buildingId, params = {}) => {
    return await apiClient.get("/maintenance-configurations/history", {
      params: { buildingId, ...params },
    });
  },

  publishConfig: async (data) => {
    return await apiClient.post("/maintenance-configurations", data);
  },
};

export default maintenanceConfigApi;
