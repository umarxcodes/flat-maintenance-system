// =====================  IMPORTS  ==========================
import { Building } from "../../models/building.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ROLES } from "../../constants/roles.constant.js";
import { BUILDINGS_CONSTANTS } from "./buildings.constants.js";
import { logger } from "../../utils/logger.util.js";

// =====================  BUILDING SERVICE  ==================
/**
 * Principal Building Domain Service.
 *
 * Enforces all building complex lifecycle and scope boundary invariants:
 * - SuperAdmin global complex provisioning.
 * - Anti-IDOR building-scoped authorization across detail retrieval and updates.
 * - Deterministic pagination, soft-delete filtering, and unique code verification.
 * - Mass-assignment protection: restricts mutations to documented operational attributes.
 */
class BuildingsService {
  /**
   * Provisions a new residential complex / building.
   * Authorized strictly for SUPER_ADMIN actors.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {Object} params.input - Validated building creation payload.
   * @returns {Promise<Object>} Created safe building representation.
   */
  async createBuilding({ actor, input }) {
    const normalizedCode = input.code.trim().toUpperCase();

    // 1. Uniqueness check against existing non-deleted buildings
    const existing = await Building.findOne({
      code: normalizedCode,
      isDeleted: false,
    });

    if (existing) {
      throw new ApiError(
        409,
        `Building with code '${normalizedCode}' already exists`,
        [{ field: "code", message: "Building code must be unique" }],
        ERROR_CODES.CONFLICT
      );
    }

    // 2. Persist new building
    const building = new Building({
      name: input.name.trim(),
      code: normalizedCode,
      address: {
        street: input.address.street.trim(),
        city: input.address.city.trim(),
        state: input.address.state.trim(),
        postalCode: input.address.postalCode.trim(),
        country: input.address.country.trim(),
      },
      totalBlocks: input.totalBlocks ?? 0,
      totalFlats: input.totalFlats ?? 0,
      status: input.status,
      isDeleted: false,
    });

    await building.save();

    logger.info("Building complex provisioned successfully", {
      buildingId: building._id.toString(),
      code: building.code,
      actorId: actor.id,
    });

    return building.toSafeBuilding();
  }

  /**
   * Retrieves a paginated list of buildings within the caller's authorized scope.
   *
   * OBAC Invariant:
   * - SuperAdmin: Global scope (views all non-deleted buildings).
   * - Other Roles: Restricted strictly to complexes listed in `actor.assignedBuildingIds`.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal.
   * @param {Object} params.query - Validated query parameters.
   * @returns {Promise<{ buildings: Array<Object>, meta: Object }>}
   */
  async listBuildings({ actor, query }) {
    const page = Number(query.page) || BUILDINGS_CONSTANTS.DEFAULT_PAGE;
    const limit = Number(query.limit) || BUILDINGS_CONSTANTS.DEFAULT_LIMIT;
    const { status, search, buildingId } = query;

    const filter = { isDeleted: false };

    // 1. OBAC Building Scope Resolution
    if (actor.role === ROLES.SUPER_ADMIN) {
      if (buildingId) {
        filter._id = buildingId;
      }
    } else {
      const authorizedBuildingIds = actor.assignedBuildingIds || [];

      // If actor has no assigned complexes, immediately return empty results
      if (authorizedBuildingIds.length === 0) {
        return {
          buildings: [],
          meta: {
            page,
            limit,
            totalRecords: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }

      if (buildingId) {
        // Enforce intersection: client cannot request a building outside authorized scope
        if (!authorizedBuildingIds.includes(buildingId)) {
          throw new ApiError(
            403,
            "Cannot filter by a building complex outside your authorized scope",
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter._id = buildingId;
      } else {
        filter._id = { $in: authorizedBuildingIds };
      }
    }

    // 2. Status filter
    if (status) {
      filter.status = status;
    }

    // 3. Search filter
    if (search) {
      const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");
      filter.$or = [{ name: searchRegex }, { code: searchRegex }];
    }

    // 4. Paginated database execution
    const skip = (page - 1) * limit;
    const [totalRecords, buildings] = await Promise.all([
      Building.countDocuments(filter),
      Building.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      buildings: buildings.map((b) => b.toSafeBuilding()),
      meta: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves single building details with OBAC IDOR verification.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal.
   * @param {string} params.id - Target building ObjectId.
   * @returns {Promise<Object>} Safe building representation.
   */
  async getBuildingById({ actor, id }) {
    const building = await Building.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!building) {
      throw new ApiError(
        404,
        `Building with ID '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // IDOR Scope Check: SuperAdmin has global access; other roles must be assigned
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const authorizedIds = new Set(actor.assignedBuildingIds || []);

      if (!authorizedIds.has(id)) {
        throw new ApiError(
          403,
          "Access denied: building is outside your authorized scope",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    return building.toSafeBuilding();
  }

  /**
   * Updates building configuration and metadata.
   *
   * Security Boundaries:
   * - SuperAdmin: Can update any building.
   * - BuildingAdmin: Can update ONLY complexes within their `assignedBuildingIds`.
   * - Mass-assignment protection: strictly limits updates to configurable fields.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal.
   * @param {string} params.id - Target building ObjectId.
   * @param {Object} params.input - Validated update payload.
   * @returns {Promise<Object>} Updated safe building representation.
   */
  async updateBuilding({ actor, id, input }) {
    const building = await Building.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!building) {
      throw new ApiError(
        404,
        `Building with ID '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // IDOR Scope Check
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const authorizedIds = new Set(actor.assignedBuildingIds || []);

      if (!authorizedIds.has(id)) {
        throw new ApiError(
          403,
          "Access denied: building is outside your authorized scope",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // Update code with uniqueness check if code is being altered
    if (input.code !== undefined) {
      const normalizedCode = input.code.trim().toUpperCase();

      if (normalizedCode !== building.code) {
        const existing = await Building.findOne({
          _id: { $ne: id },
          code: normalizedCode,
          isDeleted: false,
        });

        if (existing) {
          throw new ApiError(
            409,
            `Building with code '${normalizedCode}' already exists`,
            [{ field: "code", message: "Building code must be unique" }],
            ERROR_CODES.CONFLICT
          );
        }

        building.code = normalizedCode;
      }
    }

    // Update allowed fields
    if (input.name !== undefined) {
      building.name = input.name.trim();
    }

    if (input.address !== undefined) {
      if (input.address.street !== undefined) {
        building.address.street = input.address.street.trim();
      }
      if (input.address.city !== undefined) {
        building.address.city = input.address.city.trim();
      }
      if (input.address.state !== undefined) {
        building.address.state = input.address.state.trim();
      }
      if (input.address.postalCode !== undefined) {
        building.address.postalCode = input.address.postalCode.trim();
      }
      if (input.address.country !== undefined) {
        building.address.country = input.address.country.trim();
      }
    }

    if (input.totalBlocks !== undefined) {
      building.totalBlocks = input.totalBlocks;
    }

    if (input.totalFlats !== undefined) {
      building.totalFlats = input.totalFlats;
    }

    if (input.status !== undefined) {
      building.status = input.status;
    }

    await building.save();

    logger.info("Building complex updated successfully", {
      buildingId: building._id.toString(),
      code: building.code,
      actorId: actor.id,
    });

    return building.toSafeBuilding();
  }
}

// =====================  EXPORTS  ============================
export const buildingsService = new BuildingsService();
export default buildingsService;
