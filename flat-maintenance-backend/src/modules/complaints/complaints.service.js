// =====================  IMPORTS  ==========================
import crypto from "node:crypto";
import mongoose from "mongoose";
import { Complaint } from "./complaints.model.js";
import { Building } from "../../models/building.model.js";
import { Flat } from "../../models/flat.model.js";
import { Owner } from "../../models/owner.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { TENANTS_CONSTANTS } from "../tenants/tenants.constants.js";
import {
  COMPLAINT_STATUS,
  COMPLAINT_LIMITS,
  COMPLAINTS_PAGINATION,
} from "./complaints.constants.js";
import {
  validateComplaintTransition,
  COMPLAINT_MANAGEMENT_ROLES,
} from "./complaints.state-machine.js";
import {
  emitComplaintSecurityEvent,
  COMPLAINT_SECURITY_EVENTS,
} from "./complaints.events.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";

// =====================  DOMAIN SERVICE  ====================
/**
 * Authoritative Domain Service for Module 16: Complaints & SLA Ticket Management.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 46, Section 70.4, and Section 14.
 */
export class ComplaintService {
  /**
   * Generates a unique, sequential complaint identifier format:
   * CMP-YYYY-XXXX (e.g. CMP-2026-0012)
   *
   * @private
   * @returns {Promise<string>} Unique complaint number.
   */
  async _generateComplaintNumber() {
    const year = new Date().getFullYear();
    const count = await Complaint.countDocuments();
    const seq = String(count + 1).padStart(4, "0");
    let candidate = `CMP-${year}-${seq}`;

    const exists = await Complaint.findOne({ complaintNumber: candidate });
    if (exists) {
      const rand = crypto.randomInt(1000, 9999);
      candidate = `CMP-${year}-${rand}`;
    }

    return candidate;
  }

  /**
   * Asserts resident's legitimate relationship to the target flat.
   *
   * @param {string} flatId - Target flat unit ID.
   * @param {string} buildingId - Target building complex ID.
   * @param {Object} actor - Authenticated user JWT object.
   * @private
   */
  async _assertResidentFlatAccess(flatId, buildingId, actor) {
    // SuperAdmin and BuildingAdmin bypass resident flat check
    if (
      actor.role === ROLES.SUPER_ADMIN ||
      actor.role === ROLES.BUILDING_ADMIN
    ) {
      return;
    }

    const actorUserId = actor._id || actor.id;

    if (actor.role === ROLES.TENANT) {
      const tenant = await Tenant.findOne({
        userId: actorUserId,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
        isDeleted: false,
      });

      if (!tenant || tenant.flatId.toString() !== flatId.toString()) {
        throw new ApiError(
          403,
          `Access forbidden: You do not have an active lease for flat '${flatId}'`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }

      if (tenant.buildingId.toString() !== buildingId.toString()) {
        throw new ApiError(
          400,
          "Hierarchy mismatch: Referenced flat does not belong to the specified building complex",
          [],
          ERROR_CODES.BAD_REQUEST
        );
      }
      return;
    }

    if (actor.role === ROLES.OWNER) {
      const owner = await Owner.findOne({
        userId: actorUserId,
        isDeleted: false,
      });

      if (
        !owner ||
        !owner.flatsOwned.some((f) => f.toString() === flatId.toString())
      ) {
        throw new ApiError(
          403,
          `Access forbidden: You do not own flat '${flatId}'`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }

      if (owner.buildingId.toString() !== buildingId.toString()) {
        throw new ApiError(
          400,
          "Hierarchy mismatch: Referenced flat does not belong to the specified building complex",
          [],
          ERROR_CODES.BAD_REQUEST
        );
      }
      return;
    }

    // Unrelated roles cannot file resident grievances
    throw new ApiError(
      403,
      `Access forbidden: Role '${actor.role}' is not authorized to file resident grievances`,
      [],
      ERROR_CODES.FORBIDDEN
    );
  }

  /**
   * Files a society grievance complaint with resident anti-IDOR validation.
   * POST /api/v1/complaints
   *
   * @param {Object} payload - Validated request body.
   * @param {Object} actor - Authenticated JWT user object.
   * @returns {Promise<Object>} Created complaint DTO.
   */
  async createComplaint(payload, actor) {
    const { buildingId, flatId, type, title, description } = payload;
    const actorUserId = actor._id || actor.id;

    // 1. Verify Building exists and is active
    const building = await Building.findOne({
      _id: buildingId,
      isDeleted: false,
    });
    if (!building) {
      throw new ApiError(
        404,
        `Building complex '${buildingId}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. Verify Flat exists and belongs to target Building
    const flat = await Flat.findOne({
      _id: flatId,
      isDeleted: false,
    });
    if (!flat) {
      throw new ApiError(
        404,
        `Flat unit '${flatId}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    if (flat.buildingId.toString() !== buildingId.toString()) {
      throw new ApiError(
        400,
        "Hierarchy mismatch: Flat does not belong to the specified building complex",
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 3. Verify Resident Flat-Level Authorization (Anti-IDOR)
    await this._assertResidentFlatAccess(flatId, buildingId, actor);

    // 4. Concurrency-Safe Identifier Generation & Document Insertion
    let complaint;
    const maxRetries = COMPLAINT_LIMITS.MAX_RETRY_ATTEMPTS;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const complaintNumber = await this._generateComplaintNumber();

      try {
        complaint = await Complaint.create({
          complaintNumber,
          buildingId,
          flatId,
          createdById: actorUserId,
          type,
          title,
          description,
          status: COMPLAINT_STATUS.OPEN,
        });
        break;
      } catch (err) {
        if (
          err.code === 11000 &&
          err.keyPattern &&
          err.keyPattern.complaintNumber
        ) {
          if (attempt === maxRetries - 1) {
            throw err;
          }
          await new Promise((resolve) =>
            setTimeout(resolve, 20 + Math.random() * 50)
          );
          continue;
        }
        throw err;
      }
    }

    // 5. Security Audit Telemetry
    emitComplaintSecurityEvent(COMPLAINT_SECURITY_EVENTS.COMPLAINT_CREATED, {
      complaintId: complaint._id.toString(),
      complaintNumber: complaint.complaintNumber,
      buildingId: buildingId.toString(),
      flatId: flatId.toString(),
      type,
      actorId: actorUserId.toString(),
      actorRole: actor.role,
    });

    return complaint.toSafeComplaint();
  }

  /**
   * Retrieves role-filtered list of complaints with pagination.
   * GET /api/v1/complaints
   *
   * @param {Object} query - Request query parameters.
   * @param {Object} actor - Authenticated JWT user object.
   * @returns {Promise<Object>} Paginated complaint list and envelope.
   */
  async listComplaints(query, actor) {
    const { status, type, buildingId, flatId } = query;
    const page = Number(query.page) || COMPLAINTS_PAGINATION.DEFAULT_PAGE;
    const limit = Number(query.limit) || COMPLAINTS_PAGINATION.DEFAULT_LIMIT;
    const actorUserId = actor._id || actor.id;
    const filter = {};

    // 1. Role-Based Resource Scoping (Anti-IDOR at query boundary)
    if (actor.role === ROLES.TENANT) {
      const tenant = await Tenant.findOne({
        userId: actorUserId,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
        isDeleted: false,
      });
      filter.flatId = tenant ? tenant.flatId : new mongoose.Types.ObjectId();
    } else if (actor.role === ROLES.OWNER) {
      const owner = await Owner.findOne({
        userId: actorUserId,
        isDeleted: false,
      });
      filter.flatId = { $in: owner ? owner.flatsOwned : [] };
    } else if (
      actor.role === ROLES.MANAGER ||
      actor.role === ROLES.BUILDING_ADMIN
    ) {
      const assignedIds = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );
      if (buildingId) {
        if (!assignedIds.includes(buildingId.toString())) {
          throw new ApiError(
            403,
            `Access forbidden: Building complex '${buildingId}' is outside your authorized management scope`,
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = buildingId;
      } else {
        filter.buildingId = { $in: assignedIds };
      }
    } else if (actor.role === ROLES.MAINTENANCE_STAFF) {
      // Per Section 34 & 129: Complaints domain has no assignedStaffId field; returns empty list
      filter._id = null;
    } else if (actor.role === ROLES.SUPER_ADMIN) {
      if (buildingId) {
        filter.buildingId = buildingId;
      }
    }

    // 2. Query Filters
    if (status) {
      filter.status = status;
    }
    if (type) {
      filter.type = type;
    }
    if (flatId) {
      if (
        actor.role === ROLES.SUPER_ADMIN ||
        actor.role === ROLES.BUILDING_ADMIN ||
        actor.role === ROLES.MANAGER
      ) {
        filter.flatId = flatId;
      }
    }

    // 3. Pagination Execution
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.find(filter)
        .populate("createdById", "firstName lastName email role")
        .populate("resolvedById", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map((c) => c.toSafeComplaint()),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Resolves a society grievance complaint with formal notes.
   * PATCH /api/v1/complaints/:id/resolve
   *
   * @param {string} id - Complaint document ID.
   * @param {Object} payload - Validated request body ({ resolutionNotes }).
   * @param {Object} actor - Authenticated JWT user object.
   * @returns {Promise<Object>} Resolved complaint DTO.
   */
  async resolveComplaint(id, payload, actor) {
    const { resolutionNotes } = payload;
    const actorUserId = actor._id || actor.id;

    // 1. Role Authority Guard: only Manager, BuildingAdmin, SuperAdmin can resolve
    if (!COMPLAINT_MANAGEMENT_ROLES.includes(actor.role)) {
      throw new ApiError(
        403,
        `Access forbidden: Role '${actor.role}' is not authorized to resolve complaints`,
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    // 2. Load Complaint
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      throw new ApiError(
        404,
        `Complaint '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 3. Verify Building Scope
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = (actor.assignedBuildingIds || []).map((b) =>
        b.toString()
      );
      if (!assignedIds.includes(complaint.buildingId.toString())) {
        throw new ApiError(
          403,
          `Access forbidden: Complaint belongs to a building complex outside your authorized scope`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 4. Validate State Machine Lifecycle Transition
    validateComplaintTransition(
      complaint.status,
      COMPLAINT_STATUS.RESOLVED,
      actor,
      resolutionNotes
    );

    // 5. Atomic Conditional State Mutation (Concurrency-Safe)
    const resolvedAt = new Date();
    const resolved = await Complaint.findOneAndUpdate(
      {
        _id: id,
        status: COMPLAINT_STATUS.UNDER_INVESTIGATION,
      },
      {
        status: COMPLAINT_STATUS.RESOLVED,
        resolutionNotes: resolutionNotes.trim(),
        resolvedById: actorUserId,
        resolvedAt,
      },
      { new: true }
    )
      .populate("createdById", "firstName lastName email role")
      .populate("resolvedById", "firstName lastName email role");

    if (!resolved) {
      const fresh = await Complaint.findById(id);
      if (fresh && fresh.status === COMPLAINT_STATUS.RESOLVED) {
        throw new ApiError(
          400,
          "Complaint has already been resolved",
          [],
          ERROR_CODES.BAD_REQUEST
        );
      }
      throw new ApiError(
        400,
        "Failed to resolve complaint due to concurrent state modification",
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 6. Security Audit Telemetry
    emitComplaintSecurityEvent(COMPLAINT_SECURITY_EVENTS.COMPLAINT_RESOLVED, {
      complaintId: resolved._id.toString(),
      complaintNumber: resolved.complaintNumber,
      buildingId: resolved.buildingId.toString(),
      actorId: actorUserId.toString(),
      actorRole: actor.role,
      resolvedAt: resolvedAt.toISOString(),
    });

    return resolved.toSafeComplaint();
  }

  /**
   * Internal Domain Operation: Transitions OPEN complaint to UNDER_INVESTIGATION.
   *
   * @param {string} id - Complaint document ID.
   * @param {Object} actor - Authenticated management user object.
   * @returns {Promise<Object>} Updated complaint DTO.
   */
  async startInvestigation(id, actor) {
    const actorUserId = actor._id || actor.id;

    if (!COMPLAINT_MANAGEMENT_ROLES.includes(actor.role)) {
      throw new ApiError(
        403,
        `Access forbidden: Role '${actor.role}' is not authorized to investigate complaints`,
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      throw new ApiError(
        404,
        `Complaint '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = (actor.assignedBuildingIds || []).map((b) =>
        b.toString()
      );
      if (!assignedIds.includes(complaint.buildingId.toString())) {
        throw new ApiError(
          403,
          `Access forbidden: Complaint belongs to a building outside your authorized scope`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    validateComplaintTransition(
      complaint.status,
      COMPLAINT_STATUS.UNDER_INVESTIGATION,
      actor
    );

    const updated = await Complaint.findOneAndUpdate(
      {
        _id: id,
        status: COMPLAINT_STATUS.OPEN,
      },
      {
        status: COMPLAINT_STATUS.UNDER_INVESTIGATION,
      },
      { new: true }
    )
      .populate("createdById", "firstName lastName email role")
      .populate("resolvedById", "firstName lastName email role");

    emitComplaintSecurityEvent(
      COMPLAINT_SECURITY_EVENTS.COMPLAINT_INVESTIGATION_STARTED,
      {
        complaintId: updated._id.toString(),
        complaintNumber: updated.complaintNumber,
        buildingId: updated.buildingId.toString(),
        actorId: actorUserId.toString(),
        actorRole: actor.role,
      }
    );

    return updated.toSafeComplaint();
  }

  /**
   * Internal Domain Operation: Rejects an invalid grievance ticket with formal notes.
   *
   * @param {string} id - Complaint document ID.
   * @param {Object} payload - ({ resolutionNotes }).
   * @param {Object} actor - Authenticated management user object.
   * @returns {Promise<Object>} Rejected complaint DTO.
   */
  async rejectComplaint(id, payload, actor) {
    const { resolutionNotes } = payload;
    const actorUserId = actor._id || actor.id;

    if (!COMPLAINT_MANAGEMENT_ROLES.includes(actor.role)) {
      throw new ApiError(
        403,
        `Access forbidden: Role '${actor.role}' is not authorized to reject complaints`,
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      throw new ApiError(
        404,
        `Complaint '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = (actor.assignedBuildingIds || []).map((b) =>
        b.toString()
      );
      if (!assignedIds.includes(complaint.buildingId.toString())) {
        throw new ApiError(
          403,
          `Access forbidden: Complaint belongs to a building outside your authorized scope`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    validateComplaintTransition(
      complaint.status,
      COMPLAINT_STATUS.REJECTED,
      actor,
      resolutionNotes
    );

    const rejectedAt = new Date();
    const rejected = await Complaint.findOneAndUpdate(
      {
        _id: id,
        status: COMPLAINT_STATUS.UNDER_INVESTIGATION,
      },
      {
        status: COMPLAINT_STATUS.REJECTED,
        resolutionNotes: resolutionNotes.trim(),
        resolvedById: actorUserId,
        resolvedAt: rejectedAt,
      },
      { new: true }
    )
      .populate("createdById", "firstName lastName email role")
      .populate("resolvedById", "firstName lastName email role");

    emitComplaintSecurityEvent(COMPLAINT_SECURITY_EVENTS.COMPLAINT_REJECTED, {
      complaintId: rejected._id.toString(),
      complaintNumber: rejected.complaintNumber,
      buildingId: rejected.buildingId.toString(),
      actorId: actorUserId.toString(),
      actorRole: actor.role,
      rejectedAt: rejectedAt.toISOString(),
    });

    return rejected.toSafeComplaint();
  }
}

export const complaintService = new ComplaintService();
export default complaintService;
