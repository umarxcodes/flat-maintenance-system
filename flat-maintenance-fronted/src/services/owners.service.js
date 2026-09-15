// =====================  OWNERS SERVICE  =========================
import { ownersApi } from "../features/owners/api/owners.api.js";

/**
 * Service for property owner profiles and asset portfolios.
 */
export const ownersService = {
  getOwners: (params) => ownersApi.getOwners(params),
  getOwnerById: (id) => ownersApi.getOwnerById(id),
  createOwner: (payload) => ownersApi.createOwner(payload),
  updateOwner: (id, payload) => ownersApi.updateOwner(id, payload),
};

export default ownersService;
