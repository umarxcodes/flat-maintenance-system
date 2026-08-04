import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("App is Working Fine !");
});

export default app;
