// =====================  IMPORTS  ==========================
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { MaintenanceConfiguration } from "./maintenance-configuration.model.js";
import { CHARGE_TYPES } from "./maintenance-configuration.constants.js";
import {
  calculateBaseMaintenanceCharge,
  calculateLateFee,
  isPaymentOverdue,
  createConfigurationSnapshot,
  roundCurrency,
} from "./maintenance-configuration.calculator.js";
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

// Test Actor IDs
const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_A_ID = new mongoose.Types.ObjectId();
const ACCOUNTANT_A_ID = new mongoose.Types.ObjectId();
const ACCOUNTANT_B_ID = new mongoose.Types.ObjectId();
const TENANT_ID = new mongoose.Types.ObjectId();

// Test Building IDs
const BUILDING_A_ID = new mongoose.Types.ObjectId();
const BUILDING_B_ID = new mongoose.Types.ObjectId();
const BUILDING_DELETED_ID = new mongoose.Types.ObjectId();

// Auth Tokens
let superAdminToken;
let buildingAdminAToken;
let accountantAToken;
let accountantBToken;
let tenantToken;

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
describe("Maintenance Configurations Domain Module (Module 12)", () => {
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
    await MaintenanceConfiguration.deleteMany({});
    await Building.deleteMany({
      _id: { $in: [BUILDING_A_ID, BUILDING_B_ID, BUILDING_DELETED_ID] },
    });
    await User.deleteMany({
      _id: {
        $in: [
          SUPER_ADMIN_ID,
          BUILDING_ADMIN_A_ID,
          ACCOUNTANT_A_ID,
          ACCOUNTANT_B_ID,
          TENANT_ID,
        ],
      },
    });

    // Seed Test Buildings
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
      {
        _id: BUILDING_DELETED_ID,
        name: "Demolished Tower C",
        code: `DTC-${Date.now().toString().slice(-4)}`,
        address: {
          street: "300 Dust Road",
          city: "Metropolis",
          state: "NY",
          postalCode: "10001",
          country: "USA",
        },
        status: "INACTIVE",
        isDeleted: true,
      },
    ]);

    // Seed Test Actors
    await User.create([
      {
        _id: SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: `super.maint.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      },
      {
        _id: BUILDING_ADMIN_A_ID,
        firstName: "Admin",
        lastName: "TowerA",
        email: `admin.towera.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: ACCOUNTANT_A_ID,
        firstName: "Accountant",
        lastName: "TowerA",
        email: `accountant.a.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.ACCOUNTANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: ACCOUNTANT_B_ID,
        firstName: "Accountant",
        lastName: "TowerB",
        email: `accountant.b.${Date.now()}@test.local`,
        password: "Password123!",
        role: ROLES.ACCOUNTANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: TENANT_ID,
        firstName: "Resident",
        lastName: "Tenant",
        email: `tenant.maint.${Date.now()}@test.local`,
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
      email: "super.maint@test.local",
    });

    buildingAdminAToken = generateAccessToken({
      sub: BUILDING_ADMIN_A_ID.toString(),
      role: ROLES.BUILDING_ADMIN,
      email: "admin.towera@test.local",
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });

    accountantAToken = generateAccessToken({
      sub: ACCOUNTANT_A_ID.toString(),
      role: ROLES.ACCOUNTANT,
      email: "accountant.a@test.local",
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });

    accountantBToken = generateAccessToken({
      sub: ACCOUNTANT_B_ID.toString(),
      role: ROLES.ACCOUNTANT,
      email: "accountant.b@test.local",
      assignedBuildingIds: [BUILDING_B_ID.toString()],
    });

    tenantToken = generateAccessToken({
      sub: TENANT_ID.toString(),
      role: ROLES.TENANT,
      email: "tenant.maint@test.local",
      assignedBuildingIds: [BUILDING_A_ID.toString()],
    });
  });

  after(async () => {
    await MaintenanceConfiguration.deleteMany({});
    await Building.deleteMany({
      _id: { $in: [BUILDING_A_ID, BUILDING_B_ID, BUILDING_DELETED_ID] },
    });
    await User.deleteMany({
      _id: {
        $in: [
          SUPER_ADMIN_ID,
          BUILDING_ADMIN_A_ID,
          ACCOUNTANT_A_ID,
          ACCOUNTANT_B_ID,
          TENANT_ID,
        ],
      },
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  // =========================================================================
  // 1. PURE CALCULATION ENGINE UNIT TESTS
  // =========================================================================
  describe("Pure Calculation Engine (Unit Matrix)", () => {
    it("Case A — FLAT_RATE formula: baseRate + parking + water", () => {
      const result = calculateBaseMaintenanceCharge({
        chargeType: CHARGE_TYPES.FLAT_RATE,
        baseRate: 5000,
        parkingCharge: 500,
        waterCharge: 300,
        areaSqFt: 1000, // ignored in flat rate
      });
      assert.equal(result, 5800);
    });

    it("Case B — PER_SQFT formula: (baseRate * areaSqFt) + parking + water", () => {
      const result = calculateBaseMaintenanceCharge({
        chargeType: CHARGE_TYPES.PER_SQFT,
        baseRate: 10,
        areaSqFt: 1000,
        parkingCharge: 500,
        waterCharge: 300,
      });
      assert.equal(result, 10800);
    });

    it("Case C — Zero Surcharges: parking=0, water=0", () => {
      const flatResult = calculateBaseMaintenanceCharge({
        chargeType: CHARGE_TYPES.FLAT_RATE,
        baseRate: 5000,
        parkingCharge: 0,
        waterCharge: 0,
      });
      assert.equal(flatResult, 5000);

      const sqftResult = calculateBaseMaintenanceCharge({
        chargeType: CHARGE_TYPES.PER_SQFT,
        baseRate: 10,
        areaSqFt: 1000,
        parkingCharge: 0,
        waterCharge: 0,
      });
      assert.equal(sqftResult, 10000);
    });

    it("Case D — Decimal Precision: handles floating-point arithmetic without IEEE 754 leakage", () => {
      const result = calculateBaseMaintenanceCharge({
        chargeType: CHARGE_TYPES.PER_SQFT,
        baseRate: 12.33,
        areaSqFt: 100,
        parkingCharge: 0.1,
        waterCharge: 0.2,
      });
      // 12.33 * 100 = 1233; 1233 + 0.1 + 0.2 = 1233.30
      assert.equal(result, 1233.3);
      assert.equal(roundCurrency(0.1 + 0.2), 0.3);
    });

    it("Case E — Late Fee Penalty: BillableAmount * (lateFeePercentage / 100)", () => {
      const fee5Percent = calculateLateFee({
        billableAmount: 10000,
        lateFeePercentage: 5,
      });
      assert.equal(fee5Percent, 500);

      const feeZeroPercent = calculateLateFee({
        billableAmount: 10000,
        lateFeePercentage: 0,
      });
      assert.equal(feeZeroPercent, 0);

      const feeDecimal = calculateLateFee({
        billableAmount: 5432.1,
        lateFeePercentage: 2.5,
      });
      assert.equal(feeDecimal, 135.8);
    });

    it("Case F — Grace Period Boundary: overdue strictly after dueDate + gracePeriodDays", () => {
      const dueDate = "2026-09-01T00:00:00.000Z";
      const gracePeriodDays = 10;
      // Cutoff is exactly 2026-09-11T00:00:00.000Z

      // Payment on boundary -> not overdue
      assert.equal(
        isPaymentOverdue({
          dueDate,
          gracePeriodDays,
          paymentDate: "2026-09-11T00:00:00.000Z",
        }),
        false
      );

      // Payment 1 second after boundary -> overdue
      assert.equal(
        isPaymentOverdue({
          dueDate,
          gracePeriodDays,
          paymentDate: "2026-09-11T00:00:01.000Z",
        }),
        true
      );

      // Payment well before due date -> not overdue
      assert.equal(
        isPaymentOverdue({
          dueDate,
          gracePeriodDays,
          paymentDate: "2026-08-30T12:00:00.000Z",
        }),
        false
      );
    });

    it("Sinking Fund Conflict Compatibility: excluded by default, supported via flag", () => {
      const withoutSinking = calculateBaseMaintenanceCharge({
        chargeType: CHARGE_TYPES.FLAT_RATE,
        baseRate: 5000,
        parkingCharge: 500,
        waterCharge: 300,
        sinkingFundCharge: 200,
        includeSinkingFund: false,
      });
      assert.equal(withoutSinking, 5800);

      const withSinking = calculateBaseMaintenanceCharge({
        chargeType: CHARGE_TYPES.FLAT_RATE,
        baseRate: 5000,
        parkingCharge: 500,
        waterCharge: 300,
        sinkingFundCharge: 200,
        includeSinkingFund: true,
      });
      assert.equal(withSinking, 6000);
    });

    it("Configuration Snapshot: generates frozen immutable formula snapshot for Invoices", () => {
      const snapshot = createConfigurationSnapshot({
        _id: new mongoose.Types.ObjectId(),
        buildingId: BUILDING_A_ID,
        chargeType: CHARGE_TYPES.FLAT_RATE,
        baseRate: 4500,
        parkingCharge: 250,
        waterCharge: 150,
        sinkingFundCharge: 100,
        lateFeePercentage: 5.0,
        gracePeriodDays: 10,
        effectiveFrom: new Date("2026-09-01T00:00:00.000Z"),
      });

      assert.equal(snapshot.chargeType, CHARGE_TYPES.FLAT_RATE);
      assert.equal(snapshot.baseRate, 4500);
      assert.equal(snapshot.parkingCharge, 250);
      assert.equal(Object.isFrozen(snapshot), true);
    });

    it("Pure Calculator Input Guards: rejects malformed numbers and types", () => {
      assert.throws(
        () =>
          calculateBaseMaintenanceCharge({
            chargeType: "INVALID",
            baseRate: 100,
          }),
        /Invalid chargeType/
      );

      assert.throws(
        () =>
          calculateBaseMaintenanceCharge({
            chargeType: CHARGE_TYPES.FLAT_RATE,
            baseRate: -50,
          }),
        /non-negative finite number/
      );

      assert.throws(
        () =>
          calculateBaseMaintenanceCharge({
            chargeType: CHARGE_TYPES.FLAT_RATE,
            baseRate: Number.NaN,
          }),
        /non-negative finite number/
      );

      assert.throws(
        () =>
          calculateLateFee({
            billableAmount: -100,
            lateFeePercentage: 5,
          }),
        /non-negative finite number/
      );

      assert.throws(
        () =>
          isPaymentOverdue({
            dueDate: "invalid-date",
            gracePeriodDays: 10,
          }),
        /valid dates/
      );
    });
  });

  // =========================================================================
  // 2. AUTHORIZATION & RBAC SECURITY TESTS
  // =========================================================================
  describe("Authorization & Role-Based Access Control", () => {
    it("Rejects unauthenticated requests with 401 Unauthorized", async () => {
      const resPost = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        body: { buildingId: BUILDING_A_ID.toString() },
      });
      assert.equal(resPost.status, 401);

      const resActive = await apiRequest(
        `/api/v1/maintenance-configurations/active?buildingId=${BUILDING_A_ID.toString()}`
      );
      assert.equal(resActive.status, 401);

      const resHistory = await apiRequest(
        `/api/v1/maintenance-configurations/history?buildingId=${BUILDING_A_ID.toString()}`
      );
      assert.equal(resHistory.status, 401);
    });

    it("Rejects unauthorized roles (TENANT) with 403 Forbidden", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 5000,
          effectiveFrom: new Date().toISOString(),
        },
      });
      assert.equal(res.status, 403);
    });

    it("Authorizes ACCOUNTANT to publish maintenance configuration for assigned building", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 5000,
          parkingCharge: 500,
          waterCharge: 300,
          sinkingFundCharge: 100,
          lateFeePercentage: 5.0,
          gracePeriodDays: 10,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.baseRate, 5000);
      assert.equal(res.data.data.parkingCharge, 500);
      assert.equal(res.data.data.waterCharge, 300);
      assert.equal(res.data.data.sinkingFundCharge, 100);
      assert.equal(res.data.data.isActive, true);
    });

    it("Authorizes BUILDING_ADMIN to publish maintenance configuration for assigned building", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: CHARGE_TYPES.PER_SQFT,
          baseRate: 15.5,
          parkingCharge: 600,
          waterCharge: 350,
          effectiveFrom: "2026-09-05T00:00:00.000Z",
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.data.baseRate, 15.5);
      assert.equal(res.data.data.chargeType, CHARGE_TYPES.PER_SQFT);
    });

    it("Authorizes SUPER_ADMIN to publish maintenance configuration for any building", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: BUILDING_B_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 6500,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.data.data.buildingId, BUILDING_B_ID.toString());
      assert.equal(res.data.data.baseRate, 6500);
    });
  });

  // =========================================================================
  // 3. OBAC BUILDING SCOPE ISOLATION (ANTI-IDOR)
  // =========================================================================
  describe("Anti-IDOR Building Scope Isolation", () => {
    it("Denies Accountant A from publishing configuration for Building B (403 Forbidden)", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_B_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 9999,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
        },
      });
      assert.equal(res.status, 403);
      assert.match(
        res.data.message,
        /outside your authorized building complex scope/i
      );
    });

    it("Denies Accountant A from reading active configuration of Building B (403 Forbidden)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-configurations/active?buildingId=${BUILDING_B_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );
      assert.equal(res.status, 403);
      assert.match(
        res.data.message,
        /outside your authorized building complex scope/i
      );
    });

    it("Denies Accountant A from reading history of Building B (403 Forbidden)", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-configurations/history?buildingId=${BUILDING_B_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );
      assert.equal(res.status, 403);
      assert.match(
        res.data.message,
        /outside your authorized building complex scope/i
      );
    });

    it("Denies Accountant B from publishing configuration for Building A (403 Forbidden)", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantBToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 8888,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
        },
      });
      assert.equal(res.status, 403);
      assert.match(
        res.data.message,
        /outside your authorized building complex scope/i
      );
    });
  });

  // =========================================================================
  // 4. TARGET BUILDING INTEGRITY & EXISTENCE
  // =========================================================================
  describe("Building Existence and Active Integrity", () => {
    it("Rejects configuration for non-existent building ID with 404 Not Found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: nonExistentId.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 5000,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
        },
      });
      assert.equal(res.status, 404);
      assert.match(res.data.message, /not found or has been deleted/i);
    });

    it("Rejects configuration for soft-deleted building with 404 Not Found", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: BUILDING_DELETED_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 5000,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
        },
      });
      assert.equal(res.status, 404);
      assert.match(res.data.message, /not found or has been deleted/i);
    });
  });

  // =========================================================================
  // 5. INPUT VALIDATION & FINANCIAL CONSTRAINTS
  // =========================================================================
  describe("Strict Validation & Financial Value Protection", () => {
    it("Rejects missing required fields (baseRate, chargeType, effectiveFrom)", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
        },
      });
      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    it("Rejects unsupported chargeType (e.g. HYBRID or CUSTOM)", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: "HYBRID",
          baseRate: 5000,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
        },
      });
      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /FLAT_RATE/i);
    });

    it("Rejects negative baseRate", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: -500,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
        },
      });
      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /baseRate cannot be less than 0/i);
    });

    it("Rejects negative optional charges (parking, water, sinking fund)", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 5000,
          parkingCharge: -100,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
        },
      });
      assert.equal(res.status, 400);
      assert.match(
        JSON.stringify(res.data),
        /parkingCharge cannot be less than 0/i
      );
    });

    it("Rejects invalid late fee percentage (> 100 or negative)", async () => {
      const resHigh = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 5000,
          lateFeePercentage: 105,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
        },
      });
      assert.equal(resHigh.status, 400);
      assert.match(JSON.stringify(resHigh.data), /cannot exceed 100/i);

      const resLow = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 5000,
          lateFeePercentage: -2,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
        },
      });
      assert.equal(resLow.status, 400);
      assert.match(JSON.stringify(resLow.data), /cannot be less than 0/i);
    });

    it("Rejects non-integer or negative gracePeriodDays", async () => {
      const resDecimal = await apiRequest(
        "/api/v1/maintenance-configurations",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accountantAToken}` },
          body: {
            buildingId: BUILDING_A_ID.toString(),
            chargeType: CHARGE_TYPES.FLAT_RATE,
            baseRate: 5000,
            gracePeriodDays: 10.5,
            effectiveFrom: "2026-09-01T00:00:00.000Z",
          },
        }
      );
      assert.equal(resDecimal.status, 400);
      assert.match(JSON.stringify(resDecimal.data), /must be an integer/i);
    });

    it("Rejects invalid effectiveFrom date strings", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 5000,
          effectiveFrom: "invalid-date-format",
        },
      });
      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /Invalid date format/i);
    });

    it("Blocks mass assignment injection of isActive, _id, or audit fields", async () => {
      const res = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 5000,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
          isActive: false, // Disallowed client override
          _id: new mongoose.Types.ObjectId().toString(),
        },
      });
      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /unrecognized/i);
    });

    it("Blocks MongoDB query operator injection ($ne, $gt)", async () => {
      const res = await apiRequest(
        "/api/v1/maintenance-configurations/active?buildingId[$ne]=null",
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );
      assert.equal(res.status, 400);
    });
  });

  // =========================================================================
  // 6. APPEND-ONLY IMMUTABILITY & VERSION PRESERVATION
  // =========================================================================
  describe("Append-Only Immutability & Historical Integrity", () => {
    it("Preserves historical rate configurations without mutating previous values", async () => {
      // Clean collection for Building A to test pristine versioning
      await MaintenanceConfiguration.deleteMany({ buildingId: BUILDING_A_ID });

      // Publish v1: baseRate 5000
      const resV1 = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 5000,
          parkingCharge: 500,
          waterCharge: 300,
          effectiveFrom: "2026-08-01T00:00:00.000Z",
        },
      });
      assert.equal(resV1.status, 201);
      const v1Id = resV1.data.data._id;

      // Publish v2: baseRate 6000
      const resV2 = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 6000,
          parkingCharge: 600,
          waterCharge: 350,
          effectiveFrom: "2026-09-01T00:00:00.000Z",
        },
      });
      assert.equal(resV2.status, 201);
      const v2Id = resV2.data.data._id;

      // Direct DB Verification: Verify v1 was NOT mutated
      const v1DbDoc = await MaintenanceConfiguration.findById(v1Id);
      assert.equal(v1DbDoc.baseRate, 5000);
      assert.equal(v1DbDoc.parkingCharge, 500);
      assert.equal(v1DbDoc.waterCharge, 300);
      // Older config retired when v2 took effect
      assert.equal(v1DbDoc.isActive, false);

      const v2DbDoc = await MaintenanceConfiguration.findById(v2Id);
      assert.equal(v2DbDoc.baseRate, 6000);
      assert.equal(v2DbDoc.isActive, true);

      // Verify /history returns both versions in deterministic reverse-chronological order
      const resHistory = await apiRequest(
        `/api/v1/maintenance-configurations/history?buildingId=${BUILDING_A_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );
      assert.equal(resHistory.status, 200);
      assert.equal(resHistory.data.data.items.length, 2);
      assert.equal(resHistory.data.data.items[0]._id, v2Id);
      assert.equal(resHistory.data.data.items[0].baseRate, 6000);
      assert.equal(resHistory.data.data.items[1]._id, v1Id);
      assert.equal(resHistory.data.data.items[1].baseRate, 5000);
    });
  });

  // =========================================================================
  // 7. ACTIVE CONFIGURATION RESOLUTION & FUTURE-DATED CONFIGURATIONS
  // =========================================================================
  describe("Active Configuration Resolution & Future-Dated Formulas", () => {
    it("Returns 404 when querying active configuration for unconfigured building", async () => {
      // Building B has no configurations currently
      await MaintenanceConfiguration.deleteMany({ buildingId: BUILDING_B_ID });

      const res = await apiRequest(
        `/api/v1/maintenance-configurations/active?buildingId=${BUILDING_B_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );
      assert.equal(res.status, 404);
      assert.match(
        res.data.message,
        /No active maintenance billing configuration found/i
      );
    });

    it("Correctly resolves future-dated configuration without deactivating current formula prematurely", async () => {
      // Clear Building B
      await MaintenanceConfiguration.deleteMany({ buildingId: BUILDING_B_ID });

      // Publish Current Formula (v1): effective 2026-09-01
      const resCurrent = await apiRequest(
        "/api/v1/maintenance-configurations",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${superAdminToken}` },
          body: {
            buildingId: BUILDING_B_ID.toString(),
            chargeType: CHARGE_TYPES.FLAT_RATE,
            baseRate: 4000,
            effectiveFrom: "2026-09-01T00:00:00.000Z",
          },
        }
      );
      assert.equal(resCurrent.status, 201);

      // Publish Future Formula (v2): effective 2026-11-01 (future date)
      const resFuture = await apiRequest("/api/v1/maintenance-configurations", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: BUILDING_B_ID.toString(),
          chargeType: CHARGE_TYPES.FLAT_RATE,
          baseRate: 4800,
          effectiveFrom: "2026-11-01T00:00:00.000Z",
        },
      });
      assert.equal(resFuture.status, 201);

      // Query active formula for mid-September (2026-09-15) -> must return current v1 (4000)
      const resSept = await apiRequest(
        `/api/v1/maintenance-configurations/active?buildingId=${BUILDING_B_ID.toString()}&asOfDate=2026-09-15T00:00:00.000Z`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );
      assert.equal(resSept.status, 200);
      assert.equal(resSept.data.data.baseRate, 4000);

      // Query active formula for mid-November (2026-11-15) -> must return future v2 (4800)
      const resNov = await apiRequest(
        `/api/v1/maintenance-configurations/active?buildingId=${BUILDING_B_ID.toString()}&asOfDate=2026-11-15T00:00:00.000Z`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );
      assert.equal(resNov.status, 200);
      assert.equal(resNov.data.data.baseRate, 4800);
    });
  });

  // =========================================================================
  // 8. PAGINATION ON HISTORY
  // =========================================================================
  describe("Historical Audit Pagination Standards", () => {
    it("Enforces pagination envelope on /history endpoint", async () => {
      const res = await apiRequest(
        `/api/v1/maintenance-configurations/history?buildingId=${BUILDING_A_ID.toString()}&page=1&limit=1`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );
      assert.equal(res.status, 200);
      assert.equal(res.data.data.items.length, 1);
      assert.equal(res.data.data.pagination.page, 1);
      assert.equal(res.data.data.pagination.limit, 1);
      assert.equal(res.data.data.pagination.total, 2);
      assert.equal(res.data.data.pagination.totalPages, 2);
      assert.equal(res.data.data.pagination.hasNextPage, true);
      assert.equal(res.data.data.pagination.hasPrevPage, false);
    });
  });

  // =========================================================================
  // 9. CONCURRENCY & TRANSACTION SAFETY
  // =========================================================================
  describe("Concurrency & Transactional Integrity", () => {
    it("Handles concurrent configuration publication gracefully under ACID sessions", async () => {
      const promises = [
        apiRequest("/api/v1/maintenance-configurations", {
          method: "POST",
          headers: { Authorization: `Bearer ${accountantAToken}` },
          body: {
            buildingId: BUILDING_A_ID.toString(),
            chargeType: CHARGE_TYPES.FLAT_RATE,
            baseRate: 7000,
            effectiveFrom: "2026-12-01T00:00:00.000Z",
          },
        }),
        apiRequest("/api/v1/maintenance-configurations", {
          method: "POST",
          headers: { Authorization: `Bearer ${accountantAToken}` },
          body: {
            buildingId: BUILDING_A_ID.toString(),
            chargeType: CHARGE_TYPES.FLAT_RATE,
            baseRate: 7500,
            effectiveFrom: "2026-12-15T00:00:00.000Z",
          },
        }),
      ];

      const results = await Promise.all(promises);
      for (const res of results) {
        assert.equal(res.status, 201);
      }

      // Verify both configurations were safely committed
      const configs = await MaintenanceConfiguration.find({
        buildingId: BUILDING_A_ID,
        baseRate: { $in: [7000, 7500] },
      });
      assert.equal(configs.length, 2);
    });
  });
});
