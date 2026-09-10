// =====================  IMPORTS  ==========================
import { staffService } from "./staff.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  STAFF CONTROLLER  ==================
/**
 * Staff Domain HTTP Controller.
 *
 * Thin controller layer translating HTTP requests to domain service invocations.
 * Strictly adheres to the zero-business-logic pattern.
 */
export class StaffController {
  /**
   * HTTP POST /api/v1/staff
   * Onboards new staff personnel and assigns trade category.
   */
  async createStaff(req, res, next) {
    try {
      const staff = await staffService.createStaff(req.body, req.user);
      return res
        .status(201)
        .json(
          new ApiResponse(201, staff, "Staff profile onboarded successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * HTTP GET /api/v1/staff
   * Lists staff personnel with building scope and category/availability filters.
   */
  async listStaff(req, res, next) {
    try {
      const result = await staffService.listStaff(req.query, req.user);
      return res
        .status(200)
        .json(
          new ApiResponse(200, result, "Staff directory retrieved successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * HTTP GET /api/v1/staff/:id
   * Retrieves technician performance card and rating history.
   */
  async getStaffById(req, res, next) {
    try {
      const staff = await staffService.getStaffById(req.params.id, req.user);
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            staff,
            "Staff performance profile retrieved successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }
}

// =====================  EXPORTS  ===========================
export const staffController = new StaffController();
export default staffController;
