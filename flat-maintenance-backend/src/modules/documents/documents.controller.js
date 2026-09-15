// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { documentsService } from "./documents.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLERS  =======================
/**
 * Controller: Uploads and registers a new society document.
 *
 * POST /api/v1/documents
 */
export const createDocument = asyncHandler(async (req, res) => {
  const input = req.validated?.body || req.body;
  const file = req.file;

  const result = await documentsService.createDocument({
    input,
    file,
    actor: req.user,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        result,
        "Document uploaded and registered successfully"
      )
    );
});

/**
 * Controller: Lists society documents scoped to caller's role, building, and flat.
 *
 * GET /api/v1/documents
 */
export const listDocuments = asyncHandler(async (req, res) => {
  const query = req.validated?.query || req.query;

  const result = await documentsService.listAuthorizedDocuments({
    query,
    actor: req.user,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Authorized society documents retrieved successfully"
      )
    );
});

/**
 * Controller: Soft-deletes a society document record.
 *
 * DELETE /api/v1/documents/:id
 */
export const deleteDocument = asyncHandler(async (req, res) => {
  const documentId = req.validated?.params?.id || req.params.id;

  const result = await documentsService.softDeleteDocument({
    documentId,
    actor: req.user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Document soft-deleted successfully"));
});
