// =====================  IMPORTS  ==========================
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Staff } from "./staff.model.js";
import { STAFF_CONSTANTS } from "./staff.constants.js";
import { User } from "../../models/user.model.js";
import { Building } from "../../models/building.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { generateAccessToken } from "../../utils/token.util.js";
import { rolesService } from "../roles/roles.service.js";

// =====================  TEST SETUP & FIXTURES  =============
dotenv.config();

let server;
let baseUrl;

// Test Actor ObjectIds
const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_A_ID = new mongoose.Types.ObjectId();
const MANAGER_A_ID = new mongoose.Types.ObjectId();
const UNASSIGNED_ADMIN_ID = new mongoose.Types.ObjectId();
const TENANT_ACTOR_ID = new mongoose.Types.ObjectId();

// Test Buildings
const BUILDING_A_ID = new mongoose.Types.ObjectId();
const BUILDING_B_ID = new mongoose.Types.ObjectId();

// Auth Tokens
let superAdminToken;
let buildingAdminAToken;
let managerAToken;
let unassignedAdminToken;
let tenantToken;

// Helper to create valid User fixtures with all required fields
const createStaffUser = async (overrides = {}) => {
  return User.create({
    firstName: "Test",
    lastName: "Candidate",
    email: `staff.user.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@test.local`,
    password: "Password123!",
    role: ROLES.MAINTENANCE_STAFF,
    status: ACCOUNT_STATUS.ACTIVE,
    assignedBuildingIds: [],
    ...overrides,
  });
};

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
describe("Staff Domain Module (Module 11)", () => {
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

    // Clean up test collections
    await Staff.deleteMany({});
    await Building.deleteMany({
      _id: { $in: [BUILDING_A_ID, BUILDING_B_ID] },
    });
    await User.deleteMany({
      _id: {
        $in: [
          SUPER_ADMIN_ID,
          BUILDING_ADMIN_A_ID,
          MANAGER_A_ID,
          UNASSIGNED_ADMIN_ID,
          TENANT_ACTOR_ID,
        ],
      },
    });

    // Seed Test Buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Grand Imperial Residency A",
        code: `GRA-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Tower St, Block A",
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
        name: "Grand Imperial Residency B",
        code: `GRB-${Date.now().toString().slice(-4)}`,
        address: {
          street: "200 Tower St, Block B",
          city: "Metropolis",
          state: "NY",
          postalCode: "10001",
          country: "USA",
        },
        status: "ACTIVE",
        isDeleted: false,
      },
    ]);

    // Seed Test Actors
    await User.create([
      {
        _id: SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: `super.staff.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
      {
        _id: BUILDING_ADMIN_A_ID,
        firstName: "Building",
        lastName: "Admin",
        email: `badmin.staff.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: MANAGER_A_ID,
        firstName: "Facility",
        lastName: "Manager",
        email: `manager.staff.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: UNASSIGNED_ADMIN_ID,
        firstName: "Unassigned",
        lastName: "Admin",
        email: `unassigned.staff.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
      {
        _id: TENANT_ACTOR_ID,
        firstName: "Resident",
        lastName: "Tenant",
        email: `tenant.staff.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
    ]);

    // Generate JWT Access Tokens
    superAdminToken = generateAccessToken({
      sub: SUPER_ADMIN_ID.toString(),
      role: ROLES.SUPER_ADMIN,
    });
    buildingAdminAToken = generateAccessToken({
      sub: BUILDING_ADMIN_A_ID.toString(),
      role: ROLES.BUILDING_ADMIN,
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });
    managerAToken = generateAccessToken({
      sub: MANAGER_A_ID.toString(),
      role: ROLES.MANAGER,
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });
    unassignedAdminToken = generateAccessToken({
      sub: UNASSIGNED_ADMIN_ID.toString(),
      role: ROLES.BUILDING_ADMIN,
      assignedBuildingIds: [],
    });
    tenantToken = generateAccessToken({
      sub: TENANT_ACTOR_ID.toString(),
      role: ROLES.TENANT,
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });
  });

  after(async () => {
    // Clean up
    await Staff.deleteMany({});
    await Building.deleteMany({
      _id: { $in: [BUILDING_A_ID, BUILDING_B_ID] },
    });
    await User.deleteMany({
      _id: {
        $in: [
          SUPER_ADMIN_ID,
          BUILDING_ADMIN_A_ID,
          MANAGER_A_ID,
          UNASSIGNED_ADMIN_ID,
          TENANT_ACTOR_ID,
        ],
      },
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // =========================================================================
  // 1. MODEL INVARIANTS
  // =========================================================================
  describe("1. Staff Database Model Invariants", () => {
    it("Enforces required userId", async () => {
      const staff = new Staff({
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
      });
      await assert.rejects(staff.validate(), (err) => {
        assert.ok(err.errors.userId);
        return true;
      });
    });

    it("Enforces required buildingId", async () => {
      const staff = new Staff({
        userId: new mongoose.Types.ObjectId(),
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
      });
      await assert.rejects(staff.validate(), (err) => {
        assert.ok(err.errors.buildingId);
        return true;
      });
    });

    it("Enforces required category", async () => {
      const staff = new Staff({
        userId: new mongoose.Types.ObjectId(),
        buildingId: BUILDING_A_ID,
      });
      await assert.rejects(staff.validate(), (err) => {
        assert.ok(err.errors.category);
        return true;
      });
    });

    it("Defaults status to ACTIVE, averageRating to 0.0, totalRatingsCount to 0, isDeleted to false", async () => {
      const staff = new Staff({
        userId: new mongoose.Types.ObjectId(),
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.SECURITY,
      });
      assert.equal(staff.status, STAFF_CONSTANTS.STATUS.ACTIVE);
      assert.equal(staff.averageRating, 0.0);
      assert.equal(staff.totalRatingsCount, 0);
      assert.equal(staff.isDeleted, false);
      assert.equal(staff.assignedShift, STAFF_CONSTANTS.SHIFTS.MORNING);
    });

    it("Rejects invalid category enum", async () => {
      const staff = new Staff({
        userId: new mongoose.Types.ObjectId(),
        buildingId: BUILDING_A_ID,
        category: "INVALID_CAT",
      });
      await assert.rejects(staff.validate(), (err) => {
        assert.ok(err.errors.category);
        return true;
      });
    });

    it("Rejects invalid subCategory enum", async () => {
      const staff = new Staff({
        userId: new mongoose.Types.ObjectId(),
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        subCategory: "INVALID_SUB",
      });
      await assert.rejects(staff.validate(), (err) => {
        assert.ok(err.errors.subCategory);
        return true;
      });
    });

    it("Rejects invalid assignedShift enum", async () => {
      const staff = new Staff({
        userId: new mongoose.Types.ObjectId(),
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        assignedShift: "MIDNIGHT",
      });
      await assert.rejects(staff.validate(), (err) => {
        assert.ok(err.errors.assignedShift);
        return true;
      });
    });

    it("Rejects averageRating below 0.0 or above 5.0", async () => {
      const low = new Staff({
        userId: new mongoose.Types.ObjectId(),
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        averageRating: -0.5,
      });
      await assert.rejects(low.validate(), (err) => {
        assert.ok(err.errors.averageRating);
        return true;
      });

      const high = new Staff({
        userId: new mongoose.Types.ObjectId(),
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        averageRating: 5.5,
      });
      await assert.rejects(high.validate(), (err) => {
        assert.ok(err.errors.averageRating);
        return true;
      });
    });

    it("toSafeStaff() excludes __v, isDeleted, and deletedAt", async () => {
      const staff = new Staff({
        userId: new mongoose.Types.ObjectId(),
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.CLEANING,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.CLEANER,
      });
      const safe = staff.toSafeStaff();
      assert.equal(safe.__v, undefined);
      assert.equal(safe.isDeleted, undefined);
      assert.equal(safe.deletedAt, undefined);
      assert.equal(safe.category, STAFF_CONSTANTS.CATEGORIES.CLEANING);
    });
  });

  // =========================================================================
  // 2. POST /api/v1/staff (Onboarding, Hierarchy & Scope)
  // =========================================================================
  describe("2. POST /api/v1/staff (Onboarding, Hierarchy & Scope)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_A_ID.toString(),
          category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        },
      });
      assert.equal(res.status, 401);
    });

    it("Rejects unauthorized role (Tenant) with 403 Forbidden", async () => {
      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantToken}` },
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_A_ID.toString(),
          category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        },
      });
      assert.equal(res.status, 403);
    });

    it("IDOR Guard: BuildingAdmin cannot onboard staff in an unassigned building (403)", async () => {
      const user = await createStaffUser();

      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        body: {
          userId: user._id.toString(),
          buildingId: BUILDING_B_ID.toString(), // Building B is outside BuildingAdmin A's scope
          category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
          subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.PLUMBER,
        },
      });
      assert.equal(res.status, 403);
    });

    it("BuildingAdmin with empty assignedBuildingIds cannot onboard staff (403)", async () => {
      const user = await createStaffUser();

      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${unassignedAdminToken}` },
        body: {
          userId: user._id.toString(),
          buildingId: BUILDING_A_ID.toString(),
          category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        },
      });
      assert.equal(res.status, 403);
    });

    it("Rejects onboarding referencing a non-existent User with 404 Not Found", async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        body: {
          userId: fakeUserId,
          buildingId: BUILDING_A_ID.toString(),
          category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
          subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.ELECTRICIAN,
        },
      });
      assert.equal(res.status, 404);
    });

    it("Rejects onboarding referencing a non-existent Building with 404 Not Found", async () => {
      const user = await createStaffUser();

      const fakeBuildingId = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          userId: user._id.toString(),
          buildingId: fakeBuildingId,
          category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        },
      });
      assert.equal(res.status, 404);
    });

    it("Rejects onboarding with privileged administrative user role (400 Bad Request)", async () => {
      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          userId: MANAGER_A_ID.toString(), // Privileged Manager role
          buildingId: BUILDING_A_ID.toString(),
          category: STAFF_CONSTANTS.CATEGORIES.ADMINISTRATION,
        },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /privileged administrative role/i);
    });

    it("Rejects onboarding with resident user role (400 Bad Request)", async () => {
      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          userId: TENANT_ACTOR_ID.toString(), // Resident Tenant role
          buildingId: BUILDING_A_ID.toString(),
          category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /resident role/i);
    });

    it("Category ↔ SubCategory Mismatch: Rejects SECURITY + PLUMBER (400 Bad Request)", async () => {
      const user = await createStaffUser({ role: ROLES.SECURITY_STAFF });

      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        body: {
          userId: user._id.toString(),
          buildingId: BUILDING_A_ID.toString(),
          category: STAFF_CONSTANTS.CATEGORIES.SECURITY,
          subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.PLUMBER, // Mismatched!
        },
      });
      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /is not valid for category/i);
    });

    it("Category ↔ SubCategory Mismatch: Rejects ADMINISTRATION with trade subCategory (400 Bad Request)", async () => {
      const user = await createStaffUser();

      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        body: {
          userId: user._id.toString(),
          buildingId: BUILDING_A_ID.toString(),
          category: STAFF_CONSTANTS.CATEGORIES.ADMINISTRATION,
          subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.GATE_GUARD,
        },
      });
      assert.equal(res.status, 400);
      assert.match(
        JSON.stringify(res.data),
        /ADMINISTRATION category does not accept trade subcategories/i
      );
    });

    it("Allows BuildingAdmin to onboard staff with compatible category & trade specialization (201 Created)", async () => {
      const user = await createStaffUser();

      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        body: {
          userId: user._id.toString(),
          buildingId: BUILDING_A_ID.toString(),
          category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
          subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.PLUMBER,
          designation: "Senior Master Plumber",
          assignedShift: STAFF_CONSTANTS.SHIFTS.MORNING,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(
        res.data.data.category,
        STAFF_CONSTANTS.CATEGORIES.MAINTENANCE
      );
      assert.equal(
        res.data.data.subCategory,
        STAFF_CONSTANTS.SUB_CATEGORIES.PLUMBER
      );
      assert.equal(res.data.data.designation, "Senior Master Plumber");
      assert.equal(res.data.data.averageRating, 0.0);
      assert.equal(res.data.data.totalRatingsCount, 0);

      // Verify User assignedBuildingIds was synchronized
      const updatedUser = await User.findById(user._id);
      const hasBuilding = updatedUser.assignedBuildingIds.some(
        (id) => id.toString() === BUILDING_A_ID.toString()
      );
      assert.ok(hasBuilding, "Building was synchronized to User");
    });

    it("1:1 Staff Profile Uniqueness Guard: Rejects duplicate profile for same user (409 Conflict)", async () => {
      const user = await createStaffUser({ role: ROLES.SECURITY_STAFF });

      // First onboarding succeeds
      const res1 = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        body: {
          userId: user._id.toString(),
          buildingId: BUILDING_A_ID.toString(),
          category: STAFF_CONSTANTS.CATEGORIES.SECURITY,
          subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.GATE_GUARD,
        },
      });
      assert.equal(res1.status, 201);

      // Second onboarding for same user is rejected
      const res2 = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        body: {
          userId: user._id.toString(),
          buildingId: BUILDING_A_ID.toString(),
          category: STAFF_CONSTANTS.CATEGORIES.SECURITY,
          subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.LOBBY_GUARD,
        },
      });
      assert.equal(res2.status, 409);
    });

    it("Allows SuperAdmin to onboard staff in any building complex globally (201 Created)", async () => {
      const user = await createStaffUser();

      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          userId: user._id.toString(),
          buildingId: BUILDING_B_ID.toString(), // Building B
          category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
          subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.ELECTRICIAN,
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.data.buildingId._id, BUILDING_B_ID.toString());
    });

    it("Mass-Assignment Guard: Rejects client attempts to inject internal fields (averageRating, totalRatingsCount, status, isDeleted)", async () => {
      const user = await createStaffUser({ role: ROLES.SECURITY_STAFF });

      const res = await apiRequest("/api/v1/staff", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        body: {
          userId: user._id.toString(),
          buildingId: BUILDING_A_ID.toString(),
          category: STAFF_CONSTANTS.CATEGORIES.SECURITY,
          subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.GATE_GUARD,
          averageRating: 5.0,
          totalRatingsCount: 9999,
          status: "TERMINATED",
          isDeleted: true,
        },
      });
      assert.equal(res.status, 400); // Strict Zod schema rejects unrecognized keys
    });
  });

  // =========================================================================
  // 3. GET /api/v1/staff (Listing & Multi-Tenant Scoping)
  // =========================================================================
  describe("3. GET /api/v1/staff (Listing & Multi-Tenant Scoping)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/staff");
      assert.equal(res.status, 401);
    });

    it("IDOR Guard: Manager querying staff of an unassigned building is rejected with 403", async () => {
      const res = await apiRequest(
        `/api/v1/staff?buildingId=${BUILDING_B_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );
      assert.equal(res.status, 403);
    });

    it("BuildingAdmin with empty assignedBuildingIds receives empty results (200 OK)", async () => {
      const res = await apiRequest("/api/v1/staff", {
        headers: { Authorization: `Bearer ${unassignedAdminToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data.staff.length, 0);
      assert.equal(res.data.data.pagination.total, 0);
    });

    it("Allows Manager to list staff within assigned building scope (200 OK)", async () => {
      const res = await apiRequest("/api/v1/staff", {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.data.staff.length >= 1);
      // Ensure all returned staff belong strictly to Building A
      for (const s of res.data.data.staff) {
        assert.equal(s.buildingId._id, BUILDING_A_ID.toString());
      }
    });

    it("Allows SuperAdmin to list all staff globally across complexes (200 OK)", async () => {
      const res = await apiRequest("/api/v1/staff", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 200);
      const buildingIds = res.data.data.staff.map((s) => s.buildingId._id);
      assert.ok(buildingIds.includes(BUILDING_A_ID.toString()));
      assert.ok(buildingIds.includes(BUILDING_B_ID.toString()));
    });

    it("Supports filtering staff by category", async () => {
      const res = await apiRequest(
        `/api/v1/staff?category=${STAFF_CONSTANTS.CATEGORIES.SECURITY}`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );
      assert.equal(res.status, 200);
      for (const s of res.data.data.staff) {
        assert.equal(s.category, STAFF_CONSTANTS.CATEGORIES.SECURITY);
      }
    });

    it("Supports filtering staff by subCategory", async () => {
      const res = await apiRequest(
        `/api/v1/staff?subCategory=${STAFF_CONSTANTS.SUB_CATEGORIES.GATE_GUARD}`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );
      assert.equal(res.status, 200);
      for (const s of res.data.data.staff) {
        assert.equal(s.subCategory, STAFF_CONSTANTS.SUB_CATEGORIES.GATE_GUARD);
      }
    });

    it("Supports filtering staff by availability (status = ACTIVE)", async () => {
      const res = await apiRequest("/api/v1/staff?availability=AVAILABLE", {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });
      assert.equal(res.status, 200);
      for (const s of res.data.data.staff) {
        assert.equal(s.status, STAFF_CONSTANTS.STATUS.ACTIVE);
      }
    });

    it("Excludes soft-deleted staff from registry results", async () => {
      const deletedUser = await createStaffUser();

      const deletedStaff = await Staff.create({
        userId: deletedUser._id,
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        isDeleted: true,
        deletedAt: new Date(),
      });

      const res = await apiRequest("/api/v1/staff", {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });
      assert.equal(res.status, 200);
      const found = res.data.data.staff.some(
        (s) => s._id === deletedStaff._id.toString()
      );
      assert.equal(found, false, "Soft-deleted staff must not be returned");
    });
  });

  // =========================================================================
  // 4. GET /api/v1/staff/:id (Detail & Performance Card)
  // =========================================================================
  describe("4. GET /api/v1/staff/:id (Detail & Performance Card)", () => {
    let targetStaffAId;
    let targetStaffBId;

    before(async () => {
      const staffUserA = await createStaffUser({
        firstName: "Tech",
        lastName: "Alpha",
      });

      const staffA = await Staff.create({
        userId: staffUserA._id,
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.HVAC_TECH,
        designation: "HVAC Specialist",
        assignedShift: STAFF_CONSTANTS.SHIFTS.ROTATIONAL,
      });
      targetStaffAId = staffA._id.toString();

      const staffUserB = await createStaffUser({
        firstName: "Guard",
        lastName: "Bravo",
        role: ROLES.SECURITY_STAFF,
      });

      const staffB = await Staff.create({
        userId: staffUserB._id,
        buildingId: BUILDING_B_ID,
        category: STAFF_CONSTANTS.CATEGORIES.SECURITY,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.LOBBY_GUARD,
        designation: "Head Lobby Guard",
      });
      targetStaffBId = staffB._id.toString();
    });

    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest(`/api/v1/staff/${targetStaffAId}`);
      assert.equal(res.status, 401);
    });

    it("Rejects malformed ObjectId with 400 Bad Request", async () => {
      const res = await apiRequest("/api/v1/staff/invalid-object-id-123", {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });
      assert.equal(res.status, 400);
    });

    it("Returns 404 Not Found for non-existent Staff ID", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest(`/api/v1/staff/${fakeId}`, {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });
      assert.equal(res.status, 404);
    });

    it("IDOR Guard: Manager querying staff in an unassigned building is rejected with 403", async () => {
      const res = await apiRequest(`/api/v1/staff/${targetStaffBId}`, {
        headers: { Authorization: `Bearer ${managerAToken}` }, // Manager A is assigned to Building A, target is in Building B
      });
      assert.equal(res.status, 403);
    });

    it("Allows Manager to retrieve staff performance card within assigned building", async () => {
      const res = await apiRequest(`/api/v1/staff/${targetStaffAId}`, {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data._id, targetStaffAId);
      assert.equal(res.data.data.designation, "HVAC Specialist");

      // Verify Performance Card
      assert.ok(res.data.data.performanceCard, "Performance card is attached");
      assert.equal(res.data.data.performanceCard.averageRating, 0.0);
      assert.equal(res.data.data.performanceCard.totalRatingsCount, 0);
      assert.ok(Array.isArray(res.data.data.performanceCard.ratingHistory));

      // Sensitive Data Protection: Never leaks user password or internal security tokens
      assert.equal(res.data.data.userId.password, undefined);
      assert.equal(res.data.data.userId.refreshTokens, undefined);
      assert.equal(res.data.data.userId.invitationTokenHash, undefined);
      assert.equal(res.data.data.userId.passwordResetTokenHash, undefined);
    });

    it("Allows SuperAdmin to retrieve any staff profile globally (200 OK)", async () => {
      const res = await apiRequest(`/api/v1/staff/${targetStaffBId}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.equal(res.status, 200);
      assert.equal(res.data.data._id, targetStaffBId);
      assert.equal(res.data.data.buildingId._id, BUILDING_B_ID.toString());
    });
  });
});
