// =====================  IMPORTS  ==========================
import { z } from "zod";
import { FLOORS_CONSTANTS } from "./floors.constants.js";

// =====================  VALIDATION CONSTANTS  ==============
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// =====================  VALIDATION SCHEMAS  =================
/**
 * Validation schema for POST /api/v1/floors
 */
export const createFloorSchema = z.object({
  body: z
    .object({
      blockId: z
        .string({ required_error: "Block ID is required" })
        .regex(
          OBJECT_ID_REGEX,
          "Invalid block ID format: must be a 24-character hexadecimal ObjectId"
        ),
      buildingId: z
        .string()
        .regex(
          OBJECT_ID_REGEX,
          "Invalid building ID format: must be a 24-character hexadecimal ObjectId"
        )
        .optional(),
      floorNumber: z
        .number({ required_error: "Floor number is required" })
        .int("Floor number must be an integer")
        .min(
          FLOORS_CONSTANTS.MIN_FLOOR_NUMBER,
          `Floor number cannot be less than ${FLOORS_CONSTANTS.MIN_FLOOR_NUMBER}`
        )
        .max(
          FLOORS_CONSTANTS.MAX_FLOOR_NUMBER,
          `Floor number cannot exceed ${FLOORS_CONSTANTS.MAX_FLOOR_NUMBER}`
        ),
      name: z
        .string()
        .trim()
        .min(
          FLOORS_CONSTANTS.NAME_MIN_LENGTH,
          `Floor name must be at least ${FLOORS_CONSTANTS.NAME_MIN_LENGTH} character`
        )
        .max(
          FLOORS_CONSTANTS.NAME_MAX_LENGTH,
          `Floor name cannot exceed ${FLOORS_CONSTANTS.NAME_MAX_LENGTH} characters`
        )
        .optional(),
    })
    .strict("Unrecognized fields are rejected"),
});

/**
 * Validation schema for GET /api/v1/floors (Query parameters)
 */
export const listFloorsQuerySchema = z.object({
  query: z
    .object({
      blockId: z
        .string({ required_error: "blockId query parameter is required" })
        .regex(
          OBJECT_ID_REGEX,
          "Invalid blockId format: must be a 24-character hexadecimal ObjectId"
        ),
    })
    .strict("Unrecognized query parameters are rejected"),
});
