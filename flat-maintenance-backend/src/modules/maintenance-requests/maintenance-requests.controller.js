// =====================  IMPORTS  ==========================
import { maintenanceRequestService } from "./maintenance-requests.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLER LAYER  ==================
/**
 * Maintenance Requests HTTP Controller.
 *
 * Translates incoming HTTP requests to domain service invocations.
 * Adheres strictly to the thin controller pattern with zero direct database logic.
 */
export class MaintenanceRequestController {
  /**
   * HTTP POST /api/v1/maintenance-requests
   * Submits a new resident maintenance ticket.
   */
  async createRequest(req, res, next) {
    try {
      const request = await maintenanceRequestService.createRequest(
        req.body,
        req.user
      );
      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            request,
            "Maintenance request submitted successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * HTTP GET /api/v1/maintenance-requests
   * Lists maintenance requests with role-filtered scoping and query filters.
   */
  async listRequests(req, res, next) {
    try {
      const result = await maintenanceRequestService.listRequests(
        req.query,
        req.user
      );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Maintenance requests retrieved successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * HTTP PATCH /api/v1/maintenance-requests/:id/assign
   * Dispatches a specialized maintenance technician to the ticket.
   */
  async assignRequest(req, res, next) {
    try {
      const request = await maintenanceRequestService.assignRequest(
        req.params.id,
        req.body,
        req.user
      );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            request,
            "Technician dispatched to work order successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * HTTP PATCH /api/v1/maintenance-requests/:id/status
   * Updates work order execution status and uploads completion proof photos.
   */
  async updateStatus(req, res, next) {
    try {
      const request = await maintenanceRequestService.updateStatus(
        req.params.id,
        req.body,
        req.user
      );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            request,
            "Work order status updated successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * HTTP PATCH /api/v1/maintenance-requests/:id/verify
   * Confirms resident satisfaction and signs off on completed repair (or requests rework).
   */
  async verifyRequest(req, res, next) {
    try {
      const request = await maintenanceRequestService.verifyRequest(
        req.params.id,
        req.body,
        req.user
      );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            request,
            "Maintenance work order verified successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }
}

export const maintenanceRequestController = new MaintenanceRequestController();

export default maintenanceRequestController;
