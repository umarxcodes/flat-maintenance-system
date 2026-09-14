// =====================  CANONICAL AUDIT LOG CONSTANTS  =============
/**
 * Canonical taxonomy for sensitive security, financial, role, and operational domain mutations.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Module 24 and backend constants.
 */

export const AUDIT_ACTIONS = Object.freeze({
  // User & Identity Lifecycle
  USER_INVITED: "USER_INVITED",
  USER_STATUS_UPDATED: "USER_STATUS_UPDATED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
  USER_BUILDING_SCOPE_CHANGED: "USER_BUILDING_SCOPE_CHANGED",

  // Financial Lifecycle
  INVOICE_GENERATED: "INVOICE_GENERATED",
  INVOICE_VOIDED: "INVOICE_VOIDED",
  PAYMENT_RECORDED: "PAYMENT_RECORDED",
  EXPENSE_CREATED: "EXPENSE_CREATED",
  EXPENSE_APPROVED: "EXPENSE_APPROVED",
  EXPENSE_REJECTED: "EXPENSE_REJECTED",
  BILLING_CONFIG_ACTIVATED: "BILLING_CONFIG_ACTIVATED",

  // Occupancy & Property Lifecycle
  FLAT_OCCUPANCY_CHANGED: "FLAT_OCCUPANCY_CHANGED",
  TENANT_LEASE_ACTIVATED: "TENANT_LEASE_ACTIVATED",
  TENANT_MOVED_OUT: "TENANT_MOVED_OUT",

  // Operational & Work Orders
  MAINTENANCE_REQUEST_ASSIGNED: "MAINTENANCE_REQUEST_ASSIGNED",
  MAINTENANCE_REQUEST_COMPLETED: "MAINTENANCE_REQUEST_COMPLETED",
  COMPLAINT_TRIAGED: "COMPLAINT_TRIAGED",
  COMPLAINT_RESOLVED: "COMPLAINT_RESOLVED",

  // Security & Document Repository
  VISITOR_PASS_GENERATED: "VISITOR_PASS_GENERATED",
  VISITOR_CHECKED_IN: "VISITOR_CHECKED_IN",
  VISITOR_CHECKED_OUT: "VISITOR_CHECKED_OUT",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_DELETED: "DOCUMENT_DELETED",
});

export const AUDIT_RESOURCE_TYPES = Object.freeze({
  USER: "USER",
  ROLE: "ROLE",
  BUILDING: "BUILDING",
  BLOCK: "BLOCK",
  FLOOR: "FLOOR",
  FLAT: "FLAT",
  OWNER: "OWNER",
  TENANT: "TENANT",
  STAFF: "STAFF",
  MAINTENANCE_CONFIG: "MAINTENANCE_CONFIG",
  MAINTENANCE_REQUEST: "MAINTENANCE_REQUEST",
  INVOICE: "INVOICE",
  PAYMENT: "PAYMENT",
  COMPLAINT: "COMPLAINT",
  REVIEW: "REVIEW",
  NOTICE: "NOTICE",
  NOTIFICATION: "NOTIFICATION",
  EXPENSE: "EXPENSE",
  VISITOR: "VISITOR",
  DOCUMENT: "DOCUMENT",
});

export const AUDIT_CATEGORIES = Object.freeze({
  SECURITY: {
    label: "Security & Access",
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    borderColor: "#DDD6FE",
    actions: [
      "USER_INVITED",
      "USER_STATUS_UPDATED",
      "USER_ROLE_CHANGED",
      "USER_BUILDING_SCOPE_CHANGED",
      "VISITOR_PASS_GENERATED",
      "VISITOR_CHECKED_IN",
      "VISITOR_CHECKED_OUT",
    ],
  },
  FINANCIAL: {
    label: "Financial Operations",
    color: "#059669",
    bgColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    actions: [
      "INVOICE_GENERATED",
      "INVOICE_VOIDED",
      "PAYMENT_RECORDED",
      "EXPENSE_CREATED",
      "EXPENSE_APPROVED",
      "EXPENSE_REJECTED",
      "BILLING_CONFIG_ACTIVATED",
    ],
  },
  PROPERTY: {
    label: "Property & Occupancy",
    color: "#0284C7",
    bgColor: "#F0F9FF",
    borderColor: "#BAE6FD",
    actions: [
      "FLAT_OCCUPANCY_CHANGED",
      "TENANT_LEASE_ACTIVATED",
      "TENANT_MOVED_OUT",
    ],
  },
  OPERATIONS: {
    label: "Maintenance & Operations",
    color: "#D97706",
    bgColor: "#FFFBEB",
    borderColor: "#FDE68A",
    actions: [
      "MAINTENANCE_REQUEST_ASSIGNED",
      "MAINTENANCE_REQUEST_COMPLETED",
      "COMPLAINT_TRIAGED",
      "COMPLAINT_RESOLVED",
      "DOCUMENT_UPLOADED",
      "DOCUMENT_DELETED",
    ],
  },
});

export const getActionCategory = (action) => {
  if (!action) return AUDIT_CATEGORIES.OPERATIONS;
  const act = action.toUpperCase();
  for (const cat of Object.values(AUDIT_CATEGORIES)) {
    if (cat.actions.includes(act)) {
      return cat;
    }
  }
  return AUDIT_CATEGORIES.SECURITY;
};
