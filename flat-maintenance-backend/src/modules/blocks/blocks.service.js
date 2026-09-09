// =====================  IMPORTS  ==========================
import { Block } from "./blocks.model.js";
import { Building } from "../../models/building.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ROLES } from "../../constants/roles.constant.js";
import { logger } from "../../utils/logger.util.js";

// =====================  BLOCK SERVICE  ====================
/**
 * Principal Block Domain Service.
 *
 * Enforces all residential block/tower lifecycle and scope boundary invariants:
 * - Anti-IDOR building-scoped authorization across block provisioning and listing.
 * - Parent building existence and active state verification.
 * - Compound uniqueness enforcement ({ buildingId, name }).
 * - Synchronized building structural counters (totalBlocks increment).
 * - Safe projection excluding internal soft-delete flags and Mongoose metadata.
 */
class BlocksService {
  /**
   * Provisions a new architectural block within an authorized building complex.
   *
   * Security Boundaries:
   * - SuperAdmin: Global authority across all building complexes.
   * - BuildingAdmin: Scoped strictly to complexes within `assignedBuildingIds`.
   * - Parent Building: Must exist and cannot be soft-deleted.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {Object} params.input - Validated block creation payload.
   * @returns {Promise<Object>} Created safe block representation.
   */
  async createBlock({ actor, input }) {
    const { buildingId } = input;

    // 1. IDOR Scope Guard: Non-SuperAdmin actors must have building in assignedBuildingIds
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const authorizedBuildingIds = new Set(actor.assignedBuildingIds || []);

      if (!authorizedBuildingIds.has(buildingId)) {
        throw new ApiError(
          403,
          "Access denied: building is outside your authorized scope",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 2. Parent Building Reference Integrity & Soft-Delete Guard
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

    const trimmedName = input.name.trim();

    // 3. Application-Level Uniqueness Pre-check
    const existing = await Block.findOne({
      buildingId,
      name: trimmedName,
      isDeleted: false,
    });

    if (existing) {
      throw new ApiError(
        409,
        `Block with name '${trimmedName}' already exists in this building`,
        [
          {
            field: "name",
            message: "Block name must be unique within the building",
          },
        ],
        ERROR_CODES.CONFLICT
      );
    }

    // 4. Instantiate & Save Block Document
    const block = new Block({
      buildingId,
      name: trimmedName,
      code: input.code ? input.code.trim().toUpperCase() : null,
      totalFloors: input.totalFloors,
      isDeleted: false,
    });

    try {
      await block.save();
    } catch (err) {
      // MongoDB E11000 race-condition handling for compound unique index
      if (err.code === 11000) {
        throw new ApiError(
          409,
          `Block with name '${trimmedName}' already exists in this building`,
          [
            {
              field: "name",
              message: "Block name must be unique within the building",
            },
          ],
          ERROR_CODES.CONFLICT
        );
      }
      throw err;
    }

    // 5. Atomically update parent building's structural totalBlocks counter
    await Building.findByIdAndUpdate(buildingId, {
      $inc: { totalBlocks: 1 },
    });

    logger.info("Residential block created successfully", {
      blockId: block._id.toString(),
      buildingId: block.buildingId.toString(),
      name: block.name,
      actorId: actor.id,
    });

    return block.toSafeBlock();
  }

  /**
   * Retrieves all active blocks belonging to a specified building complex.
   *
   * Security Boundaries:
   * - SuperAdmin: Global access across all building complexes.
   * - Scoped Actors: Building must be present in actor's `assignedBuildingIds`.
   * - Soft-deleted blocks are strictly excluded.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {string} params.buildingId - Target parent building ObjectId.
   * @returns {Promise<Array<Object>>} List of safe block representations.
   */
  async listBlocksByBuilding({ actor, buildingId }) {
    // 1. IDOR Scope Guard: Verify caller has permission to view this building
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const authorizedBuildingIds = new Set(actor.assignedBuildingIds || []);

      if (!authorizedBuildingIds.has(buildingId)) {
        throw new ApiError(
          403,
          "Access denied: building is outside your authorized scope",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 2. Parent Building Existence and Active State Verification
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

    // 3. Query Active Blocks
    const blocks = await Block.find({
      buildingId,
      isDeleted: false,
    }).sort({ name: 1 });

    return blocks.map((block) => block.toSafeBlock());
  }
}

// =====================  EXPORTS  ============================
export const blocksService = new BlocksService();
export default blocksService;
