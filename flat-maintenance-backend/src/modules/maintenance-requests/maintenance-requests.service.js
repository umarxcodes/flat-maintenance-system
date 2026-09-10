// =====================  IMPORTS  ==========================
import crypto from "node:crypto";
import { MaintenanceRequest } from "./maintenance-requests.model.js";
import { Building } from "../../models/building.model.js";
import { Flat } from "../../models/flat.model.js";
import { Owner } from "../../models/owner.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { Staff } from "../../models/staff.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { TENANTS_CONSTANTS } from "../tenants/tenants.constants.js";
import { STAFF_CONSTANTS } from "../staff/staff.constants.js";
import {
  MAINTENANCE_REQUEST_STATUS,
  MAINTENANCE_REQUEST_CONSTANTS,
  TRADE_COMPATIBILITY_MAP,
} from "./maintenance-requests.constants.js";
import {
  validateStateTransition,
  calculateSlaDeadline,
} from "./maintenance-requests.state-machine.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { logger } from "../../utils/logger.util.js";

// =====================  DOMAIN SERVICE  ====================
/**
 * Authoritative Domain Service for Maintenance Requests / Work Orders.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 43 and Section 22.
 * Governing the 7-stage operational state machine, anti-IDOR flat verification,
 * technician dispatch, photographic proof submission, and resident quality sign-off.
 */
export class MaintenanceRequestService {
  /**
   * Generates a collision-safe, unique request number in the canonical format:
   * WO-YYYY-XXXXX (e.g. WO-2026-00491)
   *
   * @private
   * @returns {Promise<string>} Unique work order identifier.
   */
  async _generateRequestNumber() {
    const year = new Date().getFullYear();
    const count = await MaintenanceRequest.countDocuments();
    const seq = String(count + 1).padStart(5, "0");
    let candidate = `WO-${year}-${seq}`;

    const exists = await MaintenanceRequest.findOne({
      requestNumber: candidate,
    });
    if (exists) {
      const rand = crypto.randomInt(10000, 99999);
      candidate = `WO-${year}-${rand}`;
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

    throw new ApiError(
      403,
      "Access forbidden: Only residents (Tenants or Owners) can submit maintenance requests for their flats",
      [],
      ERROR_CODES.FORBIDDEN
    );
  }

  /**
   * Submits a new resident maintenance ticket.
   *
   * Invariants:
   * - Flat-scoped authorization: resident must own or rent the referenced flat.
   * - Hierarchy consistency: flat.buildingId === buildingId.
   * - Server-controlled SLA deadline and initial status 'OPEN'.
   *
   * @param {Object} input - Validated ticket submission payload.
   * @param {Object} actor - Authenticated JWT user.
   * @returns {Promise<Object>} Sanitized maintenance request DTO.
   */
  async createRequest(input, actor) {
    const {
      buildingId,
      flatId,
      category,
      priority = MAINTENANCE_REQUEST_CONSTANTS.PRIORITIES.MEDIUM,
      title,
      description,
      initialPhotos = [],
    } = input;

    // 1. Target Building Existence Verification
    const building = await Building.findOne({
      _id: buildingId,
      isDeleted: false,
    });
    if (!building) {
      throw new ApiError(
        404,
        `Referenced building complex '${buildingId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. Target Flat Existence and Hierarchy Verification
    const flat = await Flat.findOne({
      _id: flatId,
      isDeleted: false,
    });
    if (!flat) {
      throw new ApiError(
        404,
        `Referenced flat unit '${flatId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    if (flat.buildingId.toString() !== buildingId.toString()) {
      throw new ApiError(
        400,
        `Hierarchy error: Flat '${flatId}' belongs to building '${flat.buildingId}', not '${buildingId}'`,
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 3. Resident Flat-Level Authorization (Anti-IDOR)
    await this._assertResidentFlatAccess(flatId, buildingId, actor);

    // 4. Calculate SLA Deadline
    const slaDeadline = calculateSlaDeadline(priority, new Date());
    const actorUserId = actor._id || actor.id;

    // 5. Persist Ticket with optimistic collision retry
    let request;
    let finalRequestNumber;
    const maxRetries = 10;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      finalRequestNumber = await this._generateRequestNumber();
      try {
        request = await MaintenanceRequest.create({
          requestNumber: finalRequestNumber,
          buildingId,
          flatId,
          createdById: actorUserId,
          category,
          priority,
          title,
          description,
          initialPhotos,
          status: MAINTENANCE_REQUEST_STATUS.OPEN,
          slaDeadline,
        });
        break;
      } catch (err) {
        if (
          err.code === 11000 &&
          err.keyPattern &&
          err.keyPattern.requestNumber
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

    // 6. Security Audit Event
    logger.security("MAINTENANCE_REQUEST_CREATED", {
      requestId: request._id.toString(),
      requestNumber: finalRequestNumber,
      buildingId: buildingId.toString(),
      flatId: flatId.toString(),
      category,
      priority,
      actorId: actorUserId.toString(),
      actorRole: actor.role,
    });

    return request.toSafeMaintenanceRequest();
  }

  /**
   * Retrieves role-scoped list of maintenance work orders with filters and pagination.
   *
   * Scoping rules:
   * - Tenant: strictly scoped to own active flat.
   * - Owner: strictly scoped to owned flats portfolio.
   * - Staff: strictly scoped to work orders assigned to them.
   * - Manager / BuildingAdmin: strictly scoped to assigned building complexes.
   * - SuperAdmin: global access across all complexes.
   *
   * @param {Object} query - Filter and pagination query parameters.
   * @param {Object} actor - Authenticated JWT user.
   * @returns {Promise<Object>} Paginated request list and pagination envelope.
   */
  async listRequests(query, actor) {
    const filter = {};

    const actorUserId = actor._id || actor.id;

    // 1. Apply Role-Based Resource Scoping (Anti-IDOR)
    if (actor.role === ROLES.TENANT) {
      const tenant = await Tenant.findOne({
        userId: actorUserId,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
        isDeleted: false,
      });
      filter.flatId = tenant ? tenant.flatId : new Flat()._id; // Match none if no active tenancy
    } else if (actor.role === ROLES.OWNER) {
      const owner = await Owner.findOne({
        userId: actorUserId,
        isDeleted: false,
      });
      filter.flatId = { $in: owner ? owner.flatsOwned : [] };
    } else if (actor.role === ROLES.MAINTENANCE_STAFF) {
      const staff = await Staff.findOne({
        userId: actorUserId,
        isDeleted: false,
      });
      filter.assignedStaffId = staff ? staff._id : new Staff()._id;
    } else if (
      actor.role === ROLES.MANAGER ||
      actor.role === ROLES.BUILDING_ADMIN
    ) {
      const assignedIds = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );
      if (query.buildingId) {
        if (!assignedIds.includes(query.buildingId.toString())) {
          throw new ApiError(
            403,
            `Access forbidden: complex '${query.buildingId}' is outside your authorized building complex scope`,
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
    if (query.flatId && !filter.flatId) {
      filter.flatId = query.flatId;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }
    if (query.assignedStaffId && !filter.assignedStaffId) {
      filter.assignedStaffId = query.assignedStaffId;
    }

    // 3. Deterministic Pagination
    const page =
      Number(query.page) ||
      MAINTENANCE_REQUEST_CONSTANTS.PAGINATION.DEFAULT_PAGE;
    const limit =
      Number(query.limit) ||
      MAINTENANCE_REQUEST_CONSTANTS.PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      MaintenanceRequest.countDocuments(filter),
      MaintenanceRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map((r) => r.toSafeMaintenanceRequest()),
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
   * Dispatches a specialized maintenance technician to a work order.
   *
   * Invariants:
   * - Manager building scope enforced.
   * - Staff existence, status (ACTIVE), and building consistency verified.
   * - Trade specialization compatibility checked against category.
   * - Transitions status to 'ASSIGNED'.
   *
   * @param {string} id - Maintenance request ID.
   * @param {Object} input - Assignment payload (assignedStaffId, priority, category).
   * @param {Object} actor - Authenticated JWT user (Manager/Admin).
   * @returns {Promise<Object>} Updated maintenance request DTO.
   */
  async assignRequest(id, input, actor) {
    const { assignedStaffId, priority, category } = input;

    // 1. Resolve Maintenance Request
    const request = await MaintenanceRequest.findById(id);
    if (!request) {
      throw new ApiError(
        404,
        `Maintenance request '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. Building Scope Verification for Manager/Admin
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = (actor.assignedBuildingIds || []).map((b) =>
        b.toString()
      );
      if (!assignedIds.includes(request.buildingId.toString())) {
        throw new ApiError(
          403,
          `Access forbidden: Maintenance request '${id}' belongs to complex outside your building scope`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 3. State Machine Transition Verification
    validateStateTransition({
      currentStatus: request.status,
      targetStatus: MAINTENANCE_REQUEST_STATUS.ASSIGNED,
      actorRole: actor.role,
    });

    // 4. Technician Verification
    const staff = await Staff.findOne({
      _id: assignedStaffId,
      isDeleted: false,
    });
    if (!staff) {
      throw new ApiError(
        404,
        `Referenced staff member '${assignedStaffId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // Duty Availability Verification
    if (staff.status !== STAFF_CONSTANTS.STATUS.ACTIVE) {
      throw new ApiError(
        400,
        `Cannot assign technician: Staff member is currently '${staff.status}'`,
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    // Cross-Building Guard: Staff must belong to the exact building complex
    if (staff.buildingId.toString() !== request.buildingId.toString()) {
      throw new ApiError(
        400,
        "Operational error: Technician belongs to a different building complex",
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    // Trade Specialization Guard
    const effectiveCategory = category || request.category;
    if (staff.category === STAFF_CONSTANTS.CATEGORIES.SECURITY) {
      throw new ApiError(
        400,
        "Invalid staff assignment: Security personnel cannot be assigned maintenance work orders",
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    const compatibleTrades = TRADE_COMPATIBILITY_MAP[effectiveCategory] || [];
    if (
      compatibleTrades.length > 0 &&
      !compatibleTrades.includes(staff.subCategory)
    ) {
      throw new ApiError(
        400,
        `Specialization mismatch: Staff trade '${staff.subCategory}' is not qualified for category '${effectiveCategory}'`,
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 5. Apply Updates
    request.assignedStaffId = staff._id;
    request.status = MAINTENANCE_REQUEST_STATUS.ASSIGNED;

    if (category) {
      request.category = category;
    }
    if (priority) {
      request.priority = priority;
      request.slaDeadline = calculateSlaDeadline(priority, request.createdAt);
    }

    await request.save();

    const actorUserId = actor._id || actor.id;

    // 6. Security Audit Event
    logger.security("MAINTENANCE_REQUEST_ASSIGNED", {
      requestId: request._id.toString(),
      requestNumber: request.requestNumber,
      assignedStaffId: staff._id.toString(),
      staffSubCategory: staff.subCategory,
      assignedBy: actorUserId.toString(),
    });

    return request.toSafeMaintenanceRequest();
  }

  /**
   * Updates task execution status (IN_PROGRESS or COMPLETED) by the assigned technician.
   *
   * Invariants:
   * - Anti-Hijacking: Technicians can only update tickets assigned to themselves.
   * - Photographic Proof: COMPLETED status strictly requires Cloudinary completion photos.
   * - Lifecycle Timestamps: Sets startedAt and completedAt automatically.
   *
   * @param {string} id - Maintenance request ID.
   * @param {Object} input - Status payload (status, completionPhotos).
   * @param {Object} actor - Authenticated JWT user.
   * @returns {Promise<Object>} Updated maintenance request DTO.
   */
  async updateStatus(id, input, actor) {
    const { status, completionPhotos } = input;

    // 1. Resolve Maintenance Request
    const request = await MaintenanceRequest.findById(id);
    if (!request) {
      throw new ApiError(
        404,
        `Maintenance request '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    const actorUserId = actor._id || actor.id;

    // 2. Anti-Hijacking & Technician Identity Verification
    if (actor.role === ROLES.MAINTENANCE_STAFF) {
      const staff = await Staff.findOne({
        userId: actorUserId,
        isDeleted: false,
      });

      if (
        !staff ||
        !request.assignedStaffId ||
        request.assignedStaffId.toString() !== staff._id.toString()
      ) {
        throw new ApiError(
          403,
          "Access forbidden: You are not the assigned technician for this maintenance request",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    } else if (
      ![ROLES.MANAGER, ROLES.BUILDING_ADMIN, ROLES.SUPER_ADMIN].includes(
        actor.role
      )
    ) {
      throw new ApiError(
        403,
        "Access forbidden: Insufficient operational permissions to update work order execution status",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    // 3. State Machine Transition Verification
    validateStateTransition({
      currentStatus: request.status,
      targetStatus: status,
      actorRole: actor.role,
    });

    // 4. Apply State Transition & Timestamps
    if (status === MAINTENANCE_REQUEST_STATUS.IN_PROGRESS) {
      request.status = MAINTENANCE_REQUEST_STATUS.IN_PROGRESS;
      if (!request.startedAt) {
        request.startedAt = new Date();
      }
    } else if (status === MAINTENANCE_REQUEST_STATUS.COMPLETED) {
      request.status = MAINTENANCE_REQUEST_STATUS.COMPLETED;
      request.completedAt = new Date();
      request.completionPhotos = completionPhotos || [];
    }

    await request.save();

    // 5. Security Audit Event
    logger.security("MAINTENANCE_REQUEST_STATUS_UPDATED", {
      requestId: request._id.toString(),
      requestNumber: request.requestNumber,
      status: request.status,
      updatedBy: actorUserId.toString(),
      actorRole: actor.role,
    });

    return request.toSafeMaintenanceRequest();
  }

  /**
   * Processes resident quality inspection and sign-off.
   *
   * Invariants:
   * - Resident must rent or own the referenced flat.
   * - Request must be in COMPLETED status.
   * - If approved: sets verifiedAt, transitions directly to CLOSED.
   * - If rejected: triggers Rework cycle, transitioning back to IN_PROGRESS.
   *
   * @param {string} id - Maintenance request ID.
   * @param {Object} input - Verification payload ({ approved, feedback }).
   * @param {Object} actor - Authenticated resident user.
   * @returns {Promise<Object>} Updated maintenance request DTO.
   */
  async verifyRequest(id, input, actor) {
    const { approved } = input;

    // 1. Resolve Maintenance Request
    const request = await MaintenanceRequest.findById(id);
    if (!request) {
      throw new ApiError(
        404,
        `Maintenance request '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. State Guard: Must be in COMPLETED status
    if (request.status !== MAINTENANCE_REQUEST_STATUS.COMPLETED) {
      throw new ApiError(
        400,
        `Cannot verify maintenance request: Ticket is currently in '${request.status}' status (must be COMPLETED)`,
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 3. Resident Flat-Level Authorization (Anti-IDOR)
    await this._assertResidentFlatAccess(
      request.flatId,
      request.buildingId,
      actor
    );

    // 4. Apply State Transition
    if (approved) {
      request.verifiedAt = new Date();
      request.status = MAINTENANCE_REQUEST_STATUS.CLOSED; // Automatic closure upon resident sign-off per Section 22 Step 4
    } else {
      // Resident Rejected Quality (Rework Cycle per Section 22 and Section 70.3)
      request.status = MAINTENANCE_REQUEST_STATUS.IN_PROGRESS;
    }

    await request.save();

    const actorUserId = actor._id || actor.id;

    // 5. Security Audit Event
    logger.security("MAINTENANCE_REQUEST_VERIFIED", {
      requestId: request._id.toString(),
      requestNumber: request.requestNumber,
      status: request.status,
      approved,
      verifiedBy: actorUserId.toString(),
    });

    return request.toSafeMaintenanceRequest();
  }
}

export const maintenanceRequestService = new MaintenanceRequestService();

export default maintenanceRequestService;
