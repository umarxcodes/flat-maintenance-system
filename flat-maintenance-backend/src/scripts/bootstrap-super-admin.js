// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.config.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/role.model.js";
import { ROLES } from "../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../constants/status.constant.js";
import { logger } from "../utils/logger.util.js";

// =====================  CONFIGURATION  =====================
dotenv.config();

// =====================  BOOTSTRAP LOGIC  ==================
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

    const targetEmail = (
      process.env.SUPER_ADMIN_EMAIL || "superadmin@society.local"
    )
      .toLowerCase()
      .trim();
    const password =
      process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@Complex2026!";
    const firstName = process.env.SUPER_ADMIN_FIRST_NAME || "System";
    const lastName = process.env.SUPER_ADMIN_LAST_NAME || "SuperAdmin";
    const phone = process.env.SUPER_ADMIN_PHONE || "+10000000000";

    if (password.length < 8) {
      console.error(
        "[ERROR] FATAL: SUPER_ADMIN_PASSWORD must be at least 8 characters long."
      );
      process.exit(1);
    }

    const superAdminRole = await Role.findOne({ name: ROLES.SUPER_ADMIN });

    // 1. Check if user with target email already exists
    let superAdmin = await User.findOne({
      email: targetEmail,
      isDeleted: false,
    });

    if (superAdmin) {
      superAdmin.firstName = firstName;
      superAdmin.lastName = lastName;
      superAdmin.password = password;
      superAdmin.phone = phone;
      superAdmin.role = ROLES.SUPER_ADMIN;
      superAdmin.status = ACCOUNT_STATUS.ACTIVE;
      if (superAdminRole) {
        superAdmin.roleId = superAdminRole._id;
      }
      await superAdmin.save();

      logger.info("Super Admin updated successfully", {
        userId: superAdmin._id.toString(),
        email: superAdmin.email,
        role: superAdmin.role,
      });

      console.log(`[SUCCESS] Super Admin updated successfully: ${targetEmail}`);
      process.exit(0);
    }

    // 2. Check if a placeholder Super Admin exists (e.g. default placeholder)
    const placeholderAdmin = await User.findOne({
      role: ROLES.SUPER_ADMIN,
      isDeleted: false,
    });

    if (placeholderAdmin && placeholderAdmin.email !== targetEmail) {
      placeholderAdmin.firstName = firstName;
      placeholderAdmin.lastName = lastName;
      placeholderAdmin.email = targetEmail;
      placeholderAdmin.password = password;
      placeholderAdmin.phone = phone;
      if (superAdminRole) {
        placeholderAdmin.roleId = superAdminRole._id;
      }
      await placeholderAdmin.save();

      logger.info("Placeholder Super Admin migrated to personal account", {
        userId: placeholderAdmin._id.toString(),
        email: placeholderAdmin.email,
        role: placeholderAdmin.role,
      });

      console.log(`[SUCCESS] Super Admin account migrated to: ${targetEmail}`);
      process.exit(0);
    }

    // 3. Provision new Super Admin
    superAdmin = new User({
      firstName,
      lastName,
      email: targetEmail,
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

    console.log(
      `[SUCCESS] Super Admin provisioned successfully: ${targetEmail}`
    );
    process.exit(0);
  } catch (error) {
    console.error("[ERROR] Failed to bootstrap Super Admin:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// =====================  EXECUTION  ========================
bootstrapSuperAdmin();
