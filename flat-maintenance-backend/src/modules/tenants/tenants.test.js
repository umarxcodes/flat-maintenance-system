// =====================  IMPORTS  ==========================
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Tenant } from "./tenants.model.js";
import { Owner } from "../owners/owners.model.js";
import { Flat, FLAT_STATUS } from "../../models/flat.model.js";
import { Floor } from "../../models/floor.model.js";
import { Block } from "../../models/block.model.js";
import { Building } from "../../models/building.model.js";
import { User } from "../../models/user.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { BUILDING_STATUS } from "../buildings/buildings.constants.js";
import { TENANTS_CONSTANTS } from "./tenants.constants.js";
import { generateAccessToken } from "../../utils/token.util.js";

// =====================  TEST FIXTURES & HELPERS  ==========
dotenv.config();

let server;
let baseUrl;

// Fixture ObjectIds
const TEST_SUPER_ADMIN_ID = new mongoose.Types.ObjectId().toString();
const TEST_BUILDING_ADMIN_ID = new mongoose.Types.ObjectId().toString();
const TEST_MANAGER_ID = new mongoose.Types.ObjectId().toString();
const TEST_TENANT_ID = new mongoose.Types.ObjectId().toString();
const TEST_UNASSIGNED_USER_ID = new mongoose.Types.ObjectId().toString();

const BUILDING_A_ID = new mongoose.Types.ObjectId().toString();
const BUILDING_B_ID = new mongoose.Types.ObjectId().toString();
const BUILDING_DELETED_ID = new mongoose.Types.ObjectId().toString();

const BLOCK_A_ID = new mongoose.Types.ObjectId().toString();
const BLOCK_B_ID = new mongoose.Types.ObjectId().toString();

const FLOOR_A_ID = new mongoose.Types.ObjectId().toString();
const FLOOR_B_ID = new mongoose.Types.ObjectId().toString();

const FLAT_A1_ID = new mongoose.Types.ObjectId().toString();
const FLAT_A2_ID = new mongoose.Types.ObjectId().toString();
const FLAT_B1_ID = new mongoose.Types.ObjectId().toString();
const FLAT_DELETED_ID = new mongoose.Types.ObjectId().toString();

const OWNER_A_USER_ID = new mongoose.Types.ObjectId().toString();
const OWNER_B_USER_ID = new mongoose.Types.ObjectId().toString();

let OWNER_A_ID;
let OWNER_B_ID;

let superAdminToken;
let buildingAdminToken;
let managerToken;
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

// =====================  TENANTS MODULE TEST SUITE  ==========
describe("Tenants Domain Module (Module 10)", () => {
  before(async () => {
    await connectDB();

    // Start Express server on ephemeral port
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    // Clean test collections
    await User.deleteMany({
      email: { $regex: /@(tenant-test\.local|tenants-test\.local)$/ },
    });
    await Building.deleteMany({
      code: { $regex: /^TEST-TEN-(BLD-A|BLD-B|BLD-DEL)/ },
    });
    await Block.deleteMany({
      _id: { $in: [BLOCK_A_ID, BLOCK_B_ID] },
    });
    await Floor.deleteMany({
      _id: { $in: [FLOOR_A_ID, FLOOR_B_ID] },
    });
    await Flat.deleteMany({
      _id: { $in: [FLAT_A1_ID, FLAT_A2_ID, FLAT_B1_ID, FLAT_DELETED_ID] },
    });
    await Owner.deleteMany({
      buildingId: { $in: [BUILDING_A_ID, BUILDING_B_ID, BUILDING_DELETED_ID] },
    });
    await Tenant.deleteMany({
      buildingId: { $in: [BUILDING_A_ID, BUILDING_B_ID, BUILDING_DELETED_ID] },
    });

    // 1. Seed Buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Emerald Palms A",
        code: "TEST-TEN-BLD-A",
        address: {
          street: "123 Palm Way",
          city: "Metropolis",
          state: "NY",
          postalCode: "10001",
          country: "USA",
        },
        status: BUILDING_STATUS.ACTIVE,
        isDeleted: false,
      },
      {
        _id: BUILDING_B_ID,
        name: "Sapphire Court B",
        code: "TEST-TEN-BLD-B",
        address: {
          street: "456 Court Ave",
          city: "Gotham",
          state: "NJ",
          postalCode: "07001",
          country: "USA",
        },
        status: BUILDING_STATUS.ACTIVE,
        isDeleted: false,
      },
      {
        _id: BUILDING_DELETED_ID,
        name: "Abandoned Site",
        code: "TEST-TEN-BLD-DEL",
        address: {
          street: "789 Derelict Rd",
          city: "Atlantis",
          state: "OC",
          postalCode: "00000",
          country: "USA",
        },
        status: BUILDING_STATUS.INACTIVE,
        isDeleted: true,
      },
    ]);

    // 2. Seed Blocks
    await Block.create([
      {
        _id: BLOCK_A_ID,
        buildingId: BUILDING_A_ID,
        name: "Block Alpha",
        totalFloors: 10,
        isDeleted: false,
      },
      {
        _id: BLOCK_B_ID,
        buildingId: BUILDING_B_ID,
        name: "Block Beta",
        totalFloors: 8,
        isDeleted: false,
      },
    ]);

    // 3. Seed Floors
    await Floor.create([
      {
        _id: FLOOR_A_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorNumber: 1,
        name: "Floor 1",
        isDeleted: false,
      },
      {
        _id: FLOOR_B_ID,
        buildingId: BUILDING_B_ID,
        blockId: BLOCK_B_ID,
        floorNumber: 1,
        name: "Floor 1",
        isDeleted: false,
      },
    ]);

    // 4. Seed Owners
    const ownerAUser = await User.create({
      _id: OWNER_A_USER_ID,
      firstName: "Owner",
      lastName: "Alpha",
      email: "owner.a@tenant-test.local",
      password: "Password123!",
      role: ROLES.OWNER,
      status: ACCOUNT_STATUS.ACTIVE,
      assignedBuildingIds: [BUILDING_A_ID],
    });

    const ownerBUser = await User.create({
      _id: OWNER_B_USER_ID,
      firstName: "Owner",
      lastName: "Beta",
      email: "owner.b@tenant-test.local",
      password: "Password123!",
      role: ROLES.OWNER,
      status: ACCOUNT_STATUS.ACTIVE,
      assignedBuildingIds: [BUILDING_B_ID],
    });

    const ownerADoc = await Owner.create({
      userId: ownerAUser._id,
      buildingId: BUILDING_A_ID,
      flatsOwned: [FLAT_A1_ID, FLAT_A2_ID],
    });
    OWNER_A_ID = ownerADoc._id.toString();

    const ownerBDoc = await Owner.create({
      userId: ownerBUser._id,
      buildingId: BUILDING_B_ID,
      flatsOwned: [FLAT_B1_ID],
    });
    OWNER_B_ID = ownerBDoc._id.toString();

    // 5. Seed Flats (bound to owners)
    await Flat.create([
      {
        _id: FLAT_A1_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "301",
        areaSqFt: 1200,
        flatType: "2BHK",
        status: FLAT_STATUS.VACANT,
        currentOwnerId: OWNER_A_ID,
        isDeleted: false,
      },
      {
        _id: FLAT_A2_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "302",
        areaSqFt: 1400,
        flatType: "3BHK",
        status: FLAT_STATUS.VACANT,
        currentOwnerId: OWNER_A_ID,
        isDeleted: false,
      },
      {
        _id: FLAT_B1_ID,
        buildingId: BUILDING_B_ID,
        blockId: BLOCK_B_ID,
        floorId: FLOOR_B_ID,
        flatNumber: "401",
        areaSqFt: 1100,
        flatType: "2BHK",
        status: FLAT_STATUS.VACANT,
        currentOwnerId: OWNER_B_ID,
        isDeleted: false,
      },
      {
        _id: FLAT_DELETED_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "999",
        areaSqFt: 1000,
        flatType: "1BHK",
        status: FLAT_STATUS.INACTIVE,
        isDeleted: true,
      },
    ]);

    // 6. Seed Operational Principals
    await User.create([
      {
        _id: TEST_SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: "superadmin.tenants@tenant-test.local",
        password: "Password123!",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
        isDeleted: false,
      },
      {
        _id: TEST_BUILDING_ADMIN_ID,
        firstName: "Building",
        lastName: "Admin",
        email: "bldadmin.tenants@tenant-test.local",
        password: "Password123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
        isDeleted: false,
      },
      {
        _id: TEST_MANAGER_ID,
        firstName: "Society",
        lastName: "Manager",
        email: "manager.tenants@tenant-test.local",
        password: "Password123!",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
        isDeleted: false,
      },
      {
        _id: TEST_TENANT_ID,
        firstName: "Active",
        lastName: "Tenant",
        email: "resident.tenants@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
        isDeleted: false,
      },
      {
        _id: TEST_UNASSIGNED_USER_ID,
        firstName: "Unassigned",
        lastName: "Admin",
        email: "unassigned.tenants@tenant-test.local",
        password: "Password123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
        isDeleted: false,
      },
    ]);

    // Generate JWTs
    superAdminToken = generateAccessToken({
      sub: TEST_SUPER_ADMIN_ID,
      email: "superadmin.tenants@tenant-test.local",
      role: ROLES.SUPER_ADMIN,
    });

    buildingAdminToken = generateAccessToken({
      sub: TEST_BUILDING_ADMIN_ID,
      email: "bldadmin.tenants@tenant-test.local",
      role: ROLES.BUILDING_ADMIN,
    });

    managerToken = generateAccessToken({
      sub: TEST_MANAGER_ID,
      email: "manager.tenants@tenant-test.local",
      role: ROLES.MANAGER,
    });

    tenantToken = generateAccessToken({
      sub: TEST_TENANT_ID,
      email: "resident.tenants@tenant-test.local",
      role: ROLES.TENANT,
    });

    unassignedToken = generateAccessToken({
      sub: TEST_UNASSIGNED_USER_ID,
      email: "unassigned.tenants@tenant-test.local",
      role: ROLES.BUILDING_ADMIN,
    });
  });

  after(async () => {
    // Cleanup collections
    await User.deleteMany({
      email: { $regex: /@(tenant-test\.local|tenants-test\.local)$/ },
    });
    await Building.deleteMany({
      code: { $regex: /^TEST-TEN-(BLD-A|BLD-B|BLD-DEL)/ },
    });
    await Block.deleteMany({
      _id: { $in: [BLOCK_A_ID, BLOCK_B_ID] },
    });
    await Floor.deleteMany({
      _id: { $in: [FLOOR_A_ID, FLOOR_B_ID] },
    });
    await Flat.deleteMany({
      _id: { $in: [FLAT_A1_ID, FLAT_A2_ID, FLAT_B1_ID, FLAT_DELETED_ID] },
    });
    await Owner.deleteMany({
      buildingId: { $in: [BUILDING_A_ID, BUILDING_B_ID, BUILDING_DELETED_ID] },
    });
    await Tenant.deleteMany({
      buildingId: { $in: [BUILDING_A_ID, BUILDING_B_ID, BUILDING_DELETED_ID] },
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // =========================================================
  // 1. Tenant Database Model Invariants
  // =========================================================
  describe("1. Tenant Database Model Invariants", () => {
    it("Enforces parent userId requirement", async () => {
      const tenant = new Tenant({
        buildingId: new mongoose.Types.ObjectId(),
        flatId: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2027-01-01"),
      });

      await assert.rejects(
        async () => await tenant.validate(),
        (err) => {
          assert.strictEqual(err.name, "ValidationError");
          assert.ok(err.errors.userId);
          return true;
        }
      );
    });

    it("Enforces parent buildingId requirement", async () => {
      const tenant = new Tenant({
        userId: new mongoose.Types.ObjectId(),
        flatId: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2027-01-01"),
      });

      await assert.rejects(
        async () => await tenant.validate(),
        (err) => {
          assert.strictEqual(err.name, "ValidationError");
          assert.ok(err.errors.buildingId);
          return true;
        }
      );
    });

    it("Enforces flatId, ownerId, leaseStartDate, leaseEndDate requirements", async () => {
      const tenant = new Tenant({
        userId: new mongoose.Types.ObjectId(),
        buildingId: new mongoose.Types.ObjectId(),
      });

      await assert.rejects(
        async () => await tenant.validate(),
        (err) => {
          assert.strictEqual(err.name, "ValidationError");
          assert.ok(err.errors.flatId);
          assert.ok(err.errors.ownerId);
          assert.ok(err.errors.leaseStartDate);
          assert.ok(err.errors.leaseEndDate);
          return true;
        }
      );
    });

    it("Defaults status to ACTIVE, policeVerificationStatus to PENDING, isDeleted to false", async () => {
      const tenant = new Tenant({
        userId: new mongoose.Types.ObjectId(),
        buildingId: new mongoose.Types.ObjectId(),
        flatId: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2027-01-01"),
      });

      assert.strictEqual(tenant.status, TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE);
      assert.strictEqual(
        tenant.policeVerificationStatus,
        TENANTS_CONSTANTS.POLICE_VERIFICATION_STATUS.PENDING
      );
      assert.strictEqual(tenant.isDeleted, false);
      assert.strictEqual(tenant.moveOutDate, null);
    });

    it("Rejects invalid policeVerificationStatus enum", async () => {
      const tenant = new Tenant({
        userId: new mongoose.Types.ObjectId(),
        buildingId: new mongoose.Types.ObjectId(),
        flatId: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2027-01-01"),
        policeVerificationStatus: "INVALID_STATUS",
      });

      await assert.rejects(
        async () => await tenant.validate(),
        (err) => {
          assert.ok(err.errors.policeVerificationStatus);
          return true;
        }
      );
    });

    it("Rejects invalid status enum", async () => {
      const tenant = new Tenant({
        userId: new mongoose.Types.ObjectId(),
        buildingId: new mongoose.Types.ObjectId(),
        flatId: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2027-01-01"),
        status: "EVICTED",
      });

      await assert.rejects(
        async () => await tenant.validate(),
        (err) => {
          assert.ok(err.errors.status);
          return true;
        }
      );
    });

    it("toSafeTenant() formats fields properly and excludes __v, isDeleted, and deletedAt", async () => {
      const tenant = new Tenant({
        userId: new mongoose.Types.ObjectId(),
        buildingId: new mongoose.Types.ObjectId(),
        flatId: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2027-01-01"),
      });

      const safe = tenant.toSafeTenant();
      assert.strictEqual(safe.__v, undefined);
      assert.strictEqual(safe.isDeleted, undefined);
      assert.strictEqual(safe.deletedAt, undefined);
      assert.strictEqual(safe.status, "ACTIVE");
    });
  });

  // =========================================================
  // 2. POST /api/v1/tenants (Onboarding, Hierarchy, Scope & Occupancy)
  // =========================================================
  describe("2. POST /api/v1/tenants (Onboarding, Hierarchy, Scope & Occupancy)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A1_ID,
          ownerId: OWNER_A_ID,
          leaseStartDate: "2026-01-01",
          leaseEndDate: "2027-01-01",
        },
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("Rejects unauthorized roles (e.g. Tenant without TENANT_MANAGE) with 403 Forbidden", async () => {
      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantToken}` },
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A1_ID,
          ownerId: OWNER_A_ID,
          leaseStartDate: "2026-01-01",
          leaseEndDate: "2027-01-01",
        },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
    });

    it("IDOR Guard: BuildingAdmin cannot onboard tenant in an unassigned building (403)", async () => {
      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_B_ID,
          flatId: FLAT_B1_ID,
          ownerId: OWNER_B_ID,
          leaseStartDate: "2026-01-01",
          leaseEndDate: "2027-01-01",
        },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /forbidden/i);
    });

    it("IDOR Guard: Manager cannot onboard tenant in an unassigned building (403)", async () => {
      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${managerToken}` },
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_B_ID,
          flatId: FLAT_B1_ID,
          ownerId: OWNER_B_ID,
          leaseStartDate: "2026-01-01",
          leaseEndDate: "2027-01-01",
        },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
    });

    it("BuildingAdmin with empty assignedBuildingIds cannot onboard tenants (403 Forbidden)", async () => {
      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${unassignedToken}` },
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A1_ID,
          ownerId: OWNER_A_ID,
          leaseStartDate: "2026-01-01",
          leaseEndDate: "2027-01-01",
        },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
    });

    it("Rejects onboarding referencing a non-existent User with 404 Not Found", async () => {
      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A1_ID,
          ownerId: OWNER_A_ID,
          leaseStartDate: "2026-01-01",
          leaseEndDate: "2027-01-01",
        },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /user.*not found/i);
    });

    it("Rejects onboarding referencing a non-existent Flat with 404 Not Found", async () => {
      const candidateUser = await User.create({
        firstName: "Test",
        lastName: "Tenant",
        email: "candidate.1@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: candidateUser._id.toString(),
          buildingId: BUILDING_A_ID,
          flatId: new mongoose.Types.ObjectId().toString(),
          ownerId: OWNER_A_ID,
          leaseStartDate: "2026-01-01",
          leaseEndDate: "2027-01-01",
        },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /flat.*not found/i);
    });

    it("Rejects onboarding referencing a soft-deleted Flat with 404 Not Found", async () => {
      const candidateUser = await User.create({
        firstName: "Test",
        lastName: "Tenant",
        email: "candidate.2@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: candidateUser._id.toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_DELETED_ID,
          ownerId: OWNER_A_ID,
          leaseStartDate: "2026-01-01",
          leaseEndDate: "2027-01-01",
        },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /flat.*not found/i);
    });

    it("Hierarchy Invariant: Rejects request if Flat belongs to a different building (400)", async () => {
      const candidateUser = await User.create({
        firstName: "Test",
        lastName: "Tenant",
        email: "candidate.3@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      // Target building A, but Flat B1 belongs to Building B
      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          userId: candidateUser._id.toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_B1_ID,
          ownerId: OWNER_A_ID,
          leaseStartDate: "2026-01-01",
          leaseEndDate: "2027-01-01",
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /hierarchy violation/i);
    });

    it("Hierarchy Invariant: Rejects request if Owner belongs to a different building (400)", async () => {
      const candidateUser = await User.create({
        firstName: "Test",
        lastName: "Tenant",
        email: "candidate.4@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      // Target building A and Flat A1, but Owner B belongs to Building B
      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          userId: candidateUser._id.toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A1_ID,
          ownerId: OWNER_B_ID,
          leaseStartDate: "2026-01-01",
          leaseEndDate: "2027-01-01",
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /hierarchy violation/i);
    });

    it("Owner-Flat Mismatch: Rejects request if referenced Owner does not own the Flat (400)", async () => {
      const candidateUser = await User.create({
        firstName: "Test",
        lastName: "Tenant",
        email: "candidate.5@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      // Create an Owner C in Building A who only owns FLAT_A2_ID
      const ownerCUser = await User.create({
        firstName: "Owner",
        lastName: "Charlie",
        email: "owner.c@tenant-test.local",
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      });

      const ownerCDoc = await Owner.create({
        userId: ownerCUser._id,
        buildingId: BUILDING_A_ID,
        flatsOwned: [FLAT_A2_ID],
      });

      // Attempt to lease FLAT_A1_ID with OWNER C (who only owns FLAT_A2_ID)
      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: candidateUser._id.toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A1_ID,
          ownerId: ownerCDoc._id.toString(),
          leaseStartDate: "2026-01-01",
          leaseEndDate: "2027-01-01",
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /owner-flat mismatch/i);
    });

    it("Date Ordering: Rejects request when leaseEndDate is before or equal to leaseStartDate (400)", async () => {
      const candidateUser = await User.create({
        firstName: "Test",
        lastName: "Tenant",
        email: "candidate.6@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: candidateUser._id.toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A1_ID,
          ownerId: OWNER_A_ID,
          leaseStartDate: "2027-01-01",
          leaseEndDate: "2026-01-01", // Invalid: before start
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /validation failed/i);
    });

    it("Allows BuildingAdmin to onboard tenant, updates Flat.currentTenantId and marks Flat OCCUPIED", async () => {
      const candidateUser = await User.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: candidateUser._id.toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A1_ID,
          ownerId: OWNER_A_ID,
          leaseStartDate: "2026-02-01",
          leaseEndDate: "2027-02-01",
          rentAmount: 35000,
          securityDeposit: 70000,
          emergencyContact: {
            name: "Jane Doe",
            relationship: "Spouse",
            phone: "+12025550189",
          },
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(
        res.data.data.userId._id,
        candidateUser._id.toString()
      );
      assert.strictEqual(res.data.data.buildingId, BUILDING_A_ID);
      assert.strictEqual(res.data.data.status, "ACTIVE");
      assert.strictEqual(res.data.data.rentAmount, 35000);
      assert.strictEqual(res.data.data.securityDeposit, 70000);

      // Verify Flat occupancy synchronization
      const updatedFlat = await Flat.findById(FLAT_A1_ID);
      assert.strictEqual(
        updatedFlat.currentTenantId.toString(),
        res.data.data._id
      );
      assert.strictEqual(updatedFlat.status, FLAT_STATUS.OCCUPIED);
    });

    it("Occupancy Guard: Rejects onboarding when Flat is already occupied by an active tenant (409)", async () => {
      const secondCandidate = await User.create({
        firstName: "Second",
        lastName: "Renter",
        email: "second.renter@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      // FLAT_A1_ID was already leased in the previous test
      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: secondCandidate._id.toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A1_ID,
          ownerId: OWNER_A_ID,
          leaseStartDate: "2026-03-01",
          leaseEndDate: "2027-03-01",
          rentAmount: 40000,
        },
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /already occupied/i);
    });

    it("Allows Manager to onboard tenant within assigned building scope", async () => {
      const managerCandidate = await User.create({
        firstName: "Mark",
        lastName: "Tenant",
        email: "mark.tenant@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${managerToken}` },
        body: {
          userId: managerCandidate._id.toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A2_ID,
          ownerId: OWNER_A_ID,
          leaseStartDate: "2026-04-01",
          leaseEndDate: "2027-04-01",
          rentAmount: 45000,
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.flatId._id, FLAT_A2_ID);
    });

    it("Allows SuperAdmin to onboard tenant in any building globally", async () => {
      const superCandidate = await User.create({
        firstName: "Sarah",
        lastName: "Connor",
        email: "sarah.connor@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          userId: superCandidate._id.toString(),
          buildingId: BUILDING_B_ID,
          flatId: FLAT_B1_ID,
          ownerId: OWNER_B_ID,
          leaseStartDate: "2026-05-01",
          leaseEndDate: "2027-05-01",
          rentAmount: 50000,
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.buildingId, BUILDING_B_ID);
    });

    it("Mass-Assignment Guard: Rejects client attempts to inject internal fields (_id, isDeleted, moveOutDate)", async () => {
      const hackerCandidate = await User.create({
        firstName: "Hack",
        lastName: "Candidate",
        email: "hack.candidate@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const res = await apiRequest("/api/v1/tenants", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: hackerCandidate._id.toString(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A1_ID,
          ownerId: OWNER_A_ID,
          leaseStartDate: "2026-01-01",
          leaseEndDate: "2027-01-01",
          isDeleted: true,
          moveOutDate: new Date().toISOString(),
          _id: new mongoose.Types.ObjectId().toString(),
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /validation failed/i);
    });
  });

  // =========================================================
  // 3. GET /api/v1/tenants (Listing & Scoping)
  // =========================================================
  describe("3. GET /api/v1/tenants (Listing & Scoping)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/tenants");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("IDOR Guard: BuildingAdmin querying tenants of an unassigned building is rejected with 403", async () => {
      const res = await apiRequest(
        `/api/v1/tenants?buildingId=${BUILDING_B_ID}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /forbidden/i);
    });

    it("IDOR Guard: BuildingAdmin querying tenants of a flat in an unassigned building is rejected with 403", async () => {
      const res = await apiRequest(`/api/v1/tenants?flatId=${FLAT_B1_ID}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
    });

    it("BuildingAdmin with empty assignedBuildingIds receives empty results (200 OK)", async () => {
      const res = await apiRequest("/api/v1/tenants", {
        headers: { Authorization: `Bearer ${unassignedToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.items.length, 0);
      assert.strictEqual(res.data.data.total, 0);
    });

    it("Allows BuildingAdmin to list tenants for their assigned building complex", async () => {
      const res = await apiRequest(
        `/api/v1/tenants?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(Array.isArray(res.data.data.items));
      assert.ok(res.data.data.items.length >= 2);
      for (const item of res.data.data.items) {
        assert.strictEqual(item.buildingId, BUILDING_A_ID);
      }
    });

    it("Allows SuperAdmin to list all tenants globally across complexes", async () => {
      const res = await apiRequest("/api/v1/tenants", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.items.length >= 3);
    });

    it("Supports filtering tenants by flatId", async () => {
      const res = await apiRequest(`/api/v1/tenants?flatId=${FLAT_A1_ID}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.items.length, 1);
      assert.strictEqual(res.data.data.items[0].flatId._id, FLAT_A1_ID);
    });

    it("Supports filtering tenants by status", async () => {
      const res = await apiRequest(
        `/api/v1/tenants?status=ACTIVE&buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      for (const item of res.data.data.items) {
        assert.strictEqual(item.status, "ACTIVE");
      }
    });

    it("Supports filtering tenants by leaseExpiringBefore", async () => {
      const res = await apiRequest(
        `/api/v1/tenants?leaseExpiringBefore=2027-12-31&buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.items.length >= 1);
    });

    it("Excludes soft-deleted tenant records from query results", async () => {
      const ghostUser = await User.create({
        firstName: "Ghost",
        lastName: "Tenant",
        email: "ghost.tenant@tenant-test.local",
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const deletedTenant = await Tenant.create({
        userId: ghostUser._id,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A1_ID,
        ownerId: OWNER_A_ID,
        leaseStartDate: new Date("2025-01-01"),
        leaseEndDate: new Date("2026-01-01"),
        isDeleted: true,
        deletedAt: new Date(),
      });

      const res = await apiRequest(
        `/api/v1/tenants?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 200);
      const found = res.data.data.items.some(
        (t) => t._id === deletedTenant._id.toString()
      );
      assert.strictEqual(found, false);
    });
  });

  // =========================================================
  // 4. PATCH /api/v1/tenants/:id/move-out (Checkout & Flat Release)
  // =========================================================
  describe("4. PATCH /api/v1/tenants/:id/move-out (Checkout & Flat Release)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest(
        `/api/v1/tenants/${new mongoose.Types.ObjectId().toString()}/move-out`,
        { method: "PATCH" }
      );
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("Rejects unauthorized roles (e.g. Tenant) with 403 Forbidden", async () => {
      const res = await apiRequest(
        `/api/v1/tenants/${new mongoose.Types.ObjectId().toString()}/move-out`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${tenantToken}` },
        }
      );
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
    });

    it("Rejects malformed ObjectId with 400 Bad Request", async () => {
      const res = await apiRequest("/api/v1/tenants/invalid-hex-id/move-out", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });

    it("Returns 404 Not Found for non-existent Tenant ID", async () => {
      const res = await apiRequest(
        `/api/v1/tenants/${new mongoose.Types.ObjectId().toString()}/move-out`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
    });

    it("IDOR Guard: BuildingAdmin cannot process move-out for tenant in unassigned building (403)", async () => {
      // Find tenant in Building B
      const tenantB = await Tenant.findOne({
        buildingId: BUILDING_B_ID,
        isDeleted: false,
      });

      const res = await apiRequest(
        `/api/v1/tenants/${tenantB._id.toString()}/move-out`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /forbidden/i);
    });

    it("Executes move-out: transitions status = MOVED_OUT, sets moveOutDate, releases Flat to VACANT", async () => {
      // Find active tenant in Building A
      const tenantA = await Tenant.findOne({
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A1_ID,
        status: "ACTIVE",
        isDeleted: false,
      });

      const res = await apiRequest(
        `/api/v1/tenants/${tenantA._id.toString()}/move-out`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
          body: {
            moveOutDate: "2026-09-10T12:00:00.000Z",
          },
        }
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.status, "MOVED_OUT");
      assert.ok(res.data.data.moveOutDate);

      // Verify Flat release
      const releasedFlat = await Flat.findById(FLAT_A1_ID);
      assert.strictEqual(releasedFlat.currentTenantId, null);
      assert.strictEqual(releasedFlat.status, FLAT_STATUS.VACANT);
    });

    it("Repeated Move-Out Guard: Rejects move-out on already MOVED_OUT tenant with 400 Bad Request", async () => {
      const movedOutTenant = await Tenant.findOne({
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A1_ID,
        status: "MOVED_OUT",
        isDeleted: false,
      });

      const res = await apiRequest(
        `/api/v1/tenants/${movedOutTenant._id.toString()}/move-out`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /already checked out/i);
    });
  });
});
