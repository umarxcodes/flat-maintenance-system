import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import rolesRoutes from "../modules/roles/roles.routes.js";
import permissionsRoutes from "../modules/permissions/permissions.routes.js";

const apiV1Router = Router();

// Module 1: Authentication & Sessions
apiV1Router.use("/auth", authRoutes);

// Module 2: Users & Profiles
apiV1Router.use("/users", usersRoutes);

// Module 3: Roles
apiV1Router.use("/roles", rolesRoutes);

// Module 4: Permissions Registry
apiV1Router.use("/permissions", permissionsRoutes);

export default apiV1Router;
