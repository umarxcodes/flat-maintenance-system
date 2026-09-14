// =====================  IMPORTS  ==========================
import crypto from "node:crypto";
import { Visitor } from "./visitors.model.js";
import { Flat } from "../../models/flat.model.js";
import { Owner } from "../owners/owners.model.js";
import { Tenant } from "../tenants/tenants.model.js";
import { notificationsService } from "../notifications/notifications.service.js";
import {
  VISITOR_STATUS,
  VISITOR_CONSTRAINTS,
  VISITOR_SECURITY_EVENTS,
} from "./visitors.constants.js";
import { emitVisitorSecurityEvent } from "./visitors.events.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.config.js";
import { logger } from "../../utils/logger.util.js";

// =====================  CRYPTOGRAPHIC HELPERS  =============
/**
 * Generates a cryptographically strong pseudo-random 6-digit passcode.
 * Preserves leading zeroes with fixed padding.
 *
 * @returns {string} Exactly 6 numeric digits (000000 - 999999).
 */
export const generateSecurePassCode = () => {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
};

/**
 * Generates an HMAC-SHA256 cryptographically signed QR verification token.
 *
 * @param {string} passCode - 6-digit gate passcode.
 * @param {string} flatId - Associated flat identifier.
 * @param {string} hostUserId - Resident host identifier.
 * @param {Date} expectedArrivalDate - Target arrival date.
 * @returns {string} URL-safe signed cryptographic token string.
 */
export const generateSignedQrToken = (
  passCode,
  flatId,
  hostUserId,
  expectedArrivalDate
) => {
  const timestamp = new Date(expectedArrivalDate).getTime();
  const payload = `${passCode}:${flatId}:${hostUserId}:${timestamp}`;
  const hmac = crypto
    .createHmac("sha256", env.JWT_ACCESS_SECRET)
    .update(payload)
    .digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${hmac}`;
};

// =====================  SERVICE IMPLEMENTATION  ============
class VisitorsService {
  /**
   * Asserts that an actor has legitimate resident authority over a requested flat.
   *
   * @param {string} flatId - Target flat ObjectId.
   * @param {Object} actor - Authenticated JWT user principal.
   * @returns {Promise<Object>} Authoritative Flat document.
   * @private
   */
  async _assertResidentFlatAccess(flatId, actor) {
    const flat = await Flat.findById(flatId);
    if (!flat || flat.isDeleted) {
      throw new ApiError(
        404,
        "Referenced flat not found or is no longer active",
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // Platform Super Admin has universal operational access
    if (actor.role === ROLES.SUPER_ADMIN) {
      return flat;
    }

    // Building Admin must be assigned to the flat's building
    if (actor.role === ROLES.BUILDING_ADMIN) {
      const assigned = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );
      if (!assigned.includes(flat.buildingId.toString())) {
        throw new ApiError(
          403,
          "Access forbidden: You are not authorized for this building",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
      return flat;
    }

    const actorUserId = (actor._id || actor.id).toString();

    // Tenant authorization check
    if (actor.role === ROLES.TENANT) {
      const tenant = await Tenant.findOne({
        userId: actorUserId,
        status: "ACTIVE",
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

      if (tenant.buildingId.toString() !== flat.buildingId.toString()) {
        throw new ApiError(
          400,
          "Hierarchy mismatch: Referenced flat does not belong to your building",
          [],
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      return flat;
    }

    // Owner authorization check
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

      if (owner.buildingId.toString() !== flat.buildingId.toString()) {
        throw new ApiError(
          400,
          "Hierarchy mismatch: Referenced flat does not belong to your building",
          [],
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      return flat;
    }

    throw new ApiError(
      403,
      `Access forbidden: Role '${actor.role}' is not authorized to generate visitor passes`,
      [],
      ERROR_CODES.FORBIDDEN
    );
  }

  /**
   * Asserts that security personnel are authorized for the specified building.
   *
   * @param {string} buildingId - Building ObjectId to verify.
   * @param {Object} actor - Authenticated JWT user principal.
   * @private
   */
  _assertBuildingStaffAccess(buildingId, actor) {
    if (actor.role === ROLES.SUPER_ADMIN) {
      return;
    }

    const assigned = (actor.assignedBuildingIds || []).map((id) =>
      id.toString()
    );
    if (!assigned.includes(buildingId.toString())) {
      throw new ApiError(
        403,
        "Access forbidden: You are not assigned to security duties for this building",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  /**
   * Pre-registers a visitor for a resident's authorized flat and generates
   * the short-lived gate credentials required for physical entry.
   *
   * The authenticated resident is the authoritative host identity. The flat
   * relationship is validated before persistence, and the building is derived
   * from the authoritative flat record rather than trusted from client input.
   *
   * The passCode is generated using a cryptographically secure random source
   * and remains backed by a database uniqueness constraint because concurrent
   * requests can still produce theoretical collisions.
   *
   * @param {Object} input - Validated visitor pass generation parameters.
   * @param {string} input.flatId - Target flat ObjectId.
   * @param {string} input.visitorName - Visitor legal or declared name.
   * @param {string|undefined} input.visitorPhone - Optional contact number.
   * @param {string|undefined} input.vehicleNumber - Optional vehicle license plate.
   * @param {string} input.visitorType - Enum classification.
   * @param {number|undefined} input.visitorCount - Number of guests in party.
   * @param {string|Date} input.expectedArrivalDate - ISO arrival timestamp.
   * @param {Object} actor - Authenticated resident JWT user principal.
   * @returns {Promise<Object>} Safe visitor pass representation.
   */
  async createVisitorPass(input, actor) {
    // 1. Authorize flat ownership/lease and derive authoritative building context
    const flat = await this._assertResidentFlatAccess(input.flatId, actor);
    const buildingId = flat.buildingId;
    const hostUserId = actor._id || actor.id;

    const arrivalDate = new Date(input.expectedArrivalDate);

    // 2. Bounded retry loop for passcode generation backed by database uniqueness
    const MAX_RETRIES = 5;
    let createdVisitor = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      const passCode = generateSecurePassCode();
      const qrToken = generateSignedQrToken(
        passCode,
        input.flatId,
        hostUserId,
        arrivalDate
      );

      try {
        createdVisitor = await Visitor.create({
          passCode,
          qrToken,
          buildingId,
          flatId: input.flatId,
          hostUserId,
          visitorName: input.visitorName,
          visitorPhone: input.visitorPhone || null,
          vehicleNumber: input.vehicleNumber
            ? input.vehicleNumber.trim().toUpperCase()
            : null,
          visitorType: input.visitorType,
          visitorCount:
            input.visitorCount || VISITOR_CONSTRAINTS.DEFAULT_VISITOR_COUNT,
          expectedArrivalDate: arrivalDate,
          status: VISITOR_STATUS.EXPECTED,
        });
        break;
      } catch (err) {
        // Handle unique constraint collision on passCode
        if (err.code === 11000 && attempt < MAX_RETRIES) {
          continue;
        }
        throw new ApiError(
          500,
          "Failed to allocate unique digital gate pass credentials. Please try again.",
          [err.message],
          ERROR_CODES.INTERNAL_SERVER_ERROR
        );
      }
    }

    // 3. Security Audit Logging
    emitVisitorSecurityEvent(VISITOR_SECURITY_EVENTS.VISITOR_PASS_CREATED, {
      visitorId: createdVisitor._id.toString(),
      passCode: createdVisitor.passCode,
      buildingId: buildingId.toString(),
      flatId: input.flatId.toString(),
      hostUserId: hostUserId.toString(),
      visitorType: createdVisitor.visitorType,
    });

    // 4. Outbox / Messaging Telemetry Event
    emitVisitorSecurityEvent(VISITOR_SECURITY_EVENTS.VISITOR_PASS_SHARED, {
      visitorId: createdVisitor._id.toString(),
      hostUserId: hostUserId.toString(),
      buildingId: buildingId.toString(),
      passCode: createdVisitor.passCode,
      action: "DELIVER_PASS_CREDENTIALS",
    });

    return createdVisitor.toSafeObject();
  }

  /**
   * Verifies a visitor pass for an authenticated security officer without
   * performing the gate-entry state transition.
   *
   * Verification is intentionally read-only. A valid EXPECTED pass is returned
   * as eligible for entry, while expired, denied, checked-in, and checked-out
   * passes must not be treated as new-arrival credentials.
   *
   * @param {string} passCode - 6-digit numeric gate passcode.
   * @param {Object} actor - Authenticated security officer JWT principal.
   * @returns {Promise<Object>} Verification summary with eligibility status.
   */
  async verifyVisitorPass(passCode, actor) {
    // 1. Indexed unique lookup with projection
    const visitor = await Visitor.findOne({ passCode })
      .populate("hostUserId", "name email phone")
      .populate("flatId", "flatNumber blockId");

    if (!visitor) {
      throw new ApiError(
        404,
        "Visitor pass not found or invalid pass code",
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. Building scope enforcement for gate security staff
    this._assertBuildingStaffAccess(visitor.buildingId, actor);

    // 3. Evaluate 24-hour expiration rule
    let currentStatus = visitor.status;
    if (currentStatus === VISITOR_STATUS.EXPECTED && visitor.isExpired()) {
      // Lazy state update to EXPIRED
      await Visitor.updateOne(
        { _id: visitor._id, status: VISITOR_STATUS.EXPECTED },
        { $set: { status: VISITOR_STATUS.EXPIRED } }
      );
      currentStatus = VISITOR_STATUS.EXPIRED;
      visitor.status = VISITOR_STATUS.EXPIRED;
    }

    const isValid = currentStatus === VISITOR_STATUS.EXPECTED;

    // 4. Security Audit Telemetry
    emitVisitorSecurityEvent(VISITOR_SECURITY_EVENTS.VISITOR_VERIFIED, {
      visitorId: visitor._id.toString(),
      passCode,
      verifiedByStaffId: (actor._id || actor.id).toString(),
      buildingId: visitor.buildingId.toString(),
      status: currentStatus,
      isValid,
    });

    return {
      valid: isValid,
      visitor: {
        _id: visitor._id,
        passCode: visitor.passCode,
        visitorName: visitor.visitorName,
        visitorType: visitor.visitorType,
        visitorCount: visitor.visitorCount,
        vehicleNumber: visitor.vehicleNumber,
        expectedArrivalDate: visitor.expectedArrivalDate,
        status: currentStatus,
        entryTimestamp: visitor.entryTimestamp,
        exitTimestamp: visitor.exitTimestamp,
        host: visitor.hostUserId
          ? {
              _id: visitor.hostUserId._id,
              name: visitor.hostUserId.name,
              phone: visitor.hostUserId.phone,
            }
          : null,
        flat: visitor.flatId
          ? {
              _id: visitor.flatId._id,
              flatNumber: visitor.flatId.flatNumber,
            }
          : null,
        buildingId: visitor.buildingId,
      },
    };
  }

  /**
   * Atomically transitions an authorized EXPECTED visitor into CHECKED_IN state.
   *
   * The visitor ID, building scope, and current EXPECTED status are enforced
   * directly in the update predicate. This closes the race where multiple gate
   * officers could otherwise check in the same pass simultaneously.
   *
   * The entry timestamp and verifying staff identity are generated by the
   * server so gate personnel cannot spoof historical timestamps or another
   * officer's identity.
   *
   * @param {string} visitorId - Visitor ObjectId.
   * @param {Object} actor - Authenticated security officer JWT principal.
   * @param {Object} [gateData={}] - Optional check-in amendments (e.g. vehicle license plate).
   * @returns {Promise<Object>} Safe updated visitor representation.
   */
  async checkInVisitor(visitorId, actor, gateData = {}) {
    // 1. Inspect resource existence and state
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      throw new ApiError(
        404,
        "Visitor pass not found",
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. Building scope enforcement for gate staff
    this._assertBuildingStaffAccess(visitor.buildingId, actor);

    // 3. State machine validation
    if (visitor.status === VISITOR_STATUS.CHECKED_IN) {
      throw new ApiError(
        409,
        "Visitor pass has already been checked in",
        [],
        ERROR_CODES.CONFLICT
      );
    }

    if (visitor.status === VISITOR_STATUS.CHECKED_OUT) {
      throw new ApiError(
        400,
        "Visitor has already checked out",
        [],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (visitor.status === VISITOR_STATUS.DENIED) {
      throw new ApiError(
        400,
        "Visitor pass was denied entry",
        [],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Check expiration rule
    if (visitor.status === VISITOR_STATUS.EXPIRED || visitor.isExpired()) {
      if (visitor.status === VISITOR_STATUS.EXPECTED) {
        await Visitor.updateOne(
          { _id: visitor._id, status: VISITOR_STATUS.EXPECTED },
          { $set: { status: VISITOR_STATUS.EXPIRED } }
        );
      }
      throw new ApiError(
        400,
        "Visitor pass has expired (24-hour arrival window elapsed)",
        [],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (visitor.status !== VISITOR_STATUS.EXPECTED) {
      throw new ApiError(
        400,
        `Cannot check in visitor with status '${visitor.status}'`,
        [],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 4. Atomic conditional transition: EXPECTED -> CHECKED_IN
    const actorStaffId = actor._id || actor.id;
    const entryTimestamp = new Date();

    const updateFields = {
      status: VISITOR_STATUS.CHECKED_IN,
      entryTimestamp,
      verifiedByStaffId: actorStaffId,
    };

    if (gateData.vehicleNumber) {
      updateFields.vehicleNumber = gateData.vehicleNumber.trim().toUpperCase();
    }

    // Predicate guarantees race-free execution against concurrent scans
    const updatedVisitor = await Visitor.findOneAndUpdate(
      {
        _id: visitorId,
        status: VISITOR_STATUS.EXPECTED,
        buildingId: visitor.buildingId,
      },
      {
        $set: updateFields,
      },
      {
        returnDocument: "after",
      }
    );

    if (!updatedVisitor) {
      throw new ApiError(
        409,
        "Visitor check-in conflict: Pass was already checked in concurrently",
        [],
        ERROR_CODES.CONFLICT
      );
    }

    // 5. Security Audit Logging
    emitVisitorSecurityEvent(VISITOR_SECURITY_EVENTS.VISITOR_CHECKED_IN, {
      visitorId: updatedVisitor._id.toString(),
      buildingId: updatedVisitor.buildingId.toString(),
      hostUserId: updatedVisitor.hostUserId.toString(),
      verifiedByStaffId: actorStaffId.toString(),
      entryTimestamp: entryTimestamp.toISOString(),
      vehicleNumber: updatedVisitor.vehicleNumber,
    });

    // 6. Push In-App Arrival Notification to Resident Host (Module 19 Integration)
    try {
      await notificationsService.createNotification({
        recipientUserId: updatedVisitor.hostUserId,
        buildingId: updatedVisitor.buildingId,
        title: "Visitor Arrived",
        body: `Your visitor ${updatedVisitor.visitorName} (${updatedVisitor.visitorType}) has checked in at the security gate.`,
        category: "VISITOR",
        referenceId: updatedVisitor._id,
        referenceModel: "Visitor",
      });
    } catch (notifErr) {
      logger.error("Failed to dispatch visitor arrival notification to host", {
        error: notifErr.message,
        visitorId: updatedVisitor._id.toString(),
      });
    }

    return updatedVisitor.toSafeObject();
  }

  /**
   * Atomically transitions a CHECKED_IN visitor into CHECKED_OUT state.
   *
   * The mutation is constrained by both the authenticated security officer's
   * building scope and the current CHECKED_IN state, preventing duplicate
   * checkout and cross-building manipulation.
   *
   * @param {string} visitorId - Visitor ObjectId.
   * @param {Object} actor - Authenticated security officer JWT principal.
   * @returns {Promise<Object>} Safe updated visitor representation.
   */
  async checkOutVisitor(visitorId, actor) {
    // 1. Inspect resource existence and state
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      throw new ApiError(
        404,
        "Visitor pass not found",
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. Building scope enforcement for gate staff
    this._assertBuildingStaffAccess(visitor.buildingId, actor);

    // 3. State machine validation
    if (visitor.status === VISITOR_STATUS.CHECKED_OUT) {
      throw new ApiError(
        409,
        "Visitor has already checked out",
        [],
        ERROR_CODES.CONFLICT
      );
    }

    if (visitor.status === VISITOR_STATUS.EXPECTED) {
      throw new ApiError(
        400,
        "Visitor has not checked in yet",
        [],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (
      visitor.status === VISITOR_STATUS.EXPIRED ||
      visitor.status === VISITOR_STATUS.DENIED
    ) {
      throw new ApiError(
        400,
        `Cannot check out visitor with status '${visitor.status}'`,
        [],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (visitor.status !== VISITOR_STATUS.CHECKED_IN) {
      throw new ApiError(
        400,
        `Invalid status transition from '${visitor.status}' to 'CHECKED_OUT'`,
        [],
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // 4. Atomic conditional transition: CHECKED_IN -> CHECKED_OUT
    const exitTimestamp = new Date();

    // Predicate guarantees race-free execution against concurrent departures
    const updatedVisitor = await Visitor.findOneAndUpdate(
      {
        _id: visitorId,
        status: VISITOR_STATUS.CHECKED_IN,
        buildingId: visitor.buildingId,
      },
      {
        $set: {
          status: VISITOR_STATUS.CHECKED_OUT,
          exitTimestamp,
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!updatedVisitor) {
      throw new ApiError(
        409,
        "Visitor check-out conflict: Pass was already checked out concurrently",
        [],
        ERROR_CODES.CONFLICT
      );
    }

    // 5. Security Audit Logging
    emitVisitorSecurityEvent(VISITOR_SECURITY_EVENTS.VISITOR_CHECKED_OUT, {
      visitorId: updatedVisitor._id.toString(),
      buildingId: updatedVisitor.buildingId.toString(),
      hostUserId: updatedVisitor.hostUserId.toString(),
      exitTimestamp: exitTimestamp.toISOString(),
      verifiedByStaffId: (actor._id || actor.id).toString(),
    });

    return updatedVisitor.toSafeObject();
  }

  /**
   * Retrieves paginated visitor passes scoped by role and building.
   */
  async listVisitors(query = {}, actor) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.buildingId) {
      filter.buildingId = query.buildingId;
    } else if (actor.assignedBuildingIds && actor.assignedBuildingIds.length > 0) {
      filter.buildingId = { $in: actor.assignedBuildingIds };
    }

    if (actor.role === ROLES.OWNER || actor.role === ROLES.TENANT) {
      filter.hostUserId = actor._id || actor.id;
    }

    if (query.status) {
      filter.status = query.status;
    }
    if (query.visitorType) {
      filter.visitorType = query.visitorType;
    }
    if (query.flatId) {
      filter.flatId = query.flatId;
    }

    const [total, records] = await Promise.all([
      Visitor.countDocuments(filter),
      Visitor.find(filter)
        .sort({ expectedArrivalDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("buildingId", "name code")
        .populate("flatId", "flatNumber blockId")
        .populate("hostUserId", "firstName lastName email phone"),
    ]);

    return {
      visitors: records.map((r) => r.toSafeObject()),
      meta: {
        page,
        limit,
        totalRecords: total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

// =====================  SINGLETON EXPORT  ==================
export const visitorsService = new VisitorsService();
export default visitorsService;
