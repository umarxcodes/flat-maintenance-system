// =====================  IMPORTS & TEST RUNNER  =============
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Visitor } from "./visitors.model.js";
import {
  VISITOR_TYPES,
  VISITOR_STATUS,
  VISITOR_CONSTRAINTS,
} from "./visitors.constants.js";
import { Building } from "../../models/building.model.js";
import { Flat } from "../../models/flat.model.js";
import { User } from "../../models/user.model.js";
import { Owner } from "../owners/owners.model.js";
import { Tenant } from "../tenants/tenants.model.js";
import { Notification } from "../notifications/notifications.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { generateAccessToken } from "../../utils/token.util.js";
import { rolesService } from "../roles/roles.service.js";
import {
  generateSecurePassCode,
  generateSignedQrToken,
} from "./visitors.service.js";

// =====================  TEST SETUP & FIXTURES  =============
dotenv.config();

let server;
let baseUrl;

// Fixture ObjectIds
const BUILDING_A_ID = new mongoose.Types.ObjectId();
const BUILDING_B_ID = new mongoose.Types.ObjectId();

const FLAT_A_101_ID = new mongoose.Types.ObjectId();
const FLAT_A_102_ID = new mongoose.Types.ObjectId();
const FLAT_B_201_ID = new mongoose.Types.ObjectId();

const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const OWNER_A_ID = new mongoose.Types.ObjectId();
const TENANT_A_ID = new mongoose.Types.ObjectId();
const UNRELATED_RESIDENT_ID = new mongoose.Types.ObjectId();
const GUARD_A_ID = new mongoose.Types.ObjectId();
const GUARD_B_ID = new mongoose.Types.ObjectId();
const ACCOUNTANT_A_ID = new mongoose.Types.ObjectId();

// JWT Tokens
let superAdminToken;
let ownerAToken;
let tenantAToken;
let unrelatedResidentToken;
let guardAToken;
let guardBToken;
let accountantAToken;

/**
 * Helper to execute HTTP requests against the test server.
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
describe("Module 21: Visitors & Digital Gate Passes (visitors)", () => {
  before(async () => {
    process.env.NODE_ENV = "test";
    await connectDB();
    await rolesService.seedSystemRoles();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Clean up collections
    await Promise.all([
      Visitor.deleteMany({}),
      Building.deleteMany({}),
      Flat.deleteMany({}),
      User.deleteMany({}),
      Owner.deleteMany({}),
      Tenant.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // Seed test buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Emerald Heights Tower A",
        code: `EHTA-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Security Gate Way",
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
        code: `EHTB-${Date.now().toString().slice(-4)}`,
        address: {
          street: "200 Guard Post Road",
          city: "Metropolis",
          state: "NY",
          postalCode: "10001",
          country: "USA",
        },
        status: "ACTIVE",
        isDeleted: false,
      },
    ]);

    // Seed test flats
    await Flat.create([
      {
        _id: FLAT_A_101_ID,
        buildingId: BUILDING_A_ID,
        blockId: new mongoose.Types.ObjectId(),
        floorId: new mongoose.Types.ObjectId(),
        flatNumber: "A-101",
        floorNumber: 1,
        areaSqFt: 1200,
        flatType: "3BHK",
        status: "OCCUPIED",
        isDeleted: false,
      },
      {
        _id: FLAT_A_102_ID,
        buildingId: BUILDING_A_ID,
        blockId: new mongoose.Types.ObjectId(),
        floorId: new mongoose.Types.ObjectId(),
        flatNumber: "A-102",
        floorNumber: 1,
        areaSqFt: 950,
        flatType: "2BHK",
        status: "OCCUPIED",
        isDeleted: false,
      },
      {
        _id: FLAT_B_201_ID,
        buildingId: BUILDING_B_ID,
        blockId: new mongoose.Types.ObjectId(),
        floorId: new mongoose.Types.ObjectId(),
        flatNumber: "B-201",
        floorNumber: 2,
        areaSqFt: 1100,
        flatType: "3BHK",
        status: "OCCUPIED",
        isDeleted: false,
      },
    ]);

    // Seed test users
    await User.create([
      {
        _id: SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: "super.visitors@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: OWNER_A_ID,
        firstName: "Oliver",
        lastName: "Owner",
        email: "owner.a.visitors@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: TENANT_A_ID,
        firstName: "Tina",
        lastName: "Tenant",
        email: "tenant.a.visitors@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: UNRELATED_RESIDENT_ID,
        firstName: "Unrelated",
        lastName: "User",
        email: "unrelated.visitors@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: GUARD_A_ID,
        firstName: "Gary",
        lastName: "GuardA",
        email: "guard.a.visitors@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SECURITY_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: GUARD_B_ID,
        firstName: "George",
        lastName: "GuardB",
        email: "guard.b.visitors@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SECURITY_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: ACCOUNTANT_A_ID,
        firstName: "Arthur",
        lastName: "Accountant",
        email: "acct.a.visitors@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.ACCOUNTANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
    ]);

    // Seed Owner profile
    await Owner.create({
      userId: OWNER_A_ID,
      buildingId: BUILDING_A_ID,
      flatsOwned: [FLAT_A_101_ID],
      isPrimaryResident: true,
      ownershipType: "INDIVIDUAL",
      isDeleted: false,
    });

    // Seed Tenant profile
    await Tenant.create({
      userId: TENANT_A_ID,
      buildingId: BUILDING_A_ID,
      flatId: FLAT_A_102_ID,
      ownerId: OWNER_A_ID,
      rentAmount: 1500,
      leaseStartDate: new Date("2026-01-01"),
      leaseEndDate: new Date("2027-01-01"),
      status: "ACTIVE",
      isDeleted: false,
      emergencyContact: {
        name: "Emergency Contact",
        relationship: "Family",
        phone: "+1234567890",
      },
    });

    // Generate JWT access tokens
    superAdminToken = generateAccessToken({
      sub: SUPER_ADMIN_ID.toString(),
      role: ROLES.SUPER_ADMIN,
    });

    ownerAToken = generateAccessToken({
      sub: OWNER_A_ID.toString(),
      role: ROLES.OWNER,
      buildingIds: [BUILDING_A_ID.toString()],
    });

    tenantAToken = generateAccessToken({
      sub: TENANT_A_ID.toString(),
      role: ROLES.TENANT,
      buildingIds: [BUILDING_A_ID.toString()],
    });

    unrelatedResidentToken = generateAccessToken({
      sub: UNRELATED_RESIDENT_ID.toString(),
      role: ROLES.TENANT,
      buildingIds: [BUILDING_B_ID.toString()],
    });

    guardAToken = generateAccessToken({
      sub: GUARD_A_ID.toString(),
      role: ROLES.SECURITY_STAFF,
      buildingIds: [BUILDING_A_ID.toString()],
    });

    guardBToken = generateAccessToken({
      sub: GUARD_B_ID.toString(),
      role: ROLES.SECURITY_STAFF,
      buildingIds: [BUILDING_B_ID.toString()],
    });

    accountantAToken = generateAccessToken({
      sub: ACCOUNTANT_A_ID.toString(),
      role: ROLES.ACCOUNTANT,
      buildingIds: [BUILDING_A_ID.toString()],
    });
  });

  after(async () => {
    await Promise.all([
      Visitor.deleteMany({}),
      Building.deleteMany({}),
      Flat.deleteMany({}),
      User.deleteMany({}),
      Owner.deleteMany({}),
      Tenant.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(async () => {
    await Visitor.deleteMany({});
    await Notification.deleteMany({});
  });

  // =====================  DATABASE MODEL & SCHEMA  ===========
  describe("Database Model & Cryptographic Generators", () => {
    it("should generate cryptographically strong 6-digit passCodes with leading zeroes preserved", () => {
      assert.equal(VISITOR_CONSTRAINTS.PASSCODE_LENGTH, 6);
      for (let i = 0; i < 50; i += 1) {
        const code = generateSecurePassCode();
        assert.equal(typeof code, "string");
        assert.equal(code.length, VISITOR_CONSTRAINTS.PASSCODE_LENGTH);
        assert.match(code, /^\d{6}$/);
      }
    });

    it("should generate signed HMAC-SHA256 QR tokens that cannot be forged", () => {
      const passCode = "004281";
      const date = new Date("2026-09-15T10:00:00.000Z");
      const token = generateSignedQrToken(
        passCode,
        FLAT_A_101_ID.toString(),
        OWNER_A_ID.toString(),
        date
      );

      assert.equal(typeof token, "string");
      assert.ok(token.includes("."));
      const [payloadEncoded, signature] = token.split(".");
      assert.ok(payloadEncoded && signature);
      assert.equal(signature.length, 64); // SHA256 hex string length
    });

    it("should enforce uniqueness constraint on passCode at schema level", async () => {
      const passCode = "123456";
      const payload = {
        passCode,
        qrToken: "test.token",
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        hostUserId: OWNER_A_ID,
        visitorName: "Visitor Unique",
        visitorType: VISITOR_TYPES.GUEST,
        expectedArrivalDate: new Date(),
      };

      await Visitor.create(payload);

      await assert.rejects(async () => {
        await Visitor.create({
          ...payload,
          visitorName: "Visitor Duplicate",
        });
      }, /duplicate key/i);
    });

    it("should reject invalid visitorType enum in Mongoose model", async () => {
      await assert.rejects(async () => {
        await Visitor.create({
          passCode: "999999",
          qrToken: "test.token",
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A_101_ID,
          hostUserId: OWNER_A_ID,
          visitorName: "Invalid Type Visitor",
          visitorType: "CONTRACTOR", // Invalid enum
          expectedArrivalDate: new Date(),
        });
      }, /Invalid visitor classification type/i);
    });

    it("should evaluate expiration status correctly via isExpired instance method", () => {
      const activePass = new Visitor({
        expectedArrivalDate: new Date(Date.now() + 3600000), // +1 hour in future
        status: VISITOR_STATUS.EXPECTED,
      });
      assert.equal(activePass.isExpired(), false);

      const expiredPass = new Visitor({
        expectedArrivalDate: new Date(Date.now() - 25 * 3600000), // 25 hours ago
        status: VISITOR_STATUS.EXPECTED,
      });
      assert.equal(expiredPass.isExpired(), true);

      const checkedInOldPass = new Visitor({
        expectedArrivalDate: new Date(Date.now() - 25 * 3600000),
        status: VISITOR_STATUS.CHECKED_IN,
      });
      // CHECKED_IN cannot expire
      assert.equal(checkedInOldPass.isExpired(), false);
    });
  });

  // =====================  PASS GENERATION (POST /visitors)  ===
  describe("POST /api/v1/visitors — Pre-generate Digital Visitor Pass", () => {
    it("Owner creates digital visitor pass for owned flat (201 Created)", async () => {
      const res = await apiRequest("/api/v1/visitors", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          flatId: FLAT_A_101_ID.toString(),
          visitorName: "John Guest",
          visitorPhone: "+15551234567",
          vehicleNumber: "ny-abc-1234",
          visitorType: VISITOR_TYPES.GUEST,
          visitorCount: 2,
          expectedArrivalDate: new Date(Date.now() + 86400000).toISOString(),
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.visitorName, "John Guest");
      assert.equal(res.data.data.vehicleNumber, "NY-ABC-1234");
      assert.equal(res.data.data.visitorCount, 2);
      assert.equal(res.data.data.status, VISITOR_STATUS.EXPECTED);
      assert.match(res.data.data.passCode, /^\d{6}$/);
      assert.ok(res.data.data.qrToken);
      assert.equal(res.data.data.buildingId, BUILDING_A_ID.toString());
      assert.equal(res.data.data.hostUserId, OWNER_A_ID.toString());
    });

    it("Tenant creates digital visitor pass for active leased flat (201 Created)", async () => {
      const res = await apiRequest("/api/v1/visitors", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantAToken}` },
        body: {
          flatId: FLAT_A_102_ID.toString(),
          visitorName: "Amazon Delivery Courier",
          visitorType: VISITOR_TYPES.DELIVERY,
          expectedArrivalDate: new Date().toISOString(),
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.visitorName, "Amazon Delivery Courier");
      assert.equal(res.data.data.visitorCount, 1); // Default count
      assert.equal(res.data.data.status, VISITOR_STATUS.EXPECTED);
      assert.equal(res.data.data.hostUserId, TENANT_A_ID.toString());
    });

    it("Resident attempting to create pass for another resident's flat is forbidden (403)", async () => {
      const res = await apiRequest("/api/v1/visitors", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          flatId: FLAT_A_102_ID.toString(), // Owner A does not own flat 102
          visitorName: "Unauthorized Pass",
          visitorType: VISITOR_TYPES.CAB,
          expectedArrivalDate: new Date().toISOString(),
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /do not own flat/i);
    });

    it("Resident from another building is forbidden from generating passes (403)", async () => {
      const res = await apiRequest("/api/v1/visitors", {
        method: "POST",
        headers: { Authorization: `Bearer ${unrelatedResidentToken}` },
        body: {
          flatId: FLAT_A_101_ID.toString(),
          visitorName: "Cross Building Visitor",
          visitorType: VISITOR_TYPES.OTHER,
          expectedArrivalDate: new Date().toISOString(),
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it("Rejects unauthenticated requests (401 Unauthorized)", async () => {
      const res = await apiRequest("/api/v1/visitors", {
        method: "POST",
        body: {
          flatId: FLAT_A_101_ID.toString(),
          visitorName: "Anonymous",
          visitorType: VISITOR_TYPES.GUEST,
          expectedArrivalDate: new Date().toISOString(),
        },
      });

      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    it("Rejects non-resident roles without VISITOR_PASS_GENERATE (403 Forbidden)", async () => {
      const res = await apiRequest("/api/v1/visitors", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          flatId: FLAT_A_101_ID.toString(),
          visitorName: "Accountant Visitor",
          visitorType: VISITOR_TYPES.GUEST,
          expectedArrivalDate: new Date().toISOString(),
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it("Rejects payload containing client-spoofed server-authoritative fields (Strict Zod 400)", async () => {
      const res = await apiRequest("/api/v1/visitors", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          flatId: FLAT_A_101_ID.toString(),
          visitorName: "Hacker Attempt",
          visitorType: VISITOR_TYPES.GUEST,
          expectedArrivalDate: new Date().toISOString(),
          passCode: "999999", // Client spoof attempt
          status: "CHECKED_IN", // Client spoof attempt
          hostUserId: SUPER_ADMIN_ID.toString(), // Client spoof attempt
        },
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    it("Validates visitor count boundary constraints (min: 1, max: 50)", async () => {
      const resZero = await apiRequest("/api/v1/visitors", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          flatId: FLAT_A_101_ID.toString(),
          visitorName: "Invalid Count",
          visitorType: VISITOR_TYPES.GUEST,
          visitorCount: 0,
          expectedArrivalDate: new Date().toISOString(),
        },
      });
      assert.equal(resZero.status, 400);

      const resExcessive = await apiRequest("/api/v1/visitors", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          flatId: FLAT_A_101_ID.toString(),
          visitorName: "Crowd Pass",
          visitorType: VISITOR_TYPES.GUEST,
          visitorCount: 99999,
          expectedArrivalDate: new Date().toISOString(),
        },
      });
      assert.equal(resExcessive.status, 400);
    });
  });

  // =====================  GATE VERIFICATION (GET /verify/:passCode)
  describe("GET /api/v1/visitors/verify/:passCode — Gate Verification", () => {
    let testPassCode;
    let testVisitorId;

    beforeEach(async () => {
      const pass = await Visitor.create({
        passCode: "112233",
        qrToken: "test.qr.token",
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        hostUserId: OWNER_A_ID,
        visitorName: "Verified Guest",
        visitorType: VISITOR_TYPES.GUEST,
        expectedArrivalDate: new Date(Date.now() + 3600000), // In 1 hour
        status: VISITOR_STATUS.EXPECTED,
      });
      testPassCode = pass.passCode;
      testVisitorId = pass._id;
    });

    it("Authorized gate security staff validates an EXPECTED pass (200 OK)", async () => {
      const res = await apiRequest(`/api/v1/visitors/verify/${testPassCode}`, {
        headers: { Authorization: `Bearer ${guardAToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.valid, true);
      assert.equal(res.data.data.visitor.visitorName, "Verified Guest");
      assert.equal(res.data.data.visitor.status, VISITOR_STATUS.EXPECTED);
      assert.ok(res.data.data.visitor.flat);
      assert.ok(res.data.data.visitor.host);
    });

    it("Super Admin bypasses building scope check during verification (200 OK)", async () => {
      const res = await apiRequest(`/api/v1/visitors/verify/${testPassCode}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.valid, true);
    });

    it("Gate verification does NOT mutate visitor status or set entry timestamp (Read-Only)", async () => {
      await apiRequest(`/api/v1/visitors/verify/${testPassCode}`, {
        headers: { Authorization: `Bearer ${guardAToken}` },
      });

      const inDb = await Visitor.findById(testVisitorId);
      assert.equal(inDb.status, VISITOR_STATUS.EXPECTED);
      assert.equal(inDb.entryTimestamp, null);
      assert.equal(inDb.verifiedByStaffId, null);
    });

    it("Guard from Building B is forbidden from verifying Building A pass (403 Forbidden)", async () => {
      const res = await apiRequest(`/api/v1/visitors/verify/${testPassCode}`, {
        headers: { Authorization: `Bearer ${guardBToken}` },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /not assigned to security duties/i);
    });

    it("Non-security roles cannot verify gate passes (403 Forbidden)", async () => {
      const res = await apiRequest(`/api/v1/visitors/verify/${testPassCode}`, {
        headers: { Authorization: `Bearer ${tenantAToken}` },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    it("Unknown pass code returns 404 Not Found", async () => {
      const res = await apiRequest("/api/v1/visitors/verify/999999", {
        headers: { Authorization: `Bearer ${guardAToken}` },
      });

      assert.equal(res.status, 404);
      assert.equal(res.data.success, false);
    });

    it("Invalid passCode format (alphanumeric, too short) rejected by Zod (400 Bad Request)", async () => {
      const resShort = await apiRequest("/api/v1/visitors/verify/123", {
        headers: { Authorization: `Bearer ${guardAToken}` },
      });
      assert.equal(resShort.status, 400);

      const resAlpha = await apiRequest("/api/v1/visitors/verify/abcdef", {
        headers: { Authorization: `Bearer ${guardAToken}` },
      });
      assert.equal(resAlpha.status, 400);
    });

    it("Evaluates 24-hour expiration on verification and transitions pass to EXPIRED", async () => {
      const expiredPass = await Visitor.create({
        passCode: "445566",
        qrToken: "expired.qr.token",
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        hostUserId: OWNER_A_ID,
        visitorName: "Expired Guest",
        visitorType: VISITOR_TYPES.SERVICE_TECHNICIAN,
        expectedArrivalDate: new Date(Date.now() - 25 * 3600000), // 25 hours ago
        status: VISITOR_STATUS.EXPECTED,
      });

      const res = await apiRequest(
        `/api/v1/visitors/verify/${expiredPass.passCode}`,
        {
          headers: { Authorization: `Bearer ${guardAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.valid, false);
      assert.equal(res.data.data.visitor.status, VISITOR_STATUS.EXPIRED);

      // Verify DB transition
      const inDb = await Visitor.findById(expiredPass._id);
      assert.equal(inDb.status, VISITOR_STATUS.EXPIRED);
    });

    it("Returns valid: false for an already checked-in pass", async () => {
      const checkedInPass = await Visitor.create({
        passCode: "778899",
        qrToken: "checkedin.qr.token",
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        hostUserId: OWNER_A_ID,
        visitorName: "Already In Guest",
        visitorType: VISITOR_TYPES.GUEST,
        expectedArrivalDate: new Date(),
        status: VISITOR_STATUS.CHECKED_IN,
        entryTimestamp: new Date(),
      });

      const res = await apiRequest(
        `/api/v1/visitors/verify/${checkedInPass.passCode}`,
        {
          headers: { Authorization: `Bearer ${guardAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.valid, false);
      assert.equal(res.data.data.visitor.status, VISITOR_STATUS.CHECKED_IN);
    });
  });

  // =====================  CHECK-IN (PATCH /:id/check-in)  ====
  describe("PATCH /api/v1/visitors/:id/check-in — Visitor Gate Arrival", () => {
    let visitorId;

    beforeEach(async () => {
      const pass = await Visitor.create({
        passCode: "334455",
        qrToken: "checkin.test.token",
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        hostUserId: OWNER_A_ID,
        visitorName: "Arriving Guest",
        visitorType: VISITOR_TYPES.GUEST,
        expectedArrivalDate: new Date(),
        status: VISITOR_STATUS.EXPECTED,
      });
      visitorId = pass._id.toString();
    });

    it("Security staff successfully checks in visitor (200 OK)", async () => {
      const res = await apiRequest(`/api/v1/visitors/${visitorId}/check-in`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${guardAToken}` },
        body: {
          vehicleNumber: "MH-12-AB-9999",
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, VISITOR_STATUS.CHECKED_IN);
      assert.equal(res.data.data.vehicleNumber, "MH-12-AB-9999");
      assert.ok(res.data.data.entryTimestamp);
      assert.equal(
        res.data.data.verifiedByStaffId.toString(),
        GUARD_A_ID.toString()
      );

      // Verify resident host received an in-app notification (Module 19 integration)
      const notif = await Notification.findOne({
        recipientUserId: OWNER_A_ID,
        category: "VISITOR",
      });
      assert.ok(notif);
      assert.match(notif.title, /Visitor Arrived/i);
      assert.equal(notif.referenceId.toString(), visitorId);
    });

    it("Rejects check-in attempt for already checked-in visitor (409 Conflict)", async () => {
      // First check-in
      await apiRequest(`/api/v1/visitors/${visitorId}/check-in`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${guardAToken}` },
      });

      // Second duplicate check-in
      const resDuplicate = await apiRequest(
        `/api/v1/visitors/${visitorId}/check-in`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${guardAToken}` },
        }
      );

      assert.equal(resDuplicate.status, 409);
      assert.equal(resDuplicate.data.success, false);
      assert.match(resDuplicate.data.message, /already been checked in/i);
    });

    it("Security guard from different building cannot check in visitor (403 Forbidden)", async () => {
      const res = await apiRequest(`/api/v1/visitors/${visitorId}/check-in`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${guardBToken}` },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);

      // Verify visitor remains EXPECTED
      const inDb = await Visitor.findById(visitorId);
      assert.equal(inDb.status, VISITOR_STATUS.EXPECTED);
    });

    it("Cannot check in an expired pass (400 Bad Request)", async () => {
      const expiredPass = await Visitor.create({
        passCode: "991122",
        qrToken: "expired.checkin.token",
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        hostUserId: OWNER_A_ID,
        visitorName: "Late Guest",
        visitorType: VISITOR_TYPES.GUEST,
        expectedArrivalDate: new Date(Date.now() - 30 * 3600000), // 30 hours ago
        status: VISITOR_STATUS.EXPECTED,
      });

      const res = await apiRequest(
        `/api/v1/visitors/${expiredPass._id}/check-in`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${guardAToken}` },
        }
      );

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /expired/i);
    });

    it("Rejects client-spoofed entryTimestamp or verifiedByStaffId (Server-Authoritative)", async () => {
      const fakePastDate = new Date("2020-01-01T00:00:00.000Z").toISOString();
      const res = await apiRequest(`/api/v1/visitors/${visitorId}/check-in`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${guardAToken}` },
        body: {
          entryTimestamp: fakePastDate, // Spoofed field
          verifiedByStaffId: SUPER_ADMIN_ID.toString(), // Spoofed staff
        },
      });

      // Strict validation rejects unexpected body keys
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });
  });

  // =====================  CHECK-OUT (PATCH /:id/check-out) ===
  describe("PATCH /api/v1/visitors/:id/check-out — Visitor Gate Departure", () => {
    let checkedInVisitorId;

    beforeEach(async () => {
      const pass = await Visitor.create({
        passCode: "556677",
        qrToken: "checkout.test.token",
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        hostUserId: OWNER_A_ID,
        visitorName: "Departing Guest",
        visitorType: VISITOR_TYPES.CAB,
        expectedArrivalDate: new Date(),
        status: VISITOR_STATUS.CHECKED_IN,
        entryTimestamp: new Date(Date.now() - 3600000), // Entered 1 hour ago
        verifiedByStaffId: GUARD_A_ID,
      });
      checkedInVisitorId = pass._id.toString();
    });

    it("Security staff successfully checks out visitor (200 OK)", async () => {
      const res = await apiRequest(
        `/api/v1/visitors/${checkedInVisitorId}/check-out`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${guardAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, VISITOR_STATUS.CHECKED_OUT);
      assert.ok(res.data.data.exitTimestamp);
      // Entry timestamp and verifiedByStaffId preserved
      assert.ok(res.data.data.entryTimestamp);
      assert.equal(
        res.data.data.verifiedByStaffId.toString(),
        GUARD_A_ID.toString()
      );
    });

    it("Rejects check-out attempt for visitor who has not checked in (400 Bad Request)", async () => {
      const expectedPass = await Visitor.create({
        passCode: "667788",
        qrToken: "expected.checkout.token",
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        hostUserId: OWNER_A_ID,
        visitorName: "Not Yet Arrived",
        visitorType: VISITOR_TYPES.GUEST,
        expectedArrivalDate: new Date(),
        status: VISITOR_STATUS.EXPECTED,
      });

      const res = await apiRequest(
        `/api/v1/visitors/${expectedPass._id}/check-out`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${guardAToken}` },
        }
      );

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /not checked in yet/i);
    });

    it("Rejects duplicate check-out for already departed visitor (409 Conflict)", async () => {
      // First checkout
      await apiRequest(`/api/v1/visitors/${checkedInVisitorId}/check-out`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${guardAToken}` },
      });

      // Second duplicate checkout
      const resDuplicate = await apiRequest(
        `/api/v1/visitors/${checkedInVisitorId}/check-out`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${guardAToken}` },
        }
      );

      assert.equal(resDuplicate.status, 409);
      assert.equal(resDuplicate.data.success, false);
      assert.match(resDuplicate.data.message, /already checked out/i);
    });

    it("Security guard from different building cannot check out visitor (403 Forbidden)", async () => {
      const res = await apiRequest(
        `/api/v1/visitors/${checkedInVisitorId}/check-out`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${guardBToken}` },
        }
      );

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);

      // Verify visitor remains CHECKED_IN
      const inDb = await Visitor.findById(checkedInVisitorId);
      assert.equal(inDb.status, VISITOR_STATUS.CHECKED_IN);
    });
  });

  // =====================  STATE MACHINE & CONCURRENCY  =======
  describe("State Machine Invariants & Concurrency Guards", () => {
    it("Enforces valid transition paths: EXPECTED -> CHECKED_IN -> CHECKED_OUT", async () => {
      const pass = await Visitor.create({
        passCode: "889900",
        qrToken: "lifecycle.token",
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        hostUserId: OWNER_A_ID,
        visitorName: "Full Lifecycle Guest",
        visitorType: VISITOR_TYPES.GUEST,
        expectedArrivalDate: new Date(),
        status: VISITOR_STATUS.EXPECTED,
      });

      // 1. Check in: EXPECTED -> CHECKED_IN
      const resIn = await apiRequest(`/api/v1/visitors/${pass._id}/check-in`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${guardAToken}` },
      });
      assert.equal(resIn.status, 200);
      assert.equal(resIn.data.data.status, VISITOR_STATUS.CHECKED_IN);

      // 2. Check out: CHECKED_IN -> CHECKED_OUT
      const resOut = await apiRequest(
        `/api/v1/visitors/${pass._id}/check-out`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${guardAToken}` },
        }
      );
      assert.equal(resOut.status, 200);
      assert.equal(resOut.data.data.status, VISITOR_STATUS.CHECKED_OUT);

      // 3. Re-check in from CHECKED_OUT is illegal
      const resReIn = await apiRequest(
        `/api/v1/visitors/${pass._id}/check-in`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${guardAToken}` },
        }
      );
      assert.equal(resReIn.status, 400);
    });

    it("Handles concurrent check-ins safely with atomic winner (Race Condition Test)", async () => {
      const pass = await Visitor.create({
        passCode: "998877",
        qrToken: "concurrent.token",
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        hostUserId: OWNER_A_ID,
        visitorName: "Concurrent Scan Guest",
        visitorType: VISITOR_TYPES.DELIVERY,
        expectedArrivalDate: new Date(),
        status: VISITOR_STATUS.EXPECTED,
      });

      // Two simultaneous gate scans
      const [res1, res2] = await Promise.all([
        apiRequest(`/api/v1/visitors/${pass._id}/check-in`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${guardAToken}` },
        }),
        apiRequest(`/api/v1/visitors/${pass._id}/check-in`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${guardAToken}` },
        }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one 200 OK and one 409 Conflict
      assert.deepEqual(statuses, [200, 409]);

      const inDb = await Visitor.findById(pass._id);
      assert.equal(inDb.status, VISITOR_STATUS.CHECKED_IN);
    });
  });
});
