import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { cookieParser } from "./middlewares/cookie.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ApiError } from "./utils/ApiError.js";
import { ERROR_CODES } from "./constants/error-codes.constant.js";
import apiV1Router from "./routes/index.js";

const app = express();

// Security HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
  })
);

// Strict CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Response compression
app.use(compression());

// Body & Cookie Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser);

// Public Root & Health Check Endpoints (Preserved for infrastructure smoke tests)
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is working fine",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend API is healthy",
  });
});

// Centralized Domain Gateway Routing
app.use("/api/v1", apiV1Router);

// 404 Route Not Found Handler
app.use((req, res, next) => {
  next(
    new ApiError(
      404,
      `Cannot ${req.method} ${req.originalUrl} - Endpoint not found`,
      [],
      ERROR_CODES.NOT_FOUND
    )
  );
});

// Centralized Global Error Handler
app.use(errorHandler);

export default app;
