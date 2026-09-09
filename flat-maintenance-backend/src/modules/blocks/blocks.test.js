// =====================  IMPORTS  ==========================
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Block } from "../../models/block.model.js";
import { Building } from "../../models/building.model.js";
import { User } from "../../models/user.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { BUILDING_STATUS } from "../buildings/buildings.constants.js";
import { generateAccessToken } from "../../utils/token.util.js";

// =====================  TEST FIXTURES & HELPERS  ==========
dotenv.config();

let server;
let baseUrl;

// Fixture ObjectIds
const TEST_SUPER_ADMIN_ID = new mongoose.Types.ObjectId().toString();
const TEST_BUILDING_ADMIN_ID = new mongoose.Types.ObjectId().toString();
const TEST_TENANT_ID = new mongoose.Types.ObjectId().toString();
const TEST_UNASSIGNED_USER_ID = new mongoose.Types.ObjectId().toString();

const BUILDING_A_ID = new mongoose.Types.ObjectId().toString();
const BUILDING_B_ID = new mongoose.Types.ObjectId().toString();
const BUILDING_DELETED_ID = new mongoose.Types.ObjectId().toString();

let superAdminToken;
let buildingAdminToken;
let tenantToken;
let unassignedToken;

// HTTP client helper
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

// =====================  TEST SUITE  =======================
describe("Blocks Domain Module (Module 6)", () => {
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

    // Clean up test buildings & blocks
    await Building.deleteMany({
      code: { $in: ["TEST-BLK-BLD-A", "TEST-BLK-BLD-B", "TEST-BLK-BLD-DEL"] },
    });
    await Block.deleteMany({
      name: {
        $in: [
          "Tower 1",
          "Tower 2",
          "Wing A",
          "Wing B",
          "Block X",
          "Duplicate Tower",
          "Cross Building Tower",
          "Soft Deleted Block",
          "Floor Test Block",
        ],
      },
    });

    // Create baseline test buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Test Heights Complex A",
        code: "TEST-BLK-BLD-A",
        address: {
          street: "100 Innovation Way",
          city: "Metropolis",
          state: "Federal Capital",
          postalCode: "44000",
          country: "Pakistan",
        },
        totalBlocks: 0,
        totalFlats: 0,
        status: BUILDING_STATUS.ACTIVE,
        isDeleted: false,
      },
      {
        _id: BUILDING_B_ID,
        name: "Test Heights Complex B",
        code: "TEST-BLK-BLD-B",
        address: {
          street: "200 Innovation Way",
          city: "Metropolis",
          state: "Federal Capital",
          postalCode: "44000",
          country: "Pakistan",
        },
        totalBlocks: 0,
        totalFlats: 0,
        status: BUILDING_STATUS.ACTIVE,
        isDeleted: false,
      },
      {
        _id: BUILDING_DELETED_ID,
        name: "Test Decommissioned Heights",
        code: "TEST-BLK-BLD-DEL",
        address: {
          street: "300 Old Way",
          city: "Metropolis",
          state: "Federal Capital",
          postalCode: "44000",
          country: "Pakistan",
        },
        totalBlocks: 0,
        totalFlats: 0,
        status: BUILDING_STATUS.INACTIVE,
        isDeleted: true,
        deletedAt: new Date(),
      },
    ]);

    // Clean up test users
    await User.deleteMany({
      email: {
        $in: [
          "test.blk.superadmin@test.local",
          "test.blk.admin@test.local",
          "test.blk.tenant@test.local",
          "test.blk.unassigned@test.local",
        ],
      },
    });

    // Create test active users
    await User.create([
      {
        _id: TEST_SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: "test.blk.superadmin@test.local",
        password: "SuperPassword123!",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
      {
        _id: TEST_BUILDING_ADMIN_ID,
        firstName: "Building",
        lastName: "Admin",
        email: "test.blk.admin@test.local",
        password: "AdminPassword123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: TEST_TENANT_ID,
        firstName: "Resident",
        lastName: "Tenant",
        email: "test.blk.tenant@test.local",
        password: "TenantPassword123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: TEST_UNASSIGNED_USER_ID,
        firstName: "Unassigned",
        lastName: "Admin",
        email: "test.blk.unassigned@test.local",
        password: "AdminPassword123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
    ]);

    // Generate JWT access tokens
    superAdminToken = generateAccessToken({
      sub: TEST_SUPER_ADMIN_ID,
      role: ROLES.SUPER_ADMIN,
    });

    buildingAdminToken = generateAccessToken({
      sub: TEST_BUILDING_ADMIN_ID,
      role: ROLES.BUILDING_ADMIN,
      buildingIds: [BUILDING_A_ID],
    });

    tenantToken = generateAccessToken({
      sub: TEST_TENANT_ID,
      role: ROLES.TENANT,
      buildingIds: [BUILDING_A_ID],
    });

    unassignedToken = generateAccessToken({
      sub: TEST_UNASSIGNED_USER_ID,
      role: ROLES.BUILDING_ADMIN,
      buildingIds: [],
    });
  });

  after(async () => {
    // Teardown database fixtures
    await Building.deleteMany({
      code: { $in: ["TEST-BLK-BLD-A", "TEST-BLK-BLD-B", "TEST-BLK-BLD-DEL"] },
    });
    await Block.deleteMany({
      name: {
        $in: [
          "Tower 1",
          "Tower 2",
          "Wing A",
          "Wing B",
          "Block X",
          "Duplicate Tower",
          "Cross Building Tower",
          "Soft Deleted Block",
          "Floor Test Block",
        ],
      },
    });
    await User.deleteMany({
      email: {
        $in: [
          "test.blk.superadmin@test.local",
          "test.blk.admin@test.local",
          "test.blk.tenant@test.local",
          "test.blk.unassigned@test.local",
        ],
      },
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // ========================================================
  // 1. Block Model Schema & Constraint Verification
  // ========================================================
  describe("1. Block Database Model Invariants", () => {
    it("Enforces parent buildingId requirement", async () => {
      const block = new Block({
        name: "Missing Building Block",
        totalFloors: 5,
      });

      await assert.rejects(async () => block.save(), {
        name: "ValidationError",
      });
    });

    it("Enforces block name requirement", async () => {
      const block = new Block({
        buildingId: BUILDING_A_ID,
        totalFloors: 5,
      });

      await assert.rejects(async () => block.save(), {
        name: "ValidationError",
      });
    });

    it("Enforces totalFloors requirement and non-negative constraint", async () => {
      const negativeBlock = new Block({
        buildingId: BUILDING_A_ID,
        name: "Negative Floors Block",
        totalFloors: -1,
      });

      await assert.rejects(async () => negativeBlock.save(), {
        name: "ValidationError",
      });
    });

    it("Pre-save hook trims name and uppercase-normalizes code", async () => {
      const block = new Block({
        buildingId: BUILDING_A_ID,
        name: "  Floor Test Block  ",
        code: "  twr-test  ",
        totalFloors: 10,
      });

      await block.save();

      assert.equal(block.name, "Floor Test Block");
      assert.equal(block.code, "TWR-TEST");

      // Cleanup
      await Block.findByIdAndDelete(block._id);
    });

    it("toSafeBlock() formats fields properly and excludes __v and isDeleted", async () => {
      const block = new Block({
        buildingId: BUILDING_A_ID,
        name: "Floor Test Block",
        code: "TWR-SAFE",
        totalFloors: 12,
      });

      const safe = block.toSafeBlock();
      assert.equal(safe.id, block._id.toString());
      assert.equal(safe.buildingId, BUILDING_A_ID);
      assert.equal(safe.name, "Floor Test Block");
      assert.equal(safe.code, "TWR-SAFE");
      assert.equal(safe.totalFloors, 12);
      assert.equal(safe.__v, undefined);
      assert.equal(safe.isDeleted, undefined);
      assert.equal(safe.deletedAt, undefined);
    });

    it("Compound Unique Index: Prevents duplicate block name within the same building", async () => {
      const block1 = new Block({
        buildingId: BUILDING_A_ID,
        name: "Duplicate Tower",
        code: "DUP-1",
        totalFloors: 8,
      });
      await block1.save();

      const block2 = new Block({
        buildingId: BUILDING_A_ID,
        name: "Duplicate Tower",
        code: "DUP-2",
        totalFloors: 8,
      });

      await assert.rejects(
        async () => block2.save(),
        (err) => {
          assert.equal(err.code, 11000);
          return true;
        }
      );

      // Cleanup
      await Block.findByIdAndDelete(block1._id);
    });

    it("Cross-Building Unique Scoping: Allows same block name in different buildings", async () => {
      const blockA = new Block({
        buildingId: BUILDING_A_ID,
        name: "Cross Building Tower",
        code: "CBT-A",
        totalFloors: 6,
      });
      await blockA.save();

      const blockB = new Block({
        buildingId: BUILDING_B_ID,
        name: "Cross Building Tower",
        code: "CBT-B",
        totalFloors: 6,
      });
      await blockB.save();

      assert.equal(blockA.name, blockB.name);
      assert.notEqual(
        blockA.buildingId.toString(),
        blockB.buildingId.toString()
      );

      // Cleanup
      await Block.deleteMany({ name: "Cross Building Tower" });
    });
  });

  // ========================================================
  // 2. POST /api/v1/blocks (Block Provisioning & Scope)
  // ========================================================
  describe("2. POST /api/v1/blocks (Provisioning & Scope)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/blocks", {
        method: "POST",
        body: {
          buildingId: BUILDING_A_ID,
          name: "Tower 1",
          totalFloors: 10,
        },
      });

      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    it("Rejects unauthorized roles (e.g. Tenant without BLOCK_MANAGE) with 403 Forbidden", async () => {
      const res = await apiRequest("/api/v1/blocks", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantToken}` },
        body: {
          buildingId: BUILDING_A_ID,
          name: "Tower 1",
          totalFloors: 10,
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it("IDOR Guard: BuildingAdmin cannot create a block in an unassigned building", async () => {
      // BuildingAdmin is only assigned to BUILDING_A_ID, tries to create in BUILDING_B_ID
      const res = await apiRequest("/api/v1/blocks", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          buildingId: BUILDING_B_ID,
          name: "Unauthorized Block",
          totalFloors: 10,
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it("BuildingAdmin with empty assignedBuildingIds cannot create blocks (403 Forbidden)", async () => {
      const res = await apiRequest("/api/v1/blocks", {
        method: "POST",
        headers: { Authorization: `Bearer ${unassignedToken}` },
        body: {
          buildingId: BUILDING_A_ID,
          name: "Unassigned Creation Block",
          totalFloors: 5,
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it("Rejects creation referencing a non-existent building ID with 404 Not Found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest("/api/v1/blocks", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: nonExistentId,
          name: "Ghost Building Block",
          totalFloors: 5,
        },
      });

      assert.equal(res.status, 404);
      assert.equal(res.data.success, false);
    });

    it("Rejects creation referencing a soft-deleted building with 404 Not Found", async () => {
      const res = await apiRequest("/api/v1/blocks", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: BUILDING_DELETED_ID,
          name: "Dead Complex Block",
          totalFloors: 5,
        },
      });

      assert.equal(res.status, 404);
      assert.equal(res.data.success, false);
    });

    it("Allows BuildingAdmin to provision a block in assigned building and increments totalBlocks", async () => {
      const initialBuilding = await Building.findById(BUILDING_A_ID);
      const initialCount = initialBuilding.totalBlocks;

      const res = await apiRequest("/api/v1/blocks", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          buildingId: BUILDING_A_ID,
          name: "Tower 1",
          code: "TWR-1",
          totalFloors: 15,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.name, "Tower 1");
      assert.equal(res.data.data.code, "TWR-1");
      assert.equal(res.data.data.totalFloors, 15);
      assert.equal(res.data.data.buildingId, BUILDING_A_ID);

      // Verify atomic increment of parent building totalBlocks
      const updatedBuilding = await Building.findById(BUILDING_A_ID);
      assert.equal(updatedBuilding.totalBlocks, initialCount + 1);
    });

    it("Allows SuperAdmin to provision a block in any building (global scope)", async () => {
      const res = await apiRequest("/api/v1/blocks", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: BUILDING_B_ID,
          name: "Wing A",
          code: "WNG-A",
          totalFloors: 8,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.name, "Wing A");
      assert.equal(res.data.data.buildingId, BUILDING_B_ID);
    });

    it("Rejects creation with duplicate name within the same building with 409 Conflict", async () => {
      const res = await apiRequest("/api/v1/blocks", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          buildingId: BUILDING_A_ID,
          name: "Tower 1", // Already created above
          code: "TWR-1-DUP",
          totalFloors: 20,
        },
      });

      assert.equal(res.status, 409);
      assert.equal(res.data.success, false);
    });

    it("Allows creation of the same block name in a DIFFERENT building", async () => {
      // "Tower 1" was created in Building A; creating "Tower 1" in Building B should succeed
      const res = await apiRequest("/api/v1/blocks", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: BUILDING_B_ID,
          name: "Tower 1",
          code: "TWR-1-B",
          totalFloors: 12,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.name, "Tower 1");
      assert.equal(res.data.data.buildingId, BUILDING_B_ID);
    });

    it("Rejects invalid payload with negative or missing totalFloors", async () => {
      const resMissing = await apiRequest("/api/v1/blocks", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          buildingId: BUILDING_A_ID,
          name: "Bad Block",
        },
      });

      assert.equal(resMissing.status, 400);

      const resNegative = await apiRequest("/api/v1/blocks", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          buildingId: BUILDING_A_ID,
          name: "Bad Block",
          totalFloors: -5,
        },
      });

      assert.equal(resNegative.status, 400);
    });

    it("Mass-Assignment Guard: Rejects client attempts to inject internal fields (_id, isDeleted)", async () => {
      const res = await apiRequest("/api/v1/blocks", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          buildingId: BUILDING_A_ID,
          name: "Hacked Block",
          totalFloors: 10,
          isDeleted: true,
        },
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });
  });

  // ========================================================
  // 3. GET /api/v1/blocks?buildingId=:id (Directory & Scope)
  // ========================================================
  describe("3. GET /api/v1/blocks?buildingId=:id (Listing & Scope)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest(
        `/api/v1/blocks?buildingId=${BUILDING_A_ID}`,
        {
          method: "GET",
        }
      );

      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    it("Rejects request with missing buildingId query parameter with 400 Bad Request", async () => {
      const res = await apiRequest("/api/v1/blocks", {
        method: "GET",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    it("Rejects request with malformed buildingId query parameter with 400 Bad Request", async () => {
      const res = await apiRequest("/api/v1/blocks?buildingId=invalid-id", {
        method: "GET",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    it("IDOR Guard: BuildingAdmin querying blocks of an unassigned building is rejected with 403", async () => {
      // BuildingAdmin is assigned only to BUILDING_A_ID
      const res = await apiRequest(
        `/api/v1/blocks?buildingId=${BUILDING_B_ID}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it("IDOR Guard: Tenant querying blocks of an unassigned building is rejected with 403", async () => {
      const res = await apiRequest(
        `/api/v1/blocks?buildingId=${BUILDING_B_ID}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${tenantToken}` },
        }
      );

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it("BuildingAdmin with empty assignedBuildingIds cannot list blocks (403 Forbidden)", async () => {
      const res = await apiRequest(
        `/api/v1/blocks?buildingId=${BUILDING_A_ID}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${unassignedToken}` },
        }
      );

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it("Returns 404 Not Found when querying blocks for a non-existent building ID", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest(
        `/api/v1/blocks?buildingId=${nonExistentId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      assert.equal(res.status, 404);
      assert.equal(res.data.success, false);
    });

    it("Returns 404 Not Found when querying blocks for a soft-deleted building", async () => {
      const res = await apiRequest(
        `/api/v1/blocks?buildingId=${BUILDING_DELETED_ID}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      assert.equal(res.status, 404);
      assert.equal(res.data.success, false);
    });

    it("Allows BuildingAdmin to list blocks for their authorized building complex", async () => {
      const res = await apiRequest(
        `/api/v1/blocks?buildingId=${BUILDING_A_ID}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 1);
      const names = res.data.data.map((b) => b.name);
      assert.ok(names.includes("Tower 1"));
    });

    it("Allows Tenant to list blocks for their assigned building complex", async () => {
      const res = await apiRequest(
        `/api/v1/blocks?buildingId=${BUILDING_A_ID}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${tenantToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 1);
    });

    it("Allows SuperAdmin to list blocks for any building complex (global scope)", async () => {
      const res = await apiRequest(
        `/api/v1/blocks?buildingId=${BUILDING_B_ID}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(Array.isArray(res.data.data));
      const names = res.data.data.map((b) => b.name);
      assert.ok(names.includes("Wing A"));
    });

    it("Excludes soft-deleted blocks from listing results", async () => {
      // Create a soft-deleted block in BUILDING_A_ID
      const softDeletedBlock = new Block({
        buildingId: BUILDING_A_ID,
        name: "Soft Deleted Block",
        code: "DEL-BLK",
        totalFloors: 4,
        isDeleted: true,
        deletedAt: new Date(),
      });
      await softDeletedBlock.save();

      const res = await apiRequest(
        `/api/v1/blocks?buildingId=${BUILDING_A_ID}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.equal(res.status, 200);
      const names = res.data.data.map((b) => b.name);
      assert.equal(names.includes("Soft Deleted Block"), false);

      // Cleanup
      await Block.findByIdAndDelete(softDeletedBlock._id);
    });
  });
});
