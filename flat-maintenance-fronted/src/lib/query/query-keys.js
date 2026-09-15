// =====================  REACT QUERY KEYS FACTORY  =============
/**
 * Query key factories ensuring standardized caching & scoped invalidation
 */
export const queryKeys = Object.freeze({
  auth: {
    me: () => ["auth", "me"],
  },
  users: {
    all: () => ["users"],
    list: (params) => ["users", "list", params],
    detail: (id) => ["users", "detail", id],
  },
  roles: {
    all: () => ["roles"],
    list: (params) => ["roles", "list", params],
    detail: (id) => ["roles", "detail", id],
  },
  permissions: {
    all: () => ["permissions"],
    list: (params) => ["permissions", "list", params],
  },
  buildings: {
    all: () => ["buildings"],
    list: (params) => ["buildings", "list", params],
    detail: (id) => ["buildings", "detail", id],
  },
  blocks: {
    all: () => ["blocks"],
    list: (params) => ["blocks", "list", params],
    detail: (id) => ["blocks", "detail", id],
  },
  floors: {
    all: () => ["floors"],
    list: (params) => ["floors", "list", params],
    detail: (id) => ["floors", "detail", id],
  },
  flats: {
    all: () => ["flats"],
    list: (params) => ["flats", "list", params],
    detail: (id) => ["flats", "detail", id],
  },
  owners: {
    all: () => ["owners"],
    list: (params) => ["owners", "list", params],
    detail: (id) => ["owners", "detail", id],
  },
  tenants: {
    all: () => ["tenants"],
    list: (params) => ["tenants", "list", params],
    detail: (id) => ["tenants", "detail", id],
  },
  staff: {
    all: () => ["staff"],
    list: (params) => ["staff", "list", params],
    detail: (id) => ["staff", "detail", id],
  },
  maintenanceConfigurations: {
    all: () => ["maintenance-configurations"],
    active: (buildingId) => ["maintenance-configurations", "active", buildingId],
    history: (buildingId) => ["maintenance-configurations", "history", buildingId],
  },
  maintenanceRequests: {
    all: () => ["maintenance-requests"],
    list: (params) => ["maintenance-requests", "list", params],
    detail: (id) => ["maintenance-requests", "detail", id],
  },
  invoices: {
    all: () => ["invoices"],
    list: (params) => ["invoices", "list", params],
    detail: (id) => ["invoices", "detail", id],
  },
  payments: {
    all: () => ["payments"],
    list: (params) => ["payments", "list", params],
    detail: (id) => ["payments", "detail", id],
  },
  complaints: {
    all: () => ["complaints"],
    list: (params) => ["complaints", "list", params],
    detail: (id) => ["complaints", "detail", id],
  },
  reviews: {
    all: () => ["reviews"],
    list: (params) => ["reviews", "list", params],
    detail: (id) => ["reviews", "detail", id],
  },
  notices: {
    all: () => ["notices"],
    list: (params) => ["notices", "list", params],
    detail: (id) => ["notices", "detail", id],
  },
  notifications: {
    all: () => ["notifications"],
    list: (params) => ["notifications", "list", params],
    unreadCount: () => ["notifications", "unread-count"],
  },
  expenses: {
    all: () => ["expenses"],
    list: (params) => ["expenses", "list", params],
    detail: (id) => ["expenses", "detail", id],
  },
  visitors: {
    all: () => ["visitors"],
    list: (params) => ["visitors", "list", params],
    detail: (id) => ["visitors", "detail", id],
  },
  documents: {
    all: () => ["documents"],
    list: (params) => ["documents", "list", params],
    detail: (id) => ["documents", "detail", id],
  },
  reports: {
    maintenanceCollections: (params) => ["reports", "maintenance-collections", params],
    staffPerformance: (params) => ["reports", "staff-performance", params],
    complaintSla: (params) => ["reports", "complaint-sla", params],
  },
  auditLogs: {
    all: () => ["audit-logs"],
    list: (params) => ["audit-logs", "list", params],
  },
});
