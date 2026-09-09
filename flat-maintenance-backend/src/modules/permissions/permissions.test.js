import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Permission } from "../../models/permission.model.js";
import { User } from "../../models/user.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { generateAccessToken } from "../../utils/token.util.js";
import { permissionsService } from "./permissions.service.js";
import {
  PERMISSION_MODULES,
  CANONICAL_PERMISSIONS_REGISTRY,
} from "./permissions.constants.js";

dotenv.config();

let server;
let baseUrl;

// Test fixture user IDs and tokens
const TEST_SUPER_ADMIN_ID = new mongoose.Types.ObjectId().toString();
const TEST_TENANT_ID = new mongoose.Types.ObjectId().toString();
const TEST_BUILDING_ADMIN_ID = new mongoose.Types.ObjectId().toString();

let superAdminToken;
let tenantToken;
let buildingAdminToken;

// Helper to make HTTP requests against the test server
const apiRequest = (
  path,
  { method = "GET", headers = {}, body = null } = {}
) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = { ...headers };
    let requestBody = null;

    if (body) {
      reqHeaders["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
      reqHeaders["Content-Length"] = Buffer.byteLength(requestBody);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let data;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data,
          });
        });
      }
    );

    req.on("error", reject);

    if (requestBody) {
      req.write(requestBody);
    }
    req.end();
  });
};

describe("Permissions Domain Module (Module 4)", () => {
  before(async () => {
    await connectDB();

    // Start Express server on ephemeral port
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Seed canonical platform permissions
    await permissionsService.seedPermissions();

    // Clean up any stale test fixtures
    await User.deleteMany({
      email: {
        $in: [
          "test.permissions.superadmin@test.local",
          "test.permissions.tenant@test.local",
          "test.permissions.badmin@test.local",
        ],
      },
    });

    // Create test active users in MongoDB
    await User.create([
      {
        _id: TEST_SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: "test.permissions.superadmin@test.local",
        password: "SuperPassword123!",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
      {
        _id: TEST_TENANT_ID,
        firstName: "Resident",
        lastName: "Tenant",
        email: "test.permissions.tenant@test.local",
        password: "TenantPassword123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
      {
        _id: TEST_BUILDING_ADMIN_ID,
        firstName: "Building",
        lastName: "Admin",
        email: "test.permissions.badmin@test.local",
        password: "BAdminPassword123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
    ]);

    superAdminToken = generateAccessToken({
      sub: TEST_SUPER_ADMIN_ID,
      role: ROLES.SUPER_ADMIN,
    });

    tenantToken = generateAccessToken({
      sub: TEST_TENANT_ID,
      role: ROLES.TENANT,
    });

    buildingAdminToken = generateAccessToken({
      sub: TEST_BUILDING_ADMIN_ID,
      role: ROLES.BUILDING_ADMIN,
    });
  });

  after(async () => {
    // Cleanup test users
    await User.deleteMany({
      email: {
        $in: [
          "test.permissions.superadmin@test.local",
          "test.permissions.tenant@test.local",
          "test.permissions.badmin@test.local",
        ],
      },
    });

    // Clean up any ad-hoc test permissions created during model testing
    await Permission.deleteMany({
      code: { $in: ["TEST_CUSTOM_PERM", "TEST_DUP_PERM", "TEST_NORM_PERM"] },
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // =========================================================================
  // 1. Permission Database Model Invariants
  // =========================================================================
  describe("1. Permission Database Model Invariants", () => {
    it("Enforces permission code requirement", async () => {
      const doc = new Permission({
        module: PERMISSION_MODULES.USERS,
        description: "Test permission without code",
      });

      await assert.rejects(async () => {
        await doc.save();
      }, /Permission code is required/);
    });

    it("Enforces domain module requirement", async () => {
      const doc = new Permission({
        code: "TEST_WITHOUT_MODULE",
        description: "Test permission without module",
      });

      await assert.rejects(async () => {
        await doc.save();
      }, /Domain module is required/);
    });

    it("Enforces domain module enum restriction (rejects invalid modules)", async () => {
      const doc = new Permission({
        code: "TEST_INVALID_MODULE",
        module: "INVALID_MODULE_CATEGORY",
        description: "Test permission with invalid module",
      });

      await assert.rejects(async () => {
        await doc.save();
      }, /is not a valid domain module/);
    });

    it("Enforces description requirement", async () => {
      const doc = new Permission({
        code: "TEST_NO_DESC",
        module: PERMISSION_MODULES.USERS,
      });

      await assert.rejects(async () => {
        await doc.save();
      }, /Permission description is required/);
    });

    it("Enforces database-level uniqueness on permission code", async () => {
      const code = "TEST_DUP_PERM";
      await Permission.deleteOne({ code });

      await Permission.create({
        code,
        module: PERMISSION_MODULES.USERS,
        description: "Initial permission",
      });

      const duplicate = new Permission({
        code,
        module: PERMISSION_MODULES.AUTH,
        description: "Duplicate code permission",
      });

      await assert.rejects(async () => {
        await duplicate.save();
      }, /E11000/);

      await Permission.deleteOne({ code });
    });

    it("Pre-save hook normalizes uppercase and trimmed code, module, and description", async () => {
      await Permission.deleteOne({ code: "TEST_NORM_PERM" });

      const doc = await Permission.create({
        code: "  test_norm_perm  ",
        module: "  users  ",
        description: "   Padded description text.   ",
      });

      assert.equal(doc.code, "TEST_NORM_PERM");
      assert.equal(doc.module, "USERS");
      assert.equal(doc.description, "Padded description text.");

      await Permission.deleteOne({ code: "TEST_NORM_PERM" });
    });

    it("toSafePermission() formats fields properly and excludes __v and internal fields", async () => {
      const doc = await Permission.findOne({ code: PERMISSIONS.USER_CREATE });
      assert.ok(doc, "USER_CREATE permission should exist");

      const safe = doc.toSafePermission();
      assert.equal(safe.id, doc._id.toString());
      assert.equal(safe.code, PERMISSIONS.USER_CREATE);
      assert.equal(safe.module, PERMISSION_MODULES.USERS);
      assert.ok(typeof safe.description === "string");
      assert.equal(safe.__v, undefined);
      assert.equal(safe._id, undefined);
    });
  });

  // =========================================================================
  // 2. GET /api/v1/permissions Endpoint
  // =========================================================================
  describe("2. GET /api/v1/permissions (List Platform Permissions)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/permissions");

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /token|authentication/i);
    });

    it("Rejects non-privileged tenant role with 403 Forbidden", async () => {
      const res = await apiRequest("/api/v1/permissions", {
        headers: { Authorization: `Bearer ${tenantToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /forbidden|permission/i);
    });

    it("Rejects building admin lacking ROLE_MANAGE with 403 Forbidden", async () => {
      const res = await apiRequest("/api/v1/permissions", {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /forbidden|permission/i);
    });

    it("Allows SuperAdmin to retrieve canonical platform permissions", async () => {
      const res = await apiRequest("/api/v1/permissions", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.statusCode, 200);
      assert.equal(res.data.message, "Permissions retrieved successfully");
      assert.ok(Array.isArray(res.data.data));
      assert.equal(res.data.data.length, CANONICAL_PERMISSIONS_REGISTRY.length);
    });

    it("Returns permissions in deterministic order (module ASC, code ASC)", async () => {
      const res = await apiRequest("/api/v1/permissions", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      const list = res.data.data;
      assert.ok(list.length > 1);

      for (let i = 0; i < list.length - 1; i++) {
        const curr = list[i];
        const next = list[i + 1];

        if (curr.module === next.module) {
          assert.ok(
            curr.code.localeCompare(next.code) <= 0,
            `Expected ${curr.code} <= ${next.code} within module ${curr.module}`
          );
        } else {
          assert.ok(
            curr.module.localeCompare(next.module) <= 0,
            `Expected module ${curr.module} <= ${next.module}`
          );
        }
      }
    });

    it("Ensures safe public projection (no __v or raw internals in response)", async () => {
      const res = await apiRequest("/api/v1/permissions", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      const item = res.data.data[0];
      assert.ok(item.id, "Should include id");
      assert.ok(item.code, "Should include code");
      assert.ok(item.module, "Should include module");
      assert.ok(item.description, "Should include description");
      assert.equal(item.__v, undefined);
      assert.equal(item._id, undefined);
    });

    it("Rejects unexpected query parameters (anti-query-injection guard)", async () => {
      const res = await apiRequest("/api/v1/permissions?unexpectedParam=123", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /validation/i);
    });
  });

  // =========================================================================
  // 3. Security Invariants & Read-Only API
  // =========================================================================
  describe("3. Security Invariants & Read-Only API", () => {
    it("Read-Only: POST /api/v1/permissions returns 404 (endpoint not defined)", async () => {
      const res = await apiRequest("/api/v1/permissions", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          code: "MALICIOUS_PERMISSION",
          module: PERMISSION_MODULES.USERS,
          description: "Malicious insertion",
        },
      });

      assert.equal(res.status, 404);
    });

    it("Read-Only: PATCH /api/v1/permissions/:id returns 404 (mutation not permitted)", async () => {
      const perm = await Permission.findOne({ code: PERMISSIONS.USER_CREATE });
      assert.ok(perm);

      const res = await apiRequest(`/api/v1/permissions/${perm._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: { description: "Updated description" },
      });

      assert.equal(res.status, 404);
    });

    it("Read-Only: DELETE /api/v1/permissions/:id returns 404 (deletion not permitted)", async () => {
      const perm = await Permission.findOne({ code: PERMISSIONS.USER_CREATE });
      assert.ok(perm);

      const res = await apiRequest(`/api/v1/permissions/${perm._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 404);
    });
  });

  // =========================================================================
  // 4. Seeding & Service Utilities
  // =========================================================================
  describe("4. Seeding & Service Utilities", () => {
    it("Idempotent seeding: calling seedPermissions repeatedly never duplicates permissions", async () => {
      const initialCount = await Permission.countDocuments();
      assert.equal(initialCount, CANONICAL_PERMISSIONS_REGISTRY.length);

      const secondRun = await permissionsService.seedPermissions();
      assert.equal(secondRun.created, 0);
      assert.equal(secondRun.total, CANONICAL_PERMISSIONS_REGISTRY.length);

      const postCount = await Permission.countDocuments();
      assert.equal(postCount, CANONICAL_PERMISSIONS_REGISTRY.length);
    });

    it("getPermissionByCode retrieves permission by canonical string token", async () => {
      const perm = await permissionsService.getPermissionByCode(
        PERMISSIONS.INVOICE_GENERATE
      );
      assert.ok(perm);
      assert.equal(perm.code, PERMISSIONS.INVOICE_GENERATE);
      assert.equal(perm.module, PERMISSION_MODULES.INVOICES);

      const nonExistent =
        await permissionsService.getPermissionByCode("NON_EXISTENT_CODE");
      assert.equal(nonExistent, null);
    });

    it("validatePermissionCodes accurately checks sets of permission tokens", async () => {
      const validCheck = await permissionsService.validatePermissionCodes([
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.INVOICE_GENERATE,
        PERMISSIONS.BUILDING_READ,
      ]);
      assert.equal(validCheck.isValid, true);
      assert.equal(validCheck.invalidCodes.length, 0);

      const invalidCheck = await permissionsService.validatePermissionCodes([
        PERMISSIONS.USER_CREATE,
        "FAKE_PERMISSION_1",
        "FAKE_PERMISSION_2",
      ]);
      assert.equal(invalidCheck.isValid, false);
      assert.deepEqual(invalidCheck.invalidCodes, [
        "FAKE_PERMISSION_1",
        "FAKE_PERMISSION_2",
      ]);
    });
  });
});
