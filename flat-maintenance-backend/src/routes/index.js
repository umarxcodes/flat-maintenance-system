import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import usersRoutes from "../modules/users/users.routes.js";

const apiV1Router = Router();

// Module 1: Authentication & Sessions
apiV1Router.use("/auth", authRoutes);

// Module 2: Users & Profiles
apiV1Router.use("/users", usersRoutes);

export default apiV1Router;
