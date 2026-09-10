// =====================  IMPORTS  ==========================
import { z } from "zod";
import {
  CHARGE_TYPES,
  MAINTENANCE_CONFIG_DEFAULTS,
  MAINTENANCE_CONFIG_LIMITS,
  MAINTENANCE_CONFIG_PAGINATION,
} from "./maintenance-configuration.constants.js";

// =====================  REGEX PATTERNS  ====================
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = z
  .string({
    required_error: "ID is required",
    invalid_type_error: "ID must be a string",
  })
  .trim()
  .regex(
    OBJECT_ID_REGEX,
    "Invalid ObjectId format: must be 24-character hexadecimal string"
  );

// =====================  DATE VALIDATOR  ====================
const dateStringSchema = z
  .string({
    required_error: "Date is required",
    invalid_type_error: "Date must be a string",
  })
  .trim()
  .refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "Invalid date format: must be a valid ISO date or datetime string",
  });

// =====================  SCHEMAS  ===========================
/**
 * Validation schema for publishing a new Maintenance Configuration
 * POST /api/v1/maintenance-configurations
 *
 * Security & Financial Invariants:
 * - Strict schema rejects mass-assignment of _id, isActive, createdAt, updatedAt.
 * - Non-negative financial values (baseRate, parkingCharge, waterCharge, sinkingFundCharge).
 * - Late fee percentage capped between 0.0 and 100.0%.
 * - Grace period days capped between 0 and 365 days.
 * - Charge type strictly restricted to FLAT_RATE or PER_SQFT.
 */
export const createConfigurationSchema = z.object({
  body: z
    .object({
      buildingId: objectIdSchema,
      chargeType: z.enum(Object.values(CHARGE_TYPES), {
        errorMap: () => ({
          message: `chargeType must be one of: ${Object.values(CHARGE_TYPES).join(", ")}`,
        }),
      }),
      baseRate: z
        .number({
          required_error: "baseRate is required",
          invalid_type_error: "baseRate must be a number",
        })
        .finite("baseRate must be a finite number")
        .min(
          MAINTENANCE_CONFIG_LIMITS.MIN_BASE_RATE,
          `baseRate cannot be less than ${MAINTENANCE_CONFIG_LIMITS.MIN_BASE_RATE}`
        ),
      parkingCharge: z
        .number({
          invalid_type_error: "parkingCharge must be a number",
        })
        .finite("parkingCharge must be a finite number")
        .min(
          MAINTENANCE_CONFIG_LIMITS.MIN_CHARGE,
          `parkingCharge cannot be less than ${MAINTENANCE_CONFIG_LIMITS.MIN_CHARGE}`
        )
        .default(MAINTENANCE_CONFIG_DEFAULTS.PARKING_CHARGE),
      waterCharge: z
        .number({
          invalid_type_error: "waterCharge must be a number",
        })
        .finite("waterCharge must be a finite number")
        .min(
          MAINTENANCE_CONFIG_LIMITS.MIN_CHARGE,
          `waterCharge cannot be less than ${MAINTENANCE_CONFIG_LIMITS.MIN_CHARGE}`
        )
        .default(MAINTENANCE_CONFIG_DEFAULTS.WATER_CHARGE),
      sinkingFundCharge: z
        .number({
          invalid_type_error: "sinkingFundCharge must be a number",
        })
        .finite("sinkingFundCharge must be a finite number")
        .min(
          MAINTENANCE_CONFIG_LIMITS.MIN_CHARGE,
          `sinkingFundCharge cannot be less than ${MAINTENANCE_CONFIG_LIMITS.MIN_CHARGE}`
        )
        .default(MAINTENANCE_CONFIG_DEFAULTS.SINKING_FUND_CHARGE),
      lateFeePercentage: z
        .number({
          invalid_type_error: "lateFeePercentage must be a number",
        })
        .finite("lateFeePercentage must be a finite number")
        .min(
          MAINTENANCE_CONFIG_LIMITS.MIN_LATE_FEE_PERCENTAGE,
          `lateFeePercentage cannot be less than ${MAINTENANCE_CONFIG_LIMITS.MIN_LATE_FEE_PERCENTAGE}`
        )
        .max(
          MAINTENANCE_CONFIG_LIMITS.MAX_LATE_FEE_PERCENTAGE,
          `lateFeePercentage cannot exceed ${MAINTENANCE_CONFIG_LIMITS.MAX_LATE_FEE_PERCENTAGE}`
        )
        .default(MAINTENANCE_CONFIG_DEFAULTS.LATE_FEE_PERCENTAGE),
      gracePeriodDays: z
        .number({
          invalid_type_error: "gracePeriodDays must be an integer",
        })
        .int("gracePeriodDays must be an integer")
        .min(
          MAINTENANCE_CONFIG_LIMITS.MIN_GRACE_PERIOD_DAYS,
          `gracePeriodDays cannot be less than ${MAINTENANCE_CONFIG_LIMITS.MIN_GRACE_PERIOD_DAYS}`
        )
        .max(
          MAINTENANCE_CONFIG_LIMITS.MAX_GRACE_PERIOD_DAYS,
          `gracePeriodDays cannot exceed ${MAINTENANCE_CONFIG_LIMITS.MAX_GRACE_PERIOD_DAYS}`
        )
        .default(MAINTENANCE_CONFIG_DEFAULTS.GRACE_PERIOD_DAYS),
      effectiveFrom: dateStringSchema,
    })
    .strict("Unrecognized fields are not permitted in configuration payload"),
});

/**
 * Validation schema for retrieving the active configuration of a building
 * GET /api/v1/maintenance-configurations/active?buildingId=:id
 */
export const activeConfigurationQuerySchema = z.object({
  query: z
    .object({
      buildingId: objectIdSchema,
      asOfDate: z
        .string()
        .trim()
        .refine((val) => !Number.isNaN(Date.parse(val)), {
          message: "asOfDate must be a valid ISO date or datetime string",
        })
        .optional(),
    })
    .strict(),
});

/**
 * Validation schema for retrieving historical configurations of a building
 * GET /api/v1/maintenance-configurations/history?buildingId=:id
 */
export const historyConfigurationQuerySchema = z.object({
  query: z
    .object({
      buildingId: objectIdSchema,
      page: z.coerce
        .number({
          invalid_type_error: "Page must be a valid number",
        })
        .int("Page must be an integer")
        .min(1, "Page must be at least 1")
        .default(MAINTENANCE_CONFIG_PAGINATION.DEFAULT_PAGE),
      limit: z.coerce
        .number({
          invalid_type_error: "Limit must be a valid number",
        })
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(
          MAINTENANCE_CONFIG_PAGINATION.MAX_LIMIT,
          `Limit cannot exceed ${MAINTENANCE_CONFIG_PAGINATION.MAX_LIMIT}`
        )
        .default(MAINTENANCE_CONFIG_PAGINATION.DEFAULT_LIMIT),
    })
    .strict(),
});
