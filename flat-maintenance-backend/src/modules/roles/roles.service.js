import { Role } from "../../models/role.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ROLE_PERMISSIONS } from "../../constants/permissions.constant.js";
import { ROLE_DESCRIPTIONS, ROLE_ORDER } from "./roles.constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { logger } from "../../utils/logger.util.js";

/**
 * Principal Roles Domain Service.
 *
 * Enforces all Role-Based Access Control (RBAC) definition invariants:
 * - Governs persona-to-permission mapping definitions.
 * - Enforces deterministic, stable ordering of system roles based on hierarchy.
 * - Prevents raw Mongoose document leakage through strict serialization (`toSafeRole`).
 * - Provides idempotent synchronization and database seeding for system roles.
 * - strictly read-only public interface: zero mutation endpoints exposed.
 */
class RolesService {
  /**
   * Retrieves all defined system roles in deterministic hierarchical order.
   *
   * Architectural Invariant:
   * Role definitions represent security metadata consumed by the authorization
   * layer and administrative directory interfaces. Projections are strictly
   * controlled via `toSafeRole()` to exclude internal Mongoose implementation
   * details (__v) and future internal fields.
   *
   * @returns {Promise<Array<Object>>} List of serialized public role objects.
   */
  async getRoles() {
    const roles = await Role.find({ isSystemRole: true });

    // Deterministic sorting: sort by canonical organizational hierarchy order
    const sortedRoles = [...roles].sort((a, b) => {
      const indexA = ROLE_ORDER.indexOf(a.name);
      const indexB = ROLE_ORDER.indexOf(b.name);
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });

    return sortedRoles.map((role) => role.toSafeRole());
  }

  /**
   * Retrieves a single system role definition by its MongoDB ObjectId.
   *
   * Fails closed with standard HTTP 404 NOT_FOUND if the role does not exist.
   *
   * @param {string} id - 24-character hexadecimal MongoDB ObjectId.
   * @returns {Promise<Object>} Serialized public role object.
   * @throws {ApiError} 404 NOT_FOUND if role does not exist.
   */
  async getRoleById(id) {
    const role = await Role.findById(id);

    if (!role) {
      throw new ApiError(
        404,
        `Role with ID '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    return role.toSafeRole();
  }

  /**
   * Internal helper: retrieves a role by its unique canonical name.
   *
   * Useful for internal lookups and module integrations (e.g. associating User.roleId).
   *
   * @param {string} name - Canonical role name from ROLES enum.
   * @returns {Promise<Object|null>} Role Mongoose document or null if not found.
   */
  async getRoleByName(name) {
    const normalizedName = String(name).trim().toUpperCase();
    return Role.findOne({ name: normalizedName });
  }

  /**
   * Idempotent System Role Seeder.
   *
   * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 10 & 14:
   * - Ensures all 8 documented system roles exist in MongoDB with canonical descriptions
   *   and authoritative permission tokens.
   * - Safe to execute repeatedly without duplicating records or corrupting existing ObjectIds.
   * - Synchronizes permission sets to ensure active system roles mirror code definitions.
   *
   * @returns {Promise<{ created: number, updated: number, total: number }>} Seeding telemetry.
   */
  async seedSystemRoles() {
    let createdCount = 0;
    let updatedCount = 0;

    for (const roleName of Object.values(ROLES)) {
      const description =
        ROLE_DESCRIPTIONS[roleName] || `${roleName} operational persona.`;
      const permissions = ROLE_PERMISSIONS[roleName] || [];

      const existingRole = await Role.findOne({ name: roleName });

      if (!existingRole) {
        await Role.create({
          name: roleName,
          description,
          permissions,
          isSystemRole: true,
        });
        createdCount += 1;
      } else {
        // Idempotent update: update permissions and description to maintain SSOT alignment
        existingRole.description = description;
        existingRole.permissions = permissions;
        existingRole.isSystemRole = true;
        await existingRole.save();
        updatedCount += 1;
      }
    }

    const total = await Role.countDocuments({ isSystemRole: true });

    logger.info("System roles synchronization complete", {
      created: createdCount,
      updated: updatedCount,
      total,
    });

    return { created: createdCount, updated: updatedCount, total };
  }
}

export const rolesService = new RolesService();
export default rolesService;
