import express from "express";

const app = express();

app.use(express.json());

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

export default app;
