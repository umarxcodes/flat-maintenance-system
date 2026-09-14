// =====================  GLOBAL NAVIGATION CONFIG  ============
import { PERMISSIONS } from "./permissions.js";

/**
 * Categorized Navigation configuration tree supporting dynamic RBAC & OBAC filtering
 */
export const NAVIGATION_CONFIG = Object.freeze([
  {
    category: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        iconName: "Dashboard",
        permission: null, // Available to all authenticated users
      },
    ],
  },
  {
    category: "Access & security",
    items: [
      {
        title: "Users",
        href: "/users",
        iconName: "People",
        permission: PERMISSIONS.USER_READ,
      },
      {
        title: "Roles",
        href: "/roles",
        iconName: "Shield",
        permission: PERMISSIONS.ROLE_READ,
      },
      {
        title: "Permissions",
        href: "/permissions",
        iconName: "VpnKey",
        permission: PERMISSIONS.PERMISSION_READ,
      },
    ],
  },
  {
    category: "Property management",
    items: [
      {
        title: "Buildings",
        href: "/buildings",
        iconName: "Apartment",
        permission: PERMISSIONS.BUILDING_READ,
      },
      {
        title: "Blocks / Towers",
        href: "/blocks",
        iconName: "Domain",
        permission: PERMISSIONS.BLOCK_READ,
      },
      {
        title: "Floors",
        href: "/floors",
        iconName: "Layers",
        permission: PERMISSIONS.FLOOR_READ,
      },
      {
        title: "Flats & Units",
        href: "/flats",
        iconName: "MeetingRoom",
        permission: PERMISSIONS.FLAT_READ,
      },
    ],
  },
  {
    category: "Community & people",
    items: [
      {
        title: "Owners",
        href: "/owners",
        iconName: "PersonPin",
        permission: PERMISSIONS.OWNER_READ,
      },
      {
        title: "Tenants",
        href: "/tenants",
        iconName: "Group",
        permission: PERMISSIONS.TENANT_READ,
      },
      {
        title: "Staff & Crew",
        href: "/staff",
        iconName: "Badge",
        permission: PERMISSIONS.STAFF_READ,
      },
    ],
  },
  {
    category: "Maintenance & facility",
    items: [
      {
        title: "Configurations",
        href: "/maintenance-configurations",
        iconName: "Tune",
        permission: PERMISSIONS.CONFIG_READ,
      },
      {
        title: "Work Requests",
        href: "/maintenance-requests",
        iconName: "Build",
        permission: PERMISSIONS.REQUEST_READ,
      },
    ],
  },
  {
    category: "Billing & finance",
    items: [
      {
        title: "Invoices",
        href: "/invoices",
        iconName: "ReceiptLong",
        permission: PERMISSIONS.INVOICE_READ,
      },
      {
        title: "Payments",
        href: "/payments",
        iconName: "Payment",
        permission: PERMISSIONS.PAYMENT_READ,
      },
      {
        title: "Expenses",
        href: "/expenses",
        iconName: "AccountBalanceWallet",
        permission: PERMISSIONS.EXPENSE_READ,
      },
    ],
  },
  {
    category: "Engagement & legal",
    items: [
      {
        title: "Complaints",
        href: "/complaints",
        iconName: "ReportProblem",
        permission: PERMISSIONS.COMPLAINT_READ,
      },
      {
        title: "Reviews",
        href: "/reviews",
        iconName: "RateReview",
        permission: PERMISSIONS.REVIEW_READ,
      },
      {
        title: "Notices",
        href: "/notices",
        iconName: "Campaign",
        permission: PERMISSIONS.NOTICE_READ,
      },
      {
        title: "Notifications",
        href: "/notifications",
        iconName: "Notifications",
        permission: null, // Available to all
      },
      {
        title: "Visitors",
        href: "/visitors",
        iconName: "MeetingRoom",
        permission: PERMISSIONS.VISITOR_READ,
      },
      {
        title: "Documents",
        href: "/documents",
        iconName: "Description",
        permission: PERMISSIONS.DOCUMENT_READ,
      },
    ],
  },
  {
    category: "System intelligence",
    items: [
      {
        title: "Reports",
        href: "/reports",
        iconName: "Analytics",
        permission: PERMISSIONS.REPORT_READ,
      },
      {
        title: "Audit Logs",
        href: "/audit-logs",
        iconName: "HistoryEdu",
        permission: PERMISSIONS.AUDIT_LOG_READ,
      },
    ],
  },
]);
