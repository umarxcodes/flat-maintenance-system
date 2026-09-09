// =====================  IMPORTS  ==========================
import { z } from "zod";
import { BLOCKS_CONSTANTS } from "./blocks.constants.js";

// =====================  VALIDATION CONSTANTS  ==============
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const BLOCK_CODE_REGEX = /^[A-Za-z0-9_-]+$/;

// =====================  VALIDATION SCHEMAS  =================
/**
 * Validation schema for POST /api/v1/blocks
 */
export const createBlockSchema = z.object({
  body: z
    .object({
      buildingId: z
        .string({ required_error: "Building ID is required" })
        .regex(
          OBJECT_ID_REGEX,
          "Invalid building ID format: must be a 24-character hexadecimal ObjectId"
        ),
      name: z
        .string({ required_error: "Block name is required" })
        .trim()
        .min(
          BLOCKS_CONSTANTS.NAME_MIN_LENGTH,
          `Block name must be at least ${BLOCKS_CONSTANTS.NAME_MIN_LENGTH} character`
        )
        .max(
          BLOCKS_CONSTANTS.NAME_MAX_LENGTH,
          `Block name cannot exceed ${BLOCKS_CONSTANTS.NAME_MAX_LENGTH} characters`
        ),
      code: z
        .string()
        .trim()
        .max(
          BLOCKS_CONSTANTS.CODE_MAX_LENGTH,
          `Block code cannot exceed ${BLOCKS_CONSTANTS.CODE_MAX_LENGTH} characters`
        )
        .regex(
          BLOCK_CODE_REGEX,
          "Block code must contain only letters, numbers, hyphens, or underscores"
        )
        .optional(),
      totalFloors: z
        .number({ required_error: "Total floors count is required" })
        .int("Total floors must be an integer")
        .min(
          BLOCKS_CONSTANTS.MIN_FLOORS,
          `Total floors cannot be less than ${BLOCKS_CONSTANTS.MIN_FLOORS}`
        )
        .max(
          BLOCKS_CONSTANTS.MAX_FLOORS,
          `Total floors cannot exceed ${BLOCKS_CONSTANTS.MAX_FLOORS}`
        ),
    })
    .strict("Unrecognized fields are rejected"),
});

/**
 * Validation schema for GET /api/v1/blocks (Query parameters)
 */
export const listBlocksQuerySchema = z.object({
  query: z
    .object({
      buildingId: z
        .string({ required_error: "buildingId query parameter is required" })
        .regex(
          OBJECT_ID_REGEX,
          "Invalid buildingId format: must be a 24-character hexadecimal ObjectId"
        ),
    })
    .strict("Unrecognized query parameters are rejected"),
});
