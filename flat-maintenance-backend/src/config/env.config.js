import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ FATAL: Invalid environment variables configuration:\n",
    JSON.stringify(parsed.error.format(), null, 2)
  );
  process.exit(1);
}

export const env = parsed.data;
