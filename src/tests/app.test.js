import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import http from "node:http";
import app from "../app.js";

describe("App routes", () => {
  let server;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, resolve);
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test("GET / returns 200 with working message", async () => {
    const address = server.address();
    const response = await new Promise((resolve, reject) => {
      http
        .get(`http://127.0.0.1:${address.port}/`, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve({ status: res.statusCode, body: data }));
        })
        .on("error", reject);
    });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body, "App is Working Fine !");
  });

  test("GET /health returns 200 with success status", async () => {
    const address = server.address();
    const response = await new Promise((resolve, reject) => {
      http
        .get(`http://127.0.0.1:${address.port}/health`, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve({ status: res.statusCode, body: data }));
        })
        .on("error", reject);
    });

    assert.strictEqual(response.status, 200);
    const body = JSON.parse(response.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Backend API is healthy");
  });
});
