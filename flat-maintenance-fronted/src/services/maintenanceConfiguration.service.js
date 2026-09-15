// =====================  MAINTENANCE CONFIG SERVICE  =============
import { maintenanceConfigurationsApi } from "../features/maintenance-configurations/api/maintenance-configurations.api.js";

/**
 * Service for billing rate schedules and fee formulas.
 */
export const maintenanceConfigurationService = {
  getConfigurations: (params) => maintenanceConfigurationsApi.getConfigurations(params),
  getConfigurationById: (id) => maintenanceConfigurationsApi.getConfigurationById(id),
  createConfiguration: (payload) => maintenanceConfigurationsApi.createConfiguration(payload),
  activateConfiguration: (id) => maintenanceConfigurationsApi.activateConfiguration(id),
};

export default maintenanceConfigurationService;
