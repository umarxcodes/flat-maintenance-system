// =====================  IMPORTS  ==========================
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { MaintenanceRequest } from "./maintenance-requests.model.js";
import {
  MAINTENANCE_REQUEST_STATUS,
  MAINTENANCE_REQUEST_CATEGORY,
  MAINTENANCE_REQUEST_PRIORITY,
} from "./maintenance-requests.constants.js";
import {
  validateStateTransition,
  calculateSlaDeadline,
} from "./maintenance-requests.state-machine.js";
import { Building } from "../../models/building.model.js";
import { Block } from "../../models/block.model.js";
import { Floor } from "../../models/floor.model.js";
import { Flat } from "../../models/flat.model.js";
import { User } from "../../models/user.model.js";
import { Owner } from "../../models/owner.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { Staff } from "../../models/staff.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { TENANTS_CONSTANTS } from "../tenants/tenants.constants.js";
import { STAFF_CONSTANTS } from "../staff/staff.constants.js";
import { generateAccessToken } from "../../utils/token.util.js";
import { rolesService } from "../roles/roles.service.js";

// =====================  TEST SETUP & FIXTURES  =============
dotenv.config();

let server;
let baseUrl;

// Test IDs - Buildings & Hierarchy
const BUILDING_A_ID = new mongoose.Types.ObjectId();
const BUILDING_B_ID = new mongoose.Types.ObjectId();
const BLOCK_A_ID = new mongoose.Types.ObjectId();
const FLOOR_A_ID = new mongoose.Types.ObjectId();
const FLAT_101_ID = new mongoose.Types.ObjectId();
const FLAT_102_ID = new mongoose.Types.ObjectId();
const FLAT_B_ID = new mongoose.Types.ObjectId();

// Test IDs - Actors
const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_A_ID = new mongoose.Types.ObjectId();
const MANAGER_A_ID = new mongoose.Types.ObjectId();
const PLUMBER_A_USER_ID = new mongoose.Types.ObjectId();
const PLUMBER_A_STAFF_ID = new mongoose.Types.ObjectId();
const ELECTRICIAN_A_USER_ID = new mongoose.Types.ObjectId();
const ELECTRICIAN_A_STAFF_ID = new mongoose.Types.ObjectId();
const SECURITY_A_USER_ID = new mongoose.Types.ObjectId();
const SECURITY_A_STAFF_ID = new mongoose.Types.ObjectId();
const ON_LEAVE_STAFF_USER_ID = new mongoose.Types.ObjectId();
const ON_LEAVE_STAFF_ID = new mongoose.Types.ObjectId();
const PLUMBER_B_USER_ID = new mongoose.Types.ObjectId();
const PLUMBER_B_STAFF_ID = new mongoose.Types.ObjectId();

const OWNER_A_USER_ID = new mongoose.Types.ObjectId();
const OWNER_A_PROFILE_ID = new mongoose.Types.ObjectId();
const TENANT_101_USER_ID = new mongoose.Types.ObjectId();
const TENANT_101_PROFILE_ID = new mongoose.Types.ObjectId();
const TENANT_102_USER_ID = new mongoose.Types.ObjectId();
const TENANT_102_PROFILE_ID = new mongoose.Types.ObjectId();

// Auth Tokens
let superAdminToken;
let buildingAdminAToken;
let managerAToken;
let plumberAToken;
let electricianAToken;
let securityAToken;
let plumberBToken;
let ownerAToken;
let tenant101Token;
let tenant102Token;

// Sample Cloudinary URLs
const VALID_PHOTO_URL_1 =
  "https://res.cloudinary.com/flat-maint/image/upload/v12345/initial1.jpg";
const VALID_PHOTO_URL_2 =
  "https://res.cloudinary.com/flat-maint/image/upload/v12345/completion1.jpg";
const INVALID_EXTERNAL_URL = "https://malicious-site.com/hacked.jpg";

// Helper to make HTTP requests
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
describe("Maintenance Requests / Work Orders Module (Module 13)", () => {
  before(async () => {
    await connectDB();

    // Start Express server
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Seed system roles
    await rolesService.seedSystemRoles();

    // Clean up collections
    await MaintenanceRequest.deleteMany({});
    await Staff.deleteMany({});
    await Tenant.deleteMany({});
    await Owner.deleteMany({});
    await Flat.deleteMany({});
    await Floor.deleteMany({});
    await Block.deleteMany({});
    await Building.deleteMany({
      _id: { $in: [BUILDING_A_ID, BUILDING_B_ID] },
    });
    await User.deleteMany({
      _id: {
        $in: [
          SUPER_ADMIN_ID,
          BUILDING_ADMIN_A_ID,
          MANAGER_A_ID,
          PLUMBER_A_USER_ID,
          ELECTRICIAN_A_USER_ID,
          SECURITY_A_USER_ID,
          ON_LEAVE_STAFF_USER_ID,
          PLUMBER_B_USER_ID,
          OWNER_A_USER_ID,
          TENANT_101_USER_ID,
          TENANT_102_USER_ID,
        ],
      },
    });

    // Seed Buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Emerald Heights Tower A",
        code: `EHA-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Emerald Way",
          city: "Metropolis",
          state: "NY",
          postalCode: "10001",
          country: "USA",
        },
        status: "ACTIVE",
        isDeleted: false,
      },
      {
        _id: BUILDING_B_ID,
        name: "Sapphire Enclave Tower B",
        code: `SEB-${Date.now().toString().slice(-4)}`,
        address: {
          street: "200 Sapphire Ave",
          city: "Metropolis",
          state: "NY",
          postalCode: "10001",
          country: "USA",
        },
        status: "ACTIVE",
        isDeleted: false,
      },
    ]);

    // Seed Hierarchy (Blocks, Floors, Flats)
    await Block.create({
      _id: BLOCK_A_ID,
      buildingId: BUILDING_A_ID,
      name: "Block A1",
      code: "A1",
      totalFloors: 10,
    });

    await Floor.create({
      _id: FLOOR_A_ID,
      buildingId: BUILDING_A_ID,
      blockId: BLOCK_A_ID,
      floorNumber: 1,
      name: "First Floor",
    });

    await Flat.create([
      {
        _id: FLAT_101_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "101",
        areaSqFt: 1200,
        status: "OCCUPIED",
        isDeleted: false,
      },
      {
        _id: FLAT_102_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "102",
        areaSqFt: 1100,
        status: "OCCUPIED",
        isDeleted: false,
      },
      {
        _id: FLAT_B_ID,
        buildingId: BUILDING_B_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "B101",
        areaSqFt: 1000,
        status: "OCCUPIED",
        isDeleted: false,
      },
    ]);

    // Seed Users
    await User.create([
      {
        _id: SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: `super.mr.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
      {
        _id: BUILDING_ADMIN_A_ID,
        firstName: "Admin",
        lastName: "TowerA",
        email: `admin.mr.a.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: MANAGER_A_ID,
        firstName: "Manager",
        lastName: "TowerA",
        email: `manager.mr.a.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: PLUMBER_A_USER_ID,
        firstName: "John",
        lastName: "Plumber",
        email: `plumber.a.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.MAINTENANCE_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: ELECTRICIAN_A_USER_ID,
        firstName: "Eric",
        lastName: "Spark",
        email: `electrician.a.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.MAINTENANCE_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: SECURITY_A_USER_ID,
        firstName: "Sam",
        lastName: "Guard",
        email: `guard.a.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.SECURITY_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: ON_LEAVE_STAFF_USER_ID,
        firstName: "Bob",
        lastName: "Leave",
        email: `leave.a.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.MAINTENANCE_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: PLUMBER_B_USER_ID,
        firstName: "Paul",
        lastName: "PlumberB",
        email: `plumber.b.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.MAINTENANCE_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: OWNER_A_USER_ID,
        firstName: "Oliver",
        lastName: "Owner",
        email: `owner.a.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: TENANT_101_USER_ID,
        firstName: "Tina",
        lastName: "Tenant101",
        email: `tenant.101.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: TENANT_102_USER_ID,
        firstName: "Tom",
        lastName: "Tenant102",
        email: `tenant.102.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
    ]);

    // Seed Staff Profiles
    await Staff.create([
      {
        _id: PLUMBER_A_STAFF_ID,
        userId: PLUMBER_A_USER_ID,
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.PLUMBER,
        status: STAFF_CONSTANTS.STATUS.ACTIVE,
      },
      {
        _id: ELECTRICIAN_A_STAFF_ID,
        userId: ELECTRICIAN_A_USER_ID,
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.ELECTRICIAN,
        status: STAFF_CONSTANTS.STATUS.ACTIVE,
      },
      {
        _id: SECURITY_A_STAFF_ID,
        userId: SECURITY_A_USER_ID,
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.SECURITY,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.GATE_GUARD,
        status: STAFF_CONSTANTS.STATUS.ACTIVE,
      },
      {
        _id: ON_LEAVE_STAFF_ID,
        userId: ON_LEAVE_STAFF_USER_ID,
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.PLUMBER,
        status: STAFF_CONSTANTS.STATUS.ON_LEAVE,
      },
      {
        _id: PLUMBER_B_STAFF_ID,
        userId: PLUMBER_B_USER_ID,
        buildingId: BUILDING_B_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.PLUMBER,
        status: STAFF_CONSTANTS.STATUS.ACTIVE,
      },
    ]);

    // Seed Owner & Tenant Profiles
    await Owner.create({
      _id: OWNER_A_PROFILE_ID,
      userId: OWNER_A_USER_ID,
      buildingId: BUILDING_A_ID,
      flatsOwned: [FLAT_101_ID],
    });

    await Tenant.create([
      {
        _id: TENANT_101_PROFILE_ID,
        userId: TENANT_101_USER_ID,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_ID,
        ownerId: OWNER_A_PROFILE_ID,
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2026-12-31"),
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
      },
      {
        _id: TENANT_102_PROFILE_ID,
        userId: TENANT_102_USER_ID,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_102_ID,
        ownerId: OWNER_A_PROFILE_ID,
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2026-12-31"),
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
      },
    ]);

    // Generate JWT Access Tokens
    superAdminToken = generateAccessToken({
      sub: SUPER_ADMIN_ID.toString(),
      role: ROLES.SUPER_ADMIN,
      email: "super.mr@test.local",
    });

    buildingAdminAToken = generateAccessToken({
      sub: BUILDING_ADMIN_A_ID.toString(),
      role: ROLES.BUILDING_ADMIN,
      email: "admin.mr.a@test.local",
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });

    managerAToken = generateAccessToken({
      sub: MANAGER_A_ID.toString(),
      role: ROLES.MANAGER,
      email: "manager.mr.a@test.local",
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });

    plumberAToken = generateAccessToken({
      sub: PLUMBER_A_USER_ID.toString(),
      role: ROLES.MAINTENANCE_STAFF,
      email: "plumber.a@test.local",
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });

    electricianAToken = generateAccessToken({
      sub: ELECTRICIAN_A_USER_ID.toString(),
      role: ROLES.MAINTENANCE_STAFF,
      email: "electrician.a@test.local",
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });

    securityAToken = generateAccessToken({
      sub: SECURITY_A_USER_ID.toString(),
      role: ROLES.SECURITY_STAFF,
      email: "guard.a@test.local",
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });

    plumberBToken = generateAccessToken({
      sub: PLUMBER_B_USER_ID.toString(),
      role: ROLES.MAINTENANCE_STAFF,
      email: "plumber.b@test.local",
      assignedBuildingIds: [BUILDING_B_ID.toString()],
    });

    ownerAToken = generateAccessToken({
      sub: OWNER_A_USER_ID.toString(),
      role: ROLES.OWNER,
      email: "owner.a@test.local",
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });

    tenant101Token = generateAccessToken({
      sub: TENANT_101_USER_ID.toString(),
      role: ROLES.TENANT,
      email: "tenant.101@test.local",
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });

    tenant102Token = generateAccessToken({
      sub: TENANT_102_USER_ID.toString(),
      role: ROLES.TENANT,
      email: "tenant.102@test.local",
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });
  });

  after(async () => {
    await MaintenanceRequest.deleteMany({});
    await Staff.deleteMany({});
    await Tenant.deleteMany({});
    await Owner.deleteMany({});
    await Flat.deleteMany({});
    await Floor.deleteMany({});
    await Block.deleteMany({});
    await Building.deleteMany({
      _id: { $in: [BUILDING_A_ID, BUILDING_B_ID] },
    });
    await User.deleteMany({
      _id: {
        $in: [
          SUPER_ADMIN_ID,
          BUILDING_ADMIN_A_ID,
          MANAGER_A_ID,
          PLUMBER_A_USER_ID,
          ELECTRICIAN_A_USER_ID,
          SECURITY_A_USER_ID,
          ON_LEAVE_STAFF_USER_ID,
          PLUMBER_B_USER_ID,
          OWNER_A_USER_ID,
          TENANT_101_USER_ID,
          TENANT_102_USER_ID,
        ],
      },
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // =========================================================================
  // 1. STATE MACHINE & SLA CALCULATION PURE LOGIC
  // =========================================================================
  describe("1. State Machine & SLA Calculation (Unit Logic)", () => {
    it("Validates full 7-stage happy-path transition progression", () => {
      assert.equal(
        validateStateTransition({
          currentStatus: MAINTENANCE_REQUEST_STATUS.OPEN,
          targetStatus: MAINTENANCE_REQUEST_STATUS.TRIAGED,
          actorRole: ROLES.MANAGER,
        }),
        true
      );

      assert.equal(
        validateStateTransition({
          currentStatus: MAINTENANCE_REQUEST_STATUS.TRIAGED,
          targetStatus: MAINTENANCE_REQUEST_STATUS.ASSIGNED,
          actorRole: ROLES.MANAGER,
        }),
        true
      );

      assert.equal(
        validateStateTransition({
          currentStatus: MAINTENANCE_REQUEST_STATUS.ASSIGNED,
          targetStatus: MAINTENANCE_REQUEST_STATUS.IN_PROGRESS,
          actorRole: ROLES.MAINTENANCE_STAFF,
        }),
        true
      );

      assert.equal(
        validateStateTransition({
          currentStatus: MAINTENANCE_REQUEST_STATUS.IN_PROGRESS,
          targetStatus: MAINTENANCE_REQUEST_STATUS.COMPLETED,
          actorRole: ROLES.MAINTENANCE_STAFF,
        }),
        true
      );

      assert.equal(
        validateStateTransition({
          currentStatus: MAINTENANCE_REQUEST_STATUS.COMPLETED,
          targetStatus: MAINTENANCE_REQUEST_STATUS.CLOSED,
          actorRole: ROLES.TENANT,
        }),
        true
      );
    });

    it("Validates rework transition (COMPLETED -> IN_PROGRESS) on resident rejection", () => {
      assert.equal(
        validateStateTransition({
          currentStatus: MAINTENANCE_REQUEST_STATUS.COMPLETED,
          targetStatus: MAINTENANCE_REQUEST_STATUS.IN_PROGRESS,
          actorRole: ROLES.TENANT,
        }),
        true
      );
    });

    it("Validates pre-execution cancellation (OPEN -> CANCELLED)", () => {
      assert.equal(
        validateStateTransition({
          currentStatus: MAINTENANCE_REQUEST_STATUS.OPEN,
          targetStatus: MAINTENANCE_REQUEST_STATUS.CANCELLED,
          actorRole: ROLES.TENANT,
          isCreator: true,
        }),
        true
      );
    });

    it("Rejects illegal state machine jumps", () => {
      assert.throws(
        () =>
          validateStateTransition({
            currentStatus: MAINTENANCE_REQUEST_STATUS.OPEN,
            targetStatus: MAINTENANCE_REQUEST_STATUS.COMPLETED,
            actorRole: ROLES.MANAGER,
          }),
        /cannot transition from 'OPEN' to 'COMPLETED'/i
      );

      assert.throws(
        () =>
          validateStateTransition({
            currentStatus: MAINTENANCE_REQUEST_STATUS.ASSIGNED,
            targetStatus: MAINTENANCE_REQUEST_STATUS.CLOSED,
            actorRole: ROLES.TENANT,
          }),
        /cannot transition from 'ASSIGNED' to 'CLOSED'/i
      );

      assert.throws(
        () =>
          validateStateTransition({
            currentStatus: MAINTENANCE_REQUEST_STATUS.IN_PROGRESS,
            targetStatus: MAINTENANCE_REQUEST_STATUS.VERIFIED,
            actorRole: ROLES.TENANT,
          }),
        /cannot transition from 'IN_PROGRESS' to 'VERIFIED'/i
      );

      assert.throws(
        () =>
          validateStateTransition({
            currentStatus: MAINTENANCE_REQUEST_STATUS.CLOSED,
            targetStatus: MAINTENANCE_REQUEST_STATUS.OPEN,
            actorRole: ROLES.MANAGER,
          }),
        /cannot transition from 'CLOSED' to 'OPEN'/i
      );
    });

    it("Rejects transitions attempted by unauthorized roles", () => {
      assert.throws(
        () =>
          validateStateTransition({
            currentStatus: MAINTENANCE_REQUEST_STATUS.OPEN,
            targetStatus: MAINTENANCE_REQUEST_STATUS.ASSIGNED,
            actorRole: ROLES.TENANT, // Tenant cannot assign technician
          }),
        /Only Facility Managers and Administrators can assign technicians/i
      );

      assert.throws(
        () =>
          validateStateTransition({
            currentStatus: MAINTENANCE_REQUEST_STATUS.COMPLETED,
            targetStatus: MAINTENANCE_REQUEST_STATUS.CLOSED,
            actorRole: ROLES.MAINTENANCE_STAFF, // Staff cannot self-verify/close
          }),
        /Only the resident or authorized administrator can verify/i
      );
    });

    it("Calculates deterministic SLA deadlines for all priority tiers", () => {
      const base = new Date("2026-09-01T12:00:00.000Z");

      const emergencyDeadline = calculateSlaDeadline(
        MAINTENANCE_REQUEST_PRIORITY.EMERGENCY,
        base
      );
      assert.equal(
        emergencyDeadline.toISOString(),
        new Date(base.getTime() + 4 * 60 * 60 * 1000).toISOString()
      );

      const highDeadline = calculateSlaDeadline(
        MAINTENANCE_REQUEST_PRIORITY.HIGH,
        base
      );
      assert.equal(
        highDeadline.toISOString(),
        new Date(base.getTime() + 24 * 60 * 60 * 1000).toISOString()
      );

      const mediumDeadline = calculateSlaDeadline(
        MAINTENANCE_REQUEST_PRIORITY.MEDIUM,
        base
      );
      assert.equal(
        mediumDeadline.toISOString(),
        new Date(base.getTime() + 48 * 60 * 60 * 1000).toISOString()
      );

      const lowDeadline = calculateSlaDeadline(
        MAINTENANCE_REQUEST_PRIORITY.LOW,
        base
      );
      assert.equal(
        lowDeadline.toISOString(),
        new Date(base.getTime() + 72 * 60 * 60 * 1000).toISOString()
      );
    });
  });

  // =========================================================================
  // 2. POST /api/v1/maintenance-requests (Submission & Scoping)
  // =========================================================================
  describe("2. POST /api/v1/maintenance-requests", () => {
    it("Rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/maintenance-requests", {
        method: "POST",
        body: { buildingId: BUILDING_A_ID.toString() },
      });
      assert.equal(res.status, 401);
    });

    it("Rejects roles without COMPLAINT_CREATE with 403 Forbidden", async () => {
      const res = await apiRequest("/api/v1/maintenance-requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${plumberAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_101_ID.toString(),
          category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
          title: "Leaking Kitchen Pipe",
          description: "Water leaking under kitchen sink",
        },
      });
      assert.equal(res.status, 403);
    });

    it("Allows Tenant 101 to submit maintenance request for Flat 101 (201 Created)", async () => {
      const res = await apiRequest("/api/v1/maintenance-requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_101_ID.toString(),
          category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
          priority: MAINTENANCE_REQUEST_PRIORITY.HIGH,
          title: "Severe pipe leak in bathroom",
          description:
            "Hot water pipe leaking heavily under the master sink fixture.",
          initialPhotos: [VALID_PHOTO_URL_1],
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, MAINTENANCE_REQUEST_STATUS.OPEN);
      assert.equal(res.data.data.flatId, FLAT_101_ID.toString());
      assert.equal(res.data.data.buildingId, BUILDING_A_ID.toString());
      assert.equal(res.data.data.createdById, TENANT_101_USER_ID.toString());
      assert.match(res.data.data.requestNumber, /^WO-\d{4}-\d+/);
      assert.ok(res.data.data.slaDeadline);
      assert.equal(res.data.data.initialPhotos.length, 1);
    });

    it("Allows Owner A to submit maintenance request for owned Flat 101 (201 Created)", async () => {
      const res = await apiRequest("/api/v1/maintenance-requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_101_ID.toString(),
          category: MAINTENANCE_REQUEST_CATEGORY.ELECTRICAL,
          priority: MAINTENANCE_REQUEST_PRIORITY.EMERGENCY,
          title: "Main Circuit Breaker Tripping",
          description: "Main electrical panel breaker tripping continuously.",
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.createdById, OWNER_A_USER_ID.toString());
      assert.equal(
        res.data.data.category,
        MAINTENANCE_REQUEST_CATEGORY.ELECTRICAL
      );
    });

    it("Anti-IDOR: Rejects Tenant 101 attempting to submit ticket for Flat 102 (403 Forbidden)", async () => {
      const res = await apiRequest("/api/v1/maintenance-requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_102_ID.toString(), // Belongs to Tenant 102!
          category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
          title: "Intruder ticket submission",
          description: "Attempting to create ticket for neighboring flat.",
        },
      });

      assert.equal(res.status, 403);
      assert.match(JSON.stringify(res.data), /do not have an active lease/i);
    });

    it("Anti-IDOR: Rejects Owner attempting to submit ticket for flat they do not own (403 Forbidden)", async () => {
      const res = await apiRequest("/api/v1/maintenance-requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_102_ID.toString(), // Owner owns 101, not 102
          category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
          title: "Unowned flat ticket",
          description: "Submitting for flat outside portfolio.",
        },
      });

      assert.equal(res.status, 403);
      assert.match(JSON.stringify(res.data), /do not own flat/i);
    });

    it("Hierarchy Guard: Rejects request if Flat does not belong to specified Building (400)", async () => {
      const res = await apiRequest("/api/v1/maintenance-requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_B_ID.toString(), // Belongs to Building B!
          category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
          title: "Cross building flat",
          description: "Mismatched building and flat hierarchy.",
        },
      });

      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /belongs to building/i);
    });

    it("Rejects non-Cloudinary external photo URLs (400 Bad Request)", async () => {
      const res = await apiRequest("/api/v1/maintenance-requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_101_ID.toString(),
          category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
          title: "Faulty pipe with external image",
          description: "Attaching malicious external URL.",
          initialPhotos: [INVALID_EXTERNAL_URL],
        },
      });

      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /authentic Cloudinary CDN URL/i);
    });

    it("Blocks mass assignment of status, assignedStaffId, or slaDeadline", async () => {
      const res = await apiRequest("/api/v1/maintenance-requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_101_ID.toString(),
          category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
          title: "Mass assignment attack",
          description: "Attempting to inject server controlled status.",
          status: "CLOSED",
          assignedStaffId: PLUMBER_A_STAFF_ID.toString(),
          _id: new mongoose.Types.ObjectId().toString(),
        },
      });

      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /unrecognized/i);
    });
  });

  // =========================================================================
  // 3. GET /api/v1/maintenance-requests (Role-Filtered Listing)
  // =========================================================================
  describe("3. GET /api/v1/maintenance-requests", () => {
    it("Rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/maintenance-requests");
      assert.equal(res.status, 401);
    });

    it("Tenant receives ONLY tickets for their active flat", async () => {
      const res = await apiRequest("/api/v1/maintenance-requests", {
        headers: { Authorization: `Bearer ${tenant101Token}` },
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.items.length >= 1);
      for (const item of res.data.data.items) {
        assert.equal(item.flatId, FLAT_101_ID.toString());
      }
    });

    it("Manager A receives tickets scoped to Building A with pagination", async () => {
      const res = await apiRequest(
        "/api/v1/maintenance-requests?page=1&limit=10",
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.ok(res.data.data.pagination.total >= 1);
      for (const item of res.data.data.items) {
        assert.equal(item.buildingId, BUILDING_A_ID.toString());
      }
    });

    it("SuperAdmin can query all tickets across complexes globally", async () => {
      const res = await apiRequest("/api/v1/maintenance-requests", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.items.length >= 2);
    });
  });

  // =========================================================================
  // 4. PATCH /api/v1/maintenance-requests/:id/assign (Technician Dispatch)
  // =========================================================================
  describe("4. PATCH /api/v1/maintenance-requests/:id/assign", () => {
    let testTicketId;

    before(async () => {
      // Create a fresh test ticket for dispatch
      const ticket = await MaintenanceRequest.create({
        requestNumber: `WO-${Date.now().toString().slice(-6)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_ID,
        createdById: TENANT_101_USER_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
        priority: MAINTENANCE_REQUEST_PRIORITY.MEDIUM,
        title: "Kitchen Sink Drain Clogged",
        description: "Water backing up in kitchen sink basin.",
        slaDeadline: new Date(Date.now() + 48 * 3600 * 1000),
        status: MAINTENANCE_REQUEST_STATUS.OPEN,
      });
      testTicketId = ticket._id.toString();
    });

    it("Rejects non-manager/non-admin assignment attempts (403 Forbidden)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${testTicketId}/assign`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${tenant101Token}` },
          body: { assignedStaffId: PLUMBER_A_STAFF_ID.toString() },
        }
      );
      assert.equal(res.status, 403);
    });

    it("Rejects assigning staff from a different building complex (400)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${testTicketId}/assign`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: { assignedStaffId: PLUMBER_B_STAFF_ID.toString() }, // Staff in Building B!
        }
      );
      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /different building complex/i);
    });

    it("Rejects assigning staff with ON_LEAVE duty status (400 Bad Request)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${testTicketId}/assign`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: { assignedStaffId: ON_LEAVE_STAFF_ID.toString() },
        }
      );
      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /currently 'ON_LEAVE'/i);
    });

    it("Rejects assigning Security staff to maintenance work order (400 Bad Request)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${testTicketId}/assign`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: { assignedStaffId: SECURITY_A_STAFF_ID.toString() },
        }
      );
      assert.equal(res.status, 400);
      assert.match(
        JSON.stringify(res.data),
        /Security personnel cannot be assigned/i
      );
    });

    it("Rejects trade specialization mismatch (Electrician to Plumbing ticket) (400)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${testTicketId}/assign`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: { assignedStaffId: ELECTRICIAN_A_STAFF_ID.toString() },
        }
      );
      assert.equal(res.status, 400);
      assert.match(
        JSON.stringify(res.data),
        /Specialization mismatch: Staff trade 'ELECTRICIAN' is not qualified for category 'PLUMBING'/i
      );
    });

    it("Allows Manager to dispatch qualified Plumber A to ticket (200 OK)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${testTicketId}/assign`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: {
            assignedStaffId: PLUMBER_A_STAFF_ID.toString(),
            priority: MAINTENANCE_REQUEST_PRIORITY.HIGH,
          },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, MAINTENANCE_REQUEST_STATUS.ASSIGNED);
      assert.equal(
        res.data.data.assignedStaffId,
        PLUMBER_A_STAFF_ID.toString()
      );
      assert.equal(res.data.data.priority, MAINTENANCE_REQUEST_PRIORITY.HIGH);
    });

    it("Allows Building Admin A to dispatch qualified Plumber A to ticket (200 OK)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${testTicketId}/assign`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
          body: {
            assignedStaffId: PLUMBER_A_STAFF_ID.toString(),
          },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, MAINTENANCE_REQUEST_STATUS.ASSIGNED);
    });
  });

  // =========================================================================
  // 5. PATCH /api/v1/maintenance-requests/:id/status (Technician Execution)
  // =========================================================================
  describe("5. PATCH /api/v1/maintenance-requests/:id/status", () => {
    let activeTicketId;

    before(async () => {
      const ticket = await MaintenanceRequest.create({
        requestNumber: `WO-${Date.now().toString().slice(-6)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_ID,
        createdById: TENANT_101_USER_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
        priority: MAINTENANCE_REQUEST_PRIORITY.HIGH,
        title: "Burst valve replacement",
        description: "Water valve needs complete replacement.",
        slaDeadline: new Date(Date.now() + 24 * 3600 * 1000),
        status: MAINTENANCE_REQUEST_STATUS.ASSIGNED,
        assignedStaffId: PLUMBER_A_STAFF_ID,
      });
      activeTicketId = ticket._id.toString();
    });

    it("Anti-Hijacking: Rejects Electrician A attempting to update Plumber A's ticket (403)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${activeTicketId}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${electricianAToken}` },
          body: { status: MAINTENANCE_REQUEST_STATUS.IN_PROGRESS },
        }
      );
      assert.equal(res.status, 403);
      assert.match(JSON.stringify(res.data), /not the assigned technician/i);
    });

    it("Anti-Hijacking: Rejects Plumber B from Building B attempting to update Plumber A's ticket (403)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${activeTicketId}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${plumberBToken}` },
          body: { status: MAINTENANCE_REQUEST_STATUS.IN_PROGRESS },
        }
      );
      assert.equal(res.status, 403);
      assert.match(JSON.stringify(res.data), /not the assigned technician/i);
    });

    it("Rejects Security staff attempting to update work order execution status (403)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${activeTicketId}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${securityAToken}` },
          body: { status: MAINTENANCE_REQUEST_STATUS.IN_PROGRESS },
        }
      );
      assert.equal(res.status, 403);
    });

    it("Assigned Plumber A transitions ticket to IN_PROGRESS (200 OK)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${activeTicketId}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${plumberAToken}` },
          body: { status: MAINTENANCE_REQUEST_STATUS.IN_PROGRESS },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(
        res.data.data.status,
        MAINTENANCE_REQUEST_STATUS.IN_PROGRESS
      );
      assert.ok(res.data.data.startedAt);
    });

    it("Rejects COMPLETED status without required completion photos (400 Bad Request)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${activeTicketId}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${plumberAToken}` },
          body: {
            status: MAINTENANCE_REQUEST_STATUS.COMPLETED,
            completionPhotos: [], // Missing photos!
          },
        }
      );

      assert.equal(res.status, 400);
      assert.match(
        JSON.stringify(res.data),
        /Completion photos are mandatory/i
      );
    });

    it("Assigned Plumber A marks ticket COMPLETED with Cloudinary photo proof (200 OK)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${activeTicketId}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${plumberAToken}` },
          body: {
            status: MAINTENANCE_REQUEST_STATUS.COMPLETED,
            completionPhotos: [VALID_PHOTO_URL_2],
          },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, MAINTENANCE_REQUEST_STATUS.COMPLETED);
      assert.ok(res.data.data.completedAt);
      assert.equal(res.data.data.completionPhotos.length, 1);
    });
  });

  // =========================================================================
  // 6. PATCH /api/v1/maintenance-requests/:id/verify (Resident Verification)
  // =========================================================================
  describe("6. PATCH /api/v1/maintenance-requests/:id/verify", () => {
    let completedTicketId;

    beforeEach(async () => {
      const ticket = await MaintenanceRequest.create({
        requestNumber: `WO-${Date.now().toString().slice(-6)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_ID,
        createdById: TENANT_101_USER_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
        priority: MAINTENANCE_REQUEST_PRIORITY.MEDIUM,
        title: "Faucet cartridge fix",
        description: "Replaced kitchen faucet washer.",
        slaDeadline: new Date(Date.now() + 48 * 3600 * 1000),
        status: MAINTENANCE_REQUEST_STATUS.COMPLETED,
        assignedStaffId: PLUMBER_A_STAFF_ID,
        startedAt: new Date(Date.now() - 3600 * 1000),
        completedAt: new Date(),
        completionPhotos: [VALID_PHOTO_URL_2],
      });
      completedTicketId = ticket._id.toString();
    });

    it("Anti-IDOR: Rejects Tenant 102 attempting to verify Tenant 101's ticket (403)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${completedTicketId}/verify`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${tenant102Token}` },
          body: { approved: true },
        }
      );
      assert.equal(res.status, 403);
      assert.match(JSON.stringify(res.data), /do not have an active lease/i);
    });

    it("Rework Cycle: Tenant 101 rejects repair quality (transitions back to IN_PROGRESS)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${completedTicketId}/verify`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${tenant101Token}` },
          body: {
            approved: false,
            feedback: "Faucet is still dripping intermittently.",
          },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(
        res.data.data.status,
        MAINTENANCE_REQUEST_STATUS.IN_PROGRESS
      );
    });

    it("Resident Sign-off: Tenant 101 approves repair quality (transitions to CLOSED)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-requests/${completedTicketId}/verify`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${tenant101Token}` },
          body: {
            approved: true,
            feedback: "Excellent work! Faucet functioning perfectly.",
          },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, MAINTENANCE_REQUEST_STATUS.CLOSED);
      assert.ok(res.data.data.verifiedAt);
    });
  });

  // =========================================================================
  // 7. CONCURRENCY & UNIQUENESS
  // =========================================================================
  describe("7. Concurrency & Identifier Uniqueness", () => {
    it("Handles concurrent ticket creation without request number collisions", async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        apiRequest("/api/v1/maintenance-requests", {
          method: "POST",
          headers: { Authorization: `Bearer ${tenant101Token}` },
          body: {
            buildingId: BUILDING_A_ID.toString(),
            flatId: FLAT_101_ID.toString(),
            category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
            title: `Concurrent Ticket #${i + 1}`,
            description: `Testing concurrent work order collision safety item ${i + 1}.`,
          },
        })
      );

      const results = await Promise.all(requests);
      const requestNumbers = new Set();

      for (const res of results) {
        assert.equal(res.status, 201);
        assert.ok(res.data.data.requestNumber);
        requestNumbers.add(res.data.data.requestNumber);
      }

      assert.equal(requestNumbers.size, 5); // 5 completely distinct request numbers
    });
  });
});
