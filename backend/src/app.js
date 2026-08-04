import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("Api is working Fine   !");
});

export default app;
