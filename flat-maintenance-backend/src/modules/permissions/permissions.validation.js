import { z } from "zod";

/**
 * Validation schema for GET /api/v1/permissions
 *
 * Security Guard:
 * Strict schema rejection: disallows arbitrary query parameters and MongoDB
 * operator injection attempts ($where, $ne, $regex, etc.).
 */
export const getPermissionsQuerySchema = z.object({
  query: z
    .object({})
    .strict(
      "No query parameters are supported for platform permissions registry"
    ),
});
