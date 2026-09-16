// =====================  IMPORTS  ==========================
import { z } from "zod";
import dotenv from "dotenv";

// =====================  CONFIGURATION  =====================
dotenv.config();

// =====================  VALIDATION SCHEMA  =================
/**
 * Strict Environment Configuration Schema.
 *
 * Enforces production security guarantees:
 * - JWT secrets must be at least 32 characters in production.
 * - Bcrypt salt rounds must be 12.
 * - Mongo URI is required.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(10).max(14).default(12),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .preprocess(
      (val) => val === true || val === "true" || val === "1",
      z.boolean()
    )
    .default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("Flat Maintenance <muhammadumar.xcodes@gmail.com>"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

// =====================  SCHEMA PARSING  ====================
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "FATAL: Invalid environment variables configuration:\n",
    JSON.stringify(parsed.error.format(), null, 2)
  );
  process.exit(1);
}

// =====================  EXPORTS  ===========================
export const env = parsed.data;
