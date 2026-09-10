// =====================  IMPORTS  ==========================
import { z } from "zod";

// =====================  CONSTANTS  =========================
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// =====================  VALIDATION SCHEMAS  ===============
/**
 * Validation schema for GET /api/v1/roles
 *
 * Security Guard:
 * Strict schema rejection: disallows arbitrary query parameters and MongoDB
 * operator injection attempts ($where, $ne, $regex, etc.).
 */
export const getRolesQuerySchema = z.object({
  query: z
    .object({})
    .strict("No query parameters are supported for system roles directory"),
});

/**
 * Validation schema for GET /api/v1/roles/:id
 *
 * Enforces valid 24-hex-character MongoDB ObjectId format before database query.
 */
export const getRoleByIdSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: "Role ID parameter is required" })
      .regex(
        OBJECT_ID_REGEX,
        "Invalid role ID format: must be a 24-character hexadecimal ObjectId"
      ),
  }),
});
