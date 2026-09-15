// =====================  IMPORTS  ==========================
import { z } from "zod";
import mongoose from "mongoose";
import {
  DOCUMENT_TYPES,
  DOCUMENT_VISIBILITY,
  DOCUMENT_CONSTRAINTS,
} from "./documents.constants.js";

// =====================  SHARED HELPERS  ====================
const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

// =====================  ENDPOINT SCHEMAS  ==================
/**
 * Zero-Trust validation for POST /api/v1/documents multipart metadata.
 */
export const createDocumentSchema = z.object({
  body: z
    .object({
      title: z
        .string({ required_error: "Document title is required" })
        .trim()
        .min(
          DOCUMENT_CONSTRAINTS.TITLE_MIN_LENGTH,
          `Document title must be at least ${DOCUMENT_CONSTRAINTS.TITLE_MIN_LENGTH} characters`
        )
        .max(
          DOCUMENT_CONSTRAINTS.TITLE_MAX_LENGTH,
          `Document title cannot exceed ${DOCUMENT_CONSTRAINTS.TITLE_MAX_LENGTH} characters`
        ),
      documentType: z.nativeEnum(DOCUMENT_TYPES, {
        errorMap: () => ({
          message: `Document type must be one of: ${Object.values(DOCUMENT_TYPES).join(", ")}`,
        }),
      }),
      visibility: z.nativeEnum(DOCUMENT_VISIBILITY, {
        errorMap: () => ({
          message: `Visibility must be one of: ${Object.values(DOCUMENT_VISIBILITY).join(", ")}`,
        }),
      }),
      buildingId: objectIdSchema.optional(),
      flatId: objectIdSchema.optional().nullable(),
    })
    .strict({
      message:
        "Unrecognized client fields detected in document creation payload",
    }),
});

/**
 * Zero-Trust validation for GET /api/v1/documents query parameters.
 */
export const listDocumentsQuerySchema = z.object({
  query: z
    .object({
      buildingId: objectIdSchema.optional(),
      documentType: z.nativeEnum(DOCUMENT_TYPES).optional(),
      visibility: z.nativeEnum(DOCUMENT_VISIBILITY).optional(),
      flatId: objectIdSchema.optional(),
    })
    .strict({ message: "Unrecognized query parameters detected" }),
});

/**
 * Zero-Trust validation for /api/v1/documents/:id route parameter.
 */
export const documentIdParamSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
});
