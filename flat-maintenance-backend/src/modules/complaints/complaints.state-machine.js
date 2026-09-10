// =====================  IMPORTS  ==========================
import { COMPLAINT_STATUS } from "./complaints.constants.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";

// =====================  STATE MACHINE GRAPH  ===============
/**
 * Authoritative 4-Stage Grievance Lifecycle Graph.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 70.4:
 *
 * [*] -> OPEN -> UNDER_INVESTIGATION -> RESOLVED
 *             -> UNDER_INVESTIGATION -> REJECTED
 */
export const ALLOWED_COMPLAINT_TRANSITIONS = Object.freeze({
  [COMPLAINT_STATUS.OPEN]: [COMPLAINT_STATUS.UNDER_INVESTIGATION],
  [COMPLAINT_STATUS.UNDER_INVESTIGATION]: [
    COMPLAINT_STATUS.RESOLVED,
    COMPLAINT_STATUS.REJECTED,
  ],
  [COMPLAINT_STATUS.RESOLVED]: [],
  [COMPLAINT_STATUS.REJECTED]: [],
});

/**
 * Roles authorized to advance or resolve complaints.
 * Residents (OWNER, TENANT) lodge grievances but cannot arbitrate or resolve them.
 */
export const COMPLAINT_MANAGEMENT_ROLES = Object.freeze([
  ROLES.MANAGER,
  ROLES.BUILDING_ADMIN,
  ROLES.SUPER_ADMIN,
]);

// =====================  TRANSITION VALIDATOR  ==============
/**
 * Pure state machine validator for grievance ticket lifecycle.
 *
 * @param {string} currentStatus - Current status of the complaint.
 * @param {string} targetStatus - Desired target status.
 * @param {Object} actor - Authenticated JWT user object.
 * @param {string} [resolutionNotes] - Optional notes required for resolution or rejection.
 * @returns {boolean} True if transition is structurally and contextually valid.
 * @throws {ApiError} 400 or 403 if transition violates lifecycle invariants.
 */
export const validateComplaintTransition = (
  currentStatus,
  targetStatus,
  actor,
  resolutionNotes
) => {
  // 1. Role Authorization Guard
  if (!COMPLAINT_MANAGEMENT_ROLES.includes(actor.role)) {
    throw new ApiError(
      403,
      `Access forbidden: Role '${actor.role}' is not authorized to alter complaint lifecycle state`,
      [],
      ERROR_CODES.FORBIDDEN
    );
  }

  // 2. Terminal State Guard
  if (
    currentStatus === COMPLAINT_STATUS.RESOLVED ||
    currentStatus === COMPLAINT_STATUS.REJECTED
  ) {
    throw new ApiError(
      400,
      `Illegal transition: Complaint is already in terminal state '${currentStatus}' and cannot be modified`,
      [],
      ERROR_CODES.BAD_REQUEST
    );
  }

  // 3. Permitted Transition Graph Guard
  const allowedNext = ALLOWED_COMPLAINT_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    // Specific error messages for clear domain feedback
    if (
      currentStatus === COMPLAINT_STATUS.OPEN &&
      (targetStatus === COMPLAINT_STATUS.RESOLVED ||
        targetStatus === COMPLAINT_STATUS.REJECTED)
    ) {
      throw new ApiError(
        400,
        `Invalid lifecycle transition: Complaint in state '${currentStatus}' must be '${COMPLAINT_STATUS.UNDER_INVESTIGATION}' before it can be resolved or rejected`,
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    throw new ApiError(
      400,
      `Cannot transition complaint from '${currentStatus}' to '${targetStatus}'. Allowed transitions: ${allowedNext.join(", ") || "none"}`,
      [],
      ERROR_CODES.BAD_REQUEST
    );
  }

  // 4. Resolution Notes Requirement Guard
  if (
    (targetStatus === COMPLAINT_STATUS.RESOLVED ||
      targetStatus === COMPLAINT_STATUS.REJECTED) &&
    (!resolutionNotes || !resolutionNotes.trim())
  ) {
    throw new ApiError(
      400,
      `Formal resolution notes are strictly required when transitioning complaint to '${targetStatus}'`,
      [],
      ERROR_CODES.BAD_REQUEST
    );
  }

  return true;
};
