// =====================  IMPORTS  ==========================
import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import rolesRoutes from "../modules/roles/roles.routes.js";
import permissionsRoutes from "../modules/permissions/permissions.routes.js";
import buildingsRoutes from "../modules/buildings/buildings.routes.js";
import blocksRoutes from "../modules/blocks/blocks.routes.js";
import floorsRoutes from "../modules/floors/floors.routes.js";
import ownersRoutes from "../modules/owners/owners.routes.js";
import tenantsRoutes from "../modules/tenants/tenants.routes.js";
import staffRoutes from "../modules/staff/staff.routes.js";
import maintenanceConfigurationRoutes from "../modules/maintenance-configurations/maintenance-configuration.routes.js";
import maintenanceRequestRoutes from "../modules/maintenance-requests/maintenance-requests.routes.js";
import invoiceRoutes from "../modules/invoices/invoices.routes.js";
import complaintRoutes from "../modules/complaints/complaints.routes.js";
import reviewRoutes from "../modules/reviews/reviews.routes.js";
import noticeRoutes from "../modules/notices/notices.routes.js";
import notificationRoutes from "../modules/notifications/notifications.routes.js";
import expenseRoutes from "../modules/expenses/expenses.routes.js";
import visitorRoutes from "../modules/visitors/visitors.routes.js";
import documentRoutes from "../modules/documents/documents.routes.js";
import reportRoutes from "../modules/reports/reports.routes.js";

// =====================  ROUTER SETUP  ======================
const apiV1Router = Router();

// =====================  DOMAIN MODULE ROUTES  ==============
// Module 1: Authentication & Sessions
apiV1Router.use("/auth", authRoutes);

// Module 2: Users & Profiles
apiV1Router.use("/users", usersRoutes);

// Module 3: Roles
apiV1Router.use("/roles", rolesRoutes);

// Module 4: Permissions Registry
apiV1Router.use("/permissions", permissionsRoutes);

// Module 5: Buildings
apiV1Router.use("/buildings", buildingsRoutes);

// Module 6: Blocks / Towers
apiV1Router.use("/blocks", blocksRoutes);

// Module 7: Floors / Levels
apiV1Router.use("/floors", floorsRoutes);

// Module 9: Owners
apiV1Router.use("/owners", ownersRoutes);

// Module 10: Tenants
apiV1Router.use("/tenants", tenantsRoutes);

// Module 11: Staff
apiV1Router.use("/staff", staffRoutes);

// Module 12: Maintenance Configurations
apiV1Router.use("/maintenance-configurations", maintenanceConfigurationRoutes);

// Module 13: Maintenance Requests / Work Orders
apiV1Router.use("/maintenance-requests", maintenanceRequestRoutes);

// Module 14: Invoices & Batch Billing Engine
apiV1Router.use("/invoices", invoiceRoutes);

// Module 16: Complaints & SLA Ticket Management
apiV1Router.use("/complaints", complaintRoutes);

// Module 17: Ratings & Service Reviews
apiV1Router.use("/reviews", reviewRoutes);

// Module 18: Society Notices & Announcements
apiV1Router.use("/notices", noticeRoutes);

// Module 19: In-App Notifications
apiV1Router.use("/notifications", notificationRoutes);

// Module 20: Society Operational Expenses
apiV1Router.use("/expenses", expenseRoutes);

// Module 21: Visitors & Digital Gate Passes
apiV1Router.use("/visitors", visitorRoutes);

// Module 22: Documents Repository & Access Control
apiV1Router.use("/documents", documentRoutes);

// Module 23: Reports & Analytics Engine
apiV1Router.use("/reports", reportRoutes);

// =====================  EXPORTS  ===========================
export { apiV1Router };
export default apiV1Router;
