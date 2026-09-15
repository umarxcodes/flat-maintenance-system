// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { reportsService } from "./reports.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLERS  =======================
/**
 * Controller: Retrieves building-scoped maintenance collection financial analytics.
 *
 * GET /api/v1/reports/maintenance-collections?buildingId=:id&period=YYYY-MM
 */
export const getMaintenanceCollections = asyncHandler(async (req, res) => {
  const { buildingId, period } = req.validated?.query || req.query;

  const result = await reportsService.getMaintenanceCollectionsReport({
    buildingId,
    period,
    actor: req.user,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Maintenance collections report retrieved successfully"
      )
    );
});

/**
 * Controller: Retrieves technician resolution velocity, SLA compliance, and reviews.
 *
 * GET /api/v1/reports/staff-performance?buildingId=:id
 */
export const getStaffPerformance = asyncHandler(async (req, res) => {
  const { buildingId } = req.validated?.query || req.query;

  const result = await reportsService.getStaffPerformanceReport({
    buildingId,
    actor: req.user,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Staff performance analytics report retrieved successfully"
      )
    );
});

/**
 * Controller: Retrieves complaint turnaround velocity, status distribution, and grievance metrics.
 *
 * GET /api/v1/reports/complaint-sla?buildingId=:id
 */
export const getComplaintSla = asyncHandler(async (req, res) => {
  const { buildingId } = req.validated?.query || req.query;

  const result = await reportsService.getComplaintSlaReport({
    buildingId,
    actor: req.user,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Complaint SLA and resolution analytics report retrieved successfully"
      )
    );
});
