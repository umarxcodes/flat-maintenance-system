// =====================  IMPORTS  ==========================
import { Router } from "express";
import multer from "multer";
import {
  createDocument,
  listDocuments,
  deleteDocument,
} from "./documents.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import { DOCUMENT_CONSTRAINTS } from "./documents.constants.js";
import {
  createDocumentSchema,
  listDocumentsQuerySchema,
  documentIdParamSchema,
} from "./documents.validation.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";

// =====================  MULTER MEMORY CONFIGURATION  =======
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: DOCUMENT_CONSTRAINTS.MAX_FILE_SIZE_BYTES, // 10MB
    files: 1,
  },
});

/**
 * Middleware adapter: Safely extracts single 'file' field from multipart request into RAM buffer.
 * Translates Multer exceptions into standard ApiError envelopes.
 */
const uploadSingleFile = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new ApiError(
            400,
            "File size exceeds 10MB limit",
            [{ field: "file", message: "File exceeds 10MB" }],
            ERROR_CODES.VALIDATION_ERROR
          )
        );
      }
      return next(
        new ApiError(
          400,
          err.message || "File upload failed",
          [{ field: "file", message: err.message }],
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }
    next();
  });
};

// =====================  ROUTER SETUP  ======================
const router = Router();

// =====================  DOCUMENT REPOSITORY ROUTES  ========
/**
 * @route   POST /api/v1/documents
 * @desc    Upload and register society legal deed, bylaw, AGM minutes, or lease contract
 * @access  Private (MANAGER, BUILDING_ADMIN, SUPER_ADMIN possessing DOCUMENT_UPLOAD)
 */
router.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.DOCUMENT_UPLOAD),
  uploadSingleFile,
  validate(createDocumentSchema),
  createDocument
);

/**
 * @route   GET /api/v1/documents
 * @desc    List authorized society documents tailored to caller's role, building, and flat scope
 * @access  Private (Authenticated users possessing DOCUMENT_READ)
 */
router.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.DOCUMENT_READ),
  validate(listDocumentsQuerySchema),
  listDocuments
);

/**
 * @route   DELETE /api/v1/documents/:id
 * @desc    Soft-delete a society document record within caller's authorized building scope
 * @access  Private (Administrative staff possessing DOCUMENT_UPLOAD)
 */
router.delete(
  "/:id",
  authenticate,
  authorize(PERMISSIONS.DOCUMENT_UPLOAD),
  validate(documentIdParamSchema),
  deleteDocument
);

// =====================  EXPORTS  ===========================
export default router;
