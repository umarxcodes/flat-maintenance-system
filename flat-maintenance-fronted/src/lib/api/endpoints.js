// =====================  CENTRALIZED API ENDPOINTS MAP  ========
/**
 * Exact routes mirroring backend routes/index.js under /api/v1
 */
export const API_ENDPOINTS = Object.freeze({
  // Module 1: Auth
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    REFRESH_TOKEN: "/auth/refresh-token",
    ME: "/auth/me",
  },

  // Module 2: Users
  USERS: {
    BASE: "/users",
    BY_ID: (id) => `/users/${id}`,
    STATUS: (id) => `/users/${id}/status`,
    PROFILE: "/users/profile",
  },

  // Module 3: Roles
  ROLES: {
    BASE: "/roles",
    BY_ID: (id) => `/roles/${id}`,
  },

  // Module 4: Permissions
  PERMISSIONS: {
    BASE: "/permissions",
  },

  // Module 5: Buildings
  BUILDINGS: {
    BASE: "/buildings",
    BY_ID: (id) => `/buildings/${id}`,
  },

  // Module 6: Blocks
  BLOCKS: {
    BASE: "/blocks",
    BY_ID: (id) => `/blocks/${id}`,
  },

  // Module 7: Floors
  FLOORS: {
    BASE: "/floors",
    BY_ID: (id) => `/floors/${id}`,
  },

  // Module 8: Flats
  FLATS: {
    BASE: "/flats",
    BY_ID: (id) => `/flats/${id}`,
    STATUS: (id) => `/flats/${id}/status`,
  },

  // Module 9: Owners
  OWNERS: {
    BASE: "/owners",
    BY_ID: (id) => `/owners/${id}`,
  },

  // Module 10: Tenants
  TENANTS: {
    BASE: "/tenants",
    BY_ID: (id) => `/tenants/${id}`,
    MOVE_OUT: (id) => `/tenants/${id}/move-out`,
  },

  // Module 11: Staff
  STAFF: {
    BASE: "/staff",
    BY_ID: (id) => `/staff/${id}`,
  },

  // Module 12: Maintenance Configurations
  MAINTENANCE_CONFIGURATIONS: {
    BASE: "/maintenance-configurations",
    BY_ID: (id) => `/maintenance-configurations/${id}`,
    ACTIVE: (buildingId) => `/maintenance-configurations/active/${buildingId}`,
    HISTORY: (buildingId) => `/maintenance-configurations/history/${buildingId}`,
  },

  // Module 13: Maintenance Requests
  MAINTENANCE_REQUESTS: {
    BASE: "/maintenance-requests",
    BY_ID: (id) => `/maintenance-requests/${id}`,
    ASSIGN: (id) => `/maintenance-requests/${id}/assign`,
    STATUS: (id) => `/maintenance-requests/${id}/status`,
    VERIFY: (id) => `/maintenance-requests/${id}/verify`,
  },

  // Module 14: Invoices
  INVOICES: {
    BASE: "/invoices",
    BY_ID: (id) => `/invoices/${id}`,
    GENERATE_BATCH: "/invoices/generate-batch",
    VOID: (id) => `/invoices/${id}/void`,
  },

  // Module 15: Payments
  PAYMENTS: {
    BASE: "/payments",
    BY_ID: (id) => `/payments/${id}`,
    RECEIPT: (id) => `/payments/${id}/receipt`,
  },

  // Module 16: Complaints
  COMPLAINTS: {
    BASE: "/complaints",
    BY_ID: (id) => `/complaints/${id}`,
    TRIAGE: (id) => `/complaints/${id}/triage`,
    ASSIGN: (id) => `/complaints/${id}/assign`,
    RESOLVE: (id) => `/complaints/${id}/resolve`,
  },

  // Module 17: Reviews
  REVIEWS: {
    BASE: "/reviews",
    BY_ID: (id) => `/reviews/${id}`,
    MODERATE: (id) => `/reviews/${id}/moderate`,
  },

  // Module 18: Notices
  NOTICES: {
    BASE: "/notices",
    BY_ID: (id) => `/notices/${id}`,
    RETRACT: (id) => `/notices/${id}/retract`,
  },

  // Module 19: Notifications
  NOTIFICATIONS: {
    BASE: "/notifications",
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: "/notifications/read-all",
    UNREAD_COUNT: "/notifications/unread-count",
  },

  // Module 20: Expenses
  EXPENSES: {
    BASE: "/expenses",
    BY_ID: (id) => `/expenses/${id}`,
    APPROVE: (id) => `/expenses/${id}/approve`,
  },

  // Module 21: Visitors
  VISITORS: {
    BASE: "/visitors",
    BY_ID: (id) => `/visitors/${id}`,
    VERIFY: "/visitors/verify",
    CHECK_IN: (id) => `/visitors/${id}/check-in`,
    CHECK_OUT: (id) => `/visitors/${id}/check-out`,
  },

  // Module 22: Documents
  DOCUMENTS: {
    BASE: "/documents",
    BY_ID: (id) => `/documents/${id}`,
  },

  // Module 23: Reports
  REPORTS: {
    MAINTENANCE_COLLECTIONS: "/reports/maintenance-collections",
    STAFF_PERFORMANCE: "/reports/staff-performance",
    COMPLAINT_SLA: "/reports/complaint-sla",
  },

  // Module 24: Audit Logs
  AUDIT_LOGS: {
    BASE: "/audit-logs",
  },
});
