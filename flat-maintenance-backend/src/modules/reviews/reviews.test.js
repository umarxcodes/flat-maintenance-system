// =====================  IMPORTS & TEST RUNNER  =============
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Review } from "./reviews.model.js";
import { MODERATION_STATUS, REVIEW_LIMITS } from "./reviews.constants.js";
import { reviewValidation } from "./reviews.validation.js";
import { Building } from "../../models/building.model.js";
import { Block } from "../../models/block.model.js";
import { Floor } from "../../models/floor.model.js";
import { Flat, FLAT_STATUS } from "../../models/flat.model.js";
import { User } from "../../models/user.model.js";
import { Owner } from "../../models/owner.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { Staff } from "../../models/staff.model.js";
import { MaintenanceRequest } from "../maintenance-requests/maintenance-requests.model.js";
import {
  MAINTENANCE_REQUEST_STATUS,
  MAINTENANCE_REQUEST_CATEGORY,
  MAINTENANCE_REQUEST_PRIORITY,
} from "../maintenance-requests/maintenance-requests.constants.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
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

// Test IDs - Actors
const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_A_ID = new mongoose.Types.ObjectId();
const MANAGER_A_ID = new mongoose.Types.ObjectId();
const MANAGER_B_ID = new mongoose.Types.ObjectId();
const OWNER_A_USER_ID = new mongoose.Types.ObjectId();
const OWNER_A_PROFILE_ID = new mongoose.Types.ObjectId();
const TENANT_101_USER_ID = new mongoose.Types.ObjectId();
const TENANT_101_PROFILE_ID = new mongoose.Types.ObjectId();
const TENANT_102_USER_ID = new mongoose.Types.ObjectId();
const TENANT_102_PROFILE_ID = new mongoose.Types.ObjectId();
const STAFF_TECH_USER_ID = new mongoose.Types.ObjectId();
const STAFF_TECH_PROFILE_ID = new mongoose.Types.ObjectId();
const STAFF_TECH_2_USER_ID = new mongoose.Types.ObjectId();
const STAFF_TECH_2_PROFILE_ID = new mongoose.Types.ObjectId();

// Test IDs - Maintenance Work Orders
const MR_CLOSED_1_ID = new mongoose.Types.ObjectId();
const MR_COMPLETED_2_ID = new mongoose.Types.ObjectId();
const MR_VERIFIED_3_ID = new mongoose.Types.ObjectId();
const MR_OPEN_ID = new mongoose.Types.ObjectId();
const MR_NO_STAFF_ID = new mongoose.Types.ObjectId();
const MR_OTHER_FLAT_ID = new mongoose.Types.ObjectId();

// Auth Tokens
let superAdminToken;
let buildingAdminAToken;
let managerAToken;
let managerBToken;
let ownerAToken;
let tenant101Token;
let tenant102Token;
let staffTechToken;

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
describe("Module 17: Ratings & Service Reviews (reviews)", () => {
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
      Review.deleteMany({}),
      MaintenanceRequest.deleteMany({}),
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
        name: "Reviews Test Tower A",
        code: `RVA-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Review Way",
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
        name: "Reviews Test Tower B",
        code: `RVB-${Date.now().toString().slice(-4)}`,
        address: {
          street: "200 Review Boulevard",
          city: "Metropolis",
          state: "NY",
          postalCode: "10001",
          country: "USA",
        },
        status: "ACTIVE",
        isDeleted: false,
      },
    ]);

    // Seed Block & Floor
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
      code: "FL-01",
      isDeleted: false,
    });

    // Seed Flats
    await Flat.create([
      {
        _id: FLAT_101_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "101",
        areaSqFt: 1200,
        status: FLAT_STATUS.OCCUPIED,
        isDeleted: false,
      },
      {
        _id: FLAT_102_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "102",
        areaSqFt: 1500,
        status: FLAT_STATUS.OCCUPIED,
        isDeleted: false,
      },
    ]);

    // Seed Users
    await User.create([
      {
        _id: SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: "super.review@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: BUILDING_ADMIN_A_ID,
        firstName: "Building",
        lastName: "AdminA",
        email: "badmin.review.a@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: MANAGER_A_ID,
        firstName: "Manager",
        lastName: "TowerA",
        email: "mgr.review.a@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: MANAGER_B_ID,
        firstName: "Manager",
        lastName: "TowerB",
        email: "mgr.review.b@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: OWNER_A_USER_ID,
        firstName: "Owner",
        lastName: "Alpha",
        email: "owner.review.a@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.RESIDENT_OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: TENANT_101_USER_ID,
        firstName: "Tenant",
        lastName: "OneZeroOne",
        email: "tenant.review.101@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.RESIDENT_TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: TENANT_102_USER_ID,
        firstName: "Tenant",
        lastName: "OneZeroTwo",
        email: "tenant.review.102@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.RESIDENT_TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: STAFF_TECH_USER_ID,
        firstName: "Tech",
        lastName: "Primary",
        email: "tech.primary@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MAINTENANCE_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: STAFF_TECH_2_USER_ID,
        firstName: "Tech",
        lastName: "Secondary",
        email: "tech.secondary@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MAINTENANCE_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
    ]);

    // Seed Owner Profile
    await Owner.create({
      _id: OWNER_A_PROFILE_ID,
      userId: OWNER_A_USER_ID,
      buildingId: BUILDING_A_ID,
      flatsOwned: [FLAT_101_ID],
    });

    // Seed Tenant Profiles
    await Tenant.create([
      {
        _id: TENANT_101_PROFILE_ID,
        userId: TENANT_101_USER_ID,
        flatId: FLAT_101_ID,
        buildingId: BUILDING_A_ID,
        ownerId: OWNER_A_PROFILE_ID,
        rentAmount: 25000,
        status: "ACTIVE",
        leaseStartDate: new Date("2025-01-01"),
        leaseEndDate: new Date("2026-12-31"),
      },
      {
        _id: TENANT_102_PROFILE_ID,
        userId: TENANT_102_USER_ID,
        flatId: FLAT_102_ID,
        buildingId: BUILDING_A_ID,
        ownerId: OWNER_A_PROFILE_ID,
        rentAmount: 25000,
        status: "ACTIVE",
        leaseStartDate: new Date("2025-01-01"),
        leaseEndDate: new Date("2026-12-31"),
      },
    ]);

    // Seed Staff Operational Profiles
    await Staff.create([
      {
        _id: STAFF_TECH_PROFILE_ID,
        userId: STAFF_TECH_USER_ID,
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.ELECTRICIAN,
        designation: "Lead Electrician",
        assignedShift: STAFF_CONSTANTS.SHIFTS.MORNING,
        averageRating: 0.0,
        totalRatingsCount: 0,
        isDeleted: false,
      },
      {
        _id: STAFF_TECH_2_PROFILE_ID,
        userId: STAFF_TECH_2_USER_ID,
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.PLUMBER,
        designation: "Master Plumber",
        assignedShift: STAFF_CONSTANTS.SHIFTS.MORNING,
        averageRating: 0.0,
        totalRatingsCount: 0,
        isDeleted: false,
      },
    ]);

    // Seed Maintenance Requests / Work Orders
    const now = new Date();
    await MaintenanceRequest.create([
      {
        _id: MR_CLOSED_1_ID,
        requestNumber: `MR-${Date.now()}-001`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_ID,
        createdById: TENANT_101_USER_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.ELECTRICAL,
        priority: MAINTENANCE_REQUEST_PRIORITY.HIGH,
        title: "Faulty breaker in unit 101",
        description: "Breaker continuously trips under normal load conditions.",
        assignedStaffId: STAFF_TECH_PROFILE_ID,
        status: MAINTENANCE_REQUEST_STATUS.CLOSED,
        slaDeadline: new Date(now.getTime() + 86400000),
        startedAt: now,
        completedAt: now,
      },
      {
        _id: MR_COMPLETED_2_ID,
        requestNumber: `MR-${Date.now()}-002`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_ID,
        createdById: OWNER_A_USER_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.ELECTRICAL,
        priority: MAINTENANCE_REQUEST_PRIORITY.MEDIUM,
        title: "Lighting fixture replacement",
        description: "Replace living room chandelier with LED panel fixture.",
        assignedStaffId: STAFF_TECH_PROFILE_ID,
        status: MAINTENANCE_REQUEST_STATUS.COMPLETED,
        slaDeadline: new Date(now.getTime() + 86400000),
        startedAt: now,
        completedAt: now,
      },
      {
        _id: MR_VERIFIED_3_ID,
        requestNumber: `MR-${Date.now()}-003`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_ID,
        createdById: TENANT_101_USER_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
        priority: MAINTENANCE_REQUEST_PRIORITY.LOW,
        title: "Kitchen sink drain trap leak",
        description: "Slight weeping from P-trap coupling pipe under sink.",
        assignedStaffId: STAFF_TECH_2_PROFILE_ID,
        status: MAINTENANCE_REQUEST_STATUS.VERIFIED,
        slaDeadline: new Date(now.getTime() + 86400000),
        startedAt: now,
        completedAt: now,
        verifiedAt: now,
      },
      {
        _id: MR_OPEN_ID,
        requestNumber: `MR-${Date.now()}-004`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_ID,
        createdById: TENANT_101_USER_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.CARPENTRY,
        priority: MAINTENANCE_REQUEST_PRIORITY.LOW,
        title: "Door hinge squeaking",
        description: "Front door hinge makes loud screeching noise.",
        assignedStaffId: STAFF_TECH_PROFILE_ID,
        status: MAINTENANCE_REQUEST_STATUS.OPEN,
        slaDeadline: new Date(now.getTime() + 86400000),
      },
      {
        _id: MR_NO_STAFF_ID,
        requestNumber: `MR-${Date.now()}-005`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_ID,
        createdById: TENANT_101_USER_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.CARPENTRY,
        priority: MAINTENANCE_REQUEST_PRIORITY.LOW,
        title: "Wall touch-up paint",
        description: "Hallway wall has drywall scuff mark.",
        assignedStaffId: null,
        status: MAINTENANCE_REQUEST_STATUS.CLOSED,
        slaDeadline: new Date(now.getTime() + 86400000),
      },
      {
        _id: MR_OTHER_FLAT_ID,
        requestNumber: `MR-${Date.now()}-006`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_102_ID,
        createdById: TENANT_102_USER_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.ELECTRICAL,
        priority: MAINTENANCE_REQUEST_PRIORITY.MEDIUM,
        title: "Dimmer switch repair",
        description: "Dimmer switch flickers intermittently.",
        assignedStaffId: STAFF_TECH_2_PROFILE_ID,
        status: MAINTENANCE_REQUEST_STATUS.CLOSED,
        slaDeadline: new Date(now.getTime() + 86400000),
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
      role: ROLES.RESIDENT_OWNER,
    });
    tenant101Token = generateAccessToken({
      sub: TENANT_101_USER_ID.toString(),
      role: ROLES.RESIDENT_TENANT,
    });
    tenant102Token = generateAccessToken({
      sub: TENANT_102_USER_ID.toString(),
      role: ROLES.RESIDENT_TENANT,
    });
    staffTechToken = generateAccessToken({
      sub: STAFF_TECH_USER_ID.toString(),
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

  // =====================  1. UNIT & SCHEMA INVARIANTS  ======
  describe("1. Schema & Validation Invariants", () => {
    it("Rejects non-integer or out-of-bounds ratings in Zod schema", () => {
      const invalidRatings = [0, 6, 3.5, -1, "5"];
      for (const r of invalidRatings) {
        const result = reviewValidation.createReview.safeParse({
          maintenanceRequestId: MR_CLOSED_1_ID.toString(),
          rating: r,
        });
        assert.equal(
          result.success,
          false,
          `Rating ${r} should fail validation`
        );
      }
    });

    it("Accepts valid integer ratings 1 through 5 in Zod schema", () => {
      for (let r = 1; r <= 5; r++) {
        const result = reviewValidation.createReview.safeParse({
          maintenanceRequestId: MR_CLOSED_1_ID.toString(),
          rating: r,
          title: "Great work",
          comment: "Technician arrived promptly and solved the issue cleanly.",
        });
        assert.equal(
          result.success,
          true,
          `Rating ${r} should pass validation`
        );
      }
    });

    it("Rejects unknown fields in strict mode", () => {
      const result = reviewValidation.createReview.safeParse({
        maintenanceRequestId: MR_CLOSED_1_ID.toString(),
        rating: 5,
        residentUserId: "tampered_id",
        buildingId: "tampered_id",
      });
      assert.equal(
        result.success,
        false,
        "Unknown fields must be rejected in strict mode"
      );
    });

    it("Rejects title exceeding maximum length", () => {
      const result = reviewValidation.createReview.safeParse({
        maintenanceRequestId: MR_CLOSED_1_ID.toString(),
        rating: 4,
        title: "A".repeat(REVIEW_LIMITS.TITLE_MAX_LENGTH + 1),
      });
      assert.equal(result.success, false);
    });

    it("Rejects comment exceeding maximum length", () => {
      const result = reviewValidation.createReview.safeParse({
        maintenanceRequestId: MR_CLOSED_1_ID.toString(),
        rating: 4,
        comment: "B".repeat(REVIEW_LIMITS.COMMENT_MAX_LENGTH + 1),
      });
      assert.equal(result.success, false);
    });
  });

  // =====================  2. POST /api/v1/reviews  ==========
  describe("2. Review Creation & Eligibility (POST /api/v1/reviews)", () => {
    it("Rejects unauthenticated request with 401", async () => {
      const res = await apiRequest("/api/v1/reviews", {
        method: "POST",
        body: {
          maintenanceRequestId: MR_CLOSED_1_ID.toString(),
          rating: 5,
        },
      });
      assert.equal(res.status, 401);
    });

    it("Rejects non-resident role (Manager) with 403", async () => {
      const res = await apiRequest("/api/v1/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${managerAToken}` },
        body: {
          maintenanceRequestId: MR_CLOSED_1_ID.toString(),
          rating: 5,
        },
      });
      assert.equal(res.status, 403);
    });

    it("Rejects non-resident role (Maintenance Staff) with 403", async () => {
      const res = await apiRequest("/api/v1/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${staffTechToken}` },
        body: {
          maintenanceRequestId: MR_CLOSED_1_ID.toString(),
          rating: 5,
        },
      });
      assert.equal(res.status, 403);
    });

    it("Rejects resident reviewing ticket belonging to a different flat (IDOR prevention) with 403", async () => {
      // Tenant 101 attempts to review ticket for Flat 102
      const res = await apiRequest("/api/v1/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          maintenanceRequestId: MR_OTHER_FLAT_ID.toString(),
          rating: 5,
        },
      });
      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it("Allows authorized resident (Tenant 102) to review work order for their own flat", async () => {
      const res = await apiRequest("/api/v1/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant102Token}` },
        body: {
          maintenanceRequestId: MR_OTHER_FLAT_ID.toString(),
          rating: 4,
          title: "Dimmer switch fixed well",
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
    });

    it("Rejects review for ticket not in terminal/completed status (OPEN) with 400", async () => {
      const res = await apiRequest("/api/v1/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          maintenanceRequestId: MR_OPEN_ID.toString(),
          rating: 4,
        },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /completed or closed/i);
    });

    it("Rejects review for ticket with no assigned technician with 400", async () => {
      const res = await apiRequest("/api/v1/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          maintenanceRequestId: MR_NO_STAFF_ID.toString(),
          rating: 4,
        },
      });
      assert.equal(res.status, 400);
      assert.match(res.data.message, /technician/i);
    });

    it("Successfully creates review for CLOSED ticket and updates technician metrics atomically with 201", async () => {
      const res = await apiRequest("/api/v1/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          maintenanceRequestId: MR_CLOSED_1_ID.toString(),
          rating: 5,
          title: "Outstanding Electrical Repair",
          comment:
            "Resolved the circuit breaker defect rapidly. Highly skilled.",
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.rating, 5);
      assert.equal(res.data.data.title, "Outstanding Electrical Repair");
      assert.equal(
        res.data.data.maintenanceRequestId,
        MR_CLOSED_1_ID.toString()
      );
      assert.equal(res.data.data.staffId, STAFF_TECH_PROFILE_ID.toString());
      assert.equal(res.data.data.buildingId, BUILDING_A_ID.toString());
      assert.equal(res.data.data.flatId, FLAT_101_ID.toString());
      assert.equal(res.data.data.residentUserId, TENANT_101_USER_ID.toString());
      assert.equal(res.data.data.moderationStatus, MODERATION_STATUS.PUBLISHED);

      // Verify Staff metrics updated in DB
      const updatedStaff = await Staff.findById(STAFF_TECH_PROFILE_ID);
      assert.equal(updatedStaff.totalRatingsCount, 1);
      assert.equal(updatedStaff.averageRating, 5.0);
    });

    it("Rejects duplicate review for the same work order with 409 Conflict", async () => {
      const res = await apiRequest("/api/v1/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          maintenanceRequestId: MR_CLOSED_1_ID.toString(),
          rating: 4,
          comment: "Attempting duplicate review submission.",
        },
      });

      assert.equal(res.status, 409);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /already been submitted/i);
    });

    it("Successfully creates second review for same technician by Owner and updates average rating accurately", async () => {
      const res = await apiRequest("/api/v1/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          maintenanceRequestId: MR_COMPLETED_2_ID.toString(),
          rating: 4,
          title: "Good Fixture Installation",
          comment: "Installation looks clean. Left the work area tidy.",
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.rating, 4);

      // Verify Staff metrics: previous (5 * 1 + 4) / 2 = 4.5
      const updatedStaff = await Staff.findById(STAFF_TECH_PROFILE_ID);
      assert.equal(updatedStaff.totalRatingsCount, 2);
      assert.equal(updatedStaff.averageRating, 4.5);
    });

    it("Allows review for VERIFIED ticket status by resident tenant", async () => {
      const res = await apiRequest("/api/v1/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          maintenanceRequestId: MR_VERIFIED_3_ID.toString(),
          rating: 5,
          title: "Flawless plumbing work",
          comment: "No more leaks. P-trap sealed perfectly.",
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);

      // Verify second technician's metrics (Tenant 102 gave 4, Tenant 101 gave 5 -> avg 4.5, count 2)
      const tech2 = await Staff.findById(STAFF_TECH_2_PROFILE_ID);
      assert.equal(tech2.totalRatingsCount, 2);
      assert.equal(tech2.averageRating, 4.5);
    });
  });

  // =====================  3. GET /api/v1/reviews  ===========
  describe("3. Review Retrieval & Scoping (GET /api/v1/reviews)", () => {
    it("Rejects unauthenticated request with 401", async () => {
      const res = await apiRequest("/api/v1/reviews");
      assert.equal(res.status, 401);
    });

    it("Returns paginated list of reviews with standard envelope", async () => {
      const res = await apiRequest("/api/v1/reviews?limit=10&page=1", {
        headers: { Authorization: `Bearer ${tenant101Token}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(Array.isArray(res.data.data.items));
      assert.equal(typeof res.data.data.pagination.total, "number");
      assert.equal(res.data.data.pagination.page, 1);
      assert.equal(res.data.data.pagination.limit, 10);
      assert.ok(res.data.data.items.length >= 3);
    });

    it("Filters reviews by staffId correctly", async () => {
      const res = await apiRequest(
        `/api/v1/reviews?staffId=${STAFF_TECH_PROFILE_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.items.length, 2);
      for (const item of res.data.data.items) {
        assert.equal(item.staffId, STAFF_TECH_PROFILE_ID.toString());
      }
    });

    it("Filters reviews by buildingId correctly", async () => {
      const res = await apiRequest(
        `/api/v1/reviews?buildingId=${BUILDING_A_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.ok(res.data.data.items.length >= 3);
      for (const item of res.data.data.items) {
        assert.equal(item.buildingId, BUILDING_A_ID.toString());
      }
    });

    it("Returns empty array for building with no reviews", async () => {
      const res = await apiRequest(
        `/api/v1/reviews?buildingId=${BUILDING_B_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.items.length, 0);
      assert.equal(res.data.data.pagination.total, 0);
    });
  });

  // =====================  4. MODERATION WORKFLOW  ===========
  describe("4. Review Moderation (PATCH /api/v1/reviews/:id/moderate)", () => {
    let reviewToModerateId;

    before(async () => {
      const review = await Review.findOne({
        maintenanceRequestId: MR_CLOSED_1_ID,
      });
      reviewToModerateId = review._id.toString();
    });

    it("Rejects unauthenticated moderation attempt with 401", async () => {
      const res = await apiRequest(
        `/api/v1/reviews/${reviewToModerateId}/moderate`,
        {
          method: "PATCH",
          body: {
            moderationStatus: MODERATION_STATUS.FLAGGED,
            moderationReason: "Inappropriate language in review body",
          },
        }
      );
      assert.equal(res.status, 401);
    });

    it("Rejects resident attempt to moderate reviews with 403", async () => {
      const res = await apiRequest(
        `/api/v1/reviews/${reviewToModerateId}/moderate`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${tenant101Token}` },
          body: {
            moderationStatus: MODERATION_STATUS.FLAGGED,
            moderationReason: "Trying to self-moderate",
          },
        }
      );
      assert.equal(res.status, 403);
    });

    it("Rejects manager from different building (Building B) with 403", async () => {
      const res = await apiRequest(
        `/api/v1/reviews/${reviewToModerateId}/moderate`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerBToken}` },
          body: {
            moderationStatus: MODERATION_STATUS.FLAGGED,
            moderationReason: "Manager B trying to moderate Tower A review",
          },
        }
      );
      assert.equal(res.status, 403);
      assert.match(res.data.message, /outside your assigned building/i);
    });

    it("Rejects moderation without required reason when flagging or hiding with 400", async () => {
      const res = await apiRequest(
        `/api/v1/reviews/${reviewToModerateId}/moderate`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: {
            moderationStatus: MODERATION_STATUS.FLAGGED,
          },
        }
      );
      assert.equal(res.status, 400);
    });

    it("Rejects invalid moderation status enum with 400", async () => {
      const res = await apiRequest(
        `/api/v1/reviews/${reviewToModerateId}/moderate`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: {
            moderationStatus: "INVALID_STATUS",
            moderationReason: "Reason provided",
          },
        }
      );
      assert.equal(res.status, 400);
    });

    it("Successfully allows assigned Manager to FLAG a review with 200", async () => {
      const res = await apiRequest(
        `/api/v1/reviews/${reviewToModerateId}/moderate`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${managerAToken}` },
          body: {
            moderationStatus: MODERATION_STATUS.FLAGGED,
            moderationReason: "Contains potentially sensitive tenant details",
            moderationNotes: "Escalated for administrative privacy review",
          },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.moderationStatus, MODERATION_STATUS.FLAGGED);
      assert.equal(
        res.data.data.moderationReason,
        "Contains potentially sensitive tenant details"
      );
      assert.equal(res.data.data.moderatedById, MANAGER_A_ID.toString());
      assert.ok(res.data.data.moderatedAt);

      // Verify persistent record in DB
      const dbRecord = await Review.findById(reviewToModerateId);
      assert.equal(dbRecord.moderationStatus, MODERATION_STATUS.FLAGGED);
    });

    it("Hides non-PUBLISHED reviews from standard resident queries", async () => {
      const res = await apiRequest("/api/v1/reviews", {
        headers: { Authorization: `Bearer ${tenant101Token}` },
      });

      assert.equal(res.status, 200);
      const items = res.data.data.items;
      // All items retrieved by resident must strictly be PUBLISHED
      for (const item of items) {
        assert.equal(item.moderationStatus, MODERATION_STATUS.PUBLISHED);
        assert.notEqual(item._id, reviewToModerateId);
      }
    });

    it("Allows Super Admin to HIDE a review with 200", async () => {
      const res = await apiRequest(
        `/api/v1/reviews/${reviewToModerateId}/moderate`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${superAdminToken}` },
          body: {
            moderationStatus: MODERATION_STATUS.HIDDEN,
            moderationReason:
              "Confirmed privacy violation. Review hidden permanently.",
          },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.moderationStatus, MODERATION_STATUS.HIDDEN);
      assert.equal(res.data.data.moderatedById, SUPER_ADMIN_ID.toString());
    });

    it("Allows Super Admin to restore review to PUBLISHED status with 200", async () => {
      const res = await apiRequest(
        `/api/v1/reviews/${reviewToModerateId}/moderate`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${superAdminToken}` },
          body: {
            moderationStatus: MODERATION_STATUS.PUBLISHED,
            moderationReason: "Review cleared following sanitization.",
          },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.moderationStatus, MODERATION_STATUS.PUBLISHED);
    });

    it("Allows Building Admin assigned to Building A to moderate reviews with 200", async () => {
      const res = await apiRequest(
        `/api/v1/reviews/${reviewToModerateId}/moderate`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
          body: {
            moderationStatus: MODERATION_STATUS.FLAGGED,
            moderationReason: "Building Admin re-flagged for audit compliance",
          },
        }
      );
      assert.equal(res.status, 200);
      assert.equal(res.data.data.moderationStatus, MODERATION_STATUS.FLAGGED);
      assert.equal(res.data.data.moderatedById, BUILDING_ADMIN_A_ID.toString());
    });
  });
});
