// =====================  IMPORTS  ==========================
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Flat, FLAT_STATUS, FLAT_TYPES } from "../../models/flat.model.js";
import { Floor } from "../floors/floors.model.js";
import { Block } from "../blocks/blocks.model.js";
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
const TEST_UNASSIGNED_ADMIN_ID = new mongoose.Types.ObjectId().toString();
const TEST_TENANT_ID = new mongoose.Types.ObjectId().toString();

const BUILDING_A_ID = new mongoose.Types.ObjectId().toString();
const BUILDING_B_ID = new mongoose.Types.ObjectId().toString();

const BLOCK_A_ID = new mongoose.Types.ObjectId().toString();
const BLOCK_B_ID = new mongoose.Types.ObjectId().toString();

const FLOOR_A1_ID = new mongoose.Types.ObjectId().toString();
const FLOOR_B1_ID = new mongoose.Types.ObjectId().toString();

let superAdminToken;
let buildingAdminToken;
let unassignedAdminToken;
let tenantToken;

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

// =====================  FLATS MODULE TEST SUITE  ============
describe("Flats Domain Module (Module 8)", () => {
  before(async () => {
    await connectDB();

    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Cleanup fixtures
    await User.deleteMany({
      email: {
        $in: [
          "test.flats.superadmin@test.local",
          "test.flats.bldadmin@test.local",
          "test.flats.unassigned@test.local",
          "test.flats.tenant@test.local",
        ],
      },
    });
    await Building.deleteMany({ _id: { $in: [BUILDING_A_ID, BUILDING_B_ID] } });
    await Block.deleteMany({ _id: { $in: [BLOCK_A_ID, BLOCK_B_ID] } });
    await Floor.deleteMany({ _id: { $in: [FLOOR_A1_ID, FLOOR_B1_ID] } });
    await Flat.deleteMany({
      buildingId: { $in: [BUILDING_A_ID, BUILDING_B_ID] },
    });

    // Seed test users
    await User.create([
      {
        _id: TEST_SUPER_ADMIN_ID,
        firstName: "FlatSuper",
        lastName: "Admin",
        email: "test.flats.superadmin@test.local",
        password: "HashPassword123!",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
      {
        _id: TEST_BUILDING_ADMIN_ID,
        firstName: "FlatBld",
        lastName: "Admin",
        email: "test.flats.bldadmin@test.local",
        password: "HashPassword123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: TEST_UNASSIGNED_ADMIN_ID,
        firstName: "FlatUnassigned",
        lastName: "Admin",
        email: "test.flats.unassigned@test.local",
        password: "HashPassword123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: TEST_TENANT_ID,
        firstName: "FlatResident",
        lastName: "Tenant",
        email: "test.flats.tenant@test.local",
        password: "HashPassword123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
    ]);

    // Seed Buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Emerald Heights",
        code: "EMR-FLAT",
        address: {
          street: "100 Emerald Way",
          city: "Metropolis",
          state: "NY",
          postalCode: "10001",
          country: "USA",
        },
        status: BUILDING_STATUS.ACTIVE,
        totalBlocks: 1,
        totalFlats: 0,
      },
      {
        _id: BUILDING_B_ID,
        name: "Sapphire Towers",
        code: "SPH-FLAT",
        address: {
          street: "200 Sapphire Ave",
          city: "Metropolis",
          state: "NY",
          postalCode: "10002",
          country: "USA",
        },
        status: BUILDING_STATUS.ACTIVE,
        totalBlocks: 1,
        totalFlats: 0,
      },
    ]);

    // Seed Blocks
    await Block.create([
      {
        _id: BLOCK_A_ID,
        buildingId: BUILDING_A_ID,
        name: "Tower A",
        code: "TWR-A",
        totalFloors: 10,
      },
      {
        _id: BLOCK_B_ID,
        buildingId: BUILDING_B_ID,
        name: "Tower B",
        code: "TWR-B",
        totalFloors: 5,
      },
    ]);

    // Seed Floors
    await Floor.create([
      {
        _id: FLOOR_A1_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorNumber: 1,
        name: "Floor 1",
      },
      {
        _id: FLOOR_B1_ID,
        buildingId: BUILDING_B_ID,
        blockId: BLOCK_B_ID,
        floorNumber: 1,
        name: "Floor 1",
      },
    ]);

    // Generate JWT access tokens
    superAdminToken = generateAccessToken({
      sub: TEST_SUPER_ADMIN_ID,
      email: "test.flats.superadmin@test.local",
      role: ROLES.SUPER_ADMIN,
      buildingIds: [],
    });

    buildingAdminToken = generateAccessToken({
      sub: TEST_BUILDING_ADMIN_ID,
      email: "test.flats.bldadmin@test.local",
      role: ROLES.BUILDING_ADMIN,
      buildingIds: [BUILDING_A_ID],
    });

    unassignedAdminToken = generateAccessToken({
      sub: TEST_UNASSIGNED_ADMIN_ID,
      email: "test.flats.unassigned@test.local",
      role: ROLES.BUILDING_ADMIN,
      buildingIds: [BUILDING_B_ID],
    });

    tenantToken = generateAccessToken({
      sub: TEST_TENANT_ID,
      email: "test.flats.tenant@test.local",
      role: ROLES.TENANT,
      buildingIds: [BUILDING_A_ID],
    });
  });

  after(async () => {
    await User.deleteMany({
      email: {
        $in: [
          "test.flats.superadmin@test.local",
          "test.flats.bldadmin@test.local",
          "test.flats.unassigned@test.local",
          "test.flats.tenant@test.local",
        ],
      },
    });
    await Building.deleteMany({ _id: { $in: [BUILDING_A_ID, BUILDING_B_ID] } });
    await Block.deleteMany({ _id: { $in: [BLOCK_A_ID, BLOCK_B_ID] } });
    await Floor.deleteMany({ _id: { $in: [FLOOR_A1_ID, FLOOR_B1_ID] } });
    await Flat.deleteMany({
      buildingId: { $in: [BUILDING_A_ID, BUILDING_B_ID] },
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // =====================  POST /api/v1/flats  ===================
  describe("POST /api/v1/flats — Provision Flat Unit", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await apiRequest("/api/v1/flats", {
        method: "POST",
        body: {
          blockId: BLOCK_A_ID,
          floorId: FLOOR_A1_ID,
          flatNumber: "101",
          areaSqFt: 1200,
        },
      });
      assert.equal(res.status, 401);
    });

    it("should reject unauthorized role without FLAT_CREATE with 403", async () => {
      const res = await apiRequest("/api/v1/flats", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorId: FLOOR_A1_ID,
          flatNumber: "101",
          areaSqFt: 1200,
        },
      });
      assert.equal(res.status, 403);
    });

    it("should reject building admin attempting to provision flat in unassigned complex (403)", async () => {
      const res = await apiRequest("/api/v1/flats", {
        method: "POST",
        headers: { Authorization: `Bearer ${unassignedAdminToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorId: FLOOR_A1_ID,
          flatNumber: "101",
          areaSqFt: 1200,
        },
      });
      assert.equal(res.status, 403);
    });

    it("should reject hierarchy mismatch when Floor does not belong to Block (400)", async () => {
      const res = await apiRequest("/api/v1/flats", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorId: FLOOR_B1_ID, // Belongs to Block B, not Block A
          flatNumber: "101",
          areaSqFt: 1200,
        },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /hierarchy violation/i);
    });

    it("should provision flat unit successfully by authorized Building Admin (201)", async () => {
      const res = await apiRequest("/api/v1/flats", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorId: FLOOR_A1_ID,
          flatNumber: "101",
          areaSqFt: 1250,
          flatType: FLAT_TYPES.TWO_BHK,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.flatNumber, "101");
      assert.equal(res.data.data.areaSqFt, 1250);
      assert.equal(res.data.data.status, FLAT_STATUS.VACANT);
      assert.equal(res.data.data.buildingId, BUILDING_A_ID);
    });

    it("should reject duplicate flatNumber within same block with 409 Conflict", async () => {
      const res = await apiRequest("/api/v1/flats", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorId: FLOOR_A1_ID,
          flatNumber: "101", // Duplicate
          areaSqFt: 1400,
        },
      });
      assert.equal(res.status, 409);
    });
  });

  // =====================  GET /api/v1/flats  ====================
  describe("GET /api/v1/flats — Query Flat Units", () => {
    it("should list flats filtered by building scope (200)", async () => {
      const res = await apiRequest(
        `/api/v1/flats?buildingId=${BUILDING_A_ID}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(Array.isArray(res.data.data.items));
      assert.ok(res.data.data.total >= 1);
    });

    it("should reject building admin querying building outside assigned scope (403)", async () => {
      const res = await apiRequest(
        `/api/v1/flats?buildingId=${BUILDING_B_ID}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );
      assert.equal(res.status, 403);
    });
  });

  // =====================  GET /api/v1/flats/:id  ================
  describe("GET /api/v1/flats/:id — Retrieve Flat Unit", () => {
    let createdFlatId;

    before(async () => {
      const flat = await Flat.findOne({
        flatNumber: "101",
        buildingId: BUILDING_A_ID,
      });
      createdFlatId = flat._id.toString();
    });

    it("should retrieve flat details with populated references (200)", async () => {
      const res = await apiRequest(`/api/v1/flats/${createdFlatId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data._id, createdFlatId);
      assert.equal(res.data.data.flatNumber, "101");
      assert.ok(res.data.data.buildingId);
      assert.ok(res.data.data.blockId);
    });

    it("should return 404 for non-existent flat ID", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest(`/api/v1/flats/${fakeId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 404);
    });
  });

  // =====================  PATCH /api/v1/flats/:id/status  =======
  describe("PATCH /api/v1/flats/:id/status — Transition Flat Status", () => {
    let createdFlatId;

    before(async () => {
      const flat = await Flat.findOne({
        flatNumber: "101",
        buildingId: BUILDING_A_ID,
      });
      createdFlatId = flat._id.toString();
    });

    it("should transition VACANT to UNDER_MAINTENANCE successfully (200)", async () => {
      const res = await apiRequest(`/api/v1/flats/${createdFlatId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          status: FLAT_STATUS.UNDER_MAINTENANCE,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, FLAT_STATUS.UNDER_MAINTENANCE);
    });

    it("should reject invalid status transition with 400 Validation Error", async () => {
      const res = await apiRequest(`/api/v1/flats/${createdFlatId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          status: FLAT_STATUS.OCCUPIED, // Cannot jump from UNDER_MAINTENANCE directly to OCCUPIED
        },
      });

      assert.equal(res.status, 400);
      assert.match(res.data.message, /invalid status transition/i);
    });
  });
});
