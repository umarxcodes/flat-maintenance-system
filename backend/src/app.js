import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("App is Working Fine !");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;
