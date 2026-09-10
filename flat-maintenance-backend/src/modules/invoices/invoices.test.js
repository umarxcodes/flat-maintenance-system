// =====================  IMPORTS  ==========================
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Invoice } from "./invoices.model.js";
import { INVOICE_STATUS } from "./invoices.constants.js";
import {
  calculateInvoiceAmounts,
  generateLineItems,
  calculateDueAmount,
  resolveBillingDueDate,
} from "./invoices.calculator.js";
import { validateInvoiceTransition } from "./invoices.state-machine.js";
import { Building } from "../../models/building.model.js";
import { Block } from "../../models/block.model.js";
import { Floor } from "../../models/floor.model.js";
import { Flat, FLAT_STATUS } from "../../models/flat.model.js";
import { User } from "../../models/user.model.js";
import { Owner } from "../../models/owner.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { MaintenanceConfiguration } from "../../models/maintenance-configuration.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { CHARGE_TYPES } from "../maintenance-configurations/maintenance-configuration.constants.js";
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
const FLAT_103_VACANT_ID = new mongoose.Types.ObjectId();
const FLAT_B_OCCUPIED_ID = new mongoose.Types.ObjectId();

// Test IDs - Actors
const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_A_ID = new mongoose.Types.ObjectId();
const ACCOUNTANT_A_ID = new mongoose.Types.ObjectId();
const ACCOUNTANT_B_ID = new mongoose.Types.ObjectId();
const OWNER_A_USER_ID = new mongoose.Types.ObjectId();
const OWNER_A_PROFILE_ID = new mongoose.Types.ObjectId();
const OWNER_B_USER_ID = new mongoose.Types.ObjectId();
const OWNER_B_PROFILE_ID = new mongoose.Types.ObjectId();
const TENANT_101_USER_ID = new mongoose.Types.ObjectId();
const TENANT_101_PROFILE_ID = new mongoose.Types.ObjectId();
const TENANT_102_USER_ID = new mongoose.Types.ObjectId();
const TENANT_102_PROFILE_ID = new mongoose.Types.ObjectId();

// Auth Tokens
let superAdminToken;
let buildingAdminAToken;
let accountantAToken;
let accountantBToken;
let ownerAToken;
let tenant101Token;
let tenant102Token;

/**
 * Helper to execute HTTP requests against test server.
 */
const apiRequest = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const fetchOptions = {
    method: options.method || "GET",
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

// =====================  TEST SUITE  ========================
describe("Invoices & Batch Billing Engine Module (Module 14)", () => {
  before(async () => {
    await connectDB();
    await rolesService.seedSystemRoles();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Clean test collections
    await Promise.all([
      Invoice.deleteMany({}),
      Building.deleteMany({}),
      Block.deleteMany({}),
      Floor.deleteMany({}),
      Flat.deleteMany({}),
      User.deleteMany({}),
      Owner.deleteMany({}),
      Tenant.deleteMany({}),
      MaintenanceConfiguration.deleteMany({}),
    ]);

    // Seed Buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Emerald Heights Tower A",
        code: `EH-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Emerald Ave",
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

    // Seed Hierarchy
    await Block.create({
      _id: BLOCK_A_ID,
      buildingId: BUILDING_A_ID,
      name: "Block 1",
      code: "B1",
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
        areaSqFt: 1000,
        status: FLAT_STATUS.OCCUPIED,
        isDeleted: false,
      },
      {
        _id: FLAT_103_VACANT_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "103",
        areaSqFt: 800,
        status: FLAT_STATUS.VACANT, // Should be skipped in batch billing
        isDeleted: false,
      },
      {
        _id: FLAT_B_OCCUPIED_ID,
        buildingId: BUILDING_B_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "B201",
        areaSqFt: 1100,
        status: FLAT_STATUS.OCCUPIED,
        isDeleted: false,
      },
    ]);

    // Seed Active Maintenance Configurations
    // Building A: FLAT_RATE (baseRate: 5000, parking: 500, water: 300) -> 5800
    await MaintenanceConfiguration.create({
      buildingId: BUILDING_A_ID,
      chargeType: CHARGE_TYPES.FLAT_RATE,
      baseRate: 5000,
      parkingCharge: 500,
      waterCharge: 300,
      sinkingFundCharge: 200,
      lateFeePercentage: 5.0,
      gracePeriodDays: 10,
      effectiveFrom: new Date("2026-01-01"),
      isActive: true,
    });

    // Building B: PER_SQFT (baseRate: 10, parking: 500, water: 300)
    await MaintenanceConfiguration.create({
      buildingId: BUILDING_B_ID,
      chargeType: CHARGE_TYPES.PER_SQFT,
      baseRate: 10,
      parkingCharge: 500,
      waterCharge: 300,
      sinkingFundCharge: 0,
      lateFeePercentage: 5.0,
      gracePeriodDays: 10,
      effectiveFrom: new Date("2026-01-01"),
      isActive: true,
    });

    // Seed User Accounts
    await User.create([
      {
        _id: SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: "super.inv@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: BUILDING_ADMIN_A_ID,
        firstName: "Building",
        lastName: "AdminA",
        email: "admin.inv.a@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: ACCOUNTANT_A_ID,
        firstName: "Alice",
        lastName: "Accountant",
        email: "accountant.a@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.ACCOUNTANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: ACCOUNTANT_B_ID,
        firstName: "Bob",
        lastName: "Accountant",
        email: "accountant.b@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.ACCOUNTANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: OWNER_A_USER_ID,
        firstName: "Oliver",
        lastName: "Owner",
        email: "owner.a@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: OWNER_B_USER_ID,
        firstName: "Oscar",
        lastName: "Owner",
        email: "owner.b@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: TENANT_101_USER_ID,
        firstName: "Timothy",
        lastName: "Tenant",
        email: "tenant.101@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: TENANT_102_USER_ID,
        firstName: "Tara",
        lastName: "Tenant",
        email: "tenant.102@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
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
        flatsOwned: [FLAT_101_OCCUPIED_ID, FLAT_102_OCCUPIED_ID],
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
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2026-12-31"),
        rentAmount: 25000,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
      },
      {
        _id: TENANT_102_PROFILE_ID,
        userId: TENANT_102_USER_ID,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_102_OCCUPIED_ID,
        ownerId: OWNER_A_PROFILE_ID,
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2026-12-31"),
        rentAmount: 22000,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
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
    await Flat.updateOne(
      { _id: FLAT_102_OCCUPIED_ID },
      {
        currentOwnerId: OWNER_A_PROFILE_ID,
        currentTenantId: TENANT_102_PROFILE_ID,
      }
    );
    await Flat.updateOne(
      { _id: FLAT_B_OCCUPIED_ID },
      { currentOwnerId: OWNER_B_PROFILE_ID }
    );

    // Generate JWT Access Tokens
    superAdminToken = generateAccessToken({
      sub: SUPER_ADMIN_ID.toString(),
      role: ROLES.SUPER_ADMIN,
      email: "super.inv@test.local",
    });

    buildingAdminAToken = generateAccessToken({
      sub: BUILDING_ADMIN_A_ID.toString(),
      role: ROLES.BUILDING_ADMIN,
      email: "admin.inv.a@test.local",
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
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await Invoice.deleteMany({});
    await Building.deleteMany({});
    await Block.deleteMany({});
    await Floor.deleteMany({});
    await Flat.deleteMany({});
    await User.deleteMany({});
    await Owner.deleteMany({});
    await Tenant.deleteMany({});
    await MaintenanceConfiguration.deleteMany({});
    await mongoose.disconnect();
  });

  // =========================================================================
  // 1. PURE CALCULATION & FINANCIAL FORMULA MATRIX
  // =========================================================================
  describe("1. Pure Financial Calculation Engine (Unit Matrix)", () => {
    it("Calculates FLAT_RATE formula: baseRate (5000) + parking (500) + water (300) = 5800", () => {
      const res = calculateInvoiceAmounts({
        chargeType: CHARGE_TYPES.FLAT_RATE,
        baseRate: 5000,
        parkingCharge: 500,
        waterCharge: 300,
      });

      assert.equal(res.subTotal, 5800);
      assert.equal(res.totalAmount, 5800);
      assert.equal(res.dueAmount, 5800);
      assert.equal(res.lineItems.length, 3);
      assert.deepEqual(res.lineItems, [
        { title: "Base Maintenance Charge", amount: 5000 },
        { title: "Parking Charge", amount: 500 },
        { title: "Water Utility Charge", amount: 300 },
      ]);
    });

    it("Calculates PER_SQFT formula: (baseRate 10 * area 1000) + parking (500) + water (300) = 10800", () => {
      const res = calculateInvoiceAmounts({
        chargeType: CHARGE_TYPES.PER_SQFT,
        baseRate: 10,
        areaSqFt: 1000,
        parkingCharge: 500,
        waterCharge: 300,
      });

      assert.equal(res.subTotal, 10800);
      assert.equal(res.totalAmount, 10800);
      assert.equal(res.dueAmount, 10800);
      assert.equal(res.lineItems.length, 3);
      assert.deepEqual(res.lineItems, [
        { title: "Base Maintenance Charge", amount: 10000 },
        { title: "Parking Charge", amount: 500 },
        { title: "Water Utility Charge", amount: 300 },
      ]);
    });

    it("Handles zero optional surcharges cleanly (baseRate only)", () => {
      const res = calculateInvoiceAmounts({
        chargeType: CHARGE_TYPES.FLAT_RATE,
        baseRate: 5000,
        parkingCharge: 0,
        waterCharge: 0,
      });

      assert.equal(res.subTotal, 5000);
      assert.equal(res.totalAmount, 5000);
      assert.equal(res.dueAmount, 5000);
      assert.equal(res.lineItems.length, 1);
      assert.equal(res.lineItems[0].title, "Base Maintenance Charge");
    });

    it("Sinking fund compatibility: excluded by default, supported with includeSinkingFund", () => {
      // Default: excluded per Section 23 formula
      const defaultRes = calculateInvoiceAmounts({
        chargeType: CHARGE_TYPES.FLAT_RATE,
        baseRate: 5000,
        parkingCharge: 500,
        waterCharge: 300,
        sinkingFundCharge: 200,
      });
      assert.equal(defaultRes.totalAmount, 5800);

      // Explicitly included
      const includedRes = calculateInvoiceAmounts({
        chargeType: CHARGE_TYPES.FLAT_RATE,
        baseRate: 5000,
        parkingCharge: 500,
        waterCharge: 300,
        sinkingFundCharge: 200,
        includeSinkingFund: true,
      });
      assert.equal(includedRes.totalAmount, 6000);
      assert.equal(includedRes.lineItems.length, 4);

      // Direct unit verification of generateLineItems helper
      const items = generateLineItems({
        chargeType: CHARGE_TYPES.FLAT_RATE,
        baseRate: 5000,
        parkingCharge: 500,
      });
      assert.equal(items.length, 2);
    });

    it("Prevents floating-point drift in line items and subtotal", () => {
      const res = calculateInvoiceAmounts({
        chargeType: CHARGE_TYPES.PER_SQFT,
        baseRate: 12.33,
        areaSqFt: 100.5,
        parkingCharge: 0,
        waterCharge: 0,
      });

      // 12.33 * 100.5 = 1239.165 -> rounds to 1239.17
      assert.equal(res.subTotal, 1239.17);
      assert.equal(res.totalAmount, 1239.17);
    });

    it("Calculates due amount correctly across full, partial, and overpaid balances", () => {
      assert.equal(calculateDueAmount(5800, 0), 5800);
      assert.equal(calculateDueAmount(5800, 2000), 3800);
      assert.equal(calculateDueAmount(5800, 5800), 0);
      assert.equal(calculateDueAmount(5800, 6000), 0); // Overpayment caps at 0
    });

    it("Resolves canonical billing due date to 15th of billing period month in UTC", () => {
      const defaultDueDate = resolveBillingDueDate("2026-09");
      assert.equal(defaultDueDate.getUTCFullYear(), 2026);
      assert.equal(defaultDueDate.getUTCMonth(), 8); // 0-indexed September
      assert.equal(defaultDueDate.getUTCDate(), 15);

      const explicitDueDate = resolveBillingDueDate(
        "2026-09",
        "2026-09-25T00:00:00.000Z"
      );
      assert.equal(explicitDueDate.getUTCDate(), 25);
    });

    it("Rejects malformed billing period strings", () => {
      assert.throws(
        () => resolveBillingDueDate("2026-9"),
        /Invalid billingPeriod/
      );
      assert.throws(
        () => resolveBillingDueDate("09-2026"),
        /Invalid billingPeriod/
      );
      assert.throws(
        () => resolveBillingDueDate("2026/09"),
        /Invalid billingPeriod/
      );
      assert.throws(
        () => resolveBillingDueDate("2026-13"),
        /Invalid billingPeriod/
      );
    });
  });

  // =========================================================================
  // 2. STATE MACHINE & VOID LIFECYCLE (UNIT MATRIX)
  // =========================================================================
  describe("2. State Machine Transitions & Void Validation", () => {
    it("Validates DRAFT -> ISSUED transition by Accountant", () => {
      assert.doesNotThrow(() => {
        validateInvoiceTransition(
          INVOICE_STATUS.DRAFT,
          INVOICE_STATUS.ISSUED,
          ROLES.ACCOUNTANT
        );
      });
    });

    it("Validates DRAFT -> VOID transition by Accountant", () => {
      assert.doesNotThrow(() => {
        validateInvoiceTransition(
          INVOICE_STATUS.DRAFT,
          INVOICE_STATUS.VOID,
          ROLES.ACCOUNTANT
        );
      });
    });

    it("Validates downstream payment lifecycle transitions (ISSUED/PARTIALLY_PAID -> PAID)", () => {
      assert.doesNotThrow(() => {
        validateInvoiceTransition(
          INVOICE_STATUS.ISSUED,
          INVOICE_STATUS.PARTIALLY_PAID
        );
        validateInvoiceTransition(
          INVOICE_STATUS.PARTIALLY_PAID,
          INVOICE_STATUS.PAID
        );
        validateInvoiceTransition(INVOICE_STATUS.ISSUED, INVOICE_STATUS.PAID);
        validateInvoiceTransition(
          INVOICE_STATUS.ISSUED,
          INVOICE_STATUS.OVERDUE
        );
        validateInvoiceTransition(INVOICE_STATUS.OVERDUE, INVOICE_STATUS.PAID);
      });
    });

    it("Rejects illegal state jumps (ISSUED -> VOID, PAID -> VOID, DRAFT -> PAID)", () => {
      assert.throws(() => {
        validateInvoiceTransition(
          INVOICE_STATUS.ISSUED,
          INVOICE_STATUS.VOID,
          ROLES.ACCOUNTANT
        );
      }, /Invalid invoice state transition/);

      assert.throws(() => {
        validateInvoiceTransition(
          INVOICE_STATUS.PAID,
          INVOICE_STATUS.VOID,
          ROLES.ACCOUNTANT
        );
      }, /Invalid invoice state transition/);

      assert.throws(() => {
        validateInvoiceTransition(
          INVOICE_STATUS.DRAFT,
          INVOICE_STATUS.PAID,
          ROLES.ACCOUNTANT
        );
      }, /Invalid invoice state transition/);
    });

    it("Rejects unauthorized roles attempting to void draft invoices (TENANT, OWNER)", () => {
      assert.throws(() => {
        validateInvoiceTransition(
          INVOICE_STATUS.DRAFT,
          INVOICE_STATUS.VOID,
          ROLES.TENANT
        );
      }, /Access forbidden/);

      assert.throws(() => {
        validateInvoiceTransition(
          INVOICE_STATUS.DRAFT,
          INVOICE_STATUS.VOID,
          ROLES.OWNER
        );
      }, /Access forbidden/);
    });
  });

  // =========================================================================
  // 3. POST /api/v1/invoices/generate-batch (Batch Billing Engine)
  // =========================================================================
  describe("3. POST /api/v1/invoices/generate-batch", () => {
    it("Rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/invoices/generate-batch", {
        method: "POST",
        body: {
          buildingId: BUILDING_A_ID.toString(),
          billingPeriod: "2026-09",
        },
      });
      assert.equal(res.status, 401);
    });

    it("Rejects unauthorized roles without INVOICE_GENERATE (403 Forbidden)", async () => {
      const res = await apiRequest("/api/v1/invoices/generate-batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenant101Token}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          billingPeriod: "2026-09",
        },
      });
      assert.equal(res.status, 403);
    });

    it("Anti-IDOR: Rejects Accountant A attempting to generate batch for Building B (403)", async () => {
      const res = await apiRequest("/api/v1/invoices/generate-batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_B_ID.toString(),
          billingPeriod: "2026-09",
        },
      });
      assert.equal(res.status, 403);
      assert.match(
        JSON.stringify(res.data),
        /outside your authorized building scope/i
      );
    });

    it("Rejects non-existent building with 404 Not Found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest("/api/v1/invoices/generate-batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: nonExistentId,
          billingPeriod: "2026-09",
        },
      });
      assert.equal(res.status, 404);
    });

    it("Allows Accountant A to generate batch for Building A (201 Created)", async () => {
      const res = await apiRequest("/api/v1/invoices/generate-batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          billingPeriod: "2026-09",
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.buildingId, BUILDING_A_ID.toString());
      assert.equal(res.data.data.billingPeriod, "2026-09");
      assert.equal(res.data.data.totalEligibleFlats, 2); // Flat 101, 102 (Flat 103 is VACANT)
      assert.equal(res.data.data.created, 2);
      assert.equal(res.data.data.skippedExisting, 0);
      assert.equal(res.data.data.failed, 0);

      // Verify database persistence & correctness
      const inv101 = await Invoice.findOne({
        flatId: FLAT_101_OCCUPIED_ID,
        billingPeriod: "2026-09",
      });
      assert.ok(inv101);
      assert.equal(inv101.status, INVOICE_STATUS.ISSUED);
      assert.equal(inv101.subTotal, 5800);
      assert.equal(inv101.totalAmount, 5800);
      assert.equal(inv101.dueAmount, 5800);
      assert.equal(inv101.paidAmount, 0);
      assert.equal(inv101.ownerId.toString(), OWNER_A_PROFILE_ID.toString());
      assert.equal(
        inv101.tenantId.toString(),
        TENANT_101_PROFILE_ID.toString()
      );
      assert.ok(inv101.configurationSnapshot);
      assert.equal(
        inv101.configurationSnapshot.chargeType,
        CHARGE_TYPES.FLAT_RATE
      );
      assert.equal(inv101.configurationSnapshot.baseRate, 5000);
      assert.match(inv101.invoiceNumber, /^INV-2026-09-101-\d+/);

      // Verify vacant Flat 103 was NOT billed
      const inv103 = await Invoice.findOne({
        flatId: FLAT_103_VACANT_ID,
        billingPeriod: "2026-09",
      });
      assert.equal(inv103, null);
    });

    it("Allows Building Admin A to generate batch for Building A (201 Created)", async () => {
      const res = await apiRequest("/api/v1/invoices/generate-batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          billingPeriod: "2026-11",
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.created, 2);
    });

    it("Blocks mass assignment of financial fields in batch request body", async () => {
      const res = await apiRequest("/api/v1/invoices/generate-batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          billingPeriod: "2026-10",
          totalAmount: 1, // Malicious injection
          paidAmount: 9999,
          dueAmount: 0,
        },
      });

      assert.equal(res.status, 400);
      assert.match(JSON.stringify(res.data), /unrecognized/i);
    });
  });

  // =========================================================================
  // 4. BATCH IDEMPOTENCY & CONCURRENCY
  // =========================================================================
  describe("4. Batch Idempotency & Concurrency Safety", () => {
    it("Re-running batch for same period is 100% idempotent (0 duplicates, skippedExisting >= 1)", async () => {
      const res = await apiRequest("/api/v1/invoices/generate-batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          billingPeriod: "2026-09",
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.data.created, 0); // None newly created
      assert.equal(res.data.data.skippedExisting, 2); // Both skipped safely
      assert.equal(res.data.data.failed, 0);

      // Assert total invoices in DB for Building A in 2026-09 is still strictly 2
      const count = await Invoice.countDocuments({
        buildingId: BUILDING_A_ID,
        billingPeriod: "2026-09",
      });
      assert.equal(count, 2);
    });

    it("Concurrent batch generation runs safely without duplicate key exceptions", async () => {
      // Dispatch 5 concurrent batch runs for Building B (PER_SQFT) in 2026-09
      const requests = Array.from({ length: 5 }, () =>
        apiRequest("/api/v1/invoices/generate-batch", {
          method: "POST",
          headers: { Authorization: `Bearer ${accountantBToken}` },
          body: {
            buildingId: BUILDING_B_ID.toString(),
            billingPeriod: "2026-09",
          },
        })
      );

      const results = await Promise.all(requests);

      // All 5 requests must complete with HTTP 201
      for (const res of results) {
        assert.equal(res.status, 201);
      }

      // Exactly 1 invoice must exist for Flat B in 2026-09
      const countB = await Invoice.countDocuments({
        buildingId: BUILDING_B_ID,
        billingPeriod: "2026-09",
      });
      assert.equal(countB, 1);

      const invB = await Invoice.findOne({
        buildingId: BUILDING_B_ID,
        billingPeriod: "2026-09",
      });
      // 10 * 1100 + 500 + 300 = 11800
      assert.equal(invB.totalAmount, 11800);
      assert.equal(
        invB.configurationSnapshot.chargeType,
        CHARGE_TYPES.PER_SQFT
      );
    });
  });

  // =========================================================================
  // 5. GET /api/v1/invoices (Listing & Scoping)
  // =========================================================================
  describe("5. GET /api/v1/invoices (List & Scoping)", () => {
    it("Rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/invoices");
      assert.equal(res.status, 401);
    });

    it("Accountant A receives invoices strictly scoped to Building A", async () => {
      const res = await apiRequest("/api/v1/invoices", {
        headers: { Authorization: `Bearer ${accountantAToken}` },
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.items.length >= 2);
      for (const item of res.data.data.items) {
        assert.equal(item.buildingId, BUILDING_A_ID.toString());
      }
    });

    it("SuperAdmin can query invoices globally across complexes", async () => {
      const res = await apiRequest("/api/v1/invoices", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.items.length >= 3); // 2 in Building A, 1 in Building B
    });

    it("Owner A receives ONLY invoices for their owned flats portfolio", async () => {
      const res = await apiRequest("/api/v1/invoices", {
        headers: { Authorization: `Bearer ${ownerAToken}` },
      });

      assert.equal(res.status, 200);
      for (const item of res.data.data.items) {
        assert.ok(
          [
            FLAT_101_OCCUPIED_ID.toString(),
            FLAT_102_OCCUPIED_ID.toString(),
          ].includes(item.flatId)
        );
      }
    });

    it("Tenant 101 receives ONLY invoices for their active leased Flat 101", async () => {
      const res = await apiRequest("/api/v1/invoices", {
        headers: { Authorization: `Bearer ${tenant101Token}` },
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.items.length >= 1);
      for (const item of res.data.data.items) {
        assert.equal(item.flatId, FLAT_101_OCCUPIED_ID.toString());
      }
    });

    it("Enforces pagination envelope on list responses", async () => {
      const res = await apiRequest("/api/v1/invoices?page=1&limit=2", {
        headers: { Authorization: `Bearer ${accountantAToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.pagination.page, 1);
      assert.equal(res.data.data.pagination.limit, 2);
      assert.ok(res.data.data.pagination.total >= 2);
    });
  });

  // =========================================================================
  // 6. GET /api/v1/invoices/:id (Detail Retrieval & Anti-IDOR)
  // =========================================================================
  describe("6. GET /api/v1/invoices/:id (Detail & Anti-IDOR)", () => {
    let invoiceAId;
    let invoiceBId;

    before(async () => {
      const invA = await Invoice.findOne({ flatId: FLAT_101_OCCUPIED_ID });
      invoiceAId = invA._id.toString();

      const invB = await Invoice.findOne({ flatId: FLAT_B_OCCUPIED_ID });
      invoiceBId = invB._id.toString();
    });

    it("Returns 404 for non-existent invoice ID", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await apiRequest(`/api/v1/invoices/${nonExistentId}`, {
        headers: { Authorization: `Bearer ${accountantAToken}` },
      });
      assert.equal(res.status, 404);
    });

    it("Anti-IDOR: Accountant A cannot retrieve invoice of Building B (403)", async () => {
      const res = await apiRequest(`/api/v1/invoices/${invoiceBId}`, {
        headers: { Authorization: `Bearer ${accountantAToken}` },
      });
      assert.equal(res.status, 403);
    });

    it("Anti-IDOR: Tenant 102 cannot retrieve Tenant 101's invoice (403 Forbidden)", async () => {
      const res = await apiRequest(`/api/v1/invoices/${invoiceAId}`, {
        headers: { Authorization: `Bearer ${tenant102Token}` },
      });
      assert.equal(res.status, 403);
    });

    it("Tenant 101 successfully retrieves their own Flat 101 invoice (200 OK)", async () => {
      const res = await apiRequest(`/api/v1/invoices/${invoiceAId}`, {
        headers: { Authorization: `Bearer ${tenant101Token}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.id, invoiceAId);
      assert.equal(res.data.data.flatId, FLAT_101_OCCUPIED_ID.toString());
      assert.equal(res.data.data.subTotal, 5800);
      assert.equal(res.data.data.lineItems.length, 3);
    });
  });

  // =========================================================================
  // 7. PATCH /api/v1/invoices/:id/void (Invoice Void Lifecycle)
  // =========================================================================
  describe("7. PATCH /api/v1/invoices/:id/void", () => {
    let draftInvoiceId;
    let issuedInvoiceId;

    beforeEach(async () => {
      // Clear any existing test draft invoice for flat 101 in period 2026-10
      await Invoice.deleteMany({
        flatId: FLAT_101_OCCUPIED_ID,
        billingPeriod: "2026-10",
      });

      // Create a DRAFT invoice for testing void
      const draft = await Invoice.create({
        invoiceNumber:
          `INV-2026-10-TEST-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase(),
        buildingId: BUILDING_A_ID,
        flatId: FLAT_101_OCCUPIED_ID,
        ownerId: OWNER_A_PROFILE_ID,
        billingPeriod: `2026-10`,
        configurationSnapshot: { baseRate: 5000, chargeType: "FLAT_RATE" },
        lineItems: [{ title: "Base Maintenance", amount: 5000 }],
        subTotal: 5000,
        totalAmount: 5000,
        dueAmount: 5000,
        dueDate: new Date("2026-10-15"),
        status: INVOICE_STATUS.DRAFT,
      });
      draftInvoiceId = draft._id.toString();

      const issued = await Invoice.findOne({
        flatId: FLAT_101_OCCUPIED_ID,
        status: INVOICE_STATUS.ISSUED,
      });
      issuedInvoiceId = issued._id.toString();
    });

    it("Rejects non-accountant/admin attempting to void (403 Forbidden)", async () => {
      const res = await apiRequest(`/api/v1/invoices/${draftInvoiceId}/void`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tenant101Token}` },
      });
      assert.equal(res.status, 403);
    });

    it("Anti-IDOR: Rejects Accountant B attempting to void Building A invoice (403)", async () => {
      const res = await apiRequest(`/api/v1/invoices/${draftInvoiceId}/void`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accountantBToken}` },
      });
      assert.equal(res.status, 403);
    });

    it("Rejects voiding an ISSUED invoice (400 Bad Request: only DRAFT permitted)", async () => {
      const res = await apiRequest(`/api/v1/invoices/${issuedInvoiceId}/void`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accountantAToken}` },
      });
      assert.equal(res.status, 400);
      assert.match(
        JSON.stringify(res.data),
        /Cannot transition invoice from 'ISSUED' to 'VOID'/i
      );
    });

    it("Allows Accountant A to void a DRAFT invoice (200 OK, status -> VOID)", async () => {
      const res = await apiRequest(`/api/v1/invoices/${draftInvoiceId}/void`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accountantAToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.data.status, INVOICE_STATUS.VOID);

      const dbInv = await Invoice.findById(draftInvoiceId);
      assert.equal(dbInv.status, INVOICE_STATUS.VOID);
    });

    it("Rejects voiding an already VOID invoice (400 Bad Request)", async () => {
      // First void
      await apiRequest(`/api/v1/invoices/${draftInvoiceId}/void`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accountantAToken}` },
      });

      // Second void attempt
      const res = await apiRequest(`/api/v1/invoices/${draftInvoiceId}/void`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accountantAToken}` },
      });
      assert.equal(res.status, 400);
    });
  });

  // =========================================================================
  // 8. HISTORICAL CONFIGURATION IMMUTABILITY
  // =========================================================================
  describe("8. Historical Configuration Immutability", () => {
    it("Publishing a new rate formula does NOT retroactively mutate historical invoices", async () => {
      // Existing September invoice has subTotal: 5800, baseRate: 5000
      const septInvBefore = await Invoice.findOne({
        flatId: FLAT_101_OCCUPIED_ID,
        billingPeriod: "2026-09",
      });
      assert.equal(septInvBefore.subTotal, 5800);
      assert.equal(septInvBefore.configurationSnapshot.baseRate, 5000);

      // Now publish a new rate configuration effective October 1st: baseRate increases to 7000
      await MaintenanceConfiguration.create({
        buildingId: BUILDING_A_ID,
        chargeType: CHARGE_TYPES.FLAT_RATE,
        baseRate: 7000,
        parkingCharge: 600,
        waterCharge: 400,
        lateFeePercentage: 5.0,
        gracePeriodDays: 10,
        effectiveFrom: new Date("2026-10-01"),
        isActive: true,
      });

      // Re-read September invoice
      const septInvAfter = await Invoice.findOne({
        flatId: FLAT_101_OCCUPIED_ID,
        billingPeriod: "2026-09",
      });

      // Must remain completely identical
      assert.equal(septInvAfter.subTotal, 5800);
      assert.equal(septInvAfter.totalAmount, 5800);
      assert.equal(septInvAfter.configurationSnapshot.baseRate, 5000);
    });
  });

  // =========================================================================
  // 9. DOWNSTREAM PAYMENT LIFECYCLE COMPATIBILITY
  // =========================================================================
  describe("9. Payment Lifecycle Compatibility Simulation", () => {
    it("Verifies invoice balance updates under partial and full settlement simulation", async () => {
      const inv = await Invoice.findOne({
        flatId: FLAT_101_OCCUPIED_ID,
        billingPeriod: "2026-09",
      });

      // Initial state
      assert.equal(inv.status, INVOICE_STATUS.ISSUED);
      assert.equal(inv.totalAmount, 5800);
      assert.equal(inv.paidAmount, 0);
      assert.equal(inv.dueAmount, 5800);

      // Downstream Payment simulation step 1: Partial payment of 2000
      inv.paidAmount += 2000;
      inv.dueAmount = Math.max(0, inv.totalAmount - inv.paidAmount);
      inv.status = INVOICE_STATUS.PARTIALLY_PAID;
      await inv.save();

      const partialInv = await Invoice.findById(inv._id);
      assert.equal(partialInv.status, INVOICE_STATUS.PARTIALLY_PAID);
      assert.equal(partialInv.paidAmount, 2000);
      assert.equal(partialInv.dueAmount, 3800);

      // Downstream Payment simulation step 2: Settle remaining 3800
      partialInv.paidAmount += 3800;
      partialInv.dueAmount = Math.max(
        0,
        partialInv.totalAmount - partialInv.paidAmount
      );
      partialInv.status = INVOICE_STATUS.PAID;
      partialInv.paidAt = new Date();
      await partialInv.save();

      const paidInv = await Invoice.findById(inv._id);
      assert.equal(paidInv.status, INVOICE_STATUS.PAID);
      assert.equal(paidInv.paidAmount, 5800);
      assert.equal(paidInv.dueAmount, 0);
      assert.ok(paidInv.paidAt);
    });
  });
});
