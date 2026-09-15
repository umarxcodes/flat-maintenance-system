// =====================  ROLES SERVICE  ==========================
import { rolesApi } from "../features/roles/api/roles.api.js";

/**
 * Service for RBAC role administration and permission assignment.
 */
export const rolesService = {
  getRoles: (params) => rolesApi.getRoles(params),
  getRoleById: (id) => rolesApi.getRoleById(id),
  createRole: (payload) => rolesApi.createRole(payload),
  updateRole: (id, payload) => rolesApi.updateRole(id, payload),
  deleteRole: (id) => rolesApi.deleteRole(id),
};

export default rolesService;
