// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { Flat, FLAT_STATUS, FLAT_TYPES } from "../../models/flat.model.js";
import { Block } from "../../models/block.model.js";
import { Floor } from "../../models/floor.model.js";
import { Building } from "../../models/building.model.js";
import { Owner } from "../../models/owner.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { logger } from "../../utils/logger.util.js";
import { FLATS_CONSTANTS } from "./flats.constants.js";
import { TENANTS_CONSTANTS } from "../tenants/tenants.constants.js";

// =====================  SERVICE IMPLEMENTATION  ============
/**
 * Flats Domain Service.
 *
 * Implements Module 8 architectural, hierarchical, and OBAC rules
 * sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 38.
 */
export class FlatsService {
  /**
   * Provisions a new physical flat unit within a validated 4-tier structural hierarchy.
   *
   * Architectural Invariants:
   * 1. Hierarchy Validation: Floor -> Block -> Building must strictly match.
   * 2. Compound Uniqueness: { blockId, flatNumber } prevents duplicate unit numbers in a block.
   * 3. Building Scope (OBAC): Non-SuperAdmin must be assigned to the building complex.
   * 4. Auto-increments Building.totalFlats counter.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {Object} params.input - Validated flat creation payload.
   * @returns {Promise<Object>} Safe flat presentation document.
   */
  async createFlat({ actor, input }) {
    const { blockId, floorId, flatNumber, areaSqFt, flatType, status } = input;

    // 1. Verify Block existence & active state
    const block = await Block.findOne({ _id: blockId, isDeleted: false });
    if (!block) {
      throw new ApiError(
        404,
        `Referenced block '${blockId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. Verify Floor existence & active state
    const floor = await Floor.findOne({ _id: floorId, isDeleted: false });
    if (!floor) {
      throw new ApiError(
        404,
        `Referenced floor '${floorId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 3. Hierarchy Invariant: Floor.blockId must strictly match Block._id
    if (floor.blockId.toString() !== block._id.toString()) {
      throw new ApiError(
        400,
        "Hierarchy violation: the referenced floor does not belong to the referenced block",
        [
          {
            field: "floorId",
            message: `Floor '${floorId}' belongs to block '${floor.blockId}', not block '${blockId}'`,
          },
        ],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 4. Resolve and verify Building ID consistency
    const buildingId = block.buildingId.toString();
    if (input.buildingId && input.buildingId.toString() !== buildingId) {
      throw new ApiError(
        400,
        "Hierarchy violation: provided buildingId does not match block's building",
        [
          {
            field: "buildingId",
            message: `Block belongs to building '${buildingId}', but '${input.buildingId}' was specified`,
          },
        ],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 5. OBAC Scope Guard: Non-SuperAdmin must have buildingId in assignedBuildingIds
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const authorizedBuildingIds = new Set(
        (actor.assignedBuildingIds || []).map(String)
      );

      if (!authorizedBuildingIds.has(buildingId)) {
        throw new ApiError(
          403,
          `Access forbidden: you are not authorized to provision flats in building '${buildingId}'`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 6. Compound Uniqueness Precondition Check
    const existingFlat = await Flat.findOne({
      blockId,
      flatNumber: flatNumber.trim(),
      isDeleted: false,
    });

    if (existingFlat) {
      throw new ApiError(
        409,
        `A flat with number '${flatNumber}' already exists in block '${block.name}'`,
        [
          {
            field: "flatNumber",
            message: `Flat number '${flatNumber}' is already registered in block '${blockId}'`,
          },
        ],
        ERROR_CODES.CONFLICT
      );
    }

    // 7. Provision Flat Unit
    let createdFlat;
    try {
      createdFlat = await Flat.create({
        buildingId,
        blockId,
        floorId,
        flatNumber: flatNumber.trim(),
        areaSqFt,
        flatType: flatType || FLAT_TYPES.TWO_BHK,
        status: status || FLAT_STATUS.VACANT,
      });
    } catch (err) {
      if (err.code === 11000) {
        throw new ApiError(
          409,
          `A flat with number '${flatNumber}' already exists in this block`,
          [],
          ERROR_CODES.CONFLICT
        );
      }
      throw err;
    }

    // 8. Update aggregate counter on Building
    await Building.updateOne({ _id: buildingId }, { $inc: { totalFlats: 1 } });

    // 9. Security Audit Telemetry
    logger.security("FLAT_PROVISIONED", {
      flatId: createdFlat._id.toString(),
      buildingId,
      blockId,
      floorId,
      flatNumber: createdFlat.flatNumber,
      actorId: actor.id || actor._id,
    });

    return createdFlat.toSafeFlat();
  }

  /**
   * Queries and lists flats with multi-tenant filtering, pagination, and role-based scoping.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {Object} params.query - Query filters and pagination params.
   * @returns {Promise<Object>} Paginated safe flats presentation payload.
   */
  async listFlats({ actor, query = {} }) {
    const actorUserId = actor._id || actor.id || actor.sub;
    const filter = { isDeleted: false };

    // 1. Role-based tenancy scoping (OBAC)
    if (actor.role === ROLES.OWNER) {
      const owner = await Owner.findOne({
        userId: actorUserId,
        isDeleted: false,
      });
      filter._id = { $in: owner ? owner.flatsOwned : [] };
    } else if (actor.role === ROLES.TENANT) {
      const tenant = await Tenant.findOne({
        userId: actorUserId,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
        isDeleted: false,
      });
      filter._id = tenant ? tenant.flatId : new mongoose.Types.ObjectId();
    } else if (
      actor.role === ROLES.BUILDING_ADMIN ||
      actor.role === ROLES.MANAGER
    ) {
      const assignedIds = (actor.assignedBuildingIds || []).map(String);
      if (query.buildingId) {
        if (!assignedIds.includes(query.buildingId.toString())) {
          throw new ApiError(
            403,
            `Access forbidden: building '${query.buildingId}' is outside your authorized scope`,
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = query.buildingId;
      } else {
        filter.buildingId = { $in: assignedIds };
      }
    } else if (actor.role === ROLES.SUPER_ADMIN) {
      if (query.buildingId) {
        filter.buildingId = query.buildingId;
      }
    }

    // 2. Query Filters
    if (query.blockId) filter.blockId = query.blockId;
    if (query.floorId) filter.floorId = query.floorId;
    if (query.status) filter.status = query.status;
    if (query.flatType) filter.flatType = query.flatType;

    // 3. Pagination & Execution
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const total = await Flat.countDocuments(filter);
    const flats = await Flat.find(filter)
      .sort({ flatNumber: 1 })
      .skip(skip)
      .limit(limit)
      .populate("buildingId", "name code")
      .populate("blockId", "name code")
      .populate("floorId", "floorNumber name")
      .populate("currentOwnerId", "userId")
      .populate("currentTenantId", "userId leaseEndDate");

    return {
      items: flats.map((f) => f.toSafeFlat()),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  /**
   * Retrieves single flat unit specifications and tenancy references with OBAC validation.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal.
   * @param {string} params.id - Flat ObjectId string.
   * @returns {Promise<Object>} Safe populated flat document.
   */
  async getFlatById({ actor, id }) {
    const actorUserId = actor._id || actor.id || actor.sub;

    const flat = await Flat.findOne({ _id: id, isDeleted: false })
      .populate("buildingId", "name code address")
      .populate("blockId", "name code totalFloors")
      .populate("floorId", "floorNumber name")
      .populate("currentOwnerId", "userId emergencyContact")
      .populate(
        "currentTenantId",
        "userId leaseStartDate leaseEndDate rentAmount"
      );

    if (!flat) {
      throw new ApiError(
        404,
        `Flat unit with ID '${id}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // OBAC Scoping: Verify actor authorization to view this specific flat
    if (actor.role === ROLES.OWNER) {
      const owner = await Owner.findOne({
        userId: actorUserId,
        isDeleted: false,
      });
      const ownsFlat = (owner?.flatsOwned || []).some(
        (fId) => fId.toString() === id
      );
      if (!ownsFlat) {
        throw new ApiError(
          403,
          "Access forbidden: you do not hold ownership deeds for this flat unit",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    } else if (actor.role === ROLES.TENANT) {
      const tenant = await Tenant.findOne({
        userId: actorUserId,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
        isDeleted: false,
      });
      if (!tenant || tenant.flatId.toString() !== id) {
        throw new ApiError(
          403,
          "Access forbidden: you do not hold an active tenancy lease for this flat unit",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    } else if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = new Set(
        (actor.assignedBuildingIds || []).map(String)
      );
      const bId = flat.buildingId._id
        ? flat.buildingId._id.toString()
        : flat.buildingId.toString();

      if (!assignedIds.has(bId)) {
        throw new ApiError(
          403,
          "Access forbidden: flat belongs to a complex outside your assigned scope",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    return flat.toSafeFlat();
  }

  /**
   * Transitions flat occupancy state with lifecycle validation.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal.
   * @param {string} params.id - Flat ObjectId string.
   * @param {string} params.status - Desired target status.
   * @returns {Promise<Object>} Safe updated flat document.
   */
  async updateFlatStatus({ actor, id, status }) {
    const flat = await Flat.findOne({ _id: id, isDeleted: false });
    if (!flat) {
      throw new ApiError(
        404,
        `Flat unit with ID '${id}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // OBAC Check: Non-SuperAdmin must be assigned to the flat's building
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = new Set(
        (actor.assignedBuildingIds || []).map(String)
      );
      if (!assignedIds.has(flat.buildingId.toString())) {
        throw new ApiError(
          403,
          "Access forbidden: you are not authorized to update flats in this complex",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // Lifecycle Transition Validation
    if (flat.status === status) {
      return flat.toSafeFlat();
    }

    const allowedTransitions =
      FLATS_CONSTANTS.ALLOWED_STATUS_TRANSITIONS[flat.status] || [];

    if (!allowedTransitions.includes(status)) {
      throw new ApiError(
        400,
        `Invalid status transition from '${flat.status}' to '${status}'`,
        [
          {
            field: "status",
            message: `Allowed transitions from '${flat.status}' are: ${allowedTransitions.join(", ")}`,
          },
        ],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Invariant: Cannot manually mark VACANT if an active tenant is still legally bound
    if (status === FLAT_STATUS.VACANT && flat.currentTenantId) {
      throw new ApiError(
        400,
        "Cannot mark flat as VACANT while active tenant lease is still bound. Process tenant move-out first.",
        [],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    flat.status = status;
    await flat.save();

    logger.security("FLAT_STATUS_UPDATED", {
      flatId: flat._id.toString(),
      buildingId: flat.buildingId.toString(),
      previousStatus: flat.status,
      newStatus: status,
      actorId: actor.id || actor._id,
    });

    return flat.toSafeFlat();
  }
}

// =====================  EXPORTS  ===========================
export const flatsService = new FlatsService();
export default flatsService;
