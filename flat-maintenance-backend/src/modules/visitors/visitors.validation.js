// =====================  IMPORTS  ==========================
import { z } from "zod";
import mongoose from "mongoose";
import { VISITOR_TYPES, VISITOR_CONSTRAINTS } from "./visitors.constants.js";

// =====================  SHARED HELPERS  ====================
const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

// =====================  ENDPOINT SCHEMAS  ==================
/**
 * Zero-Trust validation for POST /api/v1/visitors
 */
export const createVisitorPassSchema = z.object({
  body: z
    .object({
      flatId: objectIdSchema,
      visitorName: z
        .string({ required_error: "Visitor name is required" })
        .trim()
        .min(
          VISITOR_CONSTRAINTS.MIN_NAME_LENGTH,
          `Visitor name must be at least ${VISITOR_CONSTRAINTS.MIN_NAME_LENGTH} characters`
        )
        .max(
          VISITOR_CONSTRAINTS.MAX_NAME_LENGTH,
          `Visitor name cannot exceed ${VISITOR_CONSTRAINTS.MAX_NAME_LENGTH} characters`
        ),
      visitorPhone: z
        .string()
        .trim()
        .max(
          VISITOR_CONSTRAINTS.MAX_PHONE_LENGTH,
          `Visitor phone cannot exceed ${VISITOR_CONSTRAINTS.MAX_PHONE_LENGTH} characters`
        )
        .optional()
        .nullable(),
      vehicleNumber: z
        .string()
        .trim()
        .max(
          VISITOR_CONSTRAINTS.MAX_VEHICLE_LENGTH,
          `Vehicle number cannot exceed ${VISITOR_CONSTRAINTS.MAX_VEHICLE_LENGTH} characters`
        )
        .optional()
        .nullable(),
      visitorType: z.nativeEnum(VISITOR_TYPES, {
        errorMap: () => ({
          message: `Visitor type must be one of: ${Object.values(VISITOR_TYPES).join(", ")}`,
        }),
      }),
      visitorCount: z.coerce
        .number()
        .int("Visitor count must be an integer")
        .min(
          VISITOR_CONSTRAINTS.MIN_VISITOR_COUNT,
          `Visitor count must be at least ${VISITOR_CONSTRAINTS.MIN_VISITOR_COUNT}`
        )
        .max(
          VISITOR_CONSTRAINTS.MAX_VISITOR_COUNT,
          `Visitor count cannot exceed ${VISITOR_CONSTRAINTS.MAX_VISITOR_COUNT}`
        )
        .default(VISITOR_CONSTRAINTS.DEFAULT_VISITOR_COUNT),
      expectedArrivalDate: z
        .string({ required_error: "Expected arrival date is required" })
        .datetime({
          message:
            "Expected arrival date must be a valid ISO 8601 datetime string",
        })
        .or(z.date()),
    })
    .strict({
      message: "Unrecognized client fields detected in pass generation payload",
    }),
});

/**
 * Zero-Trust validation for GET /api/v1/visitors/verify/:passCode
 */
export const verifyVisitorPassSchema = z.object({
  params: z
    .object({
      passCode: z
        .string({ required_error: "Pass code parameter is required" })
        .trim()
        .regex(
          VISITOR_CONSTRAINTS.PASSCODE_REGEX,
          "Pass code must be exactly 6 numeric digits"
        ),
    })
    .strict(),
});

/**
 * Zero-Trust validation for PATCH /api/v1/visitors/:id/check-in
 */
export const checkInVisitorSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
  body: z
    .object({
      vehicleNumber: z
        .string()
        .trim()
        .max(
          VISITOR_CONSTRAINTS.MAX_VEHICLE_LENGTH,
          `Vehicle number cannot exceed ${VISITOR_CONSTRAINTS.MAX_VEHICLE_LENGTH} characters`
        )
        .optional()
        .nullable(),
    })
    .strict({
      message: "Unrecognized client fields detected in check-in payload",
    })
    .default({}),
});

/**
 * Zero-Trust validation for PATCH /api/v1/visitors/:id/check-out
 */
export const checkOutVisitorSchema = z.object({
  params: z
    .object({
      id: objectIdSchema,
    })
    .strict(),
  body: z
    .object({})
    .strict({ message: "Check-out operation accepts no body parameters" })
    .default({}),
});
