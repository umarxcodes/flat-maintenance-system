import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.config.js";
import { rolesService } from "../modules/roles/roles.service.js";

dotenv.config();

/**
 * CLI Command: Idempotently seeds and synchronizes the 8 canonical system roles.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 10 & 14.
 *
 * Responsibilities:
 * - Populates SUPER_ADMIN, BUILDING_ADMIN, MANAGER, ACCOUNTANT, MAINTENANCE_STAFF,
 *   SECURITY_STAFF, OWNER, and TENANT in the `roles` collection.
 * - Synchronizes permission tokens and role descriptions.
 * - Idempotent: safe to run during deployment, bootstrapping, or CI pipelines.
 */
const seedRoles = async () => {
  try {
    await connectDB();

    console.log("🌱 Synchronizing canonical system roles...");
    const result = await rolesService.seedSystemRoles();

    console.log(
      `✅ System roles synchronized successfully: ${result.created} created, ${result.updated} updated, ${result.total} total in database.`
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed system roles:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seedRoles();
