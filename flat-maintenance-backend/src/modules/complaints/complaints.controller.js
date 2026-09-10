// =====================  IMPORTS  ==========================
import { complaintService } from "./complaints.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLER HANDLERS  ==============
/**
 * Thin HTTP controller for Module 16: Complaints & SLA Ticket Management.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 46 and Section 70.5.
 */
export class ComplaintController {
  /**
   * Files a new resident society grievance ticket.
   * POST /api/v1/complaints
   */
  async createComplaint(req, res, next) {
    try {
      const payload = req.validated?.body || req.body;
      const result = await complaintService.createComplaint(payload, req.user);
      return res
        .status(201)
        .json(new ApiResponse(201, result, "Complaint filed successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves role-filtered list of complaints with status and type filters.
   * GET /api/v1/complaints
   */
  async listComplaints(req, res, next) {
    try {
      const query = req.validated?.query || req.query;
      const result = await complaintService.listComplaints(query, req.user);
      return res
        .status(200)
        .json(
          new ApiResponse(200, result, "Complaints retrieved successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolves a complaint grievance ticket with formal notes.
   * PATCH /api/v1/complaints/:id/resolve
   */
  async resolveComplaint(req, res, next) {
    try {
      const payload = req.validated?.body || req.body;
      const result = await complaintService.resolveComplaint(
        req.params.id,
        payload,
        req.user
      );
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Complaint resolved successfully"));
    } catch (error) {
      next(error);
    }
  }
}

export const complaintController = new ComplaintController();
export default complaintController;
