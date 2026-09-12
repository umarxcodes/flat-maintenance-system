// =====================  IMPORTS  ==========================
import { z } from "zod";
import { FLATS_CONSTANTS } from "./flats.constants.js";
import { FLAT_TYPES, FLAT_STATUS } from "../../models/flat.model.js";

// =====================  VALIDATION CONSTANTS  ==============
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// =====================  SCHEMAS  ===========================
/**
 * Validation schema for POST /api/v1/flats
 * Provisions a new flat unit within a validated building, block, and floor hierarchy.
 */
export const createFlatSchema = z.object({
  body: z
    .object({
      buildingId: z
        .string()
        .regex(
          OBJECT_ID_REGEX,
          "Invalid building ID format: must be a 24-character hexadecimal ObjectId"
        )
        .optional(),
      blockId: z
        .string({ required_error: "Block ID is required" })
        .regex(
          OBJECT_ID_REGEX,
          "Invalid block ID format: must be a 24-character hexadecimal ObjectId"
        ),
      floorId: z
        .string({ required_error: "Floor ID is required" })
        .regex(
          OBJECT_ID_REGEX,
          "Invalid floor ID format: must be a 24-character hexadecimal ObjectId"
        ),
      flatNumber: z
        .string({ required_error: "Flat number is required" })
        .trim()
        .min(
          FLATS_CONSTANTS.FLAT_NUMBER_MIN_LENGTH,
          `Flat number must be at least ${FLATS_CONSTANTS.FLAT_NUMBER_MIN_LENGTH} character`
        )
        .max(
          FLATS_CONSTANTS.FLAT_NUMBER_MAX_LENGTH,
          `Flat number cannot exceed ${FLATS_CONSTANTS.FLAT_NUMBER_MAX_LENGTH} characters`
        ),
      areaSqFt: z
        .number({ required_error: "Area in square feet is required" })
        .min(
          FLATS_CONSTANTS.MIN_AREA_SQFT,
          `Area must be at least ${FLATS_CONSTANTS.MIN_AREA_SQFT} sq ft`
        )
        .max(
          FLATS_CONSTANTS.MAX_AREA_SQFT,
          `Area cannot exceed ${FLATS_CONSTANTS.MAX_AREA_SQFT} sq ft`
        ),
      flatType: z
        .enum(Object.values(FLAT_TYPES), {
          errorMap: () => ({
            message: `Flat type must be one of: ${Object.values(FLAT_TYPES).join(", ")}`,
          }),
        })
        .optional(),
      status: z
        .enum(Object.values(FLAT_STATUS), {
          errorMap: () => ({
            message: `Status must be one of: ${Object.values(FLAT_STATUS).join(", ")}`,
          }),
        })
        .optional(),
    })
    .strict("Unrecognized fields are rejected"),
});

/**
 * Validation schema for GET /api/v1/flats (Query parameters)
 */
export const listFlatsQuerySchema = z.object({
  query: z
    .object({
      buildingId: z
        .string()
        .regex(OBJECT_ID_REGEX, "Invalid buildingId format")
        .optional(),
      blockId: z
        .string()
        .regex(OBJECT_ID_REGEX, "Invalid blockId format")
        .optional(),
      floorId: z
        .string()
        .regex(OBJECT_ID_REGEX, "Invalid floorId format")
        .optional(),
      status: z
        .enum(Object.values(FLAT_STATUS), {
          errorMap: () => ({
            message: `Status must be one of: ${Object.values(FLAT_STATUS).join(", ")}`,
          }),
        })
        .optional(),
      flatType: z
        .enum(Object.values(FLAT_TYPES), {
          errorMap: () => ({
            message: `Flat type must be one of: ${Object.values(FLAT_TYPES).join(", ")}`,
          }),
        })
        .optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .strict("Unrecognized query parameters are rejected"),
});

/**
 * Validation schema for GET /api/v1/flats/:id
 */
export const getFlatByIdSchema = z.object({
  params: z
    .object({
      id: z
        .string({ required_error: "Flat ID is required" })
        .regex(OBJECT_ID_REGEX, "Invalid flat ID format"),
    })
    .strict("Unrecognized URL parameters are rejected"),
});

/**
 * Validation schema for PATCH /api/v1/flats/:id/status
 */
export const updateFlatStatusSchema = z.object({
  params: z
    .object({
      id: z
        .string({ required_error: "Flat ID is required" })
        .regex(OBJECT_ID_REGEX, "Invalid flat ID format"),
    })
    .strict("Unrecognized URL parameters are rejected"),
  body: z
    .object({
      status: z.enum(Object.values(FLAT_STATUS), {
        errorMap: () => ({
          message: `Status must be one of: ${Object.values(FLAT_STATUS).join(", ")}`,
        }),
      }),
    })
    .strict("Unrecognized fields are rejected"),
});
