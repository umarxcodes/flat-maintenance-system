// =====================  IMPORTS  ==========================
import {
  MAINTENANCE_REQUEST_STATUS,
  SLA_HOURS_BY_PRIORITY,
} from "./maintenance-requests.constants.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";

// =====================  STATE TRANSITION GRAPH  =============
/**
 * Canonical 7-Stage State Transition Graph with Rework and Cancellation.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 22 and Section 70.3.
 */
const ALLOWED_TRANSITIONS = Object.freeze({
  [MAINTENANCE_REQUEST_STATUS.OPEN]: Object.freeze([
    MAINTENANCE_REQUEST_STATUS.TRIAGED,
    MAINTENANCE_REQUEST_STATUS.ASSIGNED,
    MAINTENANCE_REQUEST_STATUS.CANCELLED,
  ]),
  [MAINTENANCE_REQUEST_STATUS.TRIAGED]: Object.freeze([
    MAINTENANCE_REQUEST_STATUS.ASSIGNED,
    MAINTENANCE_REQUEST_STATUS.CANCELLED,
  ]),
  [MAINTENANCE_REQUEST_STATUS.ASSIGNED]: Object.freeze([
    MAINTENANCE_REQUEST_STATUS.IN_PROGRESS,
    MAINTENANCE_REQUEST_STATUS.ASSIGNED, // Re-assignment permitted
    MAINTENANCE_REQUEST_STATUS.CANCELLED,
  ]),
  [MAINTENANCE_REQUEST_STATUS.IN_PROGRESS]: Object.freeze([
    MAINTENANCE_REQUEST_STATUS.COMPLETED,
  ]),
  [MAINTENANCE_REQUEST_STATUS.COMPLETED]: Object.freeze([
    MAINTENANCE_REQUEST_STATUS.VERIFIED,
    MAINTENANCE_REQUEST_STATUS.CLOSED,
    MAINTENANCE_REQUEST_STATUS.IN_PROGRESS, // Resident Quality Rejection (Rework)
  ]),
  [MAINTENANCE_REQUEST_STATUS.VERIFIED]: Object.freeze([
    MAINTENANCE_REQUEST_STATUS.CLOSED,
  ]),
  [MAINTENANCE_REQUEST_STATUS.CLOSED]: Object.freeze([]), // Terminal
  [MAINTENANCE_REQUEST_STATUS.CANCELLED]: Object.freeze([]), // Terminal
});

// =====================  TRANSITION VALIDATOR  ==============
/**
 * Validates whether a state transition from `currentStatus` to `targetStatus`
 * is legitimate within the 7-stage maintenance lifecycle and permitted for `actorRole`.
 *
 * @param {Object} params - Transition parameters.
 * @param {string} params.currentStatus - Current status of the maintenance request.
 * @param {string} params.targetStatus - Desired target status.
 * @param {string} params.actorRole - Role of the authenticated actor attempting the change.
 * @param {boolean} [params.isCreator=false] - Whether actor is the ticket's creator.
 * @throws {ApiError} If the transition is illegal or unauthorized.
 */
export const validateStateTransition = (
  firstArg,
  targetStatusArg,
  actorRoleArg,
  isCreatorArg = false
) => {
  let currentStatus;
  let targetStatus;
  let actorRole;
  let isCreator;

  if (typeof firstArg === "object" && firstArg !== null) {
    currentStatus = firstArg.currentStatus;
    targetStatus = firstArg.targetStatus;
    actorRole = firstArg.actorRole;
    isCreator = firstArg.isCreator ?? false;
  } else {
    currentStatus = firstArg;
    targetStatus = targetStatusArg;
    actorRole = actorRoleArg;
    isCreator = isCreatorArg ?? false;
  }

  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || [];

  if (!allowedTargets.includes(targetStatus)) {
    throw new ApiError(
      400,
      `Invalid state transition: Maintenance request cannot transition from '${currentStatus}' to '${targetStatus}'`,
      [],
      ERROR_CODES.BAD_REQUEST
    );
  }

  // Role-specific transition authorization rules
  if (targetStatus === MAINTENANCE_REQUEST_STATUS.TRIAGED) {
    if (
      ![ROLES.MANAGER, ROLES.BUILDING_ADMIN, ROLES.SUPER_ADMIN].includes(
        actorRole
      )
    ) {
      throw new ApiError(
        403,
        "Access forbidden: Only Facility Managers and Administrators can triage maintenance requests",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  if (targetStatus === MAINTENANCE_REQUEST_STATUS.ASSIGNED) {
    if (
      ![ROLES.MANAGER, ROLES.BUILDING_ADMIN, ROLES.SUPER_ADMIN].includes(
        actorRole
      )
    ) {
      throw new ApiError(
        403,
        "Access forbidden: Only Facility Managers and Administrators can assign technicians",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  if (
    [
      MAINTENANCE_REQUEST_STATUS.IN_PROGRESS,
      MAINTENANCE_REQUEST_STATUS.COMPLETED,
    ].includes(targetStatus)
  ) {
    const isReworkTransition =
      currentStatus === MAINTENANCE_REQUEST_STATUS.COMPLETED &&
      targetStatus === MAINTENANCE_REQUEST_STATUS.IN_PROGRESS;

    const allowedRoles = isReworkTransition
      ? [
          ROLES.TENANT,
          ROLES.OWNER,
          ROLES.MAINTENANCE_STAFF,
          ROLES.MANAGER,
          ROLES.BUILDING_ADMIN,
          ROLES.SUPER_ADMIN,
        ]
      : [
          ROLES.MAINTENANCE_STAFF,
          ROLES.MANAGER,
          ROLES.BUILDING_ADMIN,
          ROLES.SUPER_ADMIN,
        ];

    if (!allowedRoles.includes(actorRole)) {
      throw new ApiError(
        403,
        "Access forbidden: Only assigned maintenance staff, residents (on rework), or administrators can update execution status",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  if (
    [
      MAINTENANCE_REQUEST_STATUS.VERIFIED,
      MAINTENANCE_REQUEST_STATUS.CLOSED,
    ].includes(targetStatus)
  ) {
    if (
      ![
        ROLES.OWNER,
        ROLES.TENANT,
        ROLES.BUILDING_ADMIN,
        ROLES.SUPER_ADMIN,
      ].includes(actorRole)
    ) {
      throw new ApiError(
        403,
        "Access forbidden: Only the resident or authorized administrator can verify completed repairs",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  if (targetStatus === MAINTENANCE_REQUEST_STATUS.CANCELLED) {
    const isManagerOrAdmin = [
      ROLES.MANAGER,
      ROLES.BUILDING_ADMIN,
      ROLES.SUPER_ADMIN,
    ].includes(actorRole);

    if (!isCreator && !isManagerOrAdmin) {
      throw new ApiError(
        403,
        "Access forbidden: Only the ticket creator or facility manager can cancel a maintenance request",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  return true;
};

// =====================  SLA DEADLINE HELPER  ===============
/**
 * Pure calculation helper for SLA turnaround deadlines.
 *
 * @param {string} priority - Ticket priority ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY').
 * @param {Date|string|number} [baseDate=new Date()] - Reference calculation timestamp.
 * @returns {Date} Calculated SLA expiration date.
 */
export const calculateSlaDeadline = (priority, baseDate = new Date()) => {
  const hours = SLA_HOURS_BY_PRIORITY[priority] || SLA_HOURS_BY_PRIORITY.MEDIUM;
  const startMs = new Date(baseDate).getTime();
  if (Number.isNaN(startMs)) {
    throw new TypeError("Invalid baseDate provided for SLA calculation");
  }
  return new Date(startMs + hours * 60 * 60 * 1000);
};
