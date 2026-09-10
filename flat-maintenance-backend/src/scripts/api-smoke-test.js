// =====================  IMPORTS  ==========================
import http from "node:http";
import app from "../app.js";

// =====================  COLOR HELPERS  =====================
// ANSI Color Helpers for Terminal Output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bgGreen: "\x1b[42m\x1b[30m",
  bgRed: "\x1b[41m\x1b[37m",
};

// =====================  TEST SERVER HELPERS  ==============
let server;
let port;
let totalPassed = 0;
let totalFailed = 0;

const startServer = () => {
  return new Promise((resolve, reject) => {
    server = http.createServer(app);
    server.listen(0, () => {
      port = server.address().port;
      resolve(port);
    });
    server.on("error", reject);
  });
};

const stopServer = () => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
};

const sendRequest = (
  path,
  { method = "GET", headers = {}, body = null } = {}
) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = http.request(
      `http://127.0.0.1:${port}${path}`,
      { method, headers },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => (responseBody += chunk));
        res.on("end", () => {
          const duration = Date.now() - startTime;
          let parsedData;
          try {
            parsedData = JSON.parse(responseBody);
          } catch {
            parsedData = responseBody;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData,
            duration,
          });
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "object" ? JSON.stringify(body) : body);
    }
    req.end();
  });
};

const assertTest = (name, condition, details = "") => {
  if (condition) {
    totalPassed++;
    console.log(
      `  ${colors.green}[PASS]${colors.reset} - ${name} ${colors.dim}(${details})${colors.reset}`
    );
  } else {
    totalFailed++;
    console.log(
      `  ${colors.red}[FAIL]${colors.reset} - ${name} ${colors.dim}(${details})${colors.reset}`
    );
  }
};

// =====================  TEST RUNNER  =======================
const runSmokeTest = async () => {
  console.log(
    "\n" +
      colors.bright +
      colors.cyan +
      "STARTING AUTOMATED API SMOKE TEST..." +
      colors.reset +
      "\n"
  );
  const startTime = Date.now();

  try {
    await startServer();
    console.log(
      `${colors.dim}Test server running on http://127.0.0.1:${port}${colors.reset}\n`
    );

    // 1. Root Endpoint Test
    console.log(
      colors.bright + "1. Root API Endpoint (`GET /`)" + colors.reset
    );
    const rootRes = await sendRequest("/");
    assertTest(
      "Status Code is 200 OK",
      rootRes.status === 200,
      `Status: ${rootRes.status}, ${rootRes.duration}ms`
    );
    assertTest(
      "Response payload success property is true",
      rootRes.data?.success === true,
      `Message: "${rootRes.data?.message}"`
    );

    // 2. Health Endpoint Test
    console.log(
      "\n" +
        colors.bright +
        "2. Healthcheck Endpoint (`GET /health`)" +
        colors.reset
    );
    const healthRes = await sendRequest("/health");
    assertTest(
      "Status Code is 200 OK",
      healthRes.status === 200,
      `Status: ${healthRes.status}, ${healthRes.duration}ms`
    );
    assertTest(
      "Health message is returned",
      healthRes.data?.message === "Backend API is healthy",
      `Message: "${healthRes.data?.message}"`
    );

    // 3. Unknown / Non-existent Route (404 Test)
    console.log(
      "\n" +
        colors.bright +
        "3. Non-Existent Endpoint (`GET /invalid-route-xyz`)" +
        colors.reset
    );
    const unknownRes = await sendRequest("/invalid-route-xyz");
    assertTest(
      "Status Code is 404 Not Found or standard response",
      unknownRes.status === 404 || unknownRes.status === 200,
      `Status: ${unknownRes.status}, ${unknownRes.duration}ms`
    );
  } catch (error) {
    console.error(
      `\n${colors.red}CRITICAL ERROR DURING SMOKE TEST:${colors.reset}`,
      error
    );
    totalFailed++;
  } finally {
    await stopServer();
    const totalTime = Date.now() - startTime;

    console.log(
      "\n" +
        colors.bright +
        "----------------------------------------" +
        colors.reset
    );
    console.log(colors.bright + "API SMOKE TEST SUMMARY REPORT" + colors.reset);
    console.log(
      colors.bright + "----------------------------------------" + colors.reset
    );
    console.log(
      `Total Passed : ${colors.green}${colors.bright}${totalPassed}${colors.reset}`
    );
    console.log(
      `Total Failed : ${totalFailed > 0 ? colors.red : colors.dim}${colors.bright}${totalFailed}${colors.reset}`
    );
    console.log(
      `Duration     : ${colors.yellow}${totalTime} ms${colors.reset}`
    );
    console.log("----------------------------------------\n");

    if (totalFailed > 0) {
      console.log(`${colors.bgRed} SMOKE TEST FAILED ${colors.reset}\n`);
      process.exit(1);
    } else {
      console.log(
        `${colors.bgGreen} ALL API SMOKE TESTS PASSED SUCCESSFULLY ${colors.reset}\n`
      );
      process.exit(0);
    }
  }
};

// =====================  EXECUTION  ========================
runSmokeTest();
