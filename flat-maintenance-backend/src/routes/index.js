import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";

const apiV1Router = Router();

// Module 1: Authentication & Sessions
apiV1Router.use("/auth", authRoutes);

export default apiV1Router;
