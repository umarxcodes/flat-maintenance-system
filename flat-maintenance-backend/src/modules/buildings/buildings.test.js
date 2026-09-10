// =====================  IMPORTS  ==========================
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Building } from "../../models/building.model.js";
import { User } from "../../models/user.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { BUILDING_STATUS } from "./buildings.constants.js";
import { generateAccessToken } from "../../utils/token.util.js";

// =====================  TEST FIXTURES & HELPERS  ==========
dotenv.config();

let server;
let baseUrl;

// Fixture IDs
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

// =====================  TEST SUITE  =======================
describe("Buildings Domain Module (Module 5)", () => {
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

    // Clean up test buildings
    await Building.deleteMany({
      code: {
        $in: [
          "TEST-BLD-A",
          "TEST-BLD-B",
          "TEST-BLD-DEL",
          "TEST-NEW-COMPLEX",
          "TEST-UPDATE-DUP",
          "TEST-DUP-CODE",
        ],
      },
    });

    // Create baseline test buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Test Metro Residency A",
        code: "TEST-BLD-A",
        address: {
          street: "123 Main Blvd",
          city: "Metropolis",
          state: "Federal Capital",
          postalCode: "44000",
          country: "Pakistan",
        },
        totalBlocks: 3,
        totalFlats: 120,
        status: BUILDING_STATUS.ACTIVE,
        isDeleted: false,
      },
      {
        _id: BUILDING_B_ID,
        name: "Test Green Tower B",
        code: "TEST-BLD-B",
        address: {
          street: "456 Park Avenue",
          city: "Metropolis",
          state: "Federal Capital",
          postalCode: "44000",
          country: "Pakistan",
        },
        totalBlocks: 2,
        totalFlats: 80,
        status: BUILDING_STATUS.UNDER_CONSTRUCTION,
        isDeleted: false,
      },
      {
        _id: BUILDING_DELETED_ID,
        name: "Test Decommissioned Complex",
        code: "TEST-BLD-DEL",
        address: {
          street: "789 Old Road",
          city: "Metropolis",
          state: "Federal Capital",
          postalCode: "44000",
          country: "Pakistan",
        },
        totalBlocks: 1,
        totalFlats: 20,
        status: BUILDING_STATUS.INACTIVE,
        isDeleted: true,
        deletedAt: new Date(),
      },
    ]);

    // Clean up test users
    await User.deleteMany({
      email: {
        $in: [
          "test.bld.superadmin@test.local",
          "test.bld.admin@test.local",
          "test.bld.tenant@test.local",
          "test.bld.unassigned@test.local",
        ],
      },
    });

    // Create test active users
    await User.create([
      {
        _id: TEST_SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: "test.bld.superadmin@test.local",
        password: "SuperPassword123!",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
      {
        _id: TEST_BUILDING_ADMIN_ID,
        firstName: "Building",
        lastName: "Admin",
        email: "test.bld.admin@test.local",
        password: "AdminPassword123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID], // Assigned only to Building A
      },
      {
        _id: TEST_TENANT_ID,
        firstName: "Resident",
        lastName: "Tenant",
        email: "test.bld.tenant@test.local",
        password: "TenantPassword123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID], // Assigned only to Building A
      },
      {
        _id: TEST_UNASSIGNED_USER_ID,
        firstName: "Unassigned",
        lastName: "Staff",
        email: "test.bld.unassigned@test.local",
        password: "StaffPassword123!",
        role: ROLES.MAINTENANCE_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [], // Zero building assignments
      },
    ]);

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
      role: ROLES.MAINTENANCE_STAFF,
      buildingIds: [],
    });
  });

  after(async () => {
    // Clean up test buildings
    await Building.deleteMany({
      code: {
        $in: [
          "TEST-BLD-A",
          "TEST-BLD-B",
          "TEST-BLD-DEL",
          "TEST-NEW-COMPLEX",
          "TEST-UPDATE-DUP",
          "TEST-DUP-CODE",
        ],
      },
    });

    // Clean up test users
    await User.deleteMany({
      email: {
        $in: [
          "test.bld.superadmin@test.local",
          "test.bld.admin@test.local",
          "test.bld.tenant@test.local",
          "test.bld.unassigned@test.local",
        ],
      },
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // =====================  1. BUILDING MODEL INVARIANTS  ======
  describe("1. Building Database Model Invariants", () => {
    it("Enforces building name requirement", async () => {
      const doc = new Building({
        code: "NO-NAME-BLD",
        address: {
          street: "1 Street",
          city: "City",
          state: "State",
          postalCode: "12345",
          country: "Country",
        },
      });

      await assert.rejects(async () => {
        await doc.save();
      }, /Building name is required/);
    });

    it("Enforces building code requirement", async () => {
      const doc = new Building({
        name: "No Code Tower",
        address: {
          street: "1 Street",
          city: "City",
          state: "State",
          postalCode: "12345",
          country: "Country",
        },
      });

      await assert.rejects(async () => {
        await doc.save();
      }, /Building code is required/);
    });

    it("Enforces database-level uniqueness on building code", async () => {
      const duplicate = new Building({
        name: "Duplicate Code Tower",
        code: "TEST-BLD-A", // Already exists
        address: {
          street: "999 Road",
          city: "City",
          state: "State",
          postalCode: "12345",
          country: "Country",
        },
      });

      await assert.rejects(async () => {
        await duplicate.save();
      }, /E11000/);
    });

    it("Pre-save hook normalizes uppercase code and trims name", async () => {
      const doc = await Building.create({
        name: "   Padded Tower Name   ",
        code: "  test-dup-code  ",
        address: {
          street: "Street",
          city: "City",
          state: "State",
          postalCode: "12345",
          country: "Country",
        },
      });

      assert.equal(doc.code, "TEST-DUP-CODE");
      assert.equal(doc.name, "Padded Tower Name");
      assert.equal(doc.totalBlocks, 0);
      assert.equal(doc.totalFlats, 0);
      assert.equal(doc.isDeleted, false);

      await Building.deleteOne({ _id: doc._id });
    });

    it("toSafeBuilding() formats fields properly and excludes __v and isDeleted", async () => {
      const b = await Building.findOne({ code: "TEST-BLD-A" });
      assert.ok(b);

      const safe = b.toSafeBuilding();
      assert.equal(safe.id, b._id.toString());
      assert.equal(safe.name, b.name);
      assert.equal(safe.code, "TEST-BLD-A");
      assert.equal(safe.status, BUILDING_STATUS.ACTIVE);
      assert.equal(safe.__v, undefined);
      assert.equal(safe.isDeleted, undefined);
    });
  });

  // =====================  2. POST /API/V1/BUILDINGS  =========
  describe("2. POST /api/v1/buildings (Provisioning)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/buildings", {
        method: "POST",
        body: { name: "Test Complex", code: "TEST-NEW-1" },
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("Rejects non-SuperAdmin roles (e.g. BUILDING_ADMIN) with 403 Forbidden", async () => {
      const res = await apiRequest("/api/v1/buildings", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          name: "Building Admin Unauthorized Creation",
          code: "TEST-BADMIN-FAIL",
          address: {
            street: "Street",
            city: "City",
            state: "State",
            postalCode: "12345",
            country: "Country",
          },
        },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /forbidden|permission/i);
    });

    it("Rejects Tenant role with 403 Forbidden", async () => {
      const res = await apiRequest("/api/v1/buildings", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantToken}` },
        body: {
          name: "Tenant Unauthorized Creation",
          code: "TEST-TENANT-FAIL",
          address: {
            street: "Street",
            city: "City",
            state: "State",
            postalCode: "12345",
            country: "Country",
          },
        },
      });

      assert.strictEqual(res.status, 403);
    });

    it("Allows SuperAdmin to provision a new building complex", async () => {
      const res = await apiRequest("/api/v1/buildings", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          name: "New Heights Complex",
          code: "TEST-NEW-COMPLEX",
          address: {
            street: "777 Sector F",
            city: "Metropolis",
            state: "Federal Capital",
            postalCode: "44000",
            country: "Pakistan",
          },
          totalBlocks: 4,
          totalFlats: 160,
          status: BUILDING_STATUS.ACTIVE,
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.name, "New Heights Complex");
      assert.strictEqual(res.data.data.code, "TEST-NEW-COMPLEX");
      assert.strictEqual(res.data.data.totalBlocks, 4);
      assert.strictEqual(res.data.data.totalFlats, 160);
      assert.ok(res.data.data.id);
    });

    it("Rejects creation with duplicate building code with 409 Conflict", async () => {
      const res = await apiRequest("/api/v1/buildings", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          name: "Duplicate Code Attempt",
          code: "test-new-complex", // Lowercase of existing TEST-NEW-COMPLEX
          address: {
            street: "777 Sector F",
            city: "Metropolis",
            state: "Federal Capital",
            postalCode: "44000",
            country: "Pakistan",
          },
        },
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /already exists/i);
    });

    it("Rejects payload with missing address or invalid numbers", async () => {
      const res = await apiRequest("/api/v1/buildings", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          name: "Invalid Numbers Complex",
          code: "TEST-INV-NUM",
          totalBlocks: -5, // Negative number rejected
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });
  });

  // =====================  3. GET /API/V1/BUILDINGS  ==========
  describe("3. GET /api/v1/buildings (Directory & OBAC Scope)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/buildings");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("SuperAdmin retrieves all active buildings globally with pagination", async () => {
      const res = await apiRequest("/api/v1/buildings", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.meta);
      assert.ok(res.data.data.length >= 3); // A, B, and newly created

      // Verify soft-deleted building is not returned
      const ids = res.data.data.map((b) => b.id);
      assert.ok(!ids.includes(BUILDING_DELETED_ID));
    });

    it("BuildingAdmin only receives buildings within authorized assigned scope", async () => {
      const res = await apiRequest("/api/v1/buildings", {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.length, 1);
      assert.strictEqual(res.data.data[0].id, BUILDING_A_ID);
      assert.strictEqual(res.data.data[0].code, "TEST-BLD-A");
    });

    it("Tenant only receives buildings within authorized assigned scope", async () => {
      const res = await apiRequest("/api/v1/buildings", {
        headers: { Authorization: `Bearer ${tenantToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.length, 1);
      assert.strictEqual(res.data.data[0].id, BUILDING_A_ID);
    });

    it("User with empty assignedBuildingIds receives empty results (0 records)", async () => {
      const res = await apiRequest("/api/v1/buildings", {
        headers: { Authorization: `Bearer ${unassignedToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.length, 0);
      assert.strictEqual(res.data.meta.totalRecords, 0);
    });

    it("BuildingAdmin filtering by an unauthorized building is rejected with 403", async () => {
      const res = await apiRequest(
        `/api/v1/buildings?buildingId=${BUILDING_B_ID}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /outside your authorized scope/i);
    });

    it("Supports search query filter on building name", async () => {
      const res = await apiRequest("/api/v1/buildings?search=Green", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      const names = res.data.data.map((b) => b.name);
      assert.ok(names.some((n) => n.includes("Green Tower B")));
    });
  });

  // =====================  4. GET /API/V1/BUILDINGS/:ID  ======
  describe("4. GET /api/v1/buildings/:id (Details & IDOR Protection)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest(`/api/v1/buildings/${BUILDING_A_ID}`);
      assert.strictEqual(res.status, 401);
    });

    it("Rejects malformed ObjectId with 400 Bad Request", async () => {
      const res = await apiRequest("/api/v1/buildings/invalid-hex-id-xyz", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /validation/i);
    });

    it("Returns 404 NOT_FOUND for non-existent building ID", async () => {
      const nonExistent = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest(`/api/v1/buildings/${nonExistent}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 404);
      assert.match(res.data.message, /not found/i);
    });

    it("SuperAdmin can retrieve any non-deleted building", async () => {
      const res = await apiRequest(`/api/v1/buildings/${BUILDING_B_ID}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.id, BUILDING_B_ID);
      assert.strictEqual(res.data.data.name, "Test Green Tower B");
    });

    it("BuildingAdmin can retrieve their assigned building", async () => {
      const res = await apiRequest(`/api/v1/buildings/${BUILDING_A_ID}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.id, BUILDING_A_ID);
      assert.strictEqual(res.data.data.code, "TEST-BLD-A");
    });

    it("IDOR Guard: BuildingAdmin querying unassigned building is rejected with 403", async () => {
      const res = await apiRequest(`/api/v1/buildings/${BUILDING_B_ID}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /outside your authorized scope/i);
    });

    it("IDOR Guard: Tenant querying unassigned building is rejected with 403", async () => {
      const res = await apiRequest(`/api/v1/buildings/${BUILDING_B_ID}`, {
        headers: { Authorization: `Bearer ${tenantToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.match(res.data.message, /outside your authorized scope/i);
    });

    it("Soft-deleted building returns 404 NOT_FOUND", async () => {
      const res = await apiRequest(`/api/v1/buildings/${BUILDING_DELETED_ID}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 404);
    });
  });

  // =====================  5. PATCH /API/V1/BUILDINGS/:ID  ====
  describe("5. PATCH /api/v1/buildings/:id (Update & Scope Enforcement)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest(`/api/v1/buildings/${BUILDING_A_ID}`, {
        method: "PATCH",
        body: { name: "Altered Name" },
      });

      assert.strictEqual(res.status, 401);
    });

    it("Rejects non-admin roles (e.g. Tenant) with 403 Forbidden", async () => {
      const res = await apiRequest(`/api/v1/buildings/${BUILDING_A_ID}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tenantToken}` },
        body: { name: "Tenant Alteration" },
      });

      assert.strictEqual(res.status, 403);
      assert.match(res.data.message, /forbidden|permission/i);
    });

    it("IDOR Guard: BuildingAdmin attempting to update unassigned building is rejected with 403", async () => {
      const res = await apiRequest(`/api/v1/buildings/${BUILDING_B_ID}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: { name: "Malicious Cross-Building Mutation" },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /outside your authorized scope/i);
    });

    it("BuildingAdmin updates assigned building settings successfully", async () => {
      const res = await apiRequest(`/api/v1/buildings/${BUILDING_A_ID}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          name: "Metro Residency Towers Renovated",
          totalFlats: 130,
          address: {
            street: "123 Main Blvd West Wing",
            city: "Metropolis",
          },
        },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(
        res.data.data.name,
        "Metro Residency Towers Renovated"
      );
      assert.strictEqual(res.data.data.totalFlats, 130);
      assert.strictEqual(
        res.data.data.address.street,
        "123 Main Blvd West Wing"
      );
    });

    it("Rejects update to a code already used by another building with 409 Conflict", async () => {
      const res = await apiRequest(`/api/v1/buildings/${BUILDING_A_ID}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          code: "TEST-BLD-B", // Code already belonging to Building B
        },
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /already exists/i);
    });

    it("Mass-Assignment Protection: client cannot mutate isDeleted or _id", async () => {
      const res = await apiRequest(`/api/v1/buildings/${BUILDING_A_ID}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          isDeleted: true, // Should be rejected by strict schema
        },
      });

      assert.strictEqual(res.status, 400);

      // Verify in DB that isDeleted remains false
      const building = await Building.findById(BUILDING_A_ID);
      assert.strictEqual(building.isDeleted, false);
    });
  });
});
