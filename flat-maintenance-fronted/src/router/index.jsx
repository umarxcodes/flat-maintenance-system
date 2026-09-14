// =====================  REACT ROUTER CONFIGURATION  ===========
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

// Layouts & Guards
import { DashboardLayout } from "../components/layout/DashboardLayout.jsx";
import { AuthLayout } from "../components/layout/AuthLayout.jsx";
import { AuthGuard } from "../components/guards/AuthGuard.jsx";
import { PermissionGuard } from "../components/guards/PermissionGuard.jsx";
import { PERMISSIONS } from "../lib/constants/permissions.js";
import { ROUTES } from "./routes.js";

// Common Pages
import { UnauthorizedPage } from "../pages/unauthorized/UnauthorizedPage.jsx";
import { NotFoundPage } from "../pages/not-found/NotFoundPage.jsx";
import { ProfilePage } from "../pages/profile/ProfilePage.jsx";

// Auth Pages (Module 1)
import { LoginPage } from "../pages/auth/LoginPage.jsx";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage.jsx";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage.jsx";

// Dashboard
import { DashboardPage } from "../pages/dashboard/DashboardPage.jsx";

// Domain Module Pages (Modules 2–24)
import { UsersListPage } from "../pages/users/UsersListPage.jsx";
import { UserDetailPage } from "../pages/users/UserDetailPage.jsx";
import { RolesListPage } from "../pages/roles/RolesListPage.jsx";
import { PermissionsListPage } from "../pages/permissions/PermissionsListPage.jsx";
import { BuildingsListPage } from "../pages/buildings/BuildingsListPage.jsx";
import { BuildingDetailPage } from "../pages/buildings/BuildingDetailPage.jsx";
import { BlocksListPage } from "../pages/blocks/BlocksListPage.jsx";
import { FloorsListPage } from "../pages/floors/FloorsListPage.jsx";
import { FlatsListPage } from "../pages/flats/FlatsListPage.jsx";
import { FlatDetailPage } from "../pages/flats/FlatDetailPage.jsx";
import { OwnersListPage } from "../pages/owners/OwnersListPage.jsx";
import { TenantsListPage } from "../pages/tenants/TenantsListPage.jsx";
import { StaffListPage } from "../pages/staff/StaffListPage.jsx";
import { MaintenanceConfigListPage } from "../pages/maintenance-configurations/MaintenanceConfigListPage.jsx";
import { MaintenanceConfigHistoryPage } from "../pages/maintenance-configurations/MaintenanceConfigHistoryPage.jsx";
import { MaintenanceRequestsListPage } from "../pages/maintenance-requests/MaintenanceRequestsListPage.jsx";
import { InvoicesListPage } from "../pages/invoices/InvoicesListPage.jsx";
import { InvoiceDetailPage } from "../pages/invoices/InvoiceDetailPage.jsx";
import { PaymentsListPage } from "../pages/payments/PaymentsListPage.jsx";
import { ComplaintsListPage } from "../pages/complaints/ComplaintsListPage.jsx";
import { ReviewsListPage } from "../pages/reviews/ReviewsListPage.jsx";
import { NoticesListPage } from "../pages/notices/NoticesListPage.jsx";
import { NotificationsListPage } from "../pages/notifications/NotificationsListPage.jsx";
import { ExpensesListPage } from "../pages/expenses/ExpensesListPage.jsx";
import { VisitorsListPage } from "../pages/visitors/VisitorsListPage.jsx";
import { VisitorVerifyPage } from "../pages/visitors/VisitorVerifyPage.jsx";
import { DocumentsListPage } from "../pages/documents/DocumentsListPage.jsx";
import { ReportsOverviewPage } from "../pages/reports/ReportsOverviewPage.jsx";
import { AuditLogsListPage } from "../pages/audit-logs/AuditLogsListPage.jsx";
import { ErrorPage } from "../pages/error/ErrorPage.jsx";

export const router = createBrowserRouter([
  // Public Authentication Routes
  {
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
      { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
    ],
  },

  // Protected Dashboard Application Routes
  {
    path: ROUTES.ROOT,
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
      { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
      { path: ROUTES.PROFILE, element: <ProfilePage /> },

      // Module 2: Users
      {
        path: ROUTES.USERS,
        element: (
          <PermissionGuard permission={PERMISSIONS.USER_READ} fallback={<UnauthorizedPage />}>
            <UsersListPage />
          </PermissionGuard>
        ),
      },
      {
        path: ROUTES.USER_DETAIL,
        element: (
          <PermissionGuard permission={PERMISSIONS.USER_READ} fallback={<UnauthorizedPage />}>
            <UserDetailPage />
          </PermissionGuard>
        ),
      },

      // Module 3: Roles
      {
        path: ROUTES.ROLES,
        element: (
          <PermissionGuard permission={PERMISSIONS.ROLE_READ} fallback={<UnauthorizedPage />}>
            <RolesListPage />
          </PermissionGuard>
        ),
      },

      // Module 4: Permissions
      {
        path: ROUTES.PERMISSIONS,
        element: (
          <PermissionGuard permission={PERMISSIONS.PERMISSION_READ} fallback={<UnauthorizedPage />}>
            <PermissionsListPage />
          </PermissionGuard>
        ),
      },

      // Module 5: Buildings
      {
        path: ROUTES.BUILDINGS,
        element: (
          <PermissionGuard permission={PERMISSIONS.BUILDING_READ} fallback={<UnauthorizedPage />}>
            <BuildingsListPage />
          </PermissionGuard>
        ),
      },
      {
        path: ROUTES.BUILDING_DETAIL,
        element: (
          <PermissionGuard permission={PERMISSIONS.BUILDING_READ} fallback={<UnauthorizedPage />}>
            <BuildingDetailPage />
          </PermissionGuard>
        ),
      },

      // Module 6: Blocks
      {
        path: ROUTES.BLOCKS,
        element: (
          <PermissionGuard permission={PERMISSIONS.BLOCK_READ} fallback={<UnauthorizedPage />}>
            <BlocksListPage />
          </PermissionGuard>
        ),
      },

      // Module 7: Floors
      {
        path: ROUTES.FLOORS,
        element: (
          <PermissionGuard permission={PERMISSIONS.FLOOR_READ} fallback={<UnauthorizedPage />}>
            <FloorsListPage />
          </PermissionGuard>
        ),
      },

      // Module 8: Flats
      {
        path: ROUTES.FLATS,
        element: (
          <PermissionGuard permission={PERMISSIONS.FLAT_READ} fallback={<UnauthorizedPage />}>
            <FlatsListPage />
          </PermissionGuard>
        ),
      },
      {
        path: ROUTES.FLAT_DETAIL,
        element: (
          <PermissionGuard permission={PERMISSIONS.FLAT_READ} fallback={<UnauthorizedPage />}>
            <FlatDetailPage />
          </PermissionGuard>
        ),
      },

      // Module 9: Owners
      {
        path: ROUTES.OWNERS,
        element: (
          <PermissionGuard permission={PERMISSIONS.OWNER_READ} fallback={<UnauthorizedPage />}>
            <OwnersListPage />
          </PermissionGuard>
        ),
      },

      // Module 10: Tenants
      {
        path: ROUTES.TENANTS,
        element: (
          <PermissionGuard permission={PERMISSIONS.TENANT_READ} fallback={<UnauthorizedPage />}>
            <TenantsListPage />
          </PermissionGuard>
        ),
      },

      // Module 11: Staff
      {
        path: ROUTES.STAFF,
        element: (
          <PermissionGuard permission={PERMISSIONS.STAFF_READ} fallback={<UnauthorizedPage />}>
            <StaffListPage />
          </PermissionGuard>
        ),
      },

      // Module 12: Maintenance Configurations
      {
        path: ROUTES.MAINTENANCE_CONFIGURATIONS,
        element: (
          <PermissionGuard permission={PERMISSIONS.CONFIG_READ} fallback={<UnauthorizedPage />}>
            <MaintenanceConfigListPage />
          </PermissionGuard>
        ),
      },
      {
        path: ROUTES.MAINTENANCE_CONFIGURATIONS_HISTORY,
        element: (
          <PermissionGuard permission={PERMISSIONS.CONFIG_READ} fallback={<UnauthorizedPage />}>
            <MaintenanceConfigHistoryPage />
          </PermissionGuard>
        ),
      },

      // Module 13: Maintenance Requests
      {
        path: ROUTES.MAINTENANCE_REQUESTS,
        element: (
          <PermissionGuard permission={PERMISSIONS.REQUEST_READ} fallback={<UnauthorizedPage />}>
            <MaintenanceRequestsListPage />
          </PermissionGuard>
        ),
      },

      // Module 14: Invoices
      {
        path: ROUTES.INVOICES,
        element: (
          <PermissionGuard permission={PERMISSIONS.INVOICE_READ} fallback={<UnauthorizedPage />}>
            <InvoicesListPage />
          </PermissionGuard>
        ),
      },
      {
        path: ROUTES.INVOICE_DETAIL,
        element: (
          <PermissionGuard permission={PERMISSIONS.INVOICE_READ} fallback={<UnauthorizedPage />}>
            <InvoiceDetailPage />
          </PermissionGuard>
        ),
      },

      // Module 15: Payments
      {
        path: ROUTES.PAYMENTS,
        element: (
          <PermissionGuard permission={PERMISSIONS.PAYMENT_READ} fallback={<UnauthorizedPage />}>
            <PaymentsListPage />
          </PermissionGuard>
        ),
      },

      // Module 16: Complaints
      {
        path: ROUTES.COMPLAINTS,
        element: (
          <PermissionGuard permission={PERMISSIONS.COMPLAINT_READ} fallback={<UnauthorizedPage />}>
            <ComplaintsListPage />
          </PermissionGuard>
        ),
      },

      // Module 17: Reviews
      {
        path: ROUTES.REVIEWS,
        element: (
          <PermissionGuard permission={PERMISSIONS.REVIEW_READ} fallback={<UnauthorizedPage />}>
            <ReviewsListPage />
          </PermissionGuard>
        ),
      },

      // Module 18: Notices
      {
        path: ROUTES.NOTICES,
        element: (
          <PermissionGuard permission={PERMISSIONS.NOTICE_READ} fallback={<UnauthorizedPage />}>
            <NoticesListPage />
          </PermissionGuard>
        ),
      },

      // Module 19: Notifications
      {
        path: ROUTES.NOTIFICATIONS,
        element: (
          <PermissionGuard
            permission={PERMISSIONS.NOTIFICATION_READ}
            fallback={<UnauthorizedPage />}
          >
            <NotificationsListPage />
          </PermissionGuard>
        ),
      },

      // Module 20: Expenses
      {
        path: ROUTES.EXPENSES,
        element: (
          <PermissionGuard permission={PERMISSIONS.EXPENSE_READ} fallback={<UnauthorizedPage />}>
            <ExpensesListPage />
          </PermissionGuard>
        ),
      },

      // Module 21: Visitors
      {
        path: ROUTES.VISITORS,
        element: (
          <PermissionGuard permission={PERMISSIONS.VISITOR_READ} fallback={<UnauthorizedPage />}>
            <VisitorsListPage />
          </PermissionGuard>
        ),
      },
      {
        path: ROUTES.VISITORS_VERIFY,
        element: (
          <PermissionGuard permission={PERMISSIONS.VISITOR_VERIFY} fallback={<UnauthorizedPage />}>
            <VisitorVerifyPage />
          </PermissionGuard>
        ),
      },

      // Module 22: Documents
      {
        path: ROUTES.DOCUMENTS,
        element: (
          <PermissionGuard permission={PERMISSIONS.DOCUMENT_READ} fallback={<UnauthorizedPage />}>
            <DocumentsListPage />
          </PermissionGuard>
        ),
      },

      // Module 23: Reports
      {
        path: ROUTES.REPORTS,
        element: (
          <PermissionGuard permission={PERMISSIONS.REPORT_READ} fallback={<UnauthorizedPage />}>
            <ReportsOverviewPage />
          </PermissionGuard>
        ),
      },

      // Module 24: Audit Logs
      {
        path: ROUTES.AUDIT_LOGS,
        element: (
          <PermissionGuard permission={PERMISSIONS.AUDIT_LOG_READ} fallback={<UnauthorizedPage />}>
            <AuditLogsListPage />
          </PermissionGuard>
        ),
      },
    ],
  },

  // Error and Fallback Routes
  { path: ROUTES.UNAUTHORIZED, element: <UnauthorizedPage /> },
  { path: "*", element: <NotFoundPage /> },
]);

export default router;
