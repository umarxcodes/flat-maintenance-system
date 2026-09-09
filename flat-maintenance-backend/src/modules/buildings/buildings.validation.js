// =====================  IMPORTS  ==========================
import { z } from "zod";
import { BUILDING_STATUS, BUILDINGS_CONSTANTS } from "./buildings.constants.js";

// =====================  VALIDATION CONSTANTS  ==============
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const BUILDING_CODE_REGEX = /^[A-Za-z0-9_-]+$/;

// =====================  ADDRESS SUB-SCHEMAS  ===============
const addressSchema = z.object({
  street: z
    .string({ required_error: "Street address is required" })
    .trim()
    .min(2, "Street must be at least 2 characters")
    .max(200, "Street cannot exceed 200 characters"),
  city: z
    .string({ required_error: "City is required" })
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City cannot exceed 100 characters"),
  state: z
    .string({ required_error: "State/Province is required" })
    .trim()
    .min(2, "State must be at least 2 characters")
    .max(100, "State cannot exceed 100 characters"),
  postalCode: z
    .string({ required_error: "Postal code is required" })
    .trim()
    .min(2, "Postal code must be at least 2 characters")
    .max(20, "Postal code cannot exceed 20 characters"),
  country: z
    .string({ required_error: "Country is required" })
    .trim()
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country cannot exceed 100 characters"),
});

const updateAddressSchema = z
  .object({
    street: z.string().trim().min(2).max(200).optional(),
    city: z.string().trim().min(2).max(100).optional(),
    state: z.string().trim().min(2).max(100).optional(),
    postalCode: z.string().trim().min(2).max(20).optional(),
    country: z.string().trim().min(2).max(100).optional(),
  })
  .strict();

// =====================  VALIDATION SCHEMAS  =================
/**
 * Validation schema for POST /api/v1/buildings
 */
export const createBuildingSchema = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: "Building name is required" })
        .trim()
        .min(2, "Building name must be at least 2 characters")
        .max(128, "Building name cannot exceed 128 characters"),
      code: z
        .string({ required_error: "Building code is required" })
        .trim()
        .min(2, "Building code must be at least 2 characters")
        .max(50, "Building code cannot exceed 50 characters")
        .regex(
          BUILDING_CODE_REGEX,
          "Building code must contain only letters, numbers, hyphens, or underscores"
        ),
      address: addressSchema,
      totalBlocks: z.number().int().min(0).optional().default(0),
      totalFlats: z.number().int().min(0).optional().default(0),
      status: z
        .enum(Object.values(BUILDING_STATUS))
        .optional()
        .default(BUILDING_STATUS.ACTIVE),
    })
    .strict("Unrecognized fields are rejected"),
});

/**
 * Validation schema for GET /api/v1/buildings (Query parameters)
 */
export const listBuildingsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce
        .number()
        .int()
        .min(1)
        .default(BUILDINGS_CONSTANTS.DEFAULT_PAGE),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(BUILDINGS_CONSTANTS.MAX_LIMIT)
        .default(BUILDINGS_CONSTANTS.DEFAULT_LIMIT),
      status: z.enum(Object.values(BUILDING_STATUS)).optional(),
      search: z.string().trim().max(100).optional(),
      buildingId: z
        .string()
        .regex(
          OBJECT_ID_REGEX,
          "buildingId filter must be a valid 24-character ObjectId"
        )
        .optional(),
    })
    .strict(),
});

/**
 * Validation schema for route parameter: :id
 */
export const buildingIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: "Building ID parameter is required" })
      .regex(
        OBJECT_ID_REGEX,
        "Invalid building ID format: must be a 24-character hexadecimal ObjectId"
      ),
  }),
});

/**
 * Validation schema for PATCH /api/v1/buildings/:id
 */
export const updateBuildingSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: "Building ID parameter is required" })
      .regex(
        OBJECT_ID_REGEX,
        "Invalid building ID format: must be a 24-character hexadecimal ObjectId"
      ),
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(128).optional(),
      code: z
        .string()
        .trim()
        .min(2)
        .max(50)
        .regex(
          BUILDING_CODE_REGEX,
          "Building code must contain only letters, numbers, hyphens, or underscores"
        )
        .optional(),
      address: updateAddressSchema.optional(),
      totalBlocks: z.number().int().min(0).optional(),
      totalFlats: z.number().int().min(0).optional(),
      status: z.enum(Object.values(BUILDING_STATUS)).optional(),
    })
    .strict("Unrecognized fields are rejected"),
});
