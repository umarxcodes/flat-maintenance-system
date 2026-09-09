import { PERMISSIONS } from "../../constants/permissions.constant.js";

/**
 * Canonical Domain Modules Enum.
 *
 * Categorizes platform capabilities across the 24 documented system modules
 * (sourced from BACKEND_TECHNICAL_DOCUMENTATION.md Sections 29, 34, 57, and 63).
 */
export const PERMISSION_MODULES = Object.freeze({
  AUTH: "AUTH",
  USERS: "USERS",
  ROLES: "ROLES",
  PERMISSIONS: "PERMISSIONS",
  BUILDINGS: "BUILDINGS",
  BLOCKS: "BLOCKS",
  FLOORS: "FLOORS",
  FLATS: "FLATS",
  OWNERS: "OWNERS",
  TENANTS: "TENANTS",
  STAFF: "STAFF",
  MAINTENANCE_CONFIGURATIONS: "MAINTENANCE_CONFIGURATIONS",
  MAINTENANCE_REQUESTS: "MAINTENANCE_REQUESTS",
  INVOICES: "INVOICES",
  PAYMENTS: "PAYMENTS",
  COMPLAINTS: "COMPLAINTS",
  REVIEWS: "REVIEWS",
  NOTICES: "NOTICES",
  NOTIFICATIONS: "NOTIFICATIONS",
  EXPENSES: "EXPENSES",
  VISITORS: "VISITORS",
  DOCUMENTS: "DOCUMENTS",
  REPORTS: "REPORTS",
  AUDIT_LOGS: "AUDIT_LOGS",
});

/**
 * Authoritative Canonical Permission Definitions.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 12.
 *
 * Maps every machine-readable permission code to its domain module classification
 * and human-readable operational description.
 */
export const CANONICAL_PERMISSIONS_REGISTRY = Object.freeze([
  // SYSTEM & IDENTITY PERMISSIONS
  {
    code: PERMISSIONS.USER_CREATE,
    module: PERMISSION_MODULES.USERS,
    description:
      "Invite and create new user profiles across authorized tenant scopes.",
  },
  {
    code: PERMISSIONS.USER_READ,
    module: PERMISSION_MODULES.USERS,
    description:
      "View user profiles and list users within authorized building scopes.",
  },
  {
    code: PERMISSIONS.USER_UPDATE,
    module: PERMISSION_MODULES.USERS,
    description: "Update user profile metadata and contact information.",
  },
  {
    code: PERMISSIONS.USER_DELETE,
    module: PERMISSION_MODULES.USERS,
    description: "Soft-delete user accounts from the platform.",
  },
  {
    code: PERMISSIONS.USER_STATUS_UPDATE,
    module: PERMISSION_MODULES.USERS,
    description:
      "Transition user account status (active, suspended, deactivated).",
  },
  {
    code: PERMISSIONS.ROLE_MANAGE,
    module: PERMISSION_MODULES.ROLES,
    description:
      "Inspect, manage, and assign system RBAC roles and permissions.",
  },
  {
    code: PERMISSIONS.AUDIT_READ,
    module: PERMISSION_MODULES.AUDIT_LOGS,
    description:
      "Inspect immutable, append-only security and operational audit trails.",
  },

  // HIERARCHY & STRUCTURE PERMISSIONS
  {
    code: PERMISSIONS.BUILDING_CREATE,
    module: PERMISSION_MODULES.BUILDINGS,
    description:
      "Provision new residential complexes and top-level tenancy anchors.",
  },
  {
    code: PERMISSIONS.BUILDING_READ,
    module: PERMISSION_MODULES.BUILDINGS,
    description:
      "View building details and list complexes within authorized scope.",
  },
  {
    code: PERMISSIONS.BUILDING_UPDATE,
    module: PERMISSION_MODULES.BUILDINGS,
    description:
      "Modify building configuration, address metadata, and settings.",
  },
  {
    code: PERMISSIONS.BUILDING_DELETE,
    module: PERMISSION_MODULES.BUILDINGS,
    description:
      "Soft-delete residential complex (subject to zero-arrears invariant).",
  },
  {
    code: PERMISSIONS.BLOCK_MANAGE,
    module: PERMISSION_MODULES.BLOCKS,
    description:
      "Create, update, and manage architectural blocks and towers within buildings.",
  },
  {
    code: PERMISSIONS.FLOOR_MANAGE,
    module: PERMISSION_MODULES.FLOORS,
    description: "Create, update, and manage floor levels within blocks.",
  },
  {
    code: PERMISSIONS.FLAT_CREATE,
    module: PERMISSION_MODULES.FLATS,
    description: "Provision new physical flat and apartment units.",
  },
  {
    code: PERMISSIONS.FLAT_READ,
    module: PERMISSION_MODULES.FLATS,
    description:
      "View flat details, structural floor plans, and occupancy status.",
  },
  {
    code: PERMISSIONS.FLAT_UPDATE,
    module: PERMISSION_MODULES.FLATS,
    description:
      "Modify flat dimensions, occupancy state, and tenant bindings.",
  },

  // RESIDENT & STAFF PERMISSIONS
  {
    code: PERMISSIONS.OWNER_MANAGE,
    module: PERMISSION_MODULES.OWNERS,
    description:
      "Register property owners and bind legal flat ownership deeds.",
  },
  {
    code: PERMISSIONS.TENANT_MANAGE,
    module: PERMISSION_MODULES.TENANTS,
    description:
      "Register tenancy lease contracts and execute tenant move-in/out transitions.",
  },
  {
    code: PERMISSIONS.STAFF_MANAGE,
    module: PERMISSION_MODULES.STAFF,
    description: "Provision operational maintenance and security personnel.",
  },
  {
    code: PERMISSIONS.STAFF_ASSIGN,
    module: PERMISSION_MODULES.STAFF,
    description:
      "Dispatch technicians and staff personnel to active work orders.",
  },

  // FINANCIAL & BILLING PERMISSIONS
  {
    code: PERMISSIONS.BILLING_CONFIG_MANAGE,
    module: PERMISSION_MODULES.MAINTENANCE_CONFIGURATIONS,
    description:
      "Configure maintenance calculation formulas, late fee policies, and grace periods.",
  },
  {
    code: PERMISSIONS.INVOICE_GENERATE,
    module: PERMISSION_MODULES.INVOICES,
    description:
      "Trigger monthly batch invoice generation runs and automated billing cycles.",
  },
  {
    code: PERMISSIONS.INVOICE_READ,
    module: PERMISSION_MODULES.INVOICES,
    description: "View maintenance invoices, ledgers, and billing breakdowns.",
  },
  {
    code: PERMISSIONS.INVOICE_UPDATE,
    module: PERMISSION_MODULES.INVOICES,
    description: "Void, modify, or reissue draft maintenance invoices.",
  },
  {
    code: PERMISSIONS.PAYMENT_CREATE,
    module: PERMISSION_MODULES.PAYMENTS,
    description:
      "Record and settle maintenance payments across cash, card, and online channels.",
  },
  {
    code: PERMISSIONS.PAYMENT_READ,
    module: PERMISSION_MODULES.PAYMENTS,
    description:
      "View payment transaction receipts, reconciliation ledgers, and refund records.",
  },
  {
    code: PERMISSIONS.EXPENSE_CREATE,
    module: PERMISSION_MODULES.EXPENSES,
    description:
      "Log society operational vendor expenses and procurement outlays.",
  },
  {
    code: PERMISSIONS.EXPENSE_APPROVE,
    module: PERMISSION_MODULES.EXPENSES,
    description:
      "Authorize and approve society operational expense disbursements.",
  },

  // OPERATIONS & MAINTENANCE PERMISSIONS
  {
    code: PERMISSIONS.COMPLAINT_CREATE,
    module: PERMISSION_MODULES.COMPLAINTS,
    description:
      "Submit maintenance tickets, repair requests, and resident grievances.",
  },
  {
    code: PERMISSIONS.COMPLAINT_READ,
    module: PERMISSION_MODULES.COMPLAINTS,
    description: "Inspect maintenance complaints and SLA tracking statuses.",
  },
  {
    code: PERMISSIONS.COMPLAINT_TRIAGE,
    module: PERMISSION_MODULES.COMPLAINTS,
    description:
      "Triage, prioritize, and categorize maintenance service tickets.",
  },
  {
    code: PERMISSIONS.COMPLAINT_ASSIGN,
    module: PERMISSION_MODULES.COMPLAINTS,
    description:
      "Assign maintenance tickets to designated maintenance personnel.",
  },
  {
    code: PERMISSIONS.COMPLAINT_UPDATE_STATUS,
    module: PERMISSION_MODULES.COMPLAINTS,
    description:
      "Transition maintenance ticket states (in-progress, on-hold, completed).",
  },
  {
    code: PERMISSIONS.COMPLAINT_RESOLVE,
    module: PERMISSION_MODULES.COMPLAINTS,
    description:
      "Verify ticket work completion and officially resolve complaints.",
  },
  {
    code: PERMISSIONS.REVIEW_CREATE,
    module: PERMISSION_MODULES.REVIEWS,
    description:
      "Submit post-resolution service quality ratings and resident feedback.",
  },
  {
    code: PERMISSIONS.REVIEW_READ,
    module: PERMISSION_MODULES.REVIEWS,
    description:
      "View staff performance ratings and resident review statistics.",
  },

  // SECURITY, VISITORS & NOTICES
  {
    code: PERMISSIONS.VISITOR_PASS_GENERATE,
    module: PERMISSION_MODULES.VISITORS,
    description: "Pre-register digital visitor and guest entry passes.",
  },
  {
    code: PERMISSIONS.VISITOR_CHECK_IN,
    module: PERMISSION_MODULES.VISITORS,
    description: "Validate visitor passes and log gate check-in arrivals.",
  },
  {
    code: PERMISSIONS.VISITOR_CHECK_OUT,
    module: PERMISSION_MODULES.VISITORS,
    description:
      "Record visitor security gate departures and checkout timestamps.",
  },
  {
    code: PERMISSIONS.VISITOR_READ,
    module: PERMISSION_MODULES.VISITORS,
    description: "Access visitor history logs and vehicle entry registries.",
  },
  {
    code: PERMISSIONS.NOTICE_CREATE,
    module: PERMISSION_MODULES.NOTICES,
    description:
      "Publish society bulletins, maintenance notices, and emergency alerts.",
  },
  {
    code: PERMISSIONS.NOTICE_READ,
    module: PERMISSION_MODULES.NOTICES,
    description:
      "Read community bulletins, official notices, and announcements.",
  },
  {
    code: PERMISSIONS.DOCUMENT_UPLOAD,
    module: PERMISSION_MODULES.DOCUMENTS,
    description:
      "Upload society deeds, bylaws, insurance contracts, and lease records.",
  },
  {
    code: PERMISSIONS.DOCUMENT_READ,
    module: PERMISSION_MODULES.DOCUMENTS,
    description:
      "Access and download public or tenant-scoped society documents.",
  },
]);
