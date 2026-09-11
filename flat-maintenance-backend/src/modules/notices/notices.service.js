// =====================  IMPORTS  ==========================
import { Notice } from "./notices.model.js";
import {
  NOTICE_PRIORITY,
  TARGET_AUDIENCE,
  NOTICE_PAGINATION,
} from "./notices.constants.js";
import { Building } from "../../models/building.model.js";
import { Block } from "../../models/block.model.js";
import { Flat } from "../../models/flat.model.js";
import { Owner } from "../../models/owner.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import {
  NOTICE_SECURITY_EVENTS,
  emitNoticeSecurityEvent,
} from "./notices.events.js";

// =====================  SERVICE CLASS  =====================
/**
 * Authoritative Domain Service for Module 18:
 * Society Notices & Announcements (notices).
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 48 & Section 25.
 * Governs publication, hierarchy verification, audience/block targeting,
 * auto-expiration filtering, and retraction workflows.
 */
export class NoticesService {
  /**
   * Publishes an official society bulletin.
   *
   * Security & Domain Invariants:
   * - Building OBAC: Non-SuperAdmins can only publish within assigned buildings.
   * - Hierarchy Integrity: If blockId is supplied, the block must belong strictly to buildingId.
   * - Author Identity: authorUserId is derived server-side from authenticated principal.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {Object} params.input - Validated notice creation payload.
   * @returns {Promise<Object>} Created notice presentation DTO.
   */
  async publishNotice({ actor, input }) {
    const actorUserId = actor._id || actor.id || actor.sub;

    // 1. Verify Role Authority
    if (
      ![ROLES.SUPER_ADMIN, ROLES.BUILDING_ADMIN, ROLES.MANAGER].includes(
        actor.role
      )
    ) {
      throw new ApiError(
        403,
        `Access forbidden: Role '${actor.role}' is not authorized to publish notices`,
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    // 2. Verify Target Building exists and is active
    const building = await Building.findOne({
      _id: input.buildingId,
      isDeleted: false,
    });
    if (!building) {
      throw new ApiError(
        404,
        `Building with ID '${input.buildingId}' not found or has been deactivated`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 3. Enforce Building OBAC Scope for Administrators/Managers
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = (actor.assignedBuildingIds || []).map(String);
      if (!assignedIds.includes(input.buildingId.toString())) {
        throw new ApiError(
          403,
          "Access forbidden: You cannot publish notices outside your assigned building complex",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 4. Verify Block Hierarchy Integrity (if blockId provided)
    if (input.blockId) {
      const block = await Block.findOne({
        _id: input.blockId,
        isDeleted: false,
      });
      if (!block) {
        throw new ApiError(
          404,
          `Block with ID '${input.blockId}' not found or has been deactivated`,
          [],
          ERROR_CODES.NOT_FOUND
        );
      }

      if (block.buildingId.toString() !== input.buildingId.toString()) {
        throw new ApiError(
          400,
          "Hierarchy integrity violation: Block does not belong to the specified building",
          [],
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    // 5. Persist Notice Document (Author strictly derived from token)
    const notice = await Notice.create({
      buildingId: input.buildingId,
      blockId: input.blockId || null,
      authorUserId: actorUserId,
      title: input.title,
      content: input.content,
      category: input.category,
      priority: input.priority || NOTICE_PRIORITY.NORMAL,
      targetAudience: input.targetAudience || TARGET_AUDIENCE.ALL,
      attachmentUrls: input.attachmentUrls || [],
      publishedAt: new Date(),
      expiresAt: input.expiresAt || null,
      isDeleted: false,
    });

    // 6. Emit Security Audit Log Event
    emitNoticeSecurityEvent(NOTICE_SECURITY_EVENTS.NOTICE_PUBLISHED, {
      noticeId: notice._id.toString(),
      buildingId: notice.buildingId.toString(),
      blockId: notice.blockId ? notice.blockId.toString() : null,
      category: notice.category,
      priority: notice.priority,
      targetAudience: notice.targetAudience,
      authorUserId: actorUserId.toString(),
      actorRole: actor.role,
    });

    return notice.toSafeNotice();
  }

  /**
   * Retrieves active community notices tailored to caller's authoritative scope.
   *
   * Business Rules:
   * - Active filter: isDeleted = false, publishedAt <= now, and expiresAt > now (or null).
   * - Audience Segmentation:
   *     * SuperAdmin / BuildingAdmin / Manager: view all audiences in their building(s).
   *     * Operational Staff: view ALL notices in assigned building(s).
   *     * Owners: view ALL and OWNERS_ONLY notices for their building and owned blocks.
   *     * Tenants: view ALL and TENANTS_ONLY notices for their building and leased block.
   * - Block Targeting: Residents only receive notices targeting their specific block or complex-wide.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {Object} params.query - Validated query parameters.
   * @returns {Promise<Object>} Paginated notice presentation envelope.
   */
  async listActiveNotices({ actor, query }) {
    const actorUserId = actor._id || actor.id || actor.sub;
    const now = new Date();

    // 1. Construct Active Temporal Baseline
    const filter = {
      isDeleted: false,
      publishedAt: { $lte: now },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    };

    // 2. Resolve Scope & Audience Boundaries per Actor Persona
    if (actor.role === ROLES.SUPER_ADMIN) {
      // SuperAdmin: Global scope across all complexes
      if (query.buildingId) {
        filter.buildingId = query.buildingId;
      }
      if (query.blockId) {
        filter.blockId = query.blockId;
      }
    } else if ([ROLES.BUILDING_ADMIN, ROLES.MANAGER].includes(actor.role)) {
      // Management: Restricted to assigned building complex portfolio
      const assignedIds = (actor.assignedBuildingIds || []).map(String);
      if (query.buildingId) {
        if (!assignedIds.includes(query.buildingId.toString())) {
          throw new ApiError(
            403,
            "Access forbidden: You cannot view notices outside your assigned building complex",
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = query.buildingId;
      } else {
        filter.buildingId = { $in: assignedIds };
      }

      if (query.blockId) {
        filter.blockId = query.blockId;
      }
    } else if (
      [
        ROLES.ACCOUNTANT,
        ROLES.MAINTENANCE_STAFF,
        ROLES.SECURITY_STAFF,
      ].includes(actor.role)
    ) {
      // Operational Staff: Building-scoped, visible to ALL audience notices
      const assignedIds = (actor.assignedBuildingIds || []).map(String);
      if (query.buildingId) {
        if (!assignedIds.includes(query.buildingId.toString())) {
          throw new ApiError(
            403,
            "Access forbidden: You cannot view notices outside your assigned building complex",
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = query.buildingId;
      } else {
        filter.buildingId = { $in: assignedIds };
      }
      filter.targetAudience = TARGET_AUDIENCE.ALL;

      if (query.blockId) {
        filter.blockId = query.blockId;
      }
    } else if (actor.role === ROLES.OWNER) {
      // Property Owner: Scoped strictly to building & blocks owned
      const ownerProfile = await Owner.findOne({
        userId: actorUserId,
        isDeleted: false,
      });

      if (!ownerProfile || !ownerProfile.flatsOwned?.length) {
        return this._emptyPagination(query);
      }

      const ownerBuildingId = ownerProfile.buildingId.toString();
      if (query.buildingId && query.buildingId.toString() !== ownerBuildingId) {
        throw new ApiError(
          403,
          "Access forbidden: You cannot query notices outside your registered property building",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
      filter.buildingId = ownerProfile.buildingId;

      // Resolve all blocks across owner's flat portfolio
      const flats = await Flat.find({
        _id: { $in: ownerProfile.flatsOwned },
        isDeleted: false,
      }).select("blockId");
      const ownerBlockIds = flats
        .map((f) => f.blockId?.toString())
        .filter(Boolean);

      // Audience restriction: ALL or OWNERS_ONLY
      filter.targetAudience = {
        $in: [TARGET_AUDIENCE.ALL, TARGET_AUDIENCE.OWNERS_ONLY],
      };

      // Block targeting: notice must be building-wide (null) OR match an owned block
      if (query.blockId) {
        if (!ownerBlockIds.includes(query.blockId.toString())) {
          return this._emptyPagination(query);
        }
        filter.blockId = query.blockId;
      } else {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [{ blockId: null }, { blockId: { $in: ownerBlockIds } }],
        });
      }
    } else if (actor.role === ROLES.TENANT) {
      // Resident Tenant: Scoped strictly to building & block leased
      const tenantProfile = await Tenant.findOne({
        userId: actorUserId,
        status: "ACTIVE",
        isDeleted: false,
      });

      if (!tenantProfile) {
        return this._emptyPagination(query);
      }

      const tenantBuildingId = tenantProfile.buildingId.toString();
      if (
        query.buildingId &&
        query.buildingId.toString() !== tenantBuildingId
      ) {
        throw new ApiError(
          403,
          "Access forbidden: You cannot query notices outside your leased residential building",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
      filter.buildingId = tenantProfile.buildingId;

      // Resolve tenant flat and associated block
      const tenantFlat = await Flat.findOne({
        _id: tenantProfile.flatId,
        isDeleted: false,
      }).select("blockId");
      const tenantBlockId = tenantFlat?.blockId
        ? tenantFlat.blockId.toString()
        : null;

      // Audience restriction: ALL or TENANTS_ONLY
      filter.targetAudience = {
        $in: [TARGET_AUDIENCE.ALL, TARGET_AUDIENCE.TENANTS_ONLY],
      };

      // Block targeting: notice must be building-wide (null) OR match leased block
      if (query.blockId) {
        if (tenantBlockId !== query.blockId.toString()) {
          return this._emptyPagination(query);
        }
        filter.blockId = query.blockId;
      } else {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { blockId: null },
            ...(tenantBlockId ? [{ blockId: tenantBlockId }] : []),
          ],
        });
      }
    } else {
      // Unrecognized role
      return this._emptyPagination(query);
    }

    // 3. Optional Specific Attribute Filters
    if (query.category) {
      filter.category = query.category;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }

    // 4. Bounded Pagination Execution
    const page = Math.max(
      1,
      parseInt(query.page, 10) || NOTICE_PAGINATION.DEFAULT_PAGE
    );
    const limit = Math.min(
      NOTICE_PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(query.limit, 10) || NOTICE_PAGINATION.DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    const [notices, total] = await Promise.all([
      Notice.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notice.countDocuments(filter),
    ]);

    return {
      items: notices.map((n) => ({
        _id: n._id.toString(),
        id: n._id.toString(),
        buildingId: n.buildingId.toString(),
        blockId: n.blockId ? n.blockId.toString() : null,
        authorUserId: n.authorUserId.toString(),
        title: n.title,
        content: n.content,
        category: n.category,
        priority: n.priority,
        targetAudience: n.targetAudience,
        attachmentUrls: n.attachmentUrls || [],
        publishedAt: n.publishedAt,
        expiresAt: n.expiresAt,
        isDeleted: n.isDeleted,
        deletedAt: n.deletedAt,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retracts an active society bulletin via soft deletion.
   *
   * Security Invariants:
   * - Retraction restricted to authorized management personnel.
   * - Building OBAC scope enforced for non-SuperAdmins.
   * - Deterministic 404 if already retracted or non-existent.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal.
   * @param {string} params.id - Notice ObjectId string.
   * @returns {Promise<Object>} Retracted notice safe presentation DTO.
   */
  async retractNotice({ actor, id }) {
    const actorUserId = actor._id || actor.id || actor.sub;

    // 1. Role Authority Check
    if (
      ![ROLES.SUPER_ADMIN, ROLES.BUILDING_ADMIN, ROLES.MANAGER].includes(
        actor.role
      )
    ) {
      throw new ApiError(
        403,
        `Access forbidden: Role '${actor.role}' is not authorized to retract notices`,
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    // 2. Load Active Notice Document
    const notice = await Notice.findById(id);
    if (!notice || notice.isDeleted) {
      throw new ApiError(
        404,
        `Notice with ID '${id}' not found or has already been retracted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 3. Enforce Building OBAC Scope
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = (actor.assignedBuildingIds || []).map(String);
      if (!assignedIds.includes(notice.buildingId.toString())) {
        throw new ApiError(
          403,
          "Access forbidden: You cannot retract notices outside your assigned building complex",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 4. Execute Soft-Delete Retraction
    notice.isDeleted = true;
    notice.deletedAt = new Date();
    notice.retractedById = actorUserId;
    await notice.save();

    // 5. Emit Security Audit Event
    emitNoticeSecurityEvent(NOTICE_SECURITY_EVENTS.NOTICE_RETRACTED, {
      noticeId: notice._id.toString(),
      buildingId: notice.buildingId.toString(),
      retractedById: actorUserId.toString(),
      actorRole: actor.role,
    });

    return notice.toSafeNotice();
  }

  /**
   * Generates empty pagination envelope for out-of-scope queries.
   *
   * @private
   */
  _emptyPagination(query) {
    const page = Math.max(
      1,
      parseInt(query?.page, 10) || NOTICE_PAGINATION.DEFAULT_PAGE
    );
    const limit = Math.min(
      NOTICE_PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(query?.limit, 10) || NOTICE_PAGINATION.DEFAULT_LIMIT)
    );
    return {
      items: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}

// =====================  EXPORTS  ===========================
export const noticesService = new NoticesService();
export default noticesService;
