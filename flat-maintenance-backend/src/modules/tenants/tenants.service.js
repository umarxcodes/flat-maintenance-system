// =====================  IMPORTS  ==========================
import { Tenant } from "./tenants.model.js";
import { User } from "../../models/user.model.js";
import { Building } from "../../models/building.model.js";
import { Flat, FLAT_STATUS } from "../../models/flat.model.js";
import { Owner } from "../../models/owner.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { TENANTS_CONSTANTS } from "./tenants.constants.js";
import { logger } from "../../utils/logger.util.js";

// =====================  SERVICE IMPLEMENTATION  ============
/**
 * Authoritative Tenant Domain Service.
 *
 * Implements business logic and lifecycle state transitions for Module 10: Tenants (tenants).
 *
 * Architectural Invariants:
 * - 4-Way Relationship Graph: User -> Tenant -> Building -> Flat <- Owner.
 * - Single Active Tenancy: Each flat can possess at most one active tenant at any time.
 * - Unique Active Profile: 1:1 active tenant profile per User identity.
 * - Move-Out Transition: Releases the physical Flat unit back to VACANT status upon checkout.
 * - Multi-Tenant OBAC Scope: Non-SuperAdmins can only onboard, query, or checkout tenants within assigned buildings.
 */
class TenantsService {
  /**
   * Onboards a tenant lease contract and links to designated flat and owner.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {Object} params.input - Validated tenant creation payload.
   * @returns {Promise<Object>} Created safe tenant document.
   */
  async createTenant({ actor, input }) {
    const {
      userId,
      buildingId,
      flatId,
      ownerId,
      leaseStartDate,
      leaseEndDate,
      rentAmount,
      securityDeposit,
      emergencyContact,
      policeVerificationStatus,
      status,
    } = input;

    // 1. IDOR / OBAC Scope Guard: Non-SuperAdmin must have target building in assignedBuildingIds
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const authorizedBuildingIds = new Set(actor.assignedBuildingIds || []);

      if (!authorizedBuildingIds.has(buildingId)) {
        throw new ApiError(
          403,
          `Access forbidden: you are not authorized to onboard tenants in building '${buildingId}'`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 2. Target Building Existence and Active State Verification
    const building = await Building.findOne({
      _id: buildingId,
      isDeleted: false,
    });

    if (!building) {
      throw new ApiError(
        404,
        `Referenced building '${buildingId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 3. Target User Existence and Active State Verification
    const user = await User.findOne({
      _id: userId,
      isDeleted: false,
    });

    if (!user) {
      throw new ApiError(
        404,
        `Referenced user '${userId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    if (user.status === ACCOUNT_STATUS.SUSPENDED) {
      throw new ApiError(
        403,
        `Cannot onboard tenant profile for suspended user account '${userId}'`,
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    // 4. Uniqueness Invariant: User must not already possess an active Tenant profile
    const existingActiveTenant = await Tenant.findOne({
      userId,
      status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
      isDeleted: false,
    });

    if (existingActiveTenant) {
      throw new ApiError(
        409,
        `An active tenant profile already exists for user '${userId}'`,
        [],
        ERROR_CODES.CONFLICT
      );
    }

    // 5. Target Flat Existence and Active State Verification
    const flat = await Flat.findOne({
      _id: flatId,
      isDeleted: false,
    });

    if (!flat) {
      throw new ApiError(
        404,
        `Referenced flat '${flatId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 6. Hierarchy Invariant: Flat.buildingId must strictly equal Tenant.buildingId
    if (flat.buildingId.toString() !== buildingId) {
      throw new ApiError(
        400,
        "Hierarchy violation: target flat does not belong to the specified building",
        [
          {
            field: "flatId",
            message: `Flat '${flat.flatNumber}' belongs to building '${flat.buildingId}', which does not match tenant building '${buildingId}'`,
          },
        ],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 7. Target Owner Existence and Active State Verification
    const owner = await Owner.findOne({
      _id: ownerId,
      isDeleted: false,
    });

    if (!owner) {
      throw new ApiError(
        404,
        `Referenced owner '${ownerId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 8. Hierarchy Invariant: Owner.buildingId must strictly equal Tenant.buildingId
    if (owner.buildingId.toString() !== buildingId) {
      throw new ApiError(
        400,
        "Hierarchy violation: referenced owner does not belong to the specified building",
        [
          {
            field: "ownerId",
            message: `Owner belongs to building '${owner.buildingId}', which does not match tenant building '${buildingId}'`,
          },
        ],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 9. Owner ↔ Flat Consistency: Owner must own the target Flat
    const isCurrentOwner =
      flat.currentOwnerId &&
      flat.currentOwnerId.toString() === ownerId.toString();
    const isOwnerPortfolio = (owner.flatsOwned || []).some(
      (id) => id.toString() === flatId.toString()
    );

    if (!isCurrentOwner && !isOwnerPortfolio) {
      throw new ApiError(
        400,
        "Owner-flat mismatch: referenced owner is not the registered owner of the target flat",
        [
          {
            field: "ownerId",
            message: `Owner '${ownerId}' does not own flat '${flat.flatNumber}'`,
          },
        ],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 10. Flat Occupancy Guard: Flat cannot already be occupied by an active tenant
    const targetStatus = status || TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE;

    if (targetStatus === TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE) {
      const activeTenantInFlat = await Tenant.findOne({
        flatId,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
        isDeleted: false,
      });

      if (activeTenantInFlat) {
        throw new ApiError(
          409,
          `Flat '${flat.flatNumber}' is already occupied by active tenant '${activeTenantInFlat._id}'`,
          [],
          ERROR_CODES.CONFLICT
        );
      }

      if (flat.status === FLAT_STATUS.OCCUPIED && flat.currentTenantId) {
        throw new ApiError(
          409,
          `Flat '${flat.flatNumber}' is currently marked as OCCUPIED by tenant '${flat.currentTenantId}'`,
          [],
          ERROR_CODES.CONFLICT
        );
      }
    }

    // 11. Safe Tenant Document Construction (Mass-assignment protection)
    let createdTenant;
    try {
      createdTenant = await Tenant.create({
        userId,
        buildingId,
        flatId,
        ownerId,
        leaseStartDate,
        leaseEndDate,
        rentAmount,
        securityDeposit: securityDeposit || 0,
        emergencyContact: emergencyContact || null,
        policeVerificationStatus:
          policeVerificationStatus ||
          TENANTS_CONSTANTS.POLICE_VERIFICATION_STATUS.PENDING,
        status: targetStatus,
      });
    } catch (err) {
      if (err.code === 11000) {
        throw new ApiError(
          409,
          "Conflict: an active tenant profile already exists for this user or flat",
          [],
          ERROR_CODES.CONFLICT
        );
      }
      throw err;
    }

    // 12. Atomic Flat Occupancy Update
    if (targetStatus === TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE) {
      await Flat.updateOne(
        { _id: flatId },
        {
          $set: {
            currentTenantId: createdTenant._id,
            status: FLAT_STATUS.OCCUPIED,
          },
        }
      );
    }

    // 13. Synchronize User's assignedBuildingIds
    await User.updateOne(
      { _id: userId },
      { $addToSet: { assignedBuildingIds: buildingId } }
    );

    // 14. Security Audit Logging
    logger.security("TENANT_ONBOARDED", {
      tenantId: createdTenant._id.toString(),
      userId,
      buildingId,
      flatId,
      ownerId,
      actorId: actor.id,
    });

    // 15. Return Sanitized and Populated Safe Tenant Document
    const populatedTenant = await Tenant.findById(createdTenant._id)
      .populate("userId", "firstName lastName email phone avatarUrl role")
      .populate("flatId", "flatNumber flatType status areaSqFt")
      .populate("ownerId", "userId");

    return populatedTenant.toSafeTenant();
  }

  /**
   * Retrieves paginated tenant registry with multi-dimensional filters.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {Object} params.query - Validated query parameters.
   * @returns {Promise<Object>} Paginated tenant results.
   */
  async listTenants({ actor, query }) {
    const {
      buildingId,
      flatId,
      status,
      policeVerificationStatus,
      leaseExpiringBefore,
      page,
      limit,
    } = query;
    const filter = { isDeleted: false };

    // 1. OBAC Building Scope Enforcement
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const authorizedBuildingIds = actor.assignedBuildingIds || [];

      if (authorizedBuildingIds.length === 0) {
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      if (buildingId) {
        if (!authorizedBuildingIds.includes(buildingId)) {
          throw new ApiError(
            403,
            `Access forbidden: you are not authorized to view tenants in building '${buildingId}'`,
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = buildingId;
      } else {
        filter.buildingId = { $in: authorizedBuildingIds };
      }
    } else if (buildingId) {
      filter.buildingId = buildingId;
    }

    // 2. Flat Filter Validation & Scope Guard
    if (flatId) {
      const flat = await Flat.findOne({ _id: flatId, isDeleted: false });

      if (!flat) {
        throw new ApiError(
          404,
          `Referenced flat '${flatId}' not found or has been deleted`,
          [],
          ERROR_CODES.NOT_FOUND
        );
      }

      if (
        actor.role !== ROLES.SUPER_ADMIN &&
        !actor.assignedBuildingIds.includes(flat.buildingId.toString())
      ) {
        throw new ApiError(
          403,
          `Access forbidden: you are not authorized to query tenants for flat '${flatId}'`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }

      filter.flatId = flatId;
    }

    // 3. Status Filter
    if (status) {
      filter.status = status;
    }

    // 4. Police Verification Status Filter
    if (policeVerificationStatus) {
      filter.policeVerificationStatus = policeVerificationStatus;
    }

    // 5. Lease Expiration Filter
    if (leaseExpiringBefore) {
      filter.leaseEndDate = { $lte: leaseExpiringBefore };
    }

    // 6. Pagination & Query Execution
    const skip = (page - 1) * limit;
    const total = await Tenant.countDocuments(filter);

    const tenants = await Tenant.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "firstName lastName email phone avatarUrl role")
      .populate("flatId", "flatNumber flatType status areaSqFt")
      .populate("ownerId", "userId");

    return {
      items: tenants.map((tenant) => tenant.toSafeTenant()),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  /**
   * Executes tenant checkout workflow, transitions status, and releases the flat.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {string} params.id - Target Tenant ObjectId.
   * @param {Object} params.input - Optional move-out parameters (moveOutDate).
   * @returns {Promise<Object>} Updated safe tenant document.
   */
  async moveOutTenant({ actor, id, input = {} }) {
    // 1. Tenant Existence Verification
    const tenant = await Tenant.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!tenant) {
      throw new ApiError(
        404,
        `Tenant profile '${id}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. OBAC Scope Guard: Non-SuperAdmin must have tenant.buildingId in assignedBuildingIds
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const authorizedBuildingIds = new Set(actor.assignedBuildingIds || []);

      if (!authorizedBuildingIds.has(tenant.buildingId.toString())) {
        throw new ApiError(
          403,
          `Access forbidden: you are not authorized to manage tenants in building '${tenant.buildingId}'`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 3. Lifecycle State Transition Guard
    if (tenant.status === TENANTS_CONSTANTS.TENANT_STATUS.MOVED_OUT) {
      throw new ApiError(
        400,
        `Tenant '${id}' has already checked out and completed move-out`,
        [],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (tenant.status === TENANTS_CONSTANTS.TENANT_STATUS.TERMINATED) {
      throw new ApiError(
        400,
        `Cannot process move-out for terminated tenant lease '${id}'`,
        [],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 4. Resolve Move-Out Date
    const moveOutDate = input.moveOutDate || new Date();

    // 5. Atomic Tenant Transition & Flat Release
    tenant.status = TENANTS_CONSTANTS.TENANT_STATUS.MOVED_OUT;
    tenant.moveOutDate = moveOutDate;
    await tenant.save();

    await Flat.updateOne(
      { _id: tenant.flatId },
      {
        $set: {
          currentTenantId: null,
          status: FLAT_STATUS.VACANT,
        },
      }
    );

    // 6. Security Audit Logging
    logger.security("TENANT_MOVED_OUT", {
      tenantId: tenant._id.toString(),
      flatId: tenant.flatId.toString(),
      moveOutDate,
      actorId: actor.id,
    });

    // 7. Return Populated Safe Tenant Document
    const populatedTenant = await Tenant.findById(tenant._id)
      .populate("userId", "firstName lastName email phone avatarUrl role")
      .populate("flatId", "flatNumber flatType status areaSqFt")
      .populate("ownerId", "userId");

    return populatedTenant.toSafeTenant();
  }
}

// =====================  EXPORTS  ===========================
export const tenantsService = new TenantsService();
export default tenantsService;
