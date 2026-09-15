// =====================  FLATS SERVICE  ==========================
import { flatsApi } from "../features/flats/api/flats.api.js";

/**
 * Service for managing apartment units, occupancies, and resident associations.
 */
export const flatsService = {
  getFlats: (params) => flatsApi.getFlats(params),
  getFlatById: (id) => flatsApi.getFlatById(id),
  createFlat: (payload) => flatsApi.createFlat(payload),
  updateFlat: (id, payload) => flatsApi.updateFlat(id, payload),
  deleteFlat: (id) => flatsApi.deleteFlat(id),
  assignOwner: (id, payload) => flatsApi.assignOwner(id, payload),
  assignTenant: (id, payload) => flatsApi.assignTenant(id, payload),
  updateOccupancyStatus: (id, status) => flatsApi.updateOccupancyStatus(id, status),
};

export default flatsService;
