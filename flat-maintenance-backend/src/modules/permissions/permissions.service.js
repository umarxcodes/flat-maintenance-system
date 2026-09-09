// =====================  IMPORTS  ==========================
import { Permission } from "../../models/permission.model.js";
import { CANONICAL_PERMISSIONS_REGISTRY } from "./permissions.constants.js";
import { logger } from "../../utils/logger.util.js";

// =====================  SERVICES  ===========================
/**
 * Principal Permissions Domain Service.
 *
 * Enforces all Canonical Platform Permission Registry invariants:
 * - Maintains the authoritative list of valid granular capability codes.
 * - Enforces deterministic, stable ordering of permission definitions (module ASC, code ASC).
 * - Prevents raw Mongoose document leakage through strict safe projection (toSafePermission).
 * - Provides idempotent synchronization and database seeding for all 44 canonical platform permissions.
 * - Strictly read-only public interface: zero public mutation endpoints exposed.
 */
class PermissionsService {
  /**
   * Retrieves all registered platform permissions in deterministic order.
   *
   * Architectural Invariant:
   * Permissions represent security metadata consumed by RBAC systems and UI matrices.
   * Projections are strictly controlled via `toSafePermission()` to exclude internal
   * Mongoose implementation details (__v) and database internals.
   *
   * @returns {Promise<Array<Object>>} List of serialized public permission objects.
   */
  async getPermissions() {
    const permissions = await Permission.find({}).sort({ module: 1, code: 1 });

    return permissions.map((perm) => perm.toSafePermission());
  }

  /**
   * Internal helper: retrieves a permission by its unique canonical machine code.
   *
   * @param {string} code - Machine-readable permission code token.
   * @returns {Promise<Object|null>} Permission document or null if not found.
   */
  async getPermissionByCode(code) {
    const normalizedCode = String(code).trim().toUpperCase();
    return Permission.findOne({ code: normalizedCode });
  }

  /**
   * Validates whether all provided permission codes exist in the canonical registry.
   *
   * Useful for role modification validation and cross-module referential integrity.
   *
   * @param {Array<string>} codes - Array of permission code strings.
   * @returns {Promise<{ isValid: boolean, invalidCodes: Array<string> }>} Validation result.
   */
  async validatePermissionCodes(codes) {
    if (!Array.isArray(codes) || codes.length === 0) {
      return { isValid: true, invalidCodes: [] };
    }

    const normalizedCodes = [
      ...new Set(codes.map((c) => String(c).trim().toUpperCase())),
    ];
    const registeredPermissions = await Permission.find({
      code: { $in: normalizedCodes },
    }).select("code");

    const validCodeSet = new Set(registeredPermissions.map((p) => p.code));
    const invalidCodes = normalizedCodes.filter(
      (code) => !validCodeSet.has(code)
    );

    return {
      isValid: invalidCodes.length === 0,
      invalidCodes,
    };
  }

  /**
   * Idempotent System Permissions Seeder.
   *
   * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 12 & 34:
   * - Ensures all 44 documented canonical permissions exist in MongoDB with authoritative
   *   module categories and descriptions.
   * - Safe to execute repeatedly without duplicating records or corrupting existing ObjectIds.
   * - Synchronizes descriptions and module classifications to maintain single source of truth (SSOT).
   *
   * @returns {Promise<{ created: number, updated: number, total: number }>} Seeding telemetry.
   */
  async seedPermissions() {
    const existingDocs = await Permission.find({});
    const existingMap = new Map(existingDocs.map((p) => [p.code, p]));

    const bulkOps = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const definition of CANONICAL_PERMISSIONS_REGISTRY) {
      const normalizedCode = definition.code.trim().toUpperCase();
      const existing = existingMap.get(normalizedCode);

      if (!existing) {
        bulkOps.push({
          insertOne: {
            document: {
              code: normalizedCode,
              module: definition.module,
              description: definition.description,
            },
          },
        });
        createdCount += 1;
      } else if (
        existing.module !== definition.module ||
        existing.description !== definition.description
      ) {
        bulkOps.push({
          updateOne: {
            filter: { code: normalizedCode },
            update: {
              $set: {
                module: definition.module,
                description: definition.description,
              },
            },
          },
        });
        updatedCount += 1;
      }
    }

    if (bulkOps.length > 0) {
      await Permission.bulkWrite(bulkOps);
    }

    const total = await Permission.countDocuments();

    logger.info("Canonical permissions synchronization complete", {
      created: createdCount,
      updated: updatedCount,
      total,
    });

    return { created: createdCount, updated: updatedCount, total };
  }
}

// =====================  EXPORTS  ============================
export const permissionsService = new PermissionsService();
export default permissionsService;
