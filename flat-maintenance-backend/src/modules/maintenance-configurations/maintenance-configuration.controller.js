// =====================  IMPORTS  ==========================
import { maintenanceConfigurationService } from "./maintenance-configuration.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLER LAYER  ==================
/**
 * Maintenance Configuration HTTP Controller.
 *
 * Thin HTTP translation layer delegating directly to domain services.
 * Contains zero business logic, transaction management, or direct database queries.
 */
export class MaintenanceConfigurationController {
  /**
   * HTTP POST /api/v1/maintenance-configurations
   * Publishes a new billing rate formula and surcharges for a building.
   */
  async publishConfiguration(req, res, next) {
    try {
      const config = await maintenanceConfigurationService.publishConfiguration(
        req.body,
        req.user
      );
      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            config,
            "Maintenance billing configuration published successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * HTTP GET /api/v1/maintenance-configurations/active?buildingId=:id
   * Retrieves the currently active maintenance formula for a building.
   */
  async getActiveConfiguration(req, res, next) {
    try {
      const { buildingId, asOfDate } = req.query;
      const config =
        await maintenanceConfigurationService.getActiveConfiguration(
          buildingId,
          asOfDate,
          req.user
        );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            config,
            "Active maintenance configuration retrieved successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * HTTP GET /api/v1/maintenance-configurations/history?buildingId=:id
   * Retrieves paginated historical billing rate formulas for audit and reconciliation.
   */
  async getConfigurationHistory(req, res, next) {
    try {
      const { buildingId, page, limit } = req.query;
      const result =
        await maintenanceConfigurationService.getConfigurationHistory(
          buildingId,
          { page, limit },
          req.user
        );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Maintenance configuration history retrieved successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }
}

export const maintenanceConfigurationController =
  new MaintenanceConfigurationController();

export default maintenanceConfigurationController;
