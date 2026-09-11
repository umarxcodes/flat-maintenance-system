// =====================  IMPORTS  ==========================
import { AuditLog } from "./audit-logs.model.js";
import { sanitizeAuditSnapshot } from "./audit-logs.sanitizer.js";
import {
  AUDIT_LOG_LIMITS,
  AUDIT_SECURITY_EVENTS,
} from "./audit-logs.constants.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.util.js";

// =====================  SERVICE IMPLEMENTATION  ============
class AuditLogService {
  /**
   * Appends an immutable forensic record to the auditLogs collection.
   *
   * Security & Integrity Invariants:
   * - Trusted Server Execution: Fields are populated from verified caller context, never untrusted client payloads.
   * - Credential Redaction: Both beforeState and afterState undergo recursive secret sanitization.
   * - Transaction Participation: Operates seamlessly within existing MongoDB sessions for ACID consistency.
   * - Non-Recursive: Emits no downstream audit records to prevent infinite telemetry loops.
   *
   * @param {Object} event - Validated domain mutation audit event.
   * @param {string} event.action - Canonical mutation action string.
   * @param {string|Object} event.actorUserId - Authenticated user ObjectId.
   * @param {string} event.actorRole - Authoritative historical user role.
   * @param {string|Object} [event.buildingId=null] - Associated building ObjectId.
   * @param {string} event.resourceType - Domain entity type classifier.
   * @param {string|Object} event.resourceId - Affected entity ObjectId.
   * @param {Object|null} [event.beforeState=null] - Pre-mutation entity snapshot.
   * @param {Object|null} [event.afterState=null] - Post-mutation entity snapshot.
   * @param {string|null} [event.ipAddress=null] - Originating client IP.
   * @param {string|null} [event.userAgent=null] - Originating client User-Agent.
   * @param {string|null} [event.correlationId=null] - End-to-end request correlation ID.
   * @param {Object} [options={}] - Execution options.
   * @param {import('mongoose').ClientSession} [options.session] - Optional parent transaction session.
   * @returns {Promise<Object>} Created immutable AuditLog document.
   */
  async appendAuditLog(event, options = {}) {
    const { session } = options;

    try {
      // Validate mandatory forensic identifiers
      if (!event.action) {
        throw new Error("Audit append rejected: 'action' is required");
      }
      if (!event.actorUserId) {
        throw new Error("Audit append rejected: 'actorUserId' is required");
      }
      if (!event.actorRole) {
        throw new Error("Audit append rejected: 'actorRole' is required");
      }
      if (!event.resourceType) {
        throw new Error("Audit append rejected: 'resourceType' is required");
      }
      if (!event.resourceId) {
        throw new Error("Audit append rejected: 'resourceId' is required");
      }

      // Sanitize before and after state snapshots to prevent credential leakage
      const sanitizedBefore = sanitizeAuditSnapshot(event.beforeState);
      const sanitizedAfter = sanitizeAuditSnapshot(event.afterState);

      const payload = {
        action: String(event.action).trim().toUpperCase(),
        actorUserId: event.actorUserId,
        actorRole: String(event.actorRole).trim().toUpperCase(),
        buildingId: event.buildingId || null,
        resourceType: String(event.resourceType).trim().toUpperCase(),
        resourceId: event.resourceId,
        beforeState: sanitizedBefore,
        afterState: sanitizedAfter,
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
        correlationId: event.correlationId || null,
        createdAt: new Date(),
      };

      const [created] = await AuditLog.create(
        [payload],
        session ? { session } : {}
      );
      return created;
    } catch (error) {
      logger.error("Forensic audit append failure", {
        action: event?.action,
        resourceType: event?.resourceType,
        resourceId: event?.resourceId?.toString(),
        actorUserId: event?.actorUserId?.toString(),
        buildingId: event?.buildingId?.toString(),
        correlationId: event?.correlationId,
        errorMessage: error.message,
      });

      // When operating in an active transaction session, the failure must abort the transaction
      if (session) {
        throw error;
      }

      throw error;
    }
  }

  /**
   * Queries the immutable forensic audit trail adhering strictly to multi-building
   * tenant boundaries and least-privilege administrative access.
   *
   * @param {Object} query - Validated search filters and pagination bounds.
   * @param {Object} actor - Authenticated JWT user principal.
   * @returns {Promise<{ auditLogs: Array<Object>, meta: Object }>} Paginated audit log records.
   */
  async listAuditLogs(query = {}, actor) {
    const filter = {};

    // 1. Multi-Building Tenant Boundary & Role Enforcement
    if (actor.role === ROLES.SUPER_ADMIN) {
      // Global governor: may query all buildings or optionally constrain by specific buildingId
      if (query.buildingId) {
        filter.buildingId = query.buildingId;
      }
    } else if (actor.role === ROLES.BUILDING_ADMIN) {
      const assigned = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );

      if (assigned.length === 0) {
        return {
          auditLogs: [],
          meta: {
            page: query.page || AUDIT_LOG_LIMITS.DEFAULT_PAGE,
            limit: query.limit || AUDIT_LOG_LIMITS.DEFAULT_LIMIT,
            totalRecords: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }

      if (query.buildingId) {
        if (!assigned.includes(query.buildingId.toString())) {
          throw new ApiError(
            403,
            "Access forbidden: You are not authorized for this building's audit logs",
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = query.buildingId;
      } else {
        filter.buildingId = { $in: assigned };
      }
    } else {
      throw new ApiError(
        403,
        "Access forbidden: Insufficient administrative privileges for audit trail inspection",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    // 2. Resource Filters
    if (query.resourceType) {
      filter.resourceType = query.resourceType.toUpperCase();
    }
    if (query.resourceId) {
      filter.resourceId = query.resourceId;
    }

    // 3. Actor & Action Filters
    if (query.actorUserId) {
      filter.actorUserId = query.actorUserId;
    }
    if (query.action) {
      filter.action = query.action.toUpperCase();
    }

    // 4. Chronological Range Filters
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) {
        filter.createdAt.$gte = new Date(query.from);
      }
      if (query.to) {
        filter.createdAt.$lte = new Date(query.to);
      }
    }

    // 5. Paginated Database Execution
    const page = Number(query.page) || AUDIT_LOG_LIMITS.DEFAULT_PAGE;
    const limit = Number(query.limit) || AUDIT_LOG_LIMITS.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const [totalRecords, auditLogs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 0;

    // Security Audit Telemetry
    logger.security(AUDIT_SECURITY_EVENTS.AUDIT_LOGS_ACCESSED, {
      actorId: (actor._id || actor.id).toString(),
      actorRole: actor.role,
      filterBuildingId:
        query.buildingId || (filter.buildingId?.$in ? "MULTIPLE" : "ALL"),
      recordsRetrieved: auditLogs.length,
      totalMatching: totalRecords,
    });

    return {
      auditLogs,
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
}

// =====================  SINGLETON EXPORT  ==================
export const auditLogService = new AuditLogService();
export default auditLogService;
