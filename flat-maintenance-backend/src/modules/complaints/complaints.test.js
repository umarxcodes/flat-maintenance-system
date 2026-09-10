// =====================  IMPORTS & TEST RUNNER  =============
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Complaint } from "./complaints.model.js";
import { COMPLAINT_TYPE, COMPLAINT_STATUS } from "./complaints.constants.js";
import { validateComplaintTransition } from "./complaints.state-machine.js";
import { complaintService } from "./complaints.service.js";
import { Building } from "../../models/building.model.js";
import { Block } from "../../models/block.model.js";
import { Floor } from "../../models/floor.model.js";
import { Flat, FLAT_STATUS } from "../../models/flat.model.js";
import { User } from "../../models/user.model.js";
import { Owner } from "../../models/owner.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { Staff } from "../../models/staff.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { TENANTS_CONSTANTS } from "../tenants/tenants.constants.js";
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
const FLAT_101_OCCUPIED_ID = new mongoose.Types.ObjectId();
const FLAT_102_OCCUPIED_ID = new mongoose.Types.ObjectId();
const FLAT_B_OCCUPIED_ID = new mongoose.Types.ObjectId();

// Test IDs - Actors
const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_A_ID = new mongoose.Types.ObjectId();
const MANAGER_A_ID = new mongoose.Types.ObjectId();
const MANAGER_B_ID = new mongoose.Types.ObjectId();
const OWNER_A_USER_ID = new mongoose.Types.ObjectId();
const OWNER_A_PROFILE_ID = new mongoose.Types.ObjectId();
const OWNER_B_USER_ID = new mongoose.Types.ObjectId();
const OWNER_B_PROFILE_ID = new mongoose.Types.ObjectId();
const TENANT_101_USER_ID = new mongoose.Types.ObjectId();
const TENANT_101_PROFILE_ID = new mongoose.Types.ObjectId();
const TENANT_INACTIVE_USER_ID = new mongoose.Types.ObjectId();
const TENANT_INACTIVE_PROFILE_ID = new mongoose.Types.ObjectId();
const STAFF_MAINT_ID = new mongoose.Types.ObjectId();
const STAFF_MAINT_PROFILE_ID = new mongoose.Types.ObjectId();

// Auth Tokens
let superAdminToken;
let buildingAdminAToken;
let managerAToken;
let managerBToken;
let ownerAToken;
let ownerBToken;
let tenant101Token;
let tenantInactiveToken;
let staffMaintToken;

/**
 * Helper to execute HTTP requests against test server.
 */
const apiRequest = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response
  }

  return {
    status: response.status,
    data,
  };
};

// =====================  ROOT MODULE SUITE  =================
describe("Complaints & SLA Ticket Management Module (Module 16)", () => {
  before(async () => {
    process.env.NODE_ENV = "test";
    await connectDB();
    await rolesService.seedSystemRoles();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Clean up test collections
    await Promise.all([
      Complaint.deleteMany({}),
      Flat.deleteMany({}),
      Floor.deleteMany({}),
      Block.deleteMany({}),
      Building.deleteMany({}),
      Owner.deleteMany({}),
      Tenant.deleteMany({}),
      Staff.deleteMany({}),
      User.deleteMany({}),
    ]);

    // Seed Buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Grand Horizon Tower A",
        code: `GHA-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Innovation Blvd",
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
        name: "Emerald Heights Tower B",
        code: `EHB-${Date.now().toString().slice(-4)}`,
        address: {
          street: "200 Security Parkway",
          city: "Metropolis",
          state: "NY",
          postalCode: "10001",
          country: "USA",
        },
        status: "ACTIVE",
        isDeleted: false,
      },
    ]);

    // Seed Blocks & Floors
    await Block.create({
      _id: BLOCK_A_ID,
      buildingId: BUILDING_A_ID,
      name: "Block A",
      code: "BLK-A",
      totalFloors: 10,
      isDeleted: false,
    });

    await Floor.create({
      _id: FLOOR_A_ID,
      buildingId: BUILDING_A_ID,
      blockId: BLOCK_A_ID,
      floorNumber: 1,
      name: "Floor 1",
      isDeleted: false,
    });

    // Seed Flats
    await Flat.create([
      {
        _id: FLAT_101_OCCUPIED_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "101",
        areaSqFt: 1200,
        status: FLAT_STATUS.OCCUPIED,
        isDeleted: false,
      },
      {
        _id: FLAT_102_OCCUPIED_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "102",
        areaSqFt: 1500,
        status: FLAT_STATUS.OCCUPIED,
        isDeleted: false,
      },
      {
        _id: FLAT_B_OCCUPIED_ID,
        buildingId: BUILDING_B_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "B-201",
        areaSqFt: 1000,
        status: FLAT_STATUS.OCCUPIED,
        isDeleted: false,
      },
    ]);

    // Seed User Accounts
    await User.create([
      {
        _id: SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: "super.cmp@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: BUILDING_ADMIN_A_ID,
        firstName: "Building",
        lastName: "AdminA",
        email: "admin.cmp.a@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: MANAGER_A_ID,
        firstName: "Manny",
        lastName: "ManagerA",
        email: "manager.cmp.a@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: MANAGER_B_ID,
        firstName: "Morgan",
        lastName: "ManagerB",
        email: "manager.cmp.b@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: OWNER_A_USER_ID,
        firstName: "Oliver",
        lastName: "OwnerA",
        email: "owner.cmp.a@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: OWNER_B_USER_ID,
        firstName: "Oscar",
        lastName: "OwnerB",
        email: "owner.cmp.b@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: TENANT_101_USER_ID,
        firstName: "Timothy",
        lastName: "Tenant101",
        email: "tenant.cmp.101@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: TENANT_INACTIVE_USER_ID,
        firstName: "Tina",
        lastName: "TenantOld",
        email: "tenant.cmp.old@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: STAFF_MAINT_ID,
        firstName: "Sam",
        lastName: "Staff",
        email: "staff.maint@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MAINTENANCE_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
    ]);

    // Seed Owner Profiles
    await Owner.create([
      {
        _id: OWNER_A_PROFILE_ID,
        userId: OWNER_A_USER_ID,
        buildingId: BUILDING_A_ID,
        flatsOwned: [FLAT_101_OCCUPIED_ID],
      },
      {
        _id: OWNER_B_PROFILE_ID,
        userId: OWNER_B_USER_ID,
        buildingId: BUILDING_B_ID,
        flatsOwned: [FLAT_B_OCCUPIED_ID],
      },
    ]);

    // Seed Tenant Profiles
    await Tenant.create([
      {
        _id: TENANT_101_PROFILE_ID,
        userId: TENANT_101_USER_ID,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_OCCUPIED_ID,
        ownerId: OWNER_A_PROFILE_ID,
        rentAmount: 25000,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2027-01-01"),
      },
      {
        _id: TENANT_INACTIVE_PROFILE_ID,
        userId: TENANT_INACTIVE_USER_ID,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_102_OCCUPIED_ID,
        ownerId: OWNER_A_PROFILE_ID,
        rentAmount: 20000,
        status: TENANTS_CONSTANTS.TENANT_STATUS.MOVED_OUT,
        leaseStartDate: new Date("2025-01-01"),
        leaseEndDate: new Date("2025-12-31"),
      },
    ]);

    // Update Flats with references
    await Flat.updateOne(
      { _id: FLAT_101_OCCUPIED_ID },
      {
        currentOwnerId: OWNER_A_PROFILE_ID,
        currentTenantId: TENANT_101_PROFILE_ID,
      }
    );

    // Seed Staff Profile
    await Staff.create({
      _id: STAFF_MAINT_PROFILE_ID,
      userId: STAFF_MAINT_ID,
      buildingId: BUILDING_A_ID,
      category: "MAINTENANCE",
      subCategory: "PLUMBER",
      status: "ACTIVE",
    });

    // Generate JWT Tokens
    superAdminToken = generateAccessToken({
      sub: SUPER_ADMIN_ID.toString(),
      role: ROLES.SUPER_ADMIN,
    });

    buildingAdminAToken = generateAccessToken({
      sub: BUILDING_ADMIN_A_ID.toString(),
      role: ROLES.BUILDING_ADMIN,
      buildingIds: [BUILDING_A_ID.toString()],
    });

    managerAToken = generateAccessToken({
      sub: MANAGER_A_ID.toString(),
      role: ROLES.MANAGER,
      buildingIds: [BUILDING_A_ID.toString()],
    });

    managerBToken = generateAccessToken({
      sub: MANAGER_B_ID.toString(),
      role: ROLES.MANAGER,
      buildingIds: [BUILDING_B_ID.toString()],
    });

    ownerAToken = generateAccessToken({
      sub: OWNER_A_USER_ID.toString(),
      role: ROLES.OWNER,
      buildingIds: [BUILDING_A_ID.toString()],
    });

    ownerBToken = generateAccessToken({
      sub: OWNER_B_USER_ID.toString(),
      role: ROLES.OWNER,
      buildingIds: [BUILDING_B_ID.toString()],
    });

    tenant101Token = generateAccessToken({
      sub: TENANT_101_USER_ID.toString(),
      role: ROLES.TENANT,
      buildingIds: [BUILDING_A_ID.toString()],
    });

    tenantInactiveToken = generateAccessToken({
      sub: TENANT_INACTIVE_USER_ID.toString(),
      role: ROLES.TENANT,
      buildingIds: [BUILDING_A_ID.toString()],
    });

    staffMaintToken = generateAccessToken({
      sub: STAFF_MAINT_ID.toString(),
      role: ROLES.MAINTENANCE_STAFF,
      buildingIds: [BUILDING_A_ID.toString()],
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // =========================================================================
  // 1. PURE STATE MACHINE INVARIANTS (UNIT MATRIX)
  // =========================================================================
  describe("1. Pure State Machine Invariants (Unit Matrix)", () => {
    const managerActor = { role: ROLES.MANAGER, id: MANAGER_A_ID };
    const tenantActor = { role: ROLES.TENANT, id: TENANT_101_USER_ID };

    it("Validates OPEN -> UNDER_INVESTIGATION transition by Manager", () => {
      assert.equal(
        validateComplaintTransition(
          COMPLAINT_STATUS.OPEN,
          COMPLAINT_STATUS.UNDER_INVESTIGATION,
          managerActor
        ),
        true
      );
    });

    it("Validates UNDER_INVESTIGATION -> RESOLVED transition with notes", () => {
      assert.equal(
        validateComplaintTransition(
          COMPLAINT_STATUS.UNDER_INVESTIGATION,
          COMPLAINT_STATUS.RESOLVED,
          managerActor,
          "Noise source identified and resident warned."
        ),
        true
      );
    });

    it("Validates UNDER_INVESTIGATION -> REJECTED transition with notes", () => {
      assert.equal(
        validateComplaintTransition(
          COMPLAINT_STATUS.UNDER_INVESTIGATION,
          COMPLAINT_STATUS.REJECTED,
          managerActor,
          "Parking dispute invalid; vehicle is in assigned space."
        ),
        true
      );
    });

    it("Rejects OPEN -> RESOLVED jump (must be under investigation first)", () => {
      assert.throws(
        () =>
          validateComplaintTransition(
            COMPLAINT_STATUS.OPEN,
            COMPLAINT_STATUS.RESOLVED,
            managerActor,
            "Premature resolve"
          ),
        /must be 'UNDER_INVESTIGATION' before it can be resolved/
      );
    });

    it("Rejects OPEN -> REJECTED jump (must be under investigation first)", () => {
      assert.throws(
        () =>
          validateComplaintTransition(
            COMPLAINT_STATUS.OPEN,
            COMPLAINT_STATUS.REJECTED,
            managerActor,
            "Premature reject"
          ),
        /must be 'UNDER_INVESTIGATION' before it can be resolved or rejected/
      );
    });

    it("Rejects any transition from terminal state RESOLVED", () => {
      assert.throws(
        () =>
          validateComplaintTransition(
            COMPLAINT_STATUS.RESOLVED,
            COMPLAINT_STATUS.OPEN,
            managerActor
          ),
        /already in terminal state 'RESOLVED'/
      );
    });

    it("Rejects any transition from terminal state REJECTED", () => {
      assert.throws(
        () =>
          validateComplaintTransition(
            COMPLAINT_STATUS.REJECTED,
            COMPLAINT_STATUS.RESOLVED,
            managerActor,
            "Notes"
          ),
        /already in terminal state 'REJECTED'/
      );
    });

    it("Rejects unauthorized resident roles (TENANT, OWNER) attempting lifecycle transitions", () => {
      assert.throws(
        () =>
          validateComplaintTransition(
            COMPLAINT_STATUS.OPEN,
            COMPLAINT_STATUS.UNDER_INVESTIGATION,
            tenantActor
          ),
        /Access forbidden: Role 'TENANT'/
      );
    });

    it("Rejects RESOLVED transition when resolutionNotes is missing or empty", () => {
      assert.throws(
        () =>
          validateComplaintTransition(
            COMPLAINT_STATUS.UNDER_INVESTIGATION,
            COMPLAINT_STATUS.RESOLVED,
            managerActor,
            "   "
          ),
        /Formal resolution notes are strictly required/
      );
    });
  });

  // =========================================================================
  // 2. POST /api/v1/complaints (Filing Grievances & Resident Scoping)
  // =========================================================================
  describe("2. POST /api/v1/complaints", () => {
    it("Rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        method: "POST",
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_101_OCCUPIED_ID.toString(),
          type: COMPLAINT_TYPE.NOISE_DISTURBANCE,
          title: "Late night loud music",
          description: "Loud party music playing past 2 AM on weekday nights.",
        },
      });
      assert.equal(res.status, 401);
    });

    it("Rejects unauthorized role without COMPLAINT_CREATE (403 Forbidden)", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        method: "POST",
        headers: { Authorization: `Bearer ${managerAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_101_OCCUPIED_ID.toString(),
          type: COMPLAINT_TYPE.NOISE_DISTURBANCE,
          title: "Late night loud music",
          description: "Loud party music playing past 2 AM on weekday nights.",
        },
      });
      assert.equal(res.status, 403);
    });

    it("Allows Owner A to file complaint for owned Flat 101 (201 Created)", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_101_OCCUPIED_ID.toString(),
          type: COMPLAINT_TYPE.PARKING_DISPUTE,
          title: "Reserved slot occupied",
          description:
            "Another car is repeatedly parked in my designated spot 101.",
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, COMPLAINT_STATUS.OPEN);
      assert.equal(res.data.data.type, COMPLAINT_TYPE.PARKING_DISPUTE);
      assert.match(res.data.data.complaintNumber, /^CMP-\d{4}-\d{4}$/);
      assert.equal(res.data.data.createdById._id, OWNER_A_USER_ID.toString());

      // Verify in DB
      const dbComplaint = await Complaint.findById(res.data.data._id);
      assert.ok(dbComplaint);
      assert.equal(dbComplaint.status, COMPLAINT_STATUS.OPEN);
    });

    it("Anti-IDOR: Rejects Owner A attempting to file complaint for unowned Flat 102 (403)", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_102_OCCUPIED_ID.toString(),
          type: COMPLAINT_TYPE.NOISE_DISTURBANCE,
          title: "Noise from neighbors",
          description: "Filing on behalf of flat 102 unauthorized.",
        },
      });

      assert.equal(res.status, 403);
      assert.match(JSON.stringify(res.data), /do not own flat/i);
    });

    it("Allows Tenant 101 to file complaint for active leased Flat 101 (201 Created)", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_101_OCCUPIED_ID.toString(),
          type: COMPLAINT_TYPE.NOISE_DISTURBANCE,
          title: "Hallway disturbance",
          description: "Persistent shouting in the hallway outside flat 101.",
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(
        res.data.data.createdById._id,
        TENANT_101_USER_ID.toString()
      );
    });

    it("Anti-IDOR: Rejects Tenant 101 attempting to file complaint for Flat 102 (403)", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_102_OCCUPIED_ID.toString(),
          type: COMPLAINT_TYPE.SECURITY_BREACH,
          title: "Intruder spotted",
          description: "Reporting issue for wrong flat number.",
        },
      });

      assert.equal(res.status, 403);
      assert.match(JSON.stringify(res.data), /active lease/i);
    });

    it("Rejects inactive / moved-out tenant attempting to file complaint (403)", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantInactiveToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_102_OCCUPIED_ID.toString(),
          type: COMPLAINT_TYPE.SANITATION,
          title: "Old lease complaint",
          description: "Attempting to file after lease ended.",
        },
      });

      assert.equal(res.status, 403);
    });

    it("Rejects filing for non-existent flat (404 Not Found)", async () => {
      const fakeFlatId = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest("/api/v1/complaints", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: fakeFlatId,
          type: COMPLAINT_TYPE.OTHER,
          title: "Non-existent flat ticket",
          description: "Target flat does not exist in database.",
        },
      });

      assert.equal(res.status, 404);
      assert.match(JSON.stringify(res.data), /not found/i);
    });

    it("Rejects building-flat hierarchy mismatch (400 Bad Request)", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: BUILDING_B_ID.toString(), // Mismatched building
          flatId: FLAT_101_OCCUPIED_ID.toString(), // Flat belongs to Building A
          type: COMPLAINT_TYPE.OTHER,
          title: "Mismatched building test",
          description: "Validating cross-building hierarchy constraint.",
        },
      });

      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /Hierarchy mismatch/i);
    });

    it("Rejects invalid complaint type enum (400 Bad Request)", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_101_OCCUPIED_ID.toString(),
          type: "FIRE_HAZARD", // Invalid / unapproved enum
          title: "Fire hazard complaint",
          description: "Invalid complaint type test.",
        },
      });

      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /Invalid complaint type/i);
    });

    it("Blocks mass assignment of server-controlled fields in request body", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          flatId: FLAT_101_OCCUPIED_ID.toString(),
          type: COMPLAINT_TYPE.NOISE_DISTURBANCE,
          title: "Mass assignment attempt",
          description: "Injecting status, complaintNumber, and resolvedById.",
          status: COMPLAINT_STATUS.RESOLVED, // Injected
          complaintNumber: "CMP-9999-9999",
          createdById: SUPER_ADMIN_ID.toString(),
          resolvedById: SUPER_ADMIN_ID.toString(),
        },
      });

      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /unrecognized/i);
    });
  });

  // =========================================================================
  // 3. GET /api/v1/complaints (Role Scoping, Filters & Pagination)
  // =========================================================================
  describe("3. GET /api/v1/complaints", () => {
    before(async () => {
      // Seed dedicated complaints for querying tests
      await Complaint.create([
        {
          complaintNumber: "CMP-2026-9001",
          buildingId: BUILDING_A_ID,
          flatId: FLAT_101_OCCUPIED_ID,
          createdById: TENANT_101_USER_ID,
          type: COMPLAINT_TYPE.NOISE_DISTURBANCE,
          title: "Query test noise 101",
          description: "Testing status and type filters.",
          status: COMPLAINT_STATUS.OPEN,
        },
        {
          complaintNumber: "CMP-2026-9002",
          buildingId: BUILDING_A_ID,
          flatId: FLAT_102_OCCUPIED_ID,
          createdById: SUPER_ADMIN_ID,
          type: COMPLAINT_TYPE.SECURITY_BREACH,
          title: "Query test security 102",
          description: "Testing building A scope for flat 102.",
          status: COMPLAINT_STATUS.UNDER_INVESTIGATION,
        },
        {
          complaintNumber: "CMP-2026-9003",
          buildingId: BUILDING_B_ID,
          flatId: FLAT_B_OCCUPIED_ID,
          createdById: OWNER_B_USER_ID,
          type: COMPLAINT_TYPE.SANITATION,
          title: "Query test sanitation building B",
          description: "Testing building B isolation.",
          status: COMPLAINT_STATUS.OPEN,
        },
      ]);
    });

    it("Rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/complaints");
      assert.equal(res.status, 401);
    });

    it("Manager A receives complaints strictly scoped to Building A", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.items.length >= 2);
      // Ensure zero Building B complaints leaked
      assert.ok(
        res.data.data.items.every(
          (c) => c.buildingId.toString() === BUILDING_A_ID.toString()
        )
      );
    });

    it("Anti-IDOR: Manager A querying ?buildingId=Building_B is rejected with 403 Forbidden", async () => {
      const res = await apiRequest(
        `/api/v1/complaints?buildingId=${BUILDING_B_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );

      assert.equal(res.status, 403);
      assert.match(JSON.stringify(res.data), /management scope/i);
    });

    it("SuperAdmin queries complaints globally across complexes", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      const buildingIds = res.data.data.items.map((c) =>
        c.buildingId.toString()
      );
      assert.ok(buildingIds.includes(BUILDING_A_ID.toString()));
      assert.ok(buildingIds.includes(BUILDING_B_ID.toString()));
    });

    it("Owner A receives only complaints matching flats owned", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        headers: { Authorization: `Bearer ${ownerAToken}` },
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.items.length >= 1);
      assert.ok(
        res.data.data.items.every(
          (c) => c.flatId.toString() === FLAT_101_OCCUPIED_ID.toString()
        )
      );
    });

    it("Tenant 101 receives only complaints for active leased Flat 101", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        headers: { Authorization: `Bearer ${tenant101Token}` },
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.items.length >= 1);
      assert.ok(
        res.data.data.items.every(
          (c) => c.flatId.toString() === FLAT_101_OCCUPIED_ID.toString()
        )
      );
    });

    it("Building Admin A receives complaints for assigned Building A", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.items.length >= 1);
      assert.ok(
        res.data.data.items.every(
          (c) => c.buildingId.toString() === BUILDING_A_ID.toString()
        )
      );
    });

    it("Owner B receives complaints for owned Flat B", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        headers: { Authorization: `Bearer ${ownerBToken}` },
      });

      assert.equal(res.status, 200);
      assert.ok(
        res.data.data.items.every(
          (c) => c.buildingId.toString() === BUILDING_B_ID.toString()
        )
      );
    });

    it("Maintenance Staff receives empty list (complaints domain has no assigned staff)", async () => {
      const res = await apiRequest("/api/v1/complaints", {
        headers: { Authorization: `Bearer ${staffMaintToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.items.length, 0);
    });

    it("Filters complaints by status (e.g. ?status=UNDER_INVESTIGATION)", async () => {
      const res = await apiRequest(
        `/api/v1/complaints?status=${COMPLAINT_STATUS.UNDER_INVESTIGATION}`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.ok(res.data.data.items.length >= 1);
      assert.ok(
        res.data.data.items.every(
          (c) => c.status === COMPLAINT_STATUS.UNDER_INVESTIGATION
        )
      );
    });

    it("Filters complaints by type (e.g. ?type=NOISE_DISTURBANCE)", async () => {
      const res = await apiRequest(
        `/api/v1/complaints?type=${COMPLAINT_TYPE.NOISE_DISTURBANCE}`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.ok(res.data.data.items.length >= 1);
      assert.ok(
        res.data.data.items.every(
          (c) => c.type === COMPLAINT_TYPE.NOISE_DISTURBANCE
        )
      );
    });

    it("Rejects Mongo operator injection in query parameters", async () => {
      const res = await apiRequest("/api/v1/complaints?status[$ne]=OPEN", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 400);
    });

    it("Enforces pagination envelope on list responses", async () => {
      const res = await apiRequest("/api/v1/complaints?page=1&limit=2", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.items.length, 2);
      assert.equal(res.data.data.pagination.page, 1);
      assert.equal(res.data.data.pagination.limit, 2);
      assert.ok(res.data.data.pagination.total >= 3);
      assert.equal(res.data.data.pagination.hasNextPage, true);
    });
  });

  // =========================================================================
  // 4. PATCH /api/v1/complaints/:id/resolve (Manager Grievance Resolution)
  // =========================================================================
  describe("4. PATCH /api/v1/complaints/:id/resolve", () => {
    let openComplaintId;
    let underInvestigationComplaintId;
    let buildingBComplaintId;

    beforeEach(async () => {
      // 1. Complaint in OPEN status
      const openCmp = await Complaint.create({
        complaintNumber: `CMP-2026-OPN-${Date.now().toString().slice(-4)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_OCCUPIED_ID,
        createdById: TENANT_101_USER_ID,
        type: COMPLAINT_TYPE.NOISE_DISTURBANCE,
        title: "Open noise complaint",
        description: "Awaiting manager investigation.",
        status: COMPLAINT_STATUS.OPEN,
      });
      openComplaintId = openCmp._id.toString();

      // 2. Complaint in UNDER_INVESTIGATION status
      const underInvCmp = await Complaint.create({
        complaintNumber: `CMP-2026-INV-${Date.now().toString().slice(-4)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_OCCUPIED_ID,
        createdById: TENANT_101_USER_ID,
        type: COMPLAINT_TYPE.SANITATION,
        title: "Sanitation under investigation",
        description: "Manager investigating waste disposal violation.",
        status: COMPLAINT_STATUS.UNDER_INVESTIGATION,
      });
      underInvestigationComplaintId = underInvCmp._id.toString();

      // 3. Complaint in Building B
      const bCmp = await Complaint.create({
        complaintNumber: `CMP-2026-BLD-${Date.now().toString().slice(-4)}`,
        buildingId: BUILDING_B_ID,
        flatId: FLAT_B_OCCUPIED_ID,
        createdById: OWNER_B_USER_ID,
        type: COMPLAINT_TYPE.PARKING_DISPUTE,
        title: "Building B dispute",
        description: "Dispute in Tower B parking.",
        status: COMPLAINT_STATUS.UNDER_INVESTIGATION,
      });
      buildingBComplaintId = bCmp._id.toString();
    });

    it("Rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await apiRequest(
        `/api/v1/complaints/${underInvestigationComplaintId}/resolve`,
        {
          method: "PATCH",
          body: { resolutionNotes: "Attempting unauthed resolve" },
        }
      );
      assert.equal(res.status, 401);
    });

    it("Rejects resident (Tenant / Owner) attempting to resolve (403 Forbidden)", async () => {
      const res = await apiRequest(
        `/api/v1/complaints/${underInvestigationComplaintId}/resolve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${tenant101Token}` },
          body: { resolutionNotes: "Tenant self-resolving complaint" },
        }
      );
      assert.equal(res.status, 403);
    });

    it("Anti-IDOR: Rejects Manager B attempting to resolve Building A complaint (403)", async () => {
      const res = await apiRequest(
        `/api/v1/complaints/${underInvestigationComplaintId}/resolve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerBToken}` },
          body: { resolutionNotes: "Cross-building resolution attempt" },
        }
      );
      assert.equal(res.status, 403);
      assert.match(JSON.stringify(res.data), /outside your authorized scope/i);
    });

    it("Anti-IDOR: Rejects Manager A attempting to resolve Building B complaint (403)", async () => {
      const res = await apiRequest(
        `/api/v1/complaints/${buildingBComplaintId}/resolve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: { resolutionNotes: "Cross-building resolution attempt" },
        }
      );
      assert.equal(res.status, 403);
      assert.match(JSON.stringify(res.data), /outside your authorized scope/i);
    });

    it("Rejects resolving an OPEN complaint directly (400 Bad Request: must be investigated first)", async () => {
      const res = await apiRequest(
        `/api/v1/complaints/${openComplaintId}/resolve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: {
            resolutionNotes: "Premature resolution without investigation step.",
          },
        }
      );

      assert.equal(res.status, 400);
      assert.match(
        JSON.stringify(res.data),
        /must be 'UNDER_INVESTIGATION' before it can be resolved/i
      );
    });

    it("Allows Manager A to resolve UNDER_INVESTIGATION complaint with notes (200 OK)", async () => {
      const res = await apiRequest(
        `/api/v1/complaints/${underInvestigationComplaintId}/resolve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: {
            resolutionNotes:
              "Spoke with the offending resident; sound dampening mats installed and warning issued.",
          },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, COMPLAINT_STATUS.RESOLVED);
      assert.equal(
        res.data.data.resolutionNotes,
        "Spoke with the offending resident; sound dampening mats installed and warning issued."
      );
      assert.equal(res.data.data.resolvedById._id, MANAGER_A_ID.toString());
      assert.ok(res.data.data.resolvedAt);

      // Verify in DB
      const dbComplaint = await Complaint.findById(
        underInvestigationComplaintId
      );
      assert.equal(dbComplaint.status, COMPLAINT_STATUS.RESOLVED);
      assert.equal(
        dbComplaint.resolvedById.toString(),
        MANAGER_A_ID.toString()
      );
    });

    it("Rejects resolving an already RESOLVED complaint (400 Bad Request)", async () => {
      // First resolution
      await apiRequest(
        `/api/v1/complaints/${underInvestigationComplaintId}/resolve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: { resolutionNotes: "First resolution notes." },
        }
      );

      // Second resolution attempt
      const res = await apiRequest(
        `/api/v1/complaints/${underInvestigationComplaintId}/resolve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: { resolutionNotes: "Duplicate resolution attempt notes." },
        }
      );

      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /already/i);
    });

    it("Blocks mass assignment of status or resolvedById in resolve request body", async () => {
      const res = await apiRequest(
        `/api/v1/complaints/${underInvestigationComplaintId}/resolve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: {
            resolutionNotes: "Valid resolution notes here.",
            status: "OPEN", // Malicious injection attempt
            resolvedById: SUPER_ADMIN_ID.toString(),
            resolvedAt: "2035-01-01T00:00:00.000Z",
          },
        }
      );

      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /unrecognized/i);
    });
  });

  // =========================================================================
  // 5. INTERNAL DOMAIN OPERATIONS & TERMINAL STATE LIFECYCLE
  // =========================================================================
  describe("5. Internal Domain Operations & Terminal States", () => {
    let testCmpId;

    beforeEach(async () => {
      const cmp = await Complaint.create({
        complaintNumber: `CMP-2026-INT-${Date.now().toString().slice(-4)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_OCCUPIED_ID,
        createdById: TENANT_101_USER_ID,
        type: COMPLAINT_TYPE.SECURITY_BREACH,
        title: "Internal test ticket",
        description: "Testing startInvestigation and rejectComplaint.",
        status: COMPLAINT_STATUS.OPEN,
      });
      testCmpId = cmp._id.toString();
    });

    it("Internal startInvestigation transitions OPEN -> UNDER_INVESTIGATION", async () => {
      const updated = await complaintService.startInvestigation(testCmpId, {
        role: ROLES.MANAGER,
        id: MANAGER_A_ID,
        assignedBuildingIds: [BUILDING_A_ID],
      });

      assert.equal(updated.status, COMPLAINT_STATUS.UNDER_INVESTIGATION);

      const dbRecord = await Complaint.findById(testCmpId);
      assert.equal(dbRecord.status, COMPLAINT_STATUS.UNDER_INVESTIGATION);
    });

    it("Internal rejectComplaint transitions UNDER_INVESTIGATION -> REJECTED with notes", async () => {
      // Advance to UNDER_INVESTIGATION
      await complaintService.startInvestigation(testCmpId, {
        role: ROLES.MANAGER,
        id: MANAGER_A_ID,
        assignedBuildingIds: [BUILDING_A_ID],
      });

      // Reject
      const rejected = await complaintService.rejectComplaint(
        testCmpId,
        {
          resolutionNotes:
            "Invalid grievance: security footage disproves claim.",
        },
        {
          role: ROLES.MANAGER,
          id: MANAGER_A_ID,
          assignedBuildingIds: [BUILDING_A_ID],
        }
      );

      assert.equal(rejected.status, COMPLAINT_STATUS.REJECTED);
      assert.equal(
        rejected.resolutionNotes,
        "Invalid grievance: security footage disproves claim."
      );
      assert.ok(rejected.resolvedAt);

      const dbRecord = await Complaint.findById(testCmpId);
      assert.equal(dbRecord.status, COMPLAINT_STATUS.REJECTED);
    });

    it("Attempting to resolve a REJECTED complaint fails (400 Bad Request)", async () => {
      // Advance to UNDER_INVESTIGATION then REJECTED
      await complaintService.startInvestigation(testCmpId, {
        role: ROLES.MANAGER,
        id: MANAGER_A_ID,
        assignedBuildingIds: [BUILDING_A_ID],
      });
      await complaintService.rejectComplaint(
        testCmpId,
        { resolutionNotes: "Rejection explanation notes." },
        {
          role: ROLES.MANAGER,
          id: MANAGER_A_ID,
          assignedBuildingIds: [BUILDING_A_ID],
        }
      );

      // Attempt resolve via HTTP API
      const res = await apiRequest(`/api/v1/complaints/${testCmpId}/resolve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${managerAToken}` },
        body: {
          resolutionNotes: "Attempting to resolve already rejected ticket.",
        },
      });

      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /terminal state 'REJECTED'/i);
    });
  });

  // =========================================================================
  // 6. CONCURRENCY & IDENTIFIER UNIQUENESS
  // =========================================================================
  describe("6. Concurrency Safety & Unique Identifier Handling", () => {
    it("Concurrent complaint creations generate distinct unique numbers without duplicate key errors", async () => {
      const count = 10;
      const tasks = Array.from({ length: count }, (_, idx) =>
        apiRequest("/api/v1/complaints", {
          method: "POST",
          headers: { Authorization: `Bearer ${tenant101Token}` },
          body: {
            buildingId: BUILDING_A_ID.toString(),
            flatId: FLAT_101_OCCUPIED_ID.toString(),
            type: COMPLAINT_TYPE.NOISE_DISTURBANCE,
            title: `Concurrent ticket submission #${idx + 1}`,
            description:
              "High concurrency simultaneous submission verification.",
          },
        })
      );

      const responses = await Promise.all(tasks);

      // All requests must succeed
      for (const res of responses) {
        assert.equal(res.status, 201);
        assert.equal(res.data.success, true);
        assert.ok(res.data.data.complaintNumber);
      }

      // Complaint numbers must be 100% unique
      const numbers = responses.map((r) => r.data.data.complaintNumber);
      const uniqueNumbers = new Set(numbers);
      assert.equal(uniqueNumbers.size, count);
    });

    it("Concurrent resolution calls handle racing managers safely", async () => {
      // Create under-investigation complaint
      const cmp = await Complaint.create({
        complaintNumber: `CMP-2026-RACE-${Date.now().toString().slice(-4)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_OCCUPIED_ID,
        createdById: TENANT_101_USER_ID,
        type: COMPLAINT_TYPE.PARKING_DISPUTE,
        title: "Race condition test dispute",
        description: "Two managers attempting simultaneous resolution.",
        status: COMPLAINT_STATUS.UNDER_INVESTIGATION,
      });

      const cmpId = cmp._id.toString();

      // Launch 2 simultaneous resolution calls
      const [res1, res2] = await Promise.all([
        apiRequest(`/api/v1/complaints/${cmpId}/resolve`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: { resolutionNotes: "Manager A resolution call." },
        }),
        apiRequest(`/api/v1/complaints/${cmpId}/resolve`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: { resolutionNotes: "Manager A racing second call." },
        }),
      ]);

      // Exactly one succeeds with 200, the other fails with 400
      const statuses = [res1.status, res2.status].sort();
      assert.deepEqual(statuses, [200, 400]);

      // Final status is RESOLVED
      const finalRecord = await Complaint.findById(cmpId);
      assert.equal(finalRecord.status, COMPLAINT_STATUS.RESOLVED);
    });
  });
});
