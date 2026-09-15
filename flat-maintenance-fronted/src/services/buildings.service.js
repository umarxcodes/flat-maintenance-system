// =====================  BUILDINGS SERVICE  ======================
import { buildingsApi } from "../features/buildings/api/buildings.api.js";

/**
 * Service for managing residential buildings and complexes.
 */
export const buildingsService = {
  getBuildings: (params) => buildingsApi.getBuildings(params),
  getBuildingById: (id) => buildingsApi.getBuildingById(id),
  createBuilding: (payload) => buildingsApi.createBuilding(payload),
  updateBuilding: (id, payload) => buildingsApi.updateBuilding(id, payload),
  deleteBuilding: (id) => buildingsApi.deleteBuilding(id),
};

export default buildingsService;
