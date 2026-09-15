// =====================  FLOORS SERVICE  =========================
import { floorsApi } from "../features/floors/api/floors.api.js";

/**
 * Service for managing building and block floors.
 */
export const floorsService = {
  getFloors: (params) => floorsApi.getFloors(params),
  getFloorById: (id) => floorsApi.getFloorById(id),
  createFloor: (payload) => floorsApi.createFloor(payload),
  updateFloor: (id, payload) => floorsApi.updateFloor(id, payload),
  deleteFloor: (id) => floorsApi.deleteFloor(id),
};

export default floorsService;
