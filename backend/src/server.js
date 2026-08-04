import http from "node:http";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.config.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api/v1`);
    });
  })
  .catch((error) => {
    console.error(`Failed to connect to database: ${error.message}`);
    process.exit(1);
  });

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received, closing server gracefully...`);
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown due to timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  server.close(() => process.exit(1));
});
