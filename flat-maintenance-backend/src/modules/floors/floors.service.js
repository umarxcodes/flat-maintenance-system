// =====================  IMPORTS  ==========================
import { Floor } from "./floors.model.js";
import { Block } from "../../models/block.model.js";
import { Building } from "../../models/building.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ROLES } from "../../constants/roles.constant.js";
import { logger } from "../../utils/logger.util.js";

// =====================  FLOORS SERVICE  ====================
/**
 * Principal Floor Domain Service.
 *
 * Enforces all residential vertical level lifecycle and hierarchy invariants:
 * - Strict 3-tier physical hierarchy: Building -> Block -> Floor.
 * - Anti-IDOR building-scoped authorization across floor provisioning and listing.
 * - Parent block and building existence and active state verification.
 * - Parent consistency invariant: Floor.buildingId === Block.buildingId.
 * - Upper bound validation against parent Block's totalFloors.
 * - Compound uniqueness enforcement ({ blockId, floorNumber }).
 * - Deterministic sorting by floorNumber ascending.
 * - Safe projection excluding internal soft-delete flags and Mongoose metadata.
 */
class FloorsService {
  /**
   * Provisions a new physical floor within an authorized residential block.
   *
   * Security Boundaries:
   * - SuperAdmin: Global authority across all complexes.
   * - BuildingAdmin: Scoped strictly to complexes within `assignedBuildingIds`.
   * - Parent Block & Building: Must exist and cannot be soft-deleted.
   * - Hierarchy: If buildingId is provided, it must strictly match Block.buildingId.
   * - Upper Bound: floorNumber cannot exceed Block.totalFloors.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {Object} params.input - Validated floor creation payload.
   * @returns {Promise<Object>} Created safe floor representation.
   */
  async createFloor({ actor, input }) {
    const { blockId, floorNumber } = input;

    // 1. Parent Block Reference Integrity & Soft-Delete Guard
    const block = await Block.findOne({
      _id: blockId,
      isDeleted: false,
    });

    if (!block) {
      throw new ApiError(
        404,
        `Referenced block '${blockId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. Parent Hierarchy Consistency Invariant: Floor.buildingId == Block.buildingId
    const buildingId = block.buildingId.toString();

    if (input.buildingId && input.buildingId.toString() !== buildingId) {
      throw new ApiError(
        400,
        "Hierarchy violation: floor buildingId must match parent block buildingId",
        [
          {
            field: "buildingId",
            message: `Building ID '${input.buildingId}' does not match parent block's building '${buildingId}'`,
          },
        ],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 3. Parent Building Existence and Active State Verification
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

    // 4. IDOR Scope Guard: Non-SuperAdmin actors must have building in assignedBuildingIds
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const authorizedBuildingIds = new Set(actor.assignedBuildingIds || []);

      if (!authorizedBuildingIds.has(buildingId)) {
        throw new ApiError(
          403,
          "Access denied: block's building is outside your authorized scope",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 5. Total Floors Upper Bound Invariant
    if (floorNumber > block.totalFloors) {
      throw new ApiError(
        400,
        `Floor number ${floorNumber} exceeds block total floors limit of ${block.totalFloors}`,
        [
          {
            field: "floorNumber",
            message: `Floor number cannot exceed totalFloors (${block.totalFloors}) configured on block`,
          },
        ],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 6. Application-Level Compound Uniqueness Pre-check
    const existing = await Floor.findOne({
      blockId,
      floorNumber,
      isDeleted: false,
    });

    if (existing) {
      throw new ApiError(
        409,
        `Floor number ${floorNumber} already exists in this block`,
        [
          {
            field: "floorNumber",
            message: "Floor number must be unique within the block",
          },
        ],
        ERROR_CODES.CONFLICT
      );
    }

    // 7. Instantiate & Save Floor Document
    const floor = new Floor({
      buildingId,
      blockId,
      floorNumber,
      name: input.name ? input.name.trim() : undefined,
      isDeleted: false,
    });

    try {
      await floor.save();
    } catch (err) {
      // MongoDB E11000 race-condition handling for compound unique index
      if (err.code === 11000) {
        throw new ApiError(
          409,
          `Floor number ${floorNumber} already exists in this block`,
          [
            {
              field: "floorNumber",
              message: "Floor number must be unique within the block",
            },
          ],
          ERROR_CODES.CONFLICT
        );
      }
      throw err;
    }

    logger.info("Residential floor created successfully", {
      floorId: floor._id.toString(),
      blockId: floor.blockId.toString(),
      buildingId: floor.buildingId.toString(),
      floorNumber: floor.floorNumber,
      name: floor.name,
      actorId: actor.id,
    });

    return floor.toSafeFloor();
  }

  /**
   * Retrieves all active floors belonging to a specified block.
   *
   * Security Boundaries:
   * - SuperAdmin: Global access across all building complexes.
   * - Scoped Actors: Parent building must be present in actor's `assignedBuildingIds`.
   * - Soft-deleted floors are strictly excluded.
   * - Deterministic sorting by `floorNumber: 1` ascending.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {string} params.blockId - Target parent block ObjectId.
   * @returns {Promise<Array<Object>>} List of safe floor representations.
   */
  async listFloorsByBlock({ actor, blockId }) {
    // 1. Parent Block Reference Integrity & Soft-Delete Guard
    const block = await Block.findOne({
      _id: blockId,
      isDeleted: false,
    });

    if (!block) {
      throw new ApiError(
        404,
        `Referenced block '${blockId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    const buildingId = block.buildingId.toString();

    // 2. Parent Building Existence & Active State Verification
    const building = await Building.findOne({
      _id: buildingId,
      isDeleted: false,
    });

    if (!building) {
      throw new ApiError(
        404,
        `Parent building '${buildingId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 3. IDOR Scope Guard: Verify caller has permission to view this complex
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const authorizedBuildingIds = new Set(actor.assignedBuildingIds || []);

      if (!authorizedBuildingIds.has(buildingId)) {
        throw new ApiError(
          403,
          "Access denied: block's building is outside your authorized scope",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 4. Query Active Floors in Deterministic Ascending Order
    const floors = await Floor.find({
      blockId,
      isDeleted: false,
    }).sort({ floorNumber: 1 });

    return floors.map((floor) => floor.toSafeFloor());
  }
}

// =====================  EXPORTS  ============================
export const floorsService = new FloorsService();
export default floorsService;
