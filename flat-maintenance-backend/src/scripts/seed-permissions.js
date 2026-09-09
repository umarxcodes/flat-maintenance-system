// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.config.js";
import { permissionsService } from "../modules/permissions/permissions.service.js";

// =====================  CONFIGURATION  =====================
dotenv.config();

// =====================  SEED LOGIC  =======================
/**
 * CLI Command: Idempotently seeds and synchronizes the 44 canonical platform permissions.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 12 & 34.
 *
 * Responsibilities:
 * - Populates the `permissions` collection with all documented capability tokens.
 * - Categorizes each permission under its canonical domain module.
 * - Synchronizes permission descriptions and classifications.
 * - Idempotent: safe to run during deployment, bootstrapping, or CI pipelines.
 */
const seedPermissions = async () => {
  try {
    await connectDB();

    console.log("[INFO] Synchronizing canonical platform permissions...");
    const result = await permissionsService.seedPermissions();

    console.log(
      `[SUCCESS] Platform permissions synchronized successfully: ${result.created} created, ${result.updated} updated, ${result.total} total in database.`
    );
    process.exit(0);
  } catch (error) {
    console.error("[ERROR] Failed to seed platform permissions:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// =====================  EXECUTION  ========================
seedPermissions();
