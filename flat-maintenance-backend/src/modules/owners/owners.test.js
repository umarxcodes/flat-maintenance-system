// =====================  IMPORTS  ==========================
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Owner } from "./owners.model.js";
import { Flat } from "../../models/flat.model.js";
import { Floor } from "../../models/floor.model.js";
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

const BLOCK_A_ID = new mongoose.Types.ObjectId().toString();
const BLOCK_B_ID = new mongoose.Types.ObjectId().toString();

const FLOOR_A_ID = new mongoose.Types.ObjectId().toString();
const FLOOR_B_ID = new mongoose.Types.ObjectId().toString();

const FLAT_A1_ID = new mongoose.Types.ObjectId().toString();
const FLAT_A2_ID = new mongoose.Types.ObjectId().toString();
const FLAT_B1_ID = new mongoose.Types.ObjectId().toString();
const FLAT_DELETED_ID = new mongoose.Types.ObjectId().toString();

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

// =====================  OWNERS MODULE TEST SUITE  ===========
describe("Owners Domain Module (Module 9)", () => {
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
      email: { $regex: /@(owner-test\.local|owners-test\.local)$/ },
    });
    await Building.deleteMany({
      code: { $regex: /^TEST-OWN-(BLD-A|BLD-B|BLD-DEL)/ },
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

    // 1. Seed Buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Emerald Heights A",
        code: "TEST-OWN-BLD-A",
        address: {
          street: "123 Emerald Way",
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
        name: "Sapphire Towers B",
        code: "TEST-OWN-BLD-B",
        address: {
          street: "456 Sapphire Ave",
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
        name: "Deleted Complex",
        code: "TEST-OWN-BLD-DEL",
        address: {
          street: "789 Ghost Rd",
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
        name: "Tower Alpha",
        totalFloors: 10,
        isDeleted: false,
      },
      {
        _id: BLOCK_B_ID,
        buildingId: BUILDING_B_ID,
        name: "Tower Beta",
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

    // 4. Seed Flats
    await Flat.create([
      {
        _id: FLAT_A1_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "101",
        areaSqFt: 1200,
        flatType: "2BHK",
        status: "VACANT",
        isDeleted: false,
      },
      {
        _id: FLAT_A2_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "102",
        areaSqFt: 1500,
        flatType: "3BHK",
        status: "VACANT",
        isDeleted: false,
      },
      {
        _id: FLAT_B1_ID,
        buildingId: BUILDING_B_ID,
        blockId: BLOCK_B_ID,
        floorId: FLOOR_B_ID,
        flatNumber: "201",
        areaSqFt: 1100,
        flatType: "2BHK",
        status: "VACANT",
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
        status: "INACTIVE",
        isDeleted: true,
      },
    ]);

    // 5. Seed Principals (Users)
    await User.create([
      {
        _id: TEST_SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: "superadmin.owners@owner-test.local",
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
        email: "bldadmin.owners@owner-test.local",
        password: "Password123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
        isDeleted: false,
      },
      {
        _id: TEST_TENANT_ID,
        firstName: "Regular",
        lastName: "Tenant",
        email: "tenant.owners@owner-test.local",
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
        email: "unassigned.owners@owner-test.local",
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
      email: "superadmin.owners@owner-test.local",
      role: ROLES.SUPER_ADMIN,
    });

    buildingAdminToken = generateAccessToken({
      sub: TEST_BUILDING_ADMIN_ID,
      email: "bldadmin.owners@owner-test.local",
      role: ROLES.BUILDING_ADMIN,
    });

    tenantToken = generateAccessToken({
      sub: TEST_TENANT_ID,
      email: "tenant.owners@owner-test.local",
      role: ROLES.TENANT,
    });

    unassignedToken = generateAccessToken({
      sub: TEST_UNASSIGNED_USER_ID,
      email: "unassigned.owners@owner-test.local",
      role: ROLES.BUILDING_ADMIN,
    });
  });

  after(async () => {
    // Cleanup collections
    await User.deleteMany({
      email: { $regex: /@(owner-test\.local|owners-test\.local)$/ },
    });
    await Building.deleteMany({
      code: { $regex: /^TEST-OWN-(BLD-A|BLD-B|BLD-DEL)/ },
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

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // =========================================================
  // 1. Owner Database Model Invariants
  // =========================================================
  describe("1. Owner Database Model Invariants", () => {
    it("Enforces parent userId requirement", async () => {
      const owner = new Owner({
        buildingId: new mongoose.Types.ObjectId(),
      });

      await assert.rejects(
        async () => await owner.validate(),
        (err) => {
          assert.strictEqual(err.name, "ValidationError");
          assert.ok(err.errors.userId);
          return true;
        }
      );
    });

    it("Enforces parent buildingId requirement", async () => {
      const owner = new Owner({
        userId: new mongoose.Types.ObjectId(),
      });

      await assert.rejects(
        async () => await owner.validate(),
        (err) => {
          assert.strictEqual(err.name, "ValidationError");
          assert.ok(err.errors.buildingId);
          return true;
        }
      );
    });

    it("Defaults isResidingInBuilding to false and isDeleted to false", async () => {
      const owner = new Owner({
        userId: new mongoose.Types.ObjectId(),
        buildingId: new mongoose.Types.ObjectId(),
      });

      assert.strictEqual(owner.isResidingInBuilding, false);
      assert.strictEqual(owner.isDeleted, false);
      assert.strictEqual(owner.deletedAt, null);
    });

    it("Rejects invalid idProofType enum value", async () => {
      const owner = new Owner({
        userId: new mongoose.Types.ObjectId(),
        buildingId: new mongoose.Types.ObjectId(),
        idProofType: "VOTER_ID", // Invalid enum
      });

      await assert.rejects(
        async () => await owner.validate(),
        (err) => {
          assert.strictEqual(err.name, "ValidationError");
          assert.ok(err.errors.idProofType);
          return true;
        }
      );
    });

    it("Accepts valid idProofType enum values (PASSPORT, NATIONAL_ID, DRIVING_LICENSE)", async () => {
      for (const proofType of ["PASSPORT", "NATIONAL_ID", "DRIVING_LICENSE"]) {
        const owner = new Owner({
          userId: new mongoose.Types.ObjectId(),
          buildingId: new mongoose.Types.ObjectId(),
          idProofType: proofType,
        });

        await owner.validate();
        assert.strictEqual(owner.idProofType, proofType);
      }
    });

    it("toSafeOwner() formats fields properly and excludes __v, isDeleted, and deletedAt", async () => {
      const owner = new Owner({
        userId: new mongoose.Types.ObjectId(),
        buildingId: new mongoose.Types.ObjectId(),
        isResidingInBuilding: true,
        isDeleted: false,
      });

      const safe = owner.toSafeOwner();
      assert.strictEqual(safe.__v, undefined);
      assert.strictEqual(safe.isDeleted, undefined);
      assert.strictEqual(safe.deletedAt, undefined);
      assert.strictEqual(safe.isResidingInBuilding, true);
    });

    it("Unique Index: Prevents duplicate Owner profiles for the same User", async () => {
      const sharedUserId = new mongoose.Types.ObjectId();
      const buildingId = new mongoose.Types.ObjectId();

      await Owner.create({
        userId: sharedUserId,
        buildingId,
      });

      // Attempting second owner document with same userId should throw E11000
      await assert.rejects(
        async () => {
          await Owner.create({
            userId: sharedUserId,
            buildingId,
          });
        },
        (err) => {
          assert.strictEqual(err.code, 11000);
          return true;
        }
      );

      // Clean up
      await Owner.deleteOne({ userId: sharedUserId });
    });
  });

  // =========================================================
  // 2. POST /api/v1/owners (Provisioning, Hierarchy & Scope)
  // =========================================================
  describe("2. POST /api/v1/owners (Provisioning, Hierarchy & Scope)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_A_ID,
        },
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("Rejects unauthorized roles (e.g. Tenant without OWNER_MANAGE) with 403 Forbidden", async () => {
      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantToken}` },
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_A_ID,
        },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
    });

    it("IDOR Guard: BuildingAdmin cannot create an owner in an unassigned building (403)", async () => {
      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_B_ID, // Assigned only to Building A
        },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /forbidden/i);
    });

    it("BuildingAdmin with empty assignedBuildingIds cannot create owners (403 Forbidden)", async () => {
      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${unassignedToken}` },
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_A_ID,
        },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
    });

    it("Rejects creation referencing a non-existent User with 404 Not Found", async () => {
      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: new mongoose.Types.ObjectId().toString(),
          buildingId: BUILDING_A_ID,
        },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /user.*not found/i);
    });

    it("Rejects creation referencing a soft-deleted User with 404 Not Found", async () => {
      const deletedUser = await User.create({
        firstName: "Deleted",
        lastName: "User",
        email: "deleted.user@owner-test.local",
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
        isDeleted: true,
      });

      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: deletedUser._id.toString(),
          buildingId: BUILDING_A_ID,
        },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
    });

    it("Rejects creation referencing a non-existent Building with 404 Not Found", async () => {
      const targetUser = await User.create({
        firstName: "Valid",
        lastName: "User",
        email: "valid.target.1@owner-test.local",
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const nonExistentBuildingId = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          userId: targetUser._id.toString(),
          buildingId: nonExistentBuildingId,
        },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /building.*not found/i);
    });

    it("Rejects creation referencing a non-existent Flat with 404 Not Found", async () => {
      const targetUser = await User.create({
        firstName: "Valid",
        lastName: "User",
        email: "valid.target.2@owner-test.local",
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const nonExistentFlatId = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: targetUser._id.toString(),
          buildingId: BUILDING_A_ID,
          flatsOwned: [nonExistentFlatId],
        },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /referenced flats not found/i);
    });

    it("Rejects creation referencing a soft-deleted Flat with 404 Not Found", async () => {
      const targetUser = await User.create({
        firstName: "Valid",
        lastName: "User",
        email: "valid.target.3@owner-test.local",
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: targetUser._id.toString(),
          buildingId: BUILDING_A_ID,
          flatsOwned: [FLAT_DELETED_ID],
        },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /referenced flats not found/i);
    });

    it("Hierarchy Invariant: Rejects request if linked Flat belongs to a different building (400)", async () => {
      const targetUser = await User.create({
        firstName: "Valid",
        lastName: "User",
        email: "valid.target.4@owner-test.local",
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      // Attempt to link FLAT_B1_ID (Building B) to an owner registered in BUILDING_A_ID
      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          userId: targetUser._id.toString(),
          buildingId: BUILDING_A_ID,
          flatsOwned: [FLAT_B1_ID],
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /hierarchy violation/i);
    });

    it("Rejects invalid external non-Cloudinary URL in idProofUrl with 400 Bad Request", async () => {
      const targetUser = await User.create({
        firstName: "Valid",
        lastName: "User",
        email: "valid.target.5@owner-test.local",
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: targetUser._id.toString(),
          buildingId: BUILDING_A_ID,
          idProofType: "PASSPORT",
          idProofUrl: "https://attacker.example.com/fake-passport.pdf",
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /validation failed/i);
    });

    it("Allows BuildingAdmin to register owner with authentic Cloudinary URL and flat linkage", async () => {
      const targetUser = await User.create({
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice.johnson@owner-test.local",
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: targetUser._id.toString(),
          buildingId: BUILDING_A_ID,
          flatsOwned: [FLAT_A1_ID],
          emergencyContact: {
            name: "Bob Johnson",
            relationship: "Brother",
            phone: "+12025550143",
          },
          idProofType: "PASSPORT",
          idProofUrl:
            "https://res.cloudinary.com/society-cloud/image/upload/v1600000000/flat-maintenance/id-proofs/passport-alice.jpg",
          isResidingInBuilding: true,
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.userId._id, targetUser._id.toString());
      assert.strictEqual(res.data.data.buildingId, BUILDING_A_ID);
      assert.strictEqual(res.data.data.flatsOwned.length, 1);
      assert.strictEqual(res.data.data.flatsOwned[0].flatNumber, "101");
      assert.strictEqual(res.data.data.isResidingInBuilding, true);

      // Verify Flat.currentOwnerId synchronization
      const updatedFlat = await Flat.findById(FLAT_A1_ID);
      assert.strictEqual(
        updatedFlat.currentOwnerId.toString(),
        res.data.data._id
      );

      // Verify User.assignedBuildingIds synchronization
      const updatedUser = await User.findById(targetUser._id);
      assert.ok(
        updatedUser.assignedBuildingIds.some(
          (id) => id.toString() === BUILDING_A_ID
        )
      );
    });

    it("Usurpation Guard: Rejects creation when flat is already owned by another active owner (409)", async () => {
      const secondUser = await User.create({
        firstName: "Charlie",
        lastName: "Brown",
        email: "charlie.brown@owner-test.local",
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      // FLAT_A1_ID was already claimed by Alice in the previous test
      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: secondUser._id.toString(),
          buildingId: BUILDING_A_ID,
          flatsOwned: [FLAT_A1_ID],
        },
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /already owned/i);
    });

    it("Duplicate Active Owner Guard: Rejects registering a second profile for the same user (409)", async () => {
      const existingOwner = await Owner.findOne({
        buildingId: BUILDING_A_ID,
        isDeleted: false,
      });

      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: existingOwner.userId.toString(),
          buildingId: BUILDING_A_ID,
        },
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /active owner profile already exists/i);
    });

    it("Allows SuperAdmin to register owner in any building (global scope)", async () => {
      const superTargetUser = await User.create({
        firstName: "Diana",
        lastName: "Prince",
        email: "diana.prince@owner-test.local",
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          userId: superTargetUser._id.toString(),
          buildingId: BUILDING_B_ID,
          flatsOwned: [FLAT_B1_ID],
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.buildingId, BUILDING_B_ID);
      assert.strictEqual(res.data.data.flatsOwned.length, 1);
      assert.strictEqual(res.data.data.flatsOwned[0].flatNumber, "201");
    });

    it("Mass-Assignment Guard: Rejects client attempts to inject internal fields (_id, isDeleted)", async () => {
      const user = await User.create({
        firstName: "Eve",
        lastName: "Hacker",
        email: "eve.hacker@owner-test.local",
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const res = await apiRequest("/api/v1/owners", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          userId: user._id.toString(),
          buildingId: BUILDING_A_ID,
          isDeleted: true,
          _id: new mongoose.Types.ObjectId().toString(),
          role: "SUPER_ADMIN",
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /validation failed/i);
    });
  });

  // =========================================================
  // 3. GET /api/v1/owners (Listing & Multi-Tenant Scope)
  // =========================================================
  describe("3. GET /api/v1/owners (Listing & Multi-Tenant Scope)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/owners");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("IDOR Guard: BuildingAdmin querying owners of an unassigned building is rejected with 403", async () => {
      const res = await apiRequest(
        `/api/v1/owners?buildingId=${BUILDING_B_ID}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /forbidden/i);
    });

    it("IDOR Guard: BuildingAdmin querying owners of a flat in an unassigned building is rejected with 403", async () => {
      const res = await apiRequest(`/api/v1/owners?flatId=${FLAT_B1_ID}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /forbidden/i);
    });

    it("BuildingAdmin with empty assignedBuildingIds receives empty results (200 OK)", async () => {
      const res = await apiRequest("/api/v1/owners", {
        headers: { Authorization: `Bearer ${unassignedToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.items.length, 0);
      assert.strictEqual(res.data.data.total, 0);
    });

    it("Allows BuildingAdmin to list owners for their assigned building complex", async () => {
      const res = await apiRequest(
        `/api/v1/owners?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(Array.isArray(res.data.data.items));
      assert.ok(res.data.data.items.length >= 1);
      assert.strictEqual(res.data.data.items[0].buildingId, BUILDING_A_ID);
    });

    it("Allows SuperAdmin to list all owners globally across complexes", async () => {
      const res = await apiRequest("/api/v1/owners", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.items.length >= 2);
    });

    it("Supports filtering owners by flatId", async () => {
      const res = await apiRequest(`/api/v1/owners?flatId=${FLAT_A1_ID}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.items.length, 1);
      assert.strictEqual(
        res.data.data.items[0].flatsOwned[0].flatNumber,
        "101"
      );
    });

    it("Supports filtering owners by isResidingInBuilding", async () => {
      const res = await apiRequest(
        `/api/v1/owners?isResidingInBuilding=true&buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      for (const item of res.data.data.items) {
        assert.strictEqual(item.isResidingInBuilding, true);
      }
    });

    it("Excludes soft-deleted owners from registry results", async () => {
      const dummyUser = await User.create({
        firstName: "Ghost",
        lastName: "Owner",
        email: "ghost.owner@owner-test.local",
        password: "Password123!",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      const deletedOwner = await Owner.create({
        userId: dummyUser._id,
        buildingId: BUILDING_A_ID,
        isDeleted: true,
        deletedAt: new Date(),
      });

      const res = await apiRequest(
        `/api/v1/owners?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 200);
      const found = res.data.data.items.some(
        (o) => o._id === deletedOwner._id.toString()
      );
      assert.strictEqual(found, false);
    });
  });

  // =========================================================
  // 4. GET /api/v1/owners/:id (Details & Portfolio)
  // =========================================================
  describe("4. GET /api/v1/owners/:id (Details & Portfolio)", () => {
    it("Rejects unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest(
        `/api/v1/owners/${new mongoose.Types.ObjectId().toString()}`
      );
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("Rejects malformed ObjectId with 400 Bad Request", async () => {
      const res = await apiRequest("/api/v1/owners/not-a-valid-hex-id", {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });

    it("Returns 404 Not Found for non-existent Owner ID", async () => {
      const res = await apiRequest(
        `/api/v1/owners/${new mongoose.Types.ObjectId().toString()}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
    });

    it("IDOR Guard: BuildingAdmin querying an owner of an unassigned building is rejected with 403", async () => {
      // Find owner in Building B
      const ownerB = await Owner.findOne({
        buildingId: BUILDING_B_ID,
        isDeleted: false,
      });

      const res = await apiRequest(`/api/v1/owners/${ownerB._id.toString()}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /forbidden/i);
    });

    it("Allows BuildingAdmin to retrieve owner details and property portfolio in assigned building", async () => {
      const ownerA = await Owner.findOne({
        buildingId: BUILDING_A_ID,
        isDeleted: false,
      });

      const res = await apiRequest(`/api/v1/owners/${ownerA._id.toString()}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data._id, ownerA._id.toString());
      assert.ok(res.data.data.userId);
      assert.ok(res.data.data.userId.firstName);
      assert.ok(Array.isArray(res.data.data.flatsOwned));
      assert.strictEqual(res.data.data.flatsOwned[0].flatNumber, "101");
    });

    it("Sensitive Data Protection: Never leaks User password or tokens in response", async () => {
      const ownerA = await Owner.findOne({
        buildingId: BUILDING_A_ID,
        isDeleted: false,
      });

      const res = await apiRequest(`/api/v1/owners/${ownerA._id.toString()}`, {
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.userId.password, undefined);
      assert.strictEqual(res.data.data.userId.refreshTokens, undefined);
      assert.strictEqual(res.data.data.userId.invitationTokenHash, undefined);
      assert.strictEqual(
        res.data.data.userId.passwordResetTokenHash,
        undefined
      );
    });

    it("Allows SuperAdmin to retrieve any owner profile globally", async () => {
      const ownerB = await Owner.findOne({
        buildingId: BUILDING_B_ID,
        isDeleted: false,
      });

      const res = await apiRequest(`/api/v1/owners/${ownerB._id.toString()}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data._id, ownerB._id.toString());
    });
  });
});
