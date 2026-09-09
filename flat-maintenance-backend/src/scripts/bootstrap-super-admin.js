import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.config.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/role.model.js";
import { ROLES } from "../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../constants/status.constant.js";
import { logger } from "../utils/logger.util.js";

dotenv.config();

/**
 * CLI Command: Provisions the initial Platform Super Admin account.
 *
 * Security Invariants (FR-AUTH-04):
 * - Privileged administrative roles cannot self-register through public APIs.
 * - Idempotent: safe to run multiple times without duplicating or overwriting existing Super Admins.
 * - Password hashed with bcrypt 12 via User model pre-save lifecycle hook.
 * - Bypasses building scope checks (assignedBuildingIds = []).
 */
const bootstrapSuperAdmin = async () => {
  try {
    await connectDB();

    const existingSuperAdmin = await User.findOne({
      role: ROLES.SUPER_ADMIN,
      isDeleted: false,
    });

    if (existingSuperAdmin) {
      console.log(
        `ℹ️ Super Admin account already exists (${existingSuperAdmin.email}). Skipping bootstrap.`
      );
      process.exit(0);
    }

    const email = (process.env.SUPER_ADMIN_EMAIL || "superadmin@society.local")
      .toLowerCase()
      .trim();
    const password =
      process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@Complex2026!";
    const firstName = process.env.SUPER_ADMIN_FIRST_NAME || "System";
    const lastName = process.env.SUPER_ADMIN_LAST_NAME || "SuperAdmin";
    const phone = process.env.SUPER_ADMIN_PHONE || "+10000000000";

    if (password.length < 8) {
      console.error(
        "❌ FATAL: SUPER_ADMIN_PASSWORD must be at least 8 characters long."
      );
      process.exit(1);
    }

    const superAdminRole = await Role.findOne({ name: ROLES.SUPER_ADMIN });

    const superAdmin = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: ROLES.SUPER_ADMIN,
      roleId: superAdminRole ? superAdminRole._id : null,
      status: ACCOUNT_STATUS.ACTIVE,
      assignedBuildingIds: [],
    });

    await superAdmin.save();

    logger.info("Super Admin bootstrap completed successfully", {
      userId: superAdmin._id.toString(),
      email: superAdmin.email,
      role: superAdmin.role,
    });

    console.log(`✅ Super Admin provisioned successfully: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to bootstrap Super Admin:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

bootstrapSuperAdmin();
