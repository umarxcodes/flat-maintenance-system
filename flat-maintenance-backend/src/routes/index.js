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

// =====================  EXPORTS  ===========================
export default apiV1Router;
