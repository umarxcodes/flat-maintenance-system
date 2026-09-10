// =====================  IMPORTS  ==========================
import { Owner } from "./owners.model.js";
import { User } from "../../models/user.model.js";
import { Building } from "../../models/building.model.js";
import { Flat } from "../../models/flat.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { logger } from "../../utils/logger.util.js";

// =====================  SERVICE IMPLEMENTATION  ============
/**
 * Authoritative Owner Domain Service.
 *
 * Implements business logic and security controls for Module 9: Owners (owners).
 *
 * Architectural Invariants:
 * - Decoupled Profile: Links specialization profile to authoritative User identity document.
 * - Unique Active Profile: A User can possess at most one active Owner profile.
 * - Hierarchy Integrity: Every flat in `flatsOwned` must strictly belong to the Owner's `buildingId`.
 * - No Silent Usurpation: Attempting to claim a flat already assigned to an active owner is rejected.
 * - OBAC Scope Boundary: Non-SuperAdmins can only register or query owners in assigned buildings.
 * - Bidirectional Sync: Synchronizes Flat.currentOwnerId with the Owner._id on linkage.
 */
class OwnersService {
  /**
   * Registers an Owner profile and links designated flat deeds.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {Object} params.input - Validated create owner payload.
   * @returns {Promise<Object>} Created safe owner document.
   */
  async createOwner({ actor, input }) {
    const {
      userId,
      buildingId,
      flatsOwned = [],
      emergencyContact,
      idProofType,
      idProofUrl,
      isResidingInBuilding,
    } = input;

    // 1. IDOR / OBAC Scope Guard: Non-SuperAdmin must have target building in assignedBuildingIds
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const authorizedBuildingIds = new Set(actor.assignedBuildingIds || []);

      if (!authorizedBuildingIds.has(buildingId)) {
        throw new ApiError(
          403,
          `Access forbidden: you are not authorized to manage owners in building '${buildingId}'`,
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
        `Cannot register owner profile for suspended user account '${userId}'`,
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    // 4. Uniqueness Invariant: User must not already possess an active Owner profile
    const existingOwner = await Owner.findOne({
      userId,
      isDeleted: false,
    });

    if (existingOwner) {
      throw new ApiError(
        409,
        `An active owner profile already exists for user '${userId}'`,
        [],
        ERROR_CODES.CONFLICT
      );
    }

    // 5. Flat Portfolio Validation and Cross-Building Guard
    const uniqueFlatIds = [
      ...new Set((flatsOwned || []).map((id) => id.toString())),
    ];

    if (uniqueFlatIds.length > 0) {
      const flats = await Flat.find({
        _id: { $in: uniqueFlatIds },
        isDeleted: false,
      });

      if (flats.length !== uniqueFlatIds.length) {
        const foundIds = new Set(flats.map((f) => f._id.toString()));
        const missingIds = uniqueFlatIds.filter((id) => !foundIds.has(id));

        throw new ApiError(
          404,
          `One or more referenced flats not found or deleted: [${missingIds.join(", ")}]`,
          [],
          ERROR_CODES.NOT_FOUND
        );
      }

      // Hierarchy Integrity Check: Flat.buildingId must strictly equal Owner.buildingId
      for (const flat of flats) {
        if (flat.buildingId.toString() !== buildingId) {
          throw new ApiError(
            400,
            "Hierarchy violation: every flat in flatsOwned must belong to the owner's building",
            [
              {
                field: "flatsOwned",
                message: `Flat '${flat.flatNumber}' belongs to building '${flat.buildingId}', which does not match owner building '${buildingId}'`,
              },
            ],
            ERROR_CODES.VALIDATION_ERROR
          );
        }

        // Prevent Silent Ownership Usurpation: Flat cannot already be owned by an active owner
        if (flat.currentOwnerId) {
          const activePriorOwner = await Owner.findOne({
            _id: flat.currentOwnerId,
            isDeleted: false,
          });

          if (activePriorOwner) {
            throw new ApiError(
              409,
              `Flat '${flat.flatNumber}' is already owned by owner '${activePriorOwner._id}'. Ownership transfer requires an explicit transfer workflow.`,
              [],
              ERROR_CODES.CONFLICT
            );
          }
        }
      }
    }

    // 6. Safe Owner Document Construction (Mass-assignment protection)
    let createdOwner;
    try {
      createdOwner = await Owner.create({
        userId,
        buildingId,
        flatsOwned: uniqueFlatIds,
        emergencyContact: emergencyContact || null,
        idProofType: idProofType || null,
        idProofUrl: idProofUrl || null,
        isResidingInBuilding: Boolean(isResidingInBuilding),
      });
    } catch (err) {
      // Catch MongoDB unique index collision under concurrent race conditions
      if (err.code === 11000) {
        throw new ApiError(
          409,
          `An active owner profile already exists for user '${userId}'`,
          [],
          ERROR_CODES.CONFLICT
        );
      }
      throw err;
    }

    // 7. Bidirectional Flat Ownership Synchronization
    if (uniqueFlatIds.length > 0) {
      await Flat.updateMany(
        { _id: { $in: uniqueFlatIds } },
        { $set: { currentOwnerId: createdOwner._id } }
      );
    }

    // 8. Synchronize User's assignedBuildingIds
    await User.updateOne(
      { _id: userId },
      { $addToSet: { assignedBuildingIds: buildingId } }
    );

    // 9. Security Audit Logging
    logger.security("OWNER_REGISTERED", {
      ownerId: createdOwner._id.toString(),
      userId,
      buildingId,
      flatsCount: uniqueFlatIds.length,
      actorId: actor.id,
    });

    // 10. Return Sanitized and Populated Safe Owner Document
    const populatedOwner = await Owner.findById(createdOwner._id)
      .populate("userId", "firstName lastName email phone avatarUrl role")
      .populate("flatsOwned", "flatNumber flatType status areaSqFt");

    return populatedOwner.toSafeOwner();
  }

  /**
   * Retrieves paginated owner registry with multi-dimensional flat/building filters.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {Object} params.query - Validated query parameters.
   * @returns {Promise<Object>} Paginated owner results.
   */
  async listOwners({ actor, query }) {
    const { buildingId, flatId, isResidingInBuilding, page, limit } = query;
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
            `Access forbidden: you are not authorized to view owners in building '${buildingId}'`,
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

      // If non-SuperAdmin, verify the flat belongs to an authorized building
      if (
        actor.role !== ROLES.SUPER_ADMIN &&
        !actor.assignedBuildingIds.includes(flat.buildingId.toString())
      ) {
        throw new ApiError(
          403,
          `Access forbidden: you are not authorized to query owners for flat '${flatId}'`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }

      filter.flatsOwned = flatId;
    }

    // 3. Residency Filter
    if (isResidingInBuilding !== undefined) {
      filter.isResidingInBuilding = isResidingInBuilding;
    }

    // 4. Pagination & Query Execution
    const skip = (page - 1) * limit;
    const total = await Owner.countDocuments(filter);

    const owners = await Owner.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "firstName lastName email phone avatarUrl role")
      .populate("flatsOwned", "flatNumber flatType status areaSqFt");

    return {
      items: owners.map((owner) => owner.toSafeOwner()),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  /**
   * Retrieves single owner profile and property portfolio by ID.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {string} params.id - Target Owner ObjectId.
   * @returns {Promise<Object>} Safe owner profile with property portfolio.
   */
  async getOwnerById({ actor, id }) {
    const owner = await Owner.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate("userId", "firstName lastName email phone avatarUrl role")
      .populate("flatsOwned", "flatNumber flatType status areaSqFt");

    if (!owner) {
      throw new ApiError(
        404,
        `Owner profile '${id}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // OBAC Scope Guard: Non-SuperAdmin must have owner.buildingId in assignedBuildingIds
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const authorizedBuildingIds = new Set(actor.assignedBuildingIds || []);

      if (!authorizedBuildingIds.has(owner.buildingId.toString())) {
        throw new ApiError(
          403,
          `Access forbidden: you are not authorized to view owner profile '${id}'`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    return owner.toSafeOwner();
  }
}

// =====================  EXPORTS  ===========================
export const ownersService = new OwnersService();
export default ownersService;
