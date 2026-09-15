// =====================  STATUS CONSTANTS & MAPPINGS  ========
export const STATUSES = Object.freeze({
  // User Statuses
  USER: {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
  },

  // Building Statuses
  BUILDING: {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    UNDER_CONSTRUCTION: "UNDER_CONSTRUCTION",
  },

  // Flat Occupancy Statuses
  FLAT: {
    VACANT: "VACANT",
    OCCUPIED: "OCCUPIED",
    UNDER_MAINTENANCE: "UNDER_MAINTENANCE",
    INACTIVE: "INACTIVE",
  },

  // Tenant Statuses
  TENANT: {
    ACTIVE: "ACTIVE",
    MOVED_OUT: "MOVED_OUT",
    TERMINATED: "TERMINATED",
  },

  // Police Verification Statuses
  POLICE_VERIFICATION: {
    PENDING: "PENDING",
    VERIFIED: "VERIFIED",
    REJECTED: "REJECTED",
  },

  // Staff Statuses
  STAFF: {
    ACTIVE: "ACTIVE",
    ON_LEAVE: "ON_LEAVE",
    TERMINATED: "TERMINATED",
  },

  // Maintenance Request Statuses
  MAINTENANCE_REQUEST: {
    OPEN: "OPEN",
    TRIAGED: "TRIAGED",
    ASSIGNED: "ASSIGNED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    VERIFIED: "VERIFIED",
    CLOSED: "CLOSED",
    CANCELLED: "CANCELLED",
  },

  // Invoice Statuses
  INVOICE: {
    DRAFT: "DRAFT",
    ISSUED: "ISSUED",
    PARTIALLY_PAID: "PARTIALLY_PAID",
    PAID: "PAID",
    OVERDUE: "OVERDUE",
    VOID: "VOID",
  },

  // Complaint Statuses
  COMPLAINT: {
    OPEN: "OPEN",
    UNDER_INVESTIGATION: "UNDER_INVESTIGATION",
    RESOLVED: "RESOLVED",
    REJECTED: "REJECTED",
  },

  // Review Moderation Statuses
  REVIEW: {
    PUBLISHED: "PUBLISHED",
    FLAGGED: "FLAGGED",
    HIDDEN: "HIDDEN",
  },

  // Expense Statuses
  EXPENSE: {
    PENDING_APPROVAL: "PENDING_APPROVAL",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    PAID: "PAID",
  },

  // Visitor Statuses
  VISITOR: {
    EXPECTED: "EXPECTED",
    CHECKED_IN: "CHECKED_IN",
    CHECKED_OUT: "CHECKED_OUT",
    EXPIRED: "EXPIRED",
    DENIED: "DENIED",
  },
});

/**
 * Maps any system status string to a Material UI Chip color
 */
export const STATUS_COLOR_MAP = Object.freeze({
  // Success / Active states
  ACTIVE: "success",
  PAID: "success",
  COMPLETED: "success",
  RESOLVED: "success",
  APPROVED: "success",
  VERIFIED: "success",
  PUBLISHED: "success",
  CHECKED_IN: "success",

  // Warning / In-progress states
  PENDING: "warning",
  PENDING_APPROVAL: "warning",
  UNDER_INVESTIGATION: "warning",
  UNDER_MAINTENANCE: "warning",
  PARTIALLY_PAID: "warning",
  IN_PROGRESS: "warning",
  TRIAGED: "warning",
  ASSIGNED: "info",
  EXPECTED: "info",
  FLAGGED: "warning",
  ON_LEAVE: "warning",
  DRAFT: "default",

  // Danger / Terminated states
  OVERDUE: "error",
  REJECTED: "error",
  SUSPENDED: "error",
  CANCELLED: "error",
  VOID: "error",
  TERMINATED: "error",
  DENIED: "error",
  HIDDEN: "error",
  EXPIRED: "error",

  // Neutral / Passive states
  INACTIVE: "default",
  VACANT: "default",
  OCCUPIED: "primary",
  CLOSED: "default",
  MOVED_OUT: "default",
  CHECKED_OUT: "default",
  UNDER_CONSTRUCTION: "info",
});
