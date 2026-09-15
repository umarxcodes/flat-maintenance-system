// =====================  IMPORTS & TEST RUNNER  =============
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Notice } from "./notices.model.js";
import {
  NOTICE_CATEGORY,
  NOTICE_PRIORITY,
  TARGET_AUDIENCE,
  NOTICE_LIMITS,
} from "./notices.constants.js";
import { noticeValidation } from "./notices.validation.js";
import { Building } from "../../models/building.model.js";
import { Block } from "../../models/block.model.js";
import { Floor } from "../../models/floor.model.js";
import { Flat, FLAT_STATUS } from "../../models/flat.model.js";
import { User } from "../../models/user.model.js";
import { Owner } from "../../models/owner.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { generateAccessToken } from "../../utils/token.util.js";
import { rolesService } from "../roles/roles.service.js";

// =====================  TEST SETUP & FIXTURES  =============
dotenv.config();

let server;
let baseUrl;

// Test IDs - Buildings & Hierarchy
const BUILDING_A_ID = new mongoose.Types.ObjectId();
const BUILDING_B_ID = new mongoose.Types.ObjectId();
const BLOCK_A1_ID = new mongoose.Types.ObjectId();
const BLOCK_A2_ID = new mongoose.Types.ObjectId();
const BLOCK_B1_ID = new mongoose.Types.ObjectId();
const FLOOR_A1_ID = new mongoose.Types.ObjectId();
const FLOOR_A2_ID = new mongoose.Types.ObjectId();
const FLOOR_B1_ID = new mongoose.Types.ObjectId();
const FLAT_101_ID = new mongoose.Types.ObjectId(); // Block A1
const FLAT_102_ID = new mongoose.Types.ObjectId(); // Block A2
const FLAT_201_ID = new mongoose.Types.ObjectId(); // Block B1

// Test IDs - Actors
const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_A_ID = new mongoose.Types.ObjectId();
const MANAGER_A_ID = new mongoose.Types.ObjectId();
const MANAGER_B_ID = new mongoose.Types.ObjectId();
const OWNER_A1_USER_ID = new mongoose.Types.ObjectId();
const OWNER_A1_PROFILE_ID = new mongoose.Types.ObjectId();
const TENANT_A2_USER_ID = new mongoose.Types.ObjectId();
const TENANT_A2_PROFILE_ID = new mongoose.Types.ObjectId();
const TENANT_B1_USER_ID = new mongoose.Types.ObjectId();
const TENANT_B1_PROFILE_ID = new mongoose.Types.ObjectId();
const STAFF_A_USER_ID = new mongoose.Types.ObjectId();

// Auth Tokens
let superAdminToken;
let buildingAdminAToken;
let managerAToken;
let managerBToken;
let ownerA1Token;
let tenantA2Token;
let tenantB1Token;
let staffAToken;

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
describe("Module 18: Society Notices & Announcements (notices)", () => {
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
      Notice.deleteMany({}),
      Flat.deleteMany({}),
      Floor.deleteMany({}),
      Block.deleteMany({}),
      Building.deleteMany({}),
      Owner.deleteMany({}),
      Tenant.deleteMany({}),
      User.deleteMany({}),
    ]);

    // Seed Buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Notices Test Complex A",
        code: `NCA-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Announcement Way",
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
        name: "Notices Test Complex B",
        code: `NCB-${Date.now().toString().slice(-4)}`,
        address: {
          street: "200 Broadcast Boulevard",
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
    await Block.create([
      {
        _id: BLOCK_A1_ID,
        buildingId: BUILDING_A_ID,
        name: "Block A1",
        code: "BLK-A1",
        totalFloors: 5,
        isDeleted: false,
      },
      {
        _id: BLOCK_A2_ID,
        buildingId: BUILDING_A_ID,
        name: "Block A2",
        code: "BLK-A2",
        totalFloors: 5,
        isDeleted: false,
      },
      {
        _id: BLOCK_B1_ID,
        buildingId: BUILDING_B_ID,
        name: "Block B1",
        code: "BLK-B1",
        totalFloors: 5,
        isDeleted: false,
      },
    ]);

    await Floor.create([
      {
        _id: FLOOR_A1_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A1_ID,
        floorNumber: 1,
        name: "Floor 1",
        code: "FL-A1-01",
        isDeleted: false,
      },
      {
        _id: FLOOR_A2_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A2_ID,
        floorNumber: 1,
        name: "Floor 1",
        code: "FL-A2-01",
        isDeleted: false,
      },
      {
        _id: FLOOR_B1_ID,
        buildingId: BUILDING_B_ID,
        blockId: BLOCK_B1_ID,
        floorNumber: 1,
        name: "Floor 1",
        code: "FL-B1-01",
        isDeleted: false,
      },
    ]);

    // Seed Flats
    await Flat.create([
      {
        _id: FLAT_101_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A1_ID,
        floorId: FLOOR_A1_ID,
        flatNumber: "101",
        areaSqFt: 1200,
        status: FLAT_STATUS.OCCUPIED,
        isDeleted: false,
      },
      {
        _id: FLAT_102_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A2_ID,
        floorId: FLOOR_A2_ID,
        flatNumber: "102",
        areaSqFt: 1100,
        status: FLAT_STATUS.OCCUPIED,
        isDeleted: false,
      },
      {
        _id: FLAT_201_ID,
        buildingId: BUILDING_B_ID,
        blockId: BLOCK_B1_ID,
        floorId: FLOOR_B1_ID,
        flatNumber: "201",
        areaSqFt: 1300,
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
        email: "super.notices@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: BUILDING_ADMIN_A_ID,
        firstName: "Building",
        lastName: "AdminA",
        email: "badmin.notices.a@test.local",
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
        email: "mgr.notices.a@test.local",
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
        email: "mgr.notices.b@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: OWNER_A1_USER_ID,
        firstName: "Owner",
        lastName: "A1",
        email: "owner.notices.a1@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: TENANT_A2_USER_ID,
        firstName: "Tenant",
        lastName: "A2",
        email: "tenant.notices.a2@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: TENANT_B1_USER_ID,
        firstName: "Tenant",
        lastName: "B1",
        email: "tenant.notices.b1@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: STAFF_A_USER_ID,
        firstName: "Staff",
        lastName: "MaintA",
        email: "staff.notices.a@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MAINTENANCE_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
    ]);

    // Seed Owner Profile
    await Owner.create({
      _id: OWNER_A1_PROFILE_ID,
      userId: OWNER_A1_USER_ID,
      buildingId: BUILDING_A_ID,
      flatsOwned: [FLAT_101_ID],
    });

    // Seed Tenant Profiles
    await Tenant.create([
      {
        _id: TENANT_A2_PROFILE_ID,
        userId: TENANT_A2_USER_ID,
        flatId: FLAT_102_ID,
        buildingId: BUILDING_A_ID,
        ownerId: OWNER_A1_PROFILE_ID,
        rentAmount: 25000,
        status: "ACTIVE",
        leaseStartDate: new Date("2025-01-01"),
        leaseEndDate: new Date("2026-12-31"),
      },
      {
        _id: TENANT_B1_PROFILE_ID,
        userId: TENANT_B1_USER_ID,
        flatId: FLAT_201_ID,
        buildingId: BUILDING_B_ID,
        ownerId: OWNER_A1_PROFILE_ID,
        rentAmount: 30000,
        status: "ACTIVE",
        leaseStartDate: new Date("2025-01-01"),
        leaseEndDate: new Date("2026-12-31"),
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
    ownerA1Token = generateAccessToken({
      sub: OWNER_A1_USER_ID.toString(),
      role: ROLES.OWNER,
    });
    tenantA2Token = generateAccessToken({
      sub: TENANT_A2_USER_ID.toString(),
      role: ROLES.TENANT,
    });
    tenantB1Token = generateAccessToken({
      sub: TENANT_B1_USER_ID.toString(),
      role: ROLES.TENANT,
    });
    staffAToken = generateAccessToken({
      sub: STAFF_A_USER_ID.toString(),
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

  // =====================  1. SCHEMA & VALIDATION INVARIANTS
  describe("1. Schema & Validation Invariants", () => {
    it("Rejects invalid notice category in Zod schema", () => {
      const result = noticeValidation.createNotice.safeParse({
        buildingId: BUILDING_A_ID.toString(),
        title: "Valid Title",
        content: "Valid bulletin content.",
        category: "SPORTS_AND_GAMES",
      });
      assert.equal(result.success, false);
    });

    it("Rejects invalid notice priority in Zod schema", () => {
      const result = noticeValidation.createNotice.safeParse({
        buildingId: BUILDING_A_ID.toString(),
        title: "Valid Title",
        content: "Valid bulletin content.",
        category: NOTICE_CATEGORY.GENERAL,
        priority: "CRITICAL_5",
      });
      assert.equal(result.success, false);
    });

    it("Rejects invalid target audience in Zod schema", () => {
      const result = noticeValidation.createNotice.safeParse({
        buildingId: BUILDING_A_ID.toString(),
        title: "Valid Title",
        content: "Valid bulletin content.",
        category: NOTICE_CATEGORY.GENERAL,
        targetAudience: "VIP_RESIDENTS",
      });
      assert.equal(result.success, false);
    });

    it("Rejects title shorter than minimum length", () => {
      const result = noticeValidation.createNotice.safeParse({
        buildingId: BUILDING_A_ID.toString(),
        title: "Hi",
        content: "Valid bulletin content.",
        category: NOTICE_CATEGORY.GENERAL,
      });
      assert.equal(result.success, false);
    });

    it("Rejects title longer than maximum length", () => {
      const result = noticeValidation.createNotice.safeParse({
        buildingId: BUILDING_A_ID.toString(),
        title: "A".repeat(NOTICE_LIMITS.TITLE_MAX_LENGTH + 1),
        content: "Valid bulletin content.",
        category: NOTICE_CATEGORY.GENERAL,
      });
      assert.equal(result.success, false);
    });

    it("Rejects content shorter than minimum length", () => {
      const result = noticeValidation.createNotice.safeParse({
        buildingId: BUILDING_A_ID.toString(),
        title: "Valid Title",
        content: "No",
        category: NOTICE_CATEGORY.GENERAL,
      });
      assert.equal(result.success, false);
    });

    it("Rejects content longer than maximum length", () => {
      const result = noticeValidation.createNotice.safeParse({
        buildingId: BUILDING_A_ID.toString(),
        title: "Valid Title",
        content: "C".repeat(NOTICE_LIMITS.CONTENT_MAX_LENGTH + 1),
        category: NOTICE_CATEGORY.GENERAL,
      });
      assert.equal(result.success, false);
    });

    it("Rejects past date in expiresAt", () => {
      const result = noticeValidation.createNotice.safeParse({
        buildingId: BUILDING_A_ID.toString(),
        title: "Expiring Notice",
        content: "Will expire soon.",
        category: NOTICE_CATEGORY.GENERAL,
        expiresAt: new Date(Date.now() - 60000).toISOString(),
      });
      assert.equal(result.success, false);
    });

    it("Rejects mass-assignment and extraneous fields in strict mode", () => {
      const result = noticeValidation.createNotice.safeParse({
        buildingId: BUILDING_A_ID.toString(),
        title: "Valid Title",
        content: "Valid bulletin content.",
        category: NOTICE_CATEGORY.GENERAL,
        authorUserId: "malicious_spoofed_id",
        isDeleted: true,
      });
      assert.equal(result.success, false);
    });

    it("Accepts valid notice creation payload", () => {
      const result = noticeValidation.createNotice.safeParse({
        buildingId: BUILDING_A_ID.toString(),
        blockId: BLOCK_A1_ID.toString(),
        title: "Water Tank Cleaning Schedule",
        content:
          "Overhead water tanks will be sanitized this Saturday from 10 AM to 2 PM.",
        category: NOTICE_CATEGORY.MAINTENANCE,
        priority: NOTICE_PRIORITY.HIGH,
        targetAudience: TARGET_AUDIENCE.ALL,
        attachmentUrls: [
          "https://res.cloudinary.com/demo/image/upload/schedule.pdf",
        ],
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      assert.equal(result.success, true);
    });
  });

  // =====================  2. POST /api/v1/notices  ==========
  describe("2. Bulletin Publishing (POST /api/v1/notices)", () => {
    it("Rejects unauthenticated request with 401", async () => {
      const res = await apiRequest("/api/v1/notices", {
        method: "POST",
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Public announcement",
          content: "General notice content.",
          category: NOTICE_CATEGORY.GENERAL,
        },
      });
      assert.equal(res.status, 401);
    });

    it("Rejects unauthorized resident roles (Owner) with 403", async () => {
      const res = await apiRequest("/api/v1/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerA1Token}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Owner attempt",
          content: "Trying to post notice.",
          category: NOTICE_CATEGORY.GENERAL,
        },
      });
      assert.equal(res.status, 403);
    });

    it("Rejects unauthorized resident roles (Tenant) with 403", async () => {
      const res = await apiRequest("/api/v1/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantA2Token}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Tenant attempt",
          content: "Trying to post notice.",
          category: NOTICE_CATEGORY.GENERAL,
        },
      });
      assert.equal(res.status, 403);
    });

    it("Rejects operational staff role with 403", async () => {
      const res = await apiRequest("/api/v1/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${staffAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Staff attempt",
          content: "Trying to post notice.",
          category: NOTICE_CATEGORY.GENERAL,
        },
      });
      assert.equal(res.status, 403);
    });

    it("Rejects manager publishing outside assigned building complex with 403", async () => {
      // Manager B is assigned to Building B, attempts to publish for Building A
      const res = await apiRequest("/api/v1/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${managerBToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Cross building attempt",
          content: "Should be forbidden.",
          category: NOTICE_CATEGORY.GENERAL,
        },
      });
      assert.equal(res.status, 403);
      assert.match(res.data.message, /outside your assigned building/i);
    });

    it("Rejects block hierarchy mismatch (Block from Building B attached to Building A notice) with 400", async () => {
      const res = await apiRequest("/api/v1/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${managerAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          blockId: BLOCK_B1_ID.toString(),
          title: "Mismatched Block Announcement",
          content: "This block does not belong to Building A.",
          category: NOTICE_CATEGORY.GENERAL,
        },
      });
      assert.equal(res.status, 400);
      assert.match(
        res.data.message,
        /does not belong to the specified building/i
      );
    });

    it("Allows Manager A to publish building-wide notice for Building A with 201", async () => {
      const res = await apiRequest("/api/v1/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${managerAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Annual General Meeting 2026",
          content:
            "The Annual General Meeting of Complex A will be held in the community hall next Sunday.",
          category: NOTICE_CATEGORY.EVENT,
          priority: NOTICE_PRIORITY.NORMAL,
          targetAudience: TARGET_AUDIENCE.ALL,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.title, "Annual General Meeting 2026");
      assert.equal(res.data.data.buildingId, BUILDING_A_ID.toString());
      assert.equal(res.data.data.blockId, null);
      assert.equal(res.data.data.authorUserId, MANAGER_A_ID.toString());
      assert.equal(res.data.data.targetAudience, TARGET_AUDIENCE.ALL);
      assert.equal(res.data.data.isDeleted, false);
    });

    it("Verifies author spoofing defense (server strictly binds authorUserId to authenticated actor)", async () => {
      const spoofedId = new mongoose.Types.ObjectId();
      const res = await apiRequest("/api/v1/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${managerAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Author Spoofing Test",
          content: "Verifying server-controlled author assignment.",
          category: NOTICE_CATEGORY.GENERAL,
        },
      });

      assert.equal(res.status, 201);
      // Persisted author must be MANAGER_A_ID, not any spoofed identity
      assert.equal(res.data.data.authorUserId, MANAGER_A_ID.toString());
      assert.notEqual(res.data.data.authorUserId, spoofedId.toString());
    });

    it("Allows Building Admin A to publish block-targeted notice for Block A1 with 201", async () => {
      const res = await apiRequest("/api/v1/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          blockId: BLOCK_A1_ID.toString(),
          title: "Block A1 Elevator Servicing",
          content:
            "Elevator #2 in Block A1 will undergo preventative maintenance tomorrow morning.",
          category: NOTICE_CATEGORY.MAINTENANCE,
          priority: NOTICE_PRIORITY.HIGH,
          targetAudience: TARGET_AUDIENCE.ALL,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.blockId, BLOCK_A1_ID.toString());
      assert.equal(res.data.data.authorUserId, BUILDING_ADMIN_A_ID.toString());
    });

    it("Allows Manager A to publish OWNERS_ONLY notice for Building A with 201", async () => {
      const res = await apiRequest("/api/v1/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${managerAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Society Reserve Fund Contribution",
          content:
            "Quarterly capital expenditure reserves will be collected from all registered title owners.",
          category: NOTICE_CATEGORY.FINANCIAL,
          targetAudience: TARGET_AUDIENCE.OWNERS_ONLY,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.targetAudience, TARGET_AUDIENCE.OWNERS_ONLY);
    });

    it("Allows Manager A to publish TENANTS_ONLY notice for Building A with 201", async () => {
      const res = await apiRequest("/api/v1/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${managerAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Tenant Lease Agreement Guidelines",
          content:
            "Please ensure renewed lease documents and police verifications are uploaded to the portal.",
          category: NOTICE_CATEGORY.GENERAL,
          targetAudience: TARGET_AUDIENCE.TENANTS_ONLY,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.targetAudience, TARGET_AUDIENCE.TENANTS_ONLY);
    });

    it("Allows Super Admin to publish notice for Building B with 201", async () => {
      const res = await apiRequest("/api/v1/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: BUILDING_B_ID.toString(),
          title: "Complex B Security Advisory",
          content:
            "New security protocols are in effect for main gate check-in.",
          category: NOTICE_CATEGORY.SECURITY,
          priority: NOTICE_PRIORITY.URGENT_EMERGENCY,
          targetAudience: TARGET_AUDIENCE.ALL,
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.buildingId, BUILDING_B_ID.toString());
      assert.equal(res.data.data.authorUserId, SUPER_ADMIN_ID.toString());
    });
  });

  // =====================  3. GET /api/v1/notices  ===========
  describe("3. Active Feed & Audience Matrix (GET /api/v1/notices)", () => {
    let expiredNoticeId;

    before(async () => {
      // Seed directly into DB: an expired notice (expiresAt in past)
      const expiredNotice = await Notice.create({
        buildingId: BUILDING_A_ID,
        authorUserId: MANAGER_A_ID,
        title: "Expired Fire Drill Notice",
        content: "Fire drill was completed yesterday.",
        category: NOTICE_CATEGORY.EMERGENCY,
        priority: NOTICE_PRIORITY.NORMAL,
        targetAudience: TARGET_AUDIENCE.ALL,
        publishedAt: new Date(Date.now() - 172800000), // 2 days ago
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
        isDeleted: false,
      });
      expiredNoticeId = expiredNotice._id.toString();
    });

    it("Rejects unauthenticated request with 401", async () => {
      const res = await apiRequest("/api/v1/notices");
      assert.equal(res.status, 401);
    });

    it("Enforces cross-building isolation (Tenant B1 only receives Building B notices)", async () => {
      const res = await apiRequest("/api/v1/notices", {
        headers: { Authorization: `Bearer ${tenantB1Token}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.items.length > 0);
      for (const notice of res.data.data.items) {
        assert.equal(notice.buildingId, BUILDING_B_ID.toString());
        assert.notEqual(notice.buildingId, BUILDING_A_ID.toString());
      }
    });

    it("Enforces audience matrix for Owner (receives ALL and OWNERS_ONLY, hides TENANTS_ONLY)", async () => {
      const res = await apiRequest("/api/v1/notices", {
        headers: { Authorization: `Bearer ${ownerA1Token}` },
      });

      assert.equal(res.status, 200);
      const items = res.data.data.items;
      assert.ok(items.length > 0);

      const audiences = items.map((n) => n.targetAudience);
      assert.ok(audiences.includes(TARGET_AUDIENCE.ALL));
      assert.ok(audiences.includes(TARGET_AUDIENCE.OWNERS_ONLY));
      assert.equal(
        audiences.includes(TARGET_AUDIENCE.TENANTS_ONLY),
        false,
        "Owner must NOT receive TENANTS_ONLY notices"
      );
    });

    it("Enforces audience matrix for Tenant (receives ALL and TENANTS_ONLY, hides OWNERS_ONLY)", async () => {
      const res = await apiRequest("/api/v1/notices", {
        headers: { Authorization: `Bearer ${tenantA2Token}` },
      });

      assert.equal(res.status, 200);
      const items = res.data.data.items;
      assert.ok(items.length > 0);

      const audiences = items.map((n) => n.targetAudience);
      assert.ok(audiences.includes(TARGET_AUDIENCE.ALL));
      assert.ok(audiences.includes(TARGET_AUDIENCE.TENANTS_ONLY));
      assert.equal(
        audiences.includes(TARGET_AUDIENCE.OWNERS_ONLY),
        false,
        "Tenant must NOT receive OWNERS_ONLY notices"
      );
    });

    it("Enforces block targeting (Owner in Block A1 sees Block A1 notice, Tenant in Block A2 does NOT)", async () => {
      const ownerRes = await apiRequest("/api/v1/notices", {
        headers: { Authorization: `Bearer ${ownerA1Token}` },
      });
      const tenantRes = await apiRequest("/api/v1/notices", {
        headers: { Authorization: `Bearer ${tenantA2Token}` },
      });

      const ownerTitles = ownerRes.data.data.items.map((n) => n.title);
      const tenantTitles = tenantRes.data.data.items.map((n) => n.title);

      // Block A1 elevator servicing notice
      assert.ok(
        ownerTitles.includes("Block A1 Elevator Servicing"),
        "Owner of flat in Block A1 must see Block A1 notice"
      );
      assert.equal(
        tenantTitles.includes("Block A1 Elevator Servicing"),
        false,
        "Tenant residing in Block A2 must NOT see Block A1 notice"
      );

      // Building-wide notice must be visible to both
      assert.ok(ownerTitles.includes("Annual General Meeting 2026"));
      assert.ok(tenantTitles.includes("Annual General Meeting 2026"));
    });

    it("Filters out expired notices from active feeds automatically", async () => {
      const res = await apiRequest("/api/v1/notices", {
        headers: { Authorization: `Bearer ${ownerA1Token}` },
      });

      assert.equal(res.status, 200);
      const noticeIds = res.data.data.items.map((n) => n._id);
      assert.equal(
        noticeIds.includes(expiredNoticeId),
        false,
        "Expired notice must be filtered from active feed"
      );
    });

    it("Returns paginated envelope with standard metadata", async () => {
      const res = await apiRequest("/api/v1/notices?page=1&limit=10", {
        headers: { Authorization: `Bearer ${ownerA1Token}` },
      });

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.data.data.items));
      assert.equal(typeof res.data.data.pagination.total, "number");
      assert.equal(res.data.data.pagination.page, 1);
      assert.equal(res.data.data.pagination.limit, 10);
      assert.equal(typeof res.data.data.pagination.totalPages, "number");
    });

    it("Allows Manager A to view all audience notices within assigned Building A", async () => {
      const res = await apiRequest("/api/v1/notices", {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 200);
      const audiences = res.data.data.items.map((n) => n.targetAudience);
      assert.ok(audiences.includes(TARGET_AUDIENCE.ALL));
      assert.ok(audiences.includes(TARGET_AUDIENCE.OWNERS_ONLY));
      assert.ok(audiences.includes(TARGET_AUDIENCE.TENANTS_ONLY));
    });

    it("Rejects Manager B attempting to query Building A with 403", async () => {
      const res = await apiRequest(
        `/api/v1/notices?buildingId=${BUILDING_A_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${managerBToken}` },
        }
      );

      assert.equal(res.status, 403);
      assert.match(res.data.message, /outside your assigned building/i);
    });
  });

  // =====================  4. DELETE /api/v1/notices/:id  ====
  describe("4. Bulletin Retraction (DELETE /api/v1/notices/:id)", () => {
    let noticeToRetract;

    before(async () => {
      noticeToRetract = await Notice.create({
        buildingId: BUILDING_A_ID,
        authorUserId: MANAGER_A_ID,
        title: "Erroneous Power Cut Alert",
        content: "Maintenance scheduled by error. Retracting announcement.",
        category: NOTICE_CATEGORY.MAINTENANCE,
        priority: NOTICE_PRIORITY.NORMAL,
        targetAudience: TARGET_AUDIENCE.ALL,
        publishedAt: new Date(),
        isDeleted: false,
      });
    });

    it("Rejects unauthenticated retraction attempt with 401", async () => {
      const res = await apiRequest(`/api/v1/notices/${noticeToRetract._id}`, {
        method: "DELETE",
      });
      assert.equal(res.status, 401);
    });

    it("Rejects unauthorized resident attempt (Owner) to retract notice with 403", async () => {
      const res = await apiRequest(`/api/v1/notices/${noticeToRetract._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${ownerA1Token}` },
      });
      assert.equal(res.status, 403);
    });

    it("Rejects unauthorized resident attempt (Tenant) to retract notice with 403", async () => {
      const res = await apiRequest(`/api/v1/notices/${noticeToRetract._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tenantA2Token}` },
      });
      assert.equal(res.status, 403);
    });

    it("Rejects manager from outside building scope (Manager B) with 403", async () => {
      const res = await apiRequest(`/api/v1/notices/${noticeToRetract._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${managerBToken}` },
      });
      assert.equal(res.status, 403);
      assert.match(res.data.message, /outside your assigned building/i);
    });

    it("Allows assigned Manager A to retract notice with 200", async () => {
      const res = await apiRequest(`/api/v1/notices/${noticeToRetract._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.isDeleted, true);
      assert.ok(res.data.data.deletedAt);
      assert.equal(res.data.data.retractedById, MANAGER_A_ID.toString());

      // Verify persistent record in MongoDB
      const dbRecord = await Notice.findById(noticeToRetract._id);
      assert.equal(dbRecord.isDeleted, true);
    });

    it("Rejects repeated retraction of already retracted notice with 404", async () => {
      const res = await apiRequest(`/api/v1/notices/${noticeToRetract._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 404);
      assert.match(
        res.data.message,
        /not found or has already been retracted/i
      );
    });

    it("Confirms retracted notice is excluded from active feeds", async () => {
      const res = await apiRequest("/api/v1/notices", {
        headers: { Authorization: `Bearer ${ownerA1Token}` },
      });

      assert.equal(res.status, 200);
      const ids = res.data.data.items.map((n) => n._id);
      assert.equal(ids.includes(noticeToRetract._id.toString()), false);
    });

    it("Allows Super Admin to retract any notice across all complexes with 200", async () => {
      // Create notice in Building B
      const noticeB = await Notice.create({
        buildingId: BUILDING_B_ID,
        authorUserId: MANAGER_B_ID,
        title: "Notice to be retracted by SuperAdmin",
        content: "Will be retracted by platform administrator.",
        category: NOTICE_CATEGORY.GENERAL,
        targetAudience: TARGET_AUDIENCE.ALL,
        isDeleted: false,
      });

      const res = await apiRequest(`/api/v1/notices/${noticeB._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.isDeleted, true);
      assert.equal(res.data.data.retractedById, SUPER_ADMIN_ID.toString());
    });
  });
});
