// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { visitorsService } from "./visitors.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLERS  =======================
/**
 * Controller: Pre-generates digital visitor pass.
 *
 * POST /api/v1/visitors
 */
export const createVisitorPass = asyncHandler(async (req, res) => {
  const input = req.validated?.body || req.body;
  const result = await visitorsService.createVisitorPass(input, req.user);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        result,
        "Digital visitor pass pre-generated successfully"
      )
    );
});

/**
 * Controller: Validates visitor pass credentials at the physical gate.
 *
 * GET /api/v1/visitors/verify/:passCode
 */
export const verifyVisitorPass = asyncHandler(async (req, res) => {
  const passCode = req.validated?.params?.passCode || req.params.passCode;
  const result = await visitorsService.verifyVisitorPass(passCode, req.user);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.valid
          ? "Visitor pass verified successfully. Pass is valid for entry."
          : `Visitor pass is not valid for gate entry. Current status: ${result.visitor.status}`
      )
    );
});

/**
 * Controller: Records visitor physical arrival and gate check-in.
 *
 * PATCH /api/v1/visitors/:id/check-in
 */
export const checkInVisitor = asyncHandler(async (req, res) => {
  const visitorId = req.validated?.params?.id || req.params.id;
  const gateData = req.validated?.body || req.body || {};
  const result = await visitorsService.checkInVisitor(
    visitorId,
    req.user,
    gateData
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Visitor arrival recorded and checked in successfully"
      )
    );
});

/**
 * Controller: Records visitor physical departure and gate check-out.
 *
 * PATCH /api/v1/visitors/:id/check-out
 */
export const checkOutVisitor = asyncHandler(async (req, res) => {
  const visitorId = req.validated?.params?.id || req.params.id;
  const result = await visitorsService.checkOutVisitor(visitorId, req.user);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Visitor departure recorded and checked out successfully"
      )
    );
});

/**
 * Controller: Lists visitor records with building/role scoping and pagination.
 *
 * GET /api/v1/visitors
 */
export const listVisitors = asyncHandler(async (req, res) => {
  const result = await visitorsService.listVisitors(req.query, req.user);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result.visitors,
        "Visitors retrieved successfully",
        result.meta
      )
    );
});
