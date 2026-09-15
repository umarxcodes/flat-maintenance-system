// =====================  PERMISSIONS SERVICE  ====================
import { permissionsApi } from "../features/permissions/api/permissions.api.js";

/**
 * Service for querying granular system permissions.
 */
export const permissionsService = {
  getPermissions: (params) => permissionsApi.getPermissions(params),
};

export default permissionsService;
