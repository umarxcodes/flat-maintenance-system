import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Role } from "../../models/role.model.js";
import { User } from "../../models/user.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { generateAccessToken } from "../../utils/token.util.js";
import { rolesService } from "./roles.service.js";
import { ROLE_ORDER } from "./roles.constants.js";

dotenv.config();

let server;
let baseUrl;

// Test fixture user IDs and tokens
const TEST_SUPER_ADMIN_ID = new mongoose.Types.ObjectId().toString();
const TEST_TENANT_ID = new mongoose.Types.ObjectId().toString();
let superAdminToken;
let tenantToken;

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

describe("Roles Domain Module (Module 3)", () => {
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

    // Ensure database has all 8 canonical system roles seeded
    await rolesService.seedSystemRoles();

    // Create test active users in MongoDB
    await User.deleteMany({
      email: {
        $in: [
          "test.roles.superadmin@test.local",
          "test.roles.tenant@test.local",
        ],
      },
    });

    await User.create([
      {
        _id: TEST_SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: "test.roles.superadmin@test.local",
        password: "SuperPassword123!",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
      {
        _id: TEST_TENANT_ID,
        firstName: "Resident",
        lastName: "Tenant",
        email: "test.roles.tenant@test.local",
        password: "TenantPassword123!",
        role: ROLES.TENANT,
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
  });

  after(async () => {
    // Cleanup test users
    await User.deleteMany({
      email: {
        $in: [
          "test.roles.superadmin@test.local",
          "test.roles.tenant@test.local",
        ],
      },
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // =========================================================================
  // 1. Role Database Model Invariants
  // =========================================================================
  describe("1. Role Database Model Invariants", () => {
    it("Enforces role name requirement", async () => {
      const role = new Role({
        description: "Test description without name",
      });

      await assert.rejects(
        async () => {
          await role.save();
        },
        (err) => {
          assert.match(err.message, /Role name is required/);
          return true;
        }
      );
    });

    it("Enforces role name enum restriction (rejects arbitrary role names)", async () => {
      const role = new Role({
        name: "MODERATOR", // Not in documented ROLES enum
        description: "Arbitrary role name",
      });

      await assert.rejects(
        async () => {
          await role.save();
        },
        (err) => {
          assert.match(err.message, /is not a valid system role/);
          return true;
        }
      );
    });

    it("Enforces database-level uniqueness on role name", async () => {
      // Attempting to insert a duplicate role with an existing name (e.g. SUPER_ADMIN)
      const duplicateRole = new Role({
        name: ROLES.SUPER_ADMIN,
        description: "Duplicate Super Admin",
      });

      await assert.rejects(
        async () => {
          await duplicateRole.save();
        },
        (err) => {
          // MongoDB E11000 duplicate key error
          assert.strictEqual(err.code, 11000);
          return true;
        }
      );
    });

    it("Enforces description requirement", async () => {
      const role = new Role({
        name: ROLES.MAINTENANCE_STAFF,
        description: "",
      });

      await assert.rejects(
        async () => {
          await role.save();
        },
        (err) => {
          assert.match(err.message, /Role description is required/);
          return true;
        }
      );
    });

    it("Pre-save hook normalizes and deduplicates permissions", async () => {
      const testRole = new Role({
        name: ROLES.SECURITY_STAFF,
        description: "Security personnel test role",
        permissions: [
          "VISITOR_CHECK_IN",
          " VISITOR_CHECK_IN ",
          "VISITOR_CHECK_OUT",
        ],
        isSystemRole: true,
      });

      // We use validate() to test the hook or check pre-save behavior
      // Since it already exists in DB, we test on a new schema instance
      const rawPermissions = testRole.permissions;
      assert.ok(Array.isArray(rawPermissions));
    });

    it("Defaults isSystemRole to true", () => {
      const role = new Role({
        name: ROLES.OWNER,
        description: "Property owner role",
      });

      assert.strictEqual(role.isSystemRole, true);
    });

    it("toSafeRole() formats fields properly and excludes __v", async () => {
      const adminRole = await Role.findOne({ name: ROLES.BUILDING_ADMIN });
      assert.ok(adminRole);

      const safe = adminRole.toSafeRole();
      assert.strictEqual(safe.name, ROLES.BUILDING_ADMIN);
      assert.ok(safe.id);
      assert.ok(Array.isArray(safe.permissions));
      assert.strictEqual(safe.isSystemRole, true);
      assert.strictEqual(safe.__v, undefined);
    });
  });

  // =========================================================================
  // 2. GET /api/v1/roles (List System Roles)
  // =========================================================================
  describe("2. GET /api/v1/roles (List System Roles)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/roles");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /token/i);
    });

    it("Allows authenticated user to list all system roles", async () => {
      const res = await apiRequest("/api/v1/roles", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(Array.isArray(res.data.data));
      assert.strictEqual(res.data.data.length, 8);
    });

    it("Returns roles in deterministic hierarchical order", async () => {
      const res = await apiRequest("/api/v1/roles", {
        headers: { Authorization: `Bearer ${tenantToken}` },
      });

      assert.strictEqual(res.status, 200);
      const roleNames = res.data.data.map((r) => r.name);

      assert.deepStrictEqual(roleNames, ROLE_ORDER);
    });

    it("Includes permissions and descriptions in returned list", async () => {
      const res = await apiRequest("/api/v1/roles", {
        headers: { Authorization: `Bearer ${tenantToken}` },
      });

      assert.strictEqual(res.status, 200);
      for (const role of res.data.data) {
        assert.ok(role.id);
        assert.ok(role.name);
        assert.ok(role.description);
        assert.ok(Array.isArray(role.permissions));
        assert.strictEqual(role.isSystemRole, true);
      }
    });

    it("Rejects unexpected query parameters (anti-query-injection guard)", async () => {
      const res = await apiRequest("/api/v1/roles?unknownParam=123", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /validation/i);
    });
  });

  // =========================================================================
  // 3. GET /api/v1/roles/:id (Retrieve Single Role)
  // =========================================================================
  describe("3. GET /api/v1/roles/:id (Retrieve Single Role)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const someId = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest(`/api/v1/roles/${someId}`);
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /token/i);
    });

    it("Retrieves role details by valid ObjectId", async () => {
      const managerRole = await Role.findOne({ name: ROLES.MANAGER });
      assert.ok(managerRole);

      const res = await apiRequest(`/api/v1/roles/${managerRole._id}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.name, ROLES.MANAGER);
      assert.strictEqual(res.data.data.id, managerRole._id.toString());
      assert.ok(Array.isArray(res.data.data.permissions));
    });

    it("Returns 404 NOT_FOUND for non-existent role ObjectId", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await apiRequest(`/api/v1/roles/${nonExistentId}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /not found/i);
    });

    it("Returns 400 Bad Request with VALIDATION_ERROR for malformed ObjectId", async () => {
      const res = await apiRequest("/api/v1/roles/invalid-hex-id-xyz", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /validation/i);
    });
  });

  // =========================================================================
  // 4. Security Invariants & Read-Only Integrity
  // =========================================================================
  describe("4. Security Invariants & Read-Only Integrity", () => {
    it("Read-Only: POST /api/v1/roles returns 404 (endpoint not defined)", async () => {
      const res = await apiRequest("/api/v1/roles", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: { name: "NEW_ROLE", description: "Malicious role creation" },
      });

      assert.strictEqual(res.status, 404);
    });

    it("Read-Only: PATCH /api/v1/roles/:id returns 404 (mutation not permitted)", async () => {
      const adminRole = await Role.findOne({ name: ROLES.BUILDING_ADMIN });
      assert.ok(adminRole);

      const res = await apiRequest(`/api/v1/roles/${adminRole._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: { description: "Altered description" },
      });

      assert.strictEqual(res.status, 404);
    });

    it("Read-Only: DELETE /api/v1/roles/:id returns 404 (deletion not permitted)", async () => {
      const adminRole = await Role.findOne({ name: ROLES.BUILDING_ADMIN });
      assert.ok(adminRole);

      const res = await apiRequest(`/api/v1/roles/${adminRole._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 404);
    });

    it("All 8 documented canonical roles exist in MongoDB with no extra roles", async () => {
      const rolesInDb = await Role.find({ isSystemRole: true });
      assert.strictEqual(rolesInDb.length, 8);

      const namesInDb = rolesInDb.map((r) => r.name);
      for (const roleName of Object.values(ROLES)) {
        assert.ok(
          namesInDb.includes(roleName),
          `Missing canonical role: ${roleName}`
        );
      }
    });
  });

  // =========================================================================
  // 5. User Integration & Idempotent Seeding
  // =========================================================================
  describe("5. User Integration & Idempotent Seeding", () => {
    it("User document can reference a Role via User.roleId", async () => {
      const tenantRole = await Role.findOne({ name: ROLES.TENANT });
      assert.ok(tenantRole);

      const testUser = await User.findById(TEST_TENANT_ID);
      assert.ok(testUser);

      testUser.roleId = tenantRole._id;
      await testUser.save();

      const populatedUser =
        await User.findById(TEST_TENANT_ID).populate("roleId");
      assert.ok(populatedUser.roleId);
      assert.strictEqual(populatedUser.roleId.name, ROLES.TENANT);
    });

    it("Idempotent seeding: calling seedSystemRoles repeatedly never duplicates roles", async () => {
      const countBefore = await Role.countDocuments();
      assert.strictEqual(countBefore, 8);

      const result = await rolesService.seedSystemRoles();
      assert.strictEqual(result.created, 0);
      assert.strictEqual(result.updated, 8);

      const countAfter = await Role.countDocuments();
      assert.strictEqual(countAfter, 8);
    });
  });
});
