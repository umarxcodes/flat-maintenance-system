// =====================  IMPORTS  ==========================
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Floor } from "./floors.model.js";
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
const TEST_TENANT_ID = new mongoose.Types.ObjectId().toString();
const TEST_UNASSIGNED_USER_ID = new mongoose.Types.ObjectId().toString();

const BUILDING_A_ID = new mongoose.Types.ObjectId().toString();
const BUILDING_B_ID = new mongoose.Types.ObjectId().toString();
const BUILDING_DELETED_ID = new mongoose.Types.ObjectId().toString();

const BLOCK_A_ID = new mongoose.Types.ObjectId().toString();
const BLOCK_B_ID = new mongoose.Types.ObjectId().toString();
const BLOCK_DELETED_ID = new mongoose.Types.ObjectId().toString();

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

// =====================  FLOORS MODULE TEST SUITE  ===========
describe("Floors Domain Module (Module 7)", () => {
  before(async () => {
    await connectDB();

    // Start Express server on an ephemeral port
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Cleanup fixtures from prior test executions
    await User.deleteMany({
      email: {
        $in: [
          "test.floors.superadmin@test.local",
          "test.floors.bldadmin@test.local",
          "test.floors.tenant@test.local",
          "test.floors.unassigned@test.local",
        ],
      },
    });
    await Building.deleteMany({
      _id: { $in: [BUILDING_A_ID, BUILDING_B_ID, BUILDING_DELETED_ID] },
    });
    await Block.deleteMany({
      _id: { $in: [BLOCK_A_ID, BLOCK_B_ID, BLOCK_DELETED_ID] },
    });
    await Floor.deleteMany({
      $or: [
        {
          buildingId: {
            $in: [BUILDING_A_ID, BUILDING_B_ID, BUILDING_DELETED_ID],
          },
        },
        { blockId: { $in: [BLOCK_A_ID, BLOCK_B_ID, BLOCK_DELETED_ID] } },
      ],
    });

    // Seed test users
    await User.create([
      {
        _id: TEST_SUPER_ADMIN_ID,
        firstName: "FloorSuper",
        lastName: "Admin",
        email: "test.floors.superadmin@test.local",
        password: "SuperPassword123!",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
      {
        _id: TEST_BUILDING_ADMIN_ID,
        firstName: "FloorBld",
        lastName: "Admin",
        email: "test.floors.bldadmin@test.local",
        password: "AdminPassword123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: TEST_TENANT_ID,
        firstName: "FloorResident",
        lastName: "Tenant",
        email: "test.floors.tenant@test.local",
        password: "TenantPassword123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: TEST_UNASSIGNED_USER_ID,
        firstName: "Unassigned",
        lastName: "Admin",
        email: "test.floors.unassigned@test.local",
        password: "UnassignedPassword123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
    ]);

    // Seed test buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Grand Horizon Residencies",
        code: "GHR-FL",
        address: {
          street: "742 Evergreen Terrace",
          city: "Metropolis",
          state: "Federal Capital",
          postalCode: "44000",
          country: "Pakistan",
        },
        totalBlocks: 1,
        totalFlats: 40,
        status: BUILDING_STATUS.ACTIVE,
        isDeleted: false,
      },
      {
        _id: BUILDING_B_ID,
        name: "Skyline Heights Complex",
        code: "SHC-FL",
        address: {
          street: "101 Ocean Drive",
          city: "Metropolis",
          state: "Federal Capital",
          postalCode: "44000",
          country: "Pakistan",
        },
        totalBlocks: 1,
        totalFlats: 20,
        status: BUILDING_STATUS.ACTIVE,
        isDeleted: false,
      },
      {
        _id: BUILDING_DELETED_ID,
        name: "Old Abandoned Tower",
        code: "OAT-FL",
        address: {
          street: "99 Derelict Street",
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

    // Seed test blocks
    await Block.create([
      {
        _id: BLOCK_A_ID,
        buildingId: BUILDING_A_ID,
        name: "Tower Alpha",
        code: "TA",
        totalFloors: 10,
        isDeleted: false,
      },
      {
        _id: BLOCK_B_ID,
        buildingId: BUILDING_B_ID,
        name: "Tower Beta",
        code: "TB",
        totalFloors: 5,
        isDeleted: false,
      },
      {
        _id: BLOCK_DELETED_ID,
        buildingId: BUILDING_A_ID,
        name: "Old Demolished Block",
        code: "ODB",
        totalFloors: 3,
        isDeleted: true,
        deletedAt: new Date(),
      },
    ]);

    // Generate JWT access tokens
    superAdminToken = generateAccessToken({
      sub: TEST_SUPER_ADMIN_ID,
      role: ROLES.SUPER_ADMIN,
      buildingIds: [],
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
    // Teardown test data
    await User.deleteMany({
      email: {
        $in: [
          "test.floors.superadmin@test.local",
          "test.floors.bldadmin@test.local",
          "test.floors.tenant@test.local",
          "test.floors.unassigned@test.local",
        ],
      },
    });
    await Building.deleteMany({
      _id: { $in: [BUILDING_A_ID, BUILDING_B_ID, BUILDING_DELETED_ID] },
    });
    await Block.deleteMany({
      _id: { $in: [BLOCK_A_ID, BLOCK_B_ID, BLOCK_DELETED_ID] },
    });
    await Floor.deleteMany({
      $or: [
        {
          buildingId: {
            $in: [BUILDING_A_ID, BUILDING_B_ID, BUILDING_DELETED_ID],
          },
        },
        { blockId: { $in: [BLOCK_A_ID, BLOCK_B_ID, BLOCK_DELETED_ID] } },
      ],
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // =========================================================================
  // 1. Floor Database Model Invariants
  // =========================================================================
  describe("1. Floor Database Model Invariants", () => {
    it("Enforces parent buildingId requirement", async () => {
      const floor = new Floor({
        blockId: BLOCK_A_ID,
        floorNumber: 1,
      });

      await assert.rejects(
        async () => {
          await floor.save();
        },
        (err) => {
          assert.match(err.message, /Parent building ID is required/i);
          return true;
        }
      );
    });

    it("Enforces parent blockId requirement", async () => {
      const floor = new Floor({
        buildingId: BUILDING_A_ID,
        floorNumber: 1,
      });

      await assert.rejects(
        async () => {
          await floor.save();
        },
        (err) => {
          assert.match(err.message, /Parent block ID is required/i);
          return true;
        }
      );
    });

    it("Enforces floorNumber requirement", async () => {
      const floor = new Floor({
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
      });

      await assert.rejects(
        async () => {
          await floor.save();
        },
        (err) => {
          assert.match(err.message, /Floor number is required/i);
          return true;
        }
      );
    });

    it("Enforces floorNumber integer validation", async () => {
      const floor = new Floor({
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorNumber: 2.5,
      });

      await assert.rejects(
        async () => {
          await floor.save();
        },
        (err) => {
          assert.match(err.message, /Floor number must be an integer/i);
          return true;
        }
      );
    });

    it("Pre-save hook trims name and auto-generates clean name if omitted", async () => {
      const groundFloor = new Floor({
        buildingId: BUILDING_A_ID,
        blockId: new mongoose.Types.ObjectId(),
        floorNumber: 0,
      });
      await groundFloor.save();
      assert.strictEqual(groundFloor.name, "Ground Floor");

      const basementFloor = new Floor({
        buildingId: BUILDING_A_ID,
        blockId: new mongoose.Types.ObjectId(),
        floorNumber: -2,
      });
      await basementFloor.save();
      assert.strictEqual(basementFloor.name, "Basement 2");

      const upperFloor = new Floor({
        buildingId: BUILDING_A_ID,
        blockId: new mongoose.Types.ObjectId(),
        floorNumber: 5,
      });
      await upperFloor.save();
      assert.strictEqual(upperFloor.name, "Floor 5");

      const customFloor = new Floor({
        buildingId: BUILDING_A_ID,
        blockId: new mongoose.Types.ObjectId(),
        floorNumber: 3,
        name: "  Mezzanine Level  ",
      });
      await customFloor.save();
      assert.strictEqual(customFloor.name, "Mezzanine Level");

      // Cleanup
      await Floor.deleteMany({
        _id: {
          $in: [
            groundFloor._id,
            basementFloor._id,
            upperFloor._id,
            customFloor._id,
          ],
        },
      });
    });

    it("toSafeFloor() formats fields properly and excludes __v and isDeleted", async () => {
      const floor = new Floor({
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorNumber: 99,
        name: "Roof Deck",
      });
      await floor.save();

      const safe = floor.toSafeFloor();
      assert.strictEqual(safe.id, floor._id.toString());
      assert.strictEqual(safe.buildingId, BUILDING_A_ID);
      assert.strictEqual(safe.blockId, BLOCK_A_ID);
      assert.strictEqual(safe.floorNumber, 99);
      assert.strictEqual(safe.name, "Roof Deck");
      assert.strictEqual(safe.__v, undefined);
      assert.strictEqual(safe.isDeleted, undefined);

      await Floor.deleteOne({ _id: floor._id });
    });

    it("Compound Unique Index: Prevents duplicate floorNumber within the same block", async () => {
      const blockId = new mongoose.Types.ObjectId();
      const floor1 = new Floor({
        buildingId: BUILDING_A_ID,
        blockId,
        floorNumber: 4,
      });
      await floor1.save();

      const floor2 = new Floor({
        buildingId: BUILDING_A_ID,
        blockId,
        floorNumber: 4,
      });

      await assert.rejects(
        async () => {
          await floor2.save();
        },
        (err) => {
          assert.strictEqual(err.code, 11000);
          return true;
        }
      );

      await Floor.deleteMany({ blockId });
    });

    it("Cross-Block Unique Scoping: Allows same floorNumber in different blocks", async () => {
      const block1 = new mongoose.Types.ObjectId();
      const block2 = new mongoose.Types.ObjectId();

      const floorA = new Floor({
        buildingId: BUILDING_A_ID,
        blockId: block1,
        floorNumber: 2,
      });
      const floorB = new Floor({
        buildingId: BUILDING_A_ID,
        blockId: block2,
        floorNumber: 2,
      });

      await floorA.save();
      await floorB.save();

      assert.strictEqual(floorA.floorNumber, 2);
      assert.strictEqual(floorB.floorNumber, 2);
      assert.notStrictEqual(
        floorA.blockId.toString(),
        floorB.blockId.toString()
      );

      await Floor.deleteMany({ _id: { $in: [floorA._id, floorB._id] } });
    });
  });

  // =========================================================================
  // 2. POST /api/v1/floors (Provisioning, Hierarchy & Scope)
  // =========================================================================
  describe("2. POST /api/v1/floors (Provisioning, Hierarchy & Scope)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        body: {
          blockId: BLOCK_A_ID,
          floorNumber: 1,
        },
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /token/i);
    });

    it("Rejects unauthorized roles (e.g. Tenant without FLOOR_MANAGE) with 403 Forbidden", async () => {
      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorNumber: 1,
        },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /lacks required permission/i);
    });

    it("IDOR Guard: BuildingAdmin cannot create a floor in a block of an unassigned building (403)", async () => {
      // BLOCK_B_ID belongs to BUILDING_B_ID, which is NOT in buildingAdminToken scope
      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          blockId: BLOCK_B_ID,
          floorNumber: 1,
        },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /outside your authorized scope/i);
    });

    it("BuildingAdmin with empty assignedBuildingIds cannot create floors (403 Forbidden)", async () => {
      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${unassignedToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorNumber: 1,
        },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /outside your authorized scope/i);
    });

    it("Rejects creation referencing a non-existent block ID with 404 Not Found", async () => {
      const nonExistentBlockId = new mongoose.Types.ObjectId().toString();

      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          blockId: nonExistentBlockId,
          floorNumber: 1,
        },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /not found or has been deleted/i);
    });

    it("Rejects creation referencing a soft-deleted block with 404 Not Found", async () => {
      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          blockId: BLOCK_DELETED_ID,
          floorNumber: 1,
        },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /not found or has been deleted/i);
    });

    it("Hierarchy Invariant: Rejects request if provided buildingId mismatches parent block buildingId (400)", async () => {
      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          blockId: BLOCK_A_ID, // belongs to BUILDING_A_ID
          buildingId: BUILDING_B_ID, // mismatched building ID
          floorNumber: 1,
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /Hierarchy violation/i);
    });

    it("Upper Bound Guard: Rejects floorNumber exceeding parent block totalFloors (400)", async () => {
      // BLOCK_A_ID totalFloors is 10
      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorNumber: 15,
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /exceeds block total floors limit/i);
    });

    it("Allows negative floor numbers for basements (e.g. -1)", async () => {
      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorNumber: -1,
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.floorNumber, -1);
      assert.strictEqual(res.data.data.name, "Basement 1");
    });

    it("Allows BuildingAdmin to provision a floor in assigned building block and auto-generates name", async () => {
      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorNumber: 1,
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.blockId, BLOCK_A_ID);
      assert.strictEqual(res.data.data.buildingId, BUILDING_A_ID);
      assert.strictEqual(res.data.data.floorNumber, 1);
      assert.strictEqual(res.data.data.name, "Floor 1");
    });

    it("Allows SuperAdmin to provision a floor in any building block (global scope)", async () => {
      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          blockId: BLOCK_B_ID,
          floorNumber: 1,
          name: "Custom First Floor",
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.blockId, BLOCK_B_ID);
      assert.strictEqual(res.data.data.buildingId, BUILDING_B_ID);
      assert.strictEqual(res.data.data.floorNumber, 1);
      assert.strictEqual(res.data.data.name, "Custom First Floor");
    });

    it("Rejects creation with duplicate floorNumber within the same block with 409 Conflict", async () => {
      // Floor 1 already provisioned in BLOCK_A_ID in previous test
      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorNumber: 1,
        },
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /already exists in this block/i);
    });

    it("Allows creation of the same floorNumber in a DIFFERENT block", async () => {
      // Floor 2 in BLOCK_A_ID and Floor 2 in BLOCK_B_ID
      const resA = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorNumber: 2,
        },
      });
      assert.strictEqual(resA.status, 201);

      const resB = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          blockId: BLOCK_B_ID,
          floorNumber: 2,
        },
      });
      assert.strictEqual(resB.status, 201);
    });

    it("Mass-Assignment Guard: Rejects client attempts to inject internal fields (_id, isDeleted)", async () => {
      const res = await apiRequest("/api/v1/floors", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          blockId: BLOCK_A_ID,
          floorNumber: 3,
          isDeleted: true,
          _id: new mongoose.Types.ObjectId().toString(),
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /validation/i);
    });
  });

  // =========================================================================
  // 3. GET /api/v1/floors?blockId=:id (Listing & Scope)
  // =========================================================================
  describe("3. GET /api/v1/floors?blockId=:id (Listing & Scope)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest(`/api/v1/floors?blockId=${BLOCK_A_ID}`);
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /token/i);
    });

    it("Rejects request with missing blockId query parameter with 400 Bad Request", async () => {
      const res = await apiRequest("/api/v1/floors", {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /validation/i);
    });

    it("Rejects request with malformed blockId query parameter with 400 Bad Request", async () => {
      const res = await apiRequest(
        "/api/v1/floors?blockId=not-a-valid-object-id",
        {
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /validation/i);
    });

    it("IDOR Guard: BuildingAdmin querying floors of an unassigned building block is rejected with 403", async () => {
      // BLOCK_B_ID is in BUILDING_B_ID, not in BuildingAdmin's assigned scope
      const res = await apiRequest(`/api/v1/floors?blockId=${BLOCK_B_ID}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /outside your authorized scope/i);
    });

    it("IDOR Guard: Tenant querying floors of an unassigned building block is rejected with 403", async () => {
      const res = await apiRequest(`/api/v1/floors?blockId=${BLOCK_B_ID}`, {
        headers: { Authorization: `Bearer ${tenantToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /outside your authorized scope/i);
    });

    it("BuildingAdmin with empty assignedBuildingIds cannot list floors (403 Forbidden)", async () => {
      const res = await apiRequest(`/api/v1/floors?blockId=${BLOCK_A_ID}`, {
        headers: { Authorization: `Bearer ${unassignedToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /outside your authorized scope/i);
    });

    it("Returns 404 Not Found when querying floors for a non-existent block ID", async () => {
      const nonExistentBlockId = new mongoose.Types.ObjectId().toString();

      const res = await apiRequest(
        `/api/v1/floors?blockId=${nonExistentBlockId}`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /not found or has been deleted/i);
    });

    it("Returns 404 Not Found when querying floors for a soft-deleted block", async () => {
      const res = await apiRequest(
        `/api/v1/floors?blockId=${BLOCK_DELETED_ID}`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /not found or has been deleted/i);
    });

    it("Allows BuildingAdmin to list floors for their authorized block", async () => {
      const res = await apiRequest(`/api/v1/floors?blockId=${BLOCK_A_ID}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(Array.isArray(res.data.data));
      // In BLOCK_A_ID: Basement 1 (-1), Floor 1 (1), Floor 2 (2)
      assert.ok(res.data.data.length >= 3);
    });

    it("Returns floors sorted deterministically by floorNumber ascending", async () => {
      const res = await apiRequest(`/api/v1/floors?blockId=${BLOCK_A_ID}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      const floorNumbers = res.data.data.map((f) => f.floorNumber);
      const sortedFloorNumbers = [...floorNumbers].sort((a, b) => a - b);
      assert.deepStrictEqual(floorNumbers, sortedFloorNumbers);
    });

    it("Allows Tenant to list floors for their assigned building block", async () => {
      const res = await apiRequest(`/api/v1/floors?blockId=${BLOCK_A_ID}`, {
        headers: { Authorization: `Bearer ${tenantToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(Array.isArray(res.data.data));
    });

    it("Allows SuperAdmin to list floors for any block (global scope)", async () => {
      const res = await apiRequest(`/api/v1/floors?blockId=${BLOCK_B_ID}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length >= 2);
    });

    it("Excludes soft-deleted floors from listing results", async () => {
      // Create a soft-deleted floor
      const deletedFloor = new Floor({
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorNumber: 4,
        name: "Floor 4 Deleted",
        isDeleted: true,
        deletedAt: new Date(),
      });
      await deletedFloor.save();

      const res = await apiRequest(`/api/v1/floors?blockId=${BLOCK_A_ID}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      const returnedIds = res.data.data.map((f) => f.id);
      assert.ok(!returnedIds.includes(deletedFloor._id.toString()));

      await Floor.deleteOne({ _id: deletedFloor._id });
    });
  });
});
