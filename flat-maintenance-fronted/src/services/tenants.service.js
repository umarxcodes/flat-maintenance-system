// =====================  TENANTS SERVICE  ========================
import { tenantsApi } from "../features/tenants/api/tenants.api.js";

/**
 * Service for managing resident leases and move-in/out workflows.
 */
export const tenantsService = {
  getTenants: (params) => tenantsApi.getTenants(params),
  getTenantById: (id) => tenantsApi.getTenantById(id),
  createTenant: (payload) => tenantsApi.createTenant(payload),
  updateTenant: (id, payload) => tenantsApi.updateTenant(id, payload),
  moveOutTenant: (id, payload) => tenantsApi.moveOutTenant(id, payload),
};

export default tenantsService;
