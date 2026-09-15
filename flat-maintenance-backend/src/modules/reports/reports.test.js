// =====================  IMPORTS & TEST RUNNER  =============
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Building } from "../../models/building.model.js";
import { Flat } from "../../models/flat.model.js";
import { User } from "../../models/user.model.js";
import { Invoice } from "../invoices/invoices.model.js";
import { INVOICE_STATUS } from "../invoices/invoices.constants.js";
import { Staff } from "../staff/staff.model.js";
import { STAFF_CONSTANTS } from "../staff/staff.constants.js";
import { MaintenanceRequest } from "../maintenance-requests/maintenance-requests.model.js";
import {
  MAINTENANCE_REQUEST_STATUS,
  MAINTENANCE_REQUEST_CATEGORY,
  MAINTENANCE_REQUEST_PRIORITY,
} from "../maintenance-requests/maintenance-requests.constants.js";
import { Complaint } from "../complaints/complaints.model.js";
import {
  COMPLAINT_STATUS,
  COMPLAINT_TYPE,
} from "../complaints/complaints.constants.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { generateAccessToken } from "../../utils/token.util.js";
import { rolesService } from "../roles/roles.service.js";
import {
  calculateCollectionRate,
  calculateResolutionVelocityHours,
  calculateSlaComplianceRate,
} from "./reports.constants.js";

// =====================  TEST SETUP & FIXTURES  =============
dotenv.config();

let server;
let baseUrl;

// Fixture ObjectIds
const BUILDING_A_ID = new mongoose.Types.ObjectId();
const BUILDING_B_ID = new mongoose.Types.ObjectId();

const FLAT_A_101_ID = new mongoose.Types.ObjectId();
const FLAT_A_102_ID = new mongoose.Types.ObjectId();
const FLAT_A_103_ID = new mongoose.Types.ObjectId();
const FLAT_A_104_ID = new mongoose.Types.ObjectId();
const FLAT_B_201_ID = new mongoose.Types.ObjectId();

const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_A_ID = new mongoose.Types.ObjectId();
const MANAGER_A_ID = new mongoose.Types.ObjectId();
const MANAGER_B_ID = new mongoose.Types.ObjectId();
const ACCOUNTANT_A_ID = new mongoose.Types.ObjectId();
const OWNER_A_101_ID = new mongoose.Types.ObjectId();
const TENANT_A_102_ID = new mongoose.Types.ObjectId();
const SECURITY_STAFF_A_ID = new mongoose.Types.ObjectId();

const TECH_USER_1_ID = new mongoose.Types.ObjectId();
const TECH_USER_2_ID = new mongoose.Types.ObjectId();
const STAFF_TECH_1_ID = new mongoose.Types.ObjectId();
const STAFF_TECH_2_ID = new mongoose.Types.ObjectId();

// JWT Tokens
let superAdminToken;
let buildingAdminAToken;
let managerAToken;
let managerBToken;
let accountantAToken;
let ownerA101Token;
let tenantA102Token;
let securityStaffAToken;

/**
 * Helper to execute HTTP JSON requests against test server.
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
describe("Module 23: Reports & Analytics Engine (reports)", () => {
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
      Invoice.deleteMany({}),
      Staff.deleteMany({}),
      MaintenanceRequest.deleteMany({}),
      Complaint.deleteMany({}),
      Building.deleteMany({}),
      Flat.deleteMany({}),
      User.deleteMany({}),
    ]);

    // Seed test buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Emerald Heights Tower A",
        code: `RPTA-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Analytics Way",
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
        code: `RPTB-${Date.now().toString().slice(-4)}`,
        address: {
          street: "200 Analytics Court",
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
        _id: FLAT_A_103_ID,
        buildingId: BUILDING_A_ID,
        blockId: new mongoose.Types.ObjectId(),
        floorId: new mongoose.Types.ObjectId(),
        flatNumber: "A-103",
        floorNumber: 1,
        areaSqFt: 1000,
        flatType: "2BHK",
        status: "OCCUPIED",
        isDeleted: false,
      },
      {
        _id: FLAT_A_104_ID,
        buildingId: BUILDING_A_ID,
        blockId: new mongoose.Types.ObjectId(),
        floorId: new mongoose.Types.ObjectId(),
        flatNumber: "A-104",
        floorNumber: 1,
        areaSqFt: 1050,
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
        email: "super.reports@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: BUILDING_ADMIN_A_ID,
        firstName: "Building",
        lastName: "AdminA",
        email: "badmin.a.reports@test.local",
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
        email: "mgr.a.reports@test.local",
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
        email: "mgr.b.reports@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: ACCOUNTANT_A_ID,
        firstName: "Accountant",
        lastName: "TowerA",
        email: "acct.a.reports@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.ACCOUNTANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: OWNER_A_101_ID,
        firstName: "Owen",
        lastName: "Owner",
        email: "owner.101.reports@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: TENANT_A_102_ID,
        firstName: "Teresa",
        lastName: "Tenant",
        email: "tenant.102.reports@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: SECURITY_STAFF_A_ID,
        firstName: "Sam",
        lastName: "Security",
        email: "sec.a.reports@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SECURITY_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: TECH_USER_1_ID,
        firstName: "Bob",
        lastName: "Builder",
        email: "tech1.reports@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MAINTENANCE_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: TECH_USER_2_ID,
        firstName: "Alice",
        lastName: "Fixer",
        email: "tech2.reports@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MAINTENANCE_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
      },
    ]);

    // Seed Staff profiles
    await Staff.create([
      {
        _id: STAFF_TECH_1_ID,
        userId: TECH_USER_1_ID,
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.ELECTRICIAN,
        designation: "Lead Electrician",
        assignedShift: STAFF_CONSTANTS.SHIFTS.MORNING,
        averageRating: 4.8,
        totalRatingsCount: 15,
        status: STAFF_CONSTANTS.STATUS.ACTIVE,
      },
      {
        _id: STAFF_TECH_2_ID,
        userId: TECH_USER_2_ID,
        buildingId: BUILDING_A_ID,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.PLUMBER,
        designation: "Senior Plumber",
        assignedShift: STAFF_CONSTANTS.SHIFTS.EVENING,
        averageRating: 4.2,
        totalRatingsCount: 8,
        status: STAFF_CONSTANTS.STATUS.ACTIVE,
      },
    ]);

    // Generate JWT access tokens
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

    accountantAToken = generateAccessToken({
      sub: ACCOUNTANT_A_ID.toString(),
      role: ROLES.ACCOUNTANT,
      buildingIds: [BUILDING_A_ID.toString()],
    });

    ownerA101Token = generateAccessToken({
      sub: OWNER_A_101_ID.toString(),
      role: ROLES.OWNER,
    });

    tenantA102Token = generateAccessToken({
      sub: TENANT_A_102_ID.toString(),
      role: ROLES.TENANT,
    });

    securityStaffAToken = generateAccessToken({
      sub: SECURITY_STAFF_A_ID.toString(),
      role: ROLES.SECURITY_STAFF,
      buildingIds: [BUILDING_A_ID.toString()],
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await Promise.all([
      Invoice.deleteMany({}),
      Staff.deleteMany({}),
      MaintenanceRequest.deleteMany({}),
      Complaint.deleteMany({}),
      Building.deleteMany({}),
      Flat.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  // =====================  SUITE 1: MAINTENANCE COLLECTIONS  ===
  describe("GET /api/v1/reports/maintenance-collections", () => {
    beforeEach(async () => {
      await Invoice.deleteMany({});
    });

    it("should return 200 with zero financial totals when no invoices exist for period", async () => {
      const res = await apiRequest(
        `/api/v1/reports/maintenance-collections?buildingId=${BUILDING_A_ID}&period=2026-09`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.buildingId, BUILDING_A_ID.toString());
      assert.equal(res.data.data.period, "2026-09");
      assert.equal(res.data.data.totalInvoices, 0);
      assert.equal(res.data.data.activeInvoicesCount, 0);
      assert.equal(res.data.data.totalBilled, 0);
      assert.equal(res.data.data.totalCollected, 0);
      assert.equal(res.data.data.totalOutstanding, 0);
      assert.equal(res.data.data.totalLateFees, 0);
      assert.equal(res.data.data.collectionRate, 0);
      assert.equal(res.data.data.statusBreakdown.PAID.count, 0);
      assert.equal(res.data.data.statusBreakdown.VOID.count, 0);
    });

    it("should aggregate financial metrics accurately across multiple invoice statuses", async () => {
      // 1. Fully Paid Invoice: 1000 billed, 1000 paid, 0 due
      await Invoice.create({
        invoiceNumber: `INV-${Date.now()}-1`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_101_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Base Maintenance", amount: 1000 }],
        subTotal: 1000,
        totalAmount: 1000,
        dueAmount: 0,
        paidAmount: 1000,
        lateFee: 0,
        dueDate: new Date("2026-09-15"),
        status: INVOICE_STATUS.PAID,
        paidAt: new Date("2026-09-10"),
      });

      // 2. Partially Paid Invoice: 1200 billed, 600 paid, 600 due
      await Invoice.create({
        invoiceNumber: `INV-${Date.now()}-2`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_102_ID,
        ownerId: OWNER_A_101_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Base Maintenance", amount: 1200 }],
        subTotal: 1200,
        totalAmount: 1200,
        dueAmount: 600,
        paidAmount: 600,
        lateFee: 0,
        dueDate: new Date("2026-09-15"),
        status: INVOICE_STATUS.PARTIALLY_PAID,
      });

      // 3. Overdue Invoice with Late Fee: 850 total (800 subTotal + 50 lateFee), 0 paid, 850 due
      await Invoice.create({
        invoiceNumber: `INV-${Date.now()}-3`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_103_ID,
        ownerId: OWNER_A_101_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Base Maintenance", amount: 800 }],
        subTotal: 800,
        totalAmount: 850,
        dueAmount: 850,
        paidAmount: 0,
        lateFee: 50,
        dueDate: new Date("2026-09-15"),
        status: INVOICE_STATUS.OVERDUE,
      });

      // 4. VOID Invoice: 500 total, should not be included in active collections or totalBilled
      await Invoice.create({
        invoiceNumber: `INV-${Date.now()}-4`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_104_ID,
        ownerId: OWNER_A_101_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Base Maintenance", amount: 500 }],
        subTotal: 500,
        totalAmount: 500,
        dueAmount: 500,
        paidAmount: 0,
        lateFee: 0,
        dueDate: new Date("2026-09-15"),
        status: INVOICE_STATUS.VOID,
      });

      // 5. Another Period Invoice (2026-08): Should not be counted in 2026-09
      await Invoice.create({
        invoiceNumber: `INV-${Date.now()}-5`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_101_ID,
        billingPeriod: "2026-08",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Base Maintenance", amount: 999 }],
        subTotal: 999,
        totalAmount: 999,
        dueAmount: 0,
        paidAmount: 999,
        lateFee: 0,
        dueDate: new Date("2026-08-15"),
        status: INVOICE_STATUS.PAID,
      });

      const res = await apiRequest(
        `/api/v1/reports/maintenance-collections?buildingId=${BUILDING_A_ID}&period=2026-09`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      const report = res.data.data;

      // Total invoices matching 2026-09 is 4 (including VOID)
      assert.equal(report.totalInvoices, 4);
      assert.equal(report.activeInvoicesCount, 3);

      // totalBilled = 1000 + 1200 + 850 = 3050
      assert.equal(report.totalBilled, 3050);
      // totalCollected = 1000 + 600 + 0 = 1600
      assert.equal(report.totalCollected, 1600);
      // totalOutstanding = 0 + 600 + 850 = 1450
      assert.equal(report.totalOutstanding, 1450);
      // totalLateFees = 50
      assert.equal(report.totalLateFees, 50);

      // collectionRate = (1600 / 3050) * 100 = 52.46%
      assert.equal(report.collectionRate, 52.46);

      // Status breakdown
      assert.equal(report.statusBreakdown.PAID.count, 1);
      assert.equal(report.statusBreakdown.PAID.amount, 1000);
      assert.equal(report.statusBreakdown.PARTIALLY_PAID.count, 1);
      assert.equal(report.statusBreakdown.PARTIALLY_PAID.amount, 1200);
      assert.equal(report.statusBreakdown.OVERDUE.count, 1);
      assert.equal(report.statusBreakdown.OVERDUE.amount, 850);
      assert.equal(report.statusBreakdown.VOID.count, 1);
    });

    it("should allow Building Admin and Super Admin to retrieve collections report", async () => {
      const adminRes = await apiRequest(
        `/api/v1/reports/maintenance-collections?buildingId=${BUILDING_A_ID}&period=2026-09`,
        {
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        }
      );
      assert.equal(adminRes.status, 200);

      const superRes = await apiRequest(
        `/api/v1/reports/maintenance-collections?buildingId=${BUILDING_A_ID}&period=2026-09`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );
      assert.equal(superRes.status, 200);
    });

    it("should reject Manager with 403 Forbidden (Manager lacks INVOICE_READ)", async () => {
      const res = await apiRequest(
        `/api/v1/reports/maintenance-collections?buildingId=${BUILDING_A_ID}&period=2026-09`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );
      assert.equal(res.status, 403);
    });

    it("should reject Tenant and Owner with 403 Forbidden (lacks administrative reporting rights)", async () => {
      const tenantRes = await apiRequest(
        `/api/v1/reports/maintenance-collections?buildingId=${BUILDING_A_ID}&period=2026-09`,
        {
          headers: { Authorization: `Bearer ${tenantA102Token}` },
        }
      );
      assert.equal(tenantRes.status, 403);

      const ownerRes = await apiRequest(
        `/api/v1/reports/maintenance-collections?buildingId=${BUILDING_A_ID}&period=2026-09`,
        {
          headers: { Authorization: `Bearer ${ownerA101Token}` },
        }
      );
      assert.equal(ownerRes.status, 403);

      const secRes = await apiRequest(
        `/api/v1/reports/maintenance-collections?buildingId=${BUILDING_A_ID}&period=2026-09`,
        {
          headers: { Authorization: `Bearer ${securityStaffAToken}` },
        }
      );
      assert.equal(secRes.status, 403);
    });

    it("should reject with 403 when Accountant queries a building they are not assigned to", async () => {
      const res = await apiRequest(
        `/api/v1/reports/maintenance-collections?buildingId=${BUILDING_B_ID}&period=2026-09`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );
      assert.equal(res.status, 403);
    });

    it("should reject unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest(
        `/api/v1/reports/maintenance-collections?buildingId=${BUILDING_A_ID}&period=2026-09`
      );
      assert.equal(res.status, 401);
    });

    it("should fail validation with 400 for invalid billing period format", async () => {
      const res = await apiRequest(
        `/api/v1/reports/maintenance-collections?buildingId=${BUILDING_A_ID}&period=2026-13`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );
      assert.equal(res.status, 400);
    });

    it("should fail validation with 400 for unexpected query parameters", async () => {
      const res = await apiRequest(
        `/api/v1/reports/maintenance-collections?buildingId=${BUILDING_A_ID}&period=2026-09&extra=bad`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );
      assert.equal(res.status, 400);
    });
  });

  // =====================  SUITE 2: STAFF PERFORMANCE  =========
  describe("GET /api/v1/reports/staff-performance", () => {
    beforeEach(async () => {
      await MaintenanceRequest.deleteMany({});
    });

    it("should return 200 with zero technicians when no staff exist for building", async () => {
      const res = await apiRequest(
        `/api/v1/reports/staff-performance?buildingId=${BUILDING_B_ID}`,
        {
          headers: { Authorization: `Bearer ${managerBToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.totalStaff, 0);
      assert.equal(res.data.data.technicians.length, 0);
    });

    it("should aggregate resolution velocity, SLA compliance rate, and ratings accurately", async () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const futureSla = new Date(now.getTime() + 5 * 60 * 60 * 1000);
      const pastSla = new Date(now.getTime() - 1 * 60 * 60 * 1000);

      // Work Order 1 for Tech 1: Completed on time (completed 2 hours ago, deadline was future)
      await MaintenanceRequest.create({
        requestNumber: `MR-${Date.now()}-1`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        createdById: OWNER_A_101_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.ELECTRICAL,
        priority: MAINTENANCE_REQUEST_PRIORITY.HIGH,
        title: "Main fuse tripped in apartment",
        description: "Frequent circuit tripping in kitchen",
        assignedStaffId: STAFF_TECH_1_ID,
        status: MAINTENANCE_REQUEST_STATUS.COMPLETED,
        startedAt: fourHoursAgo,
        completedAt: twoHoursAgo,
        slaDeadline: futureSla,
      });

      // Work Order 2 for Tech 1: Completed LATE (completed at now, deadline was 1 hour ago)
      await MaintenanceRequest.create({
        requestNumber: `MR-${Date.now()}-2`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_102_ID,
        createdById: TENANT_A_102_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.ELECTRICAL,
        priority: MAINTENANCE_REQUEST_PRIORITY.MEDIUM,
        title: "Dimmer switch replacement",
        description: "Living room dimmer flickers",
        assignedStaffId: STAFF_TECH_1_ID,
        status: MAINTENANCE_REQUEST_STATUS.COMPLETED,
        startedAt: fourHoursAgo,
        completedAt: now,
        slaDeadline: pastSla,
      });

      // Work Order 3 for Tech 1: Still IN_PROGRESS
      await MaintenanceRequest.create({
        requestNumber: `MR-${Date.now()}-3`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        createdById: OWNER_A_101_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.ELECTRICAL,
        priority: MAINTENANCE_REQUEST_PRIORITY.LOW,
        title: "Balcony light fixture",
        description: "Install outdoor LED fixture",
        assignedStaffId: STAFF_TECH_1_ID,
        status: MAINTENANCE_REQUEST_STATUS.IN_PROGRESS,
        startedAt: twoHoursAgo,
        slaDeadline: futureSla,
      });

      // Work Order 4 for Tech 2: OPEN, unstarted
      await MaintenanceRequest.create({
        requestNumber: `MR-${Date.now()}-4`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        createdById: OWNER_A_101_ID,
        category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
        priority: MAINTENANCE_REQUEST_PRIORITY.MEDIUM,
        title: "Bathroom sink blockage",
        description: "Water draining very slowly",
        assignedStaffId: STAFF_TECH_2_ID,
        status: MAINTENANCE_REQUEST_STATUS.OPEN,
        slaDeadline: futureSla,
      });

      const res = await apiRequest(
        `/api/v1/reports/staff-performance?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      const report = res.data.data;

      assert.equal(report.totalStaff, 2);
      assert.equal(report.summary.totalAssignedWorkOrders, 4);
      assert.equal(report.summary.totalCompletedWorkOrders, 2);

      // Technicians list
      const tech1 = report.technicians.find(
        (t) => t.staffId === STAFF_TECH_1_ID.toString()
      );
      assert.ok(tech1);
      assert.equal(tech1.totalAssigned, 3);
      assert.equal(tech1.totalCompleted, 2);
      assert.equal(tech1.inProgress, 1);
      assert.equal(tech1.open, 0);
      // Tech 1 has 1 on-time out of 2 completed -> 50% SLA compliance
      assert.equal(tech1.slaComplianceRate, 50);
      // Tech 1 resolution durations: Order 1 = 2 hrs, Order 2 = 4 hrs -> avg = 3.00 hrs
      assert.equal(tech1.averageResolutionHours, 3);
      assert.equal(tech1.averageRating, 4.8);

      const tech2 = report.technicians.find(
        (t) => t.staffId === STAFF_TECH_2_ID.toString()
      );
      assert.ok(tech2);
      assert.equal(tech2.totalAssigned, 1);
      assert.equal(tech2.totalCompleted, 0);
      assert.equal(tech2.open, 1);
      assert.equal(tech2.averageResolutionHours, 0);
      assert.equal(tech2.slaComplianceRate, 0);
      assert.equal(tech2.averageRating, 4.2);
    });

    it("should allow Building Admin and Super Admin to access staff performance report", async () => {
      const adminRes = await apiRequest(
        `/api/v1/reports/staff-performance?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        }
      );
      assert.equal(adminRes.status, 200);

      const superRes = await apiRequest(
        `/api/v1/reports/staff-performance?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );
      assert.equal(superRes.status, 200);
    });

    it("should reject Accountant with 403 Forbidden (Accountant lacks STAFF_ASSIGN)", async () => {
      const res = await apiRequest(
        `/api/v1/reports/staff-performance?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );
      assert.equal(res.status, 403);
    });

    it("should reject Manager when querying an unassigned building", async () => {
      const res = await apiRequest(
        `/api/v1/reports/staff-performance?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${managerBToken}` },
        }
      );
      assert.equal(res.status, 403);
    });

    it("should reject unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest(
        `/api/v1/reports/staff-performance?buildingId=${BUILDING_A_ID}`
      );
      assert.equal(res.status, 401);
    });

    it("should fail validation with 400 for invalid buildingId parameter", async () => {
      const res = await apiRequest(
        `/api/v1/reports/staff-performance?buildingId=12345notvalid`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );
      assert.equal(res.status, 400);
    });
  });

  // =====================  SUITE 3: COMPLAINT SLA  =============
  describe("GET /api/v1/reports/complaint-sla", () => {
    beforeEach(async () => {
      await Complaint.deleteMany({});
    });

    it("should return 200 with zero metrics when no complaints exist", async () => {
      const res = await apiRequest(
        `/api/v1/reports/complaint-sla?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      const report = res.data.data;
      assert.equal(report.buildingId, BUILDING_A_ID.toString());
      assert.equal(report.totalComplaints, 0);
      assert.equal(report.resolutionRate, 0);
      assert.equal(report.averageResolutionHours, 0);
      assert.equal(report.unresolvedAverageAgeHours, 0);
      assert.equal(report.statusBreakdown.OPEN, 0);
      assert.equal(report.statusBreakdown.RESOLVED, 0);
    });

    it("should calculate turnaround velocity, resolution rate, and aging for complaints", async () => {
      const now = new Date();
      const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Complaint 1: RESOLVED, took 6 hours (started 10 hours ago, resolved 4 hours ago)
      const c1 = new Complaint({
        complaintNumber: `CMP-${Date.now()}-1`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        createdById: OWNER_A_101_ID,
        type: COMPLAINT_TYPE.NOISE_DISTURBANCE,
        title: "Late night excessive loud music",
        description: "Loud party music from unit above late into the night",
        status: COMPLAINT_STATUS.RESOLVED,
        resolvedById: MANAGER_A_ID,
        resolvedAt: fourHoursAgo,
        createdAt: tenHoursAgo,
      });
      await c1.save({ timestamps: false });

      // Complaint 2: RESOLVED, took 2 hours (started 4 hours ago, resolved 2 hours ago)
      const c2 = new Complaint({
        complaintNumber: `CMP-${Date.now()}-2`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_102_ID,
        createdById: TENANT_A_102_ID,
        type: COMPLAINT_TYPE.PARKING_DISPUTE,
        title: "Unauthorized car in assigned bay",
        description: "Visitor vehicle parked in bay 102 without pass",
        status: COMPLAINT_STATUS.RESOLVED,
        resolvedById: MANAGER_A_ID,
        resolvedAt: twoHoursAgo,
        createdAt: fourHoursAgo,
      });
      await c2.save({ timestamps: false });

      // Complaint 3: OPEN (created 10 hours ago, still unresolved)
      const c3 = new Complaint({
        complaintNumber: `CMP-${Date.now()}-3`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        createdById: OWNER_A_101_ID,
        type: COMPLAINT_TYPE.SECURITY_BREACH,
        title: "Broken security gate latch",
        description: "Back pedestrian gate does not lock properly",
        status: COMPLAINT_STATUS.OPEN,
        createdAt: tenHoursAgo,
      });
      await c3.save({ timestamps: false });

      const res = await apiRequest(
        `/api/v1/reports/complaint-sla?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      const report = res.data.data;

      assert.equal(report.totalComplaints, 3);
      // Resolution rate = 2 / 3 = 66.67%
      assert.equal(report.resolutionRate, 66.67);
      // Average resolution hours = (6 + 2) / 2 = 4.00 hours
      assert.equal(report.averageResolutionHours, 4);

      // Status breakdown
      assert.equal(report.statusBreakdown.RESOLVED, 2);
      assert.equal(report.statusBreakdown.OPEN, 1);
      assert.equal(report.statusBreakdown.UNDER_INVESTIGATION, 0);

      // Type breakdown
      assert.equal(report.typeBreakdown.NOISE_DISTURBANCE, 1);
      assert.equal(report.typeBreakdown.PARKING_DISPUTE, 1);
      assert.equal(report.typeBreakdown.SECURITY_BREACH, 1);

      // Unresolved aging: 1 open ticket around 10 hours old
      assert.ok(report.unresolvedAverageAgeHours >= 9.9);
    });

    it("should allow Building Admin and Super Admin to access complaint SLA report", async () => {
      const adminRes = await apiRequest(
        `/api/v1/reports/complaint-sla?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        }
      );
      assert.equal(adminRes.status, 200);

      const superRes = await apiRequest(
        `/api/v1/reports/complaint-sla?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );
      assert.equal(superRes.status, 200);
    });

    it("should reject Accountant and Tenant with 403 Forbidden (administrative reporting restricted)", async () => {
      const acctRes = await apiRequest(
        `/api/v1/reports/complaint-sla?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );
      assert.equal(acctRes.status, 403);

      const tenantRes = await apiRequest(
        `/api/v1/reports/complaint-sla?buildingId=${BUILDING_A_ID}`,
        {
          headers: { Authorization: `Bearer ${tenantA102Token}` },
        }
      );
      assert.equal(tenantRes.status, 403);
    });

    it("should reject unauthenticated request with 401 Unauthorized", async () => {
      const res = await apiRequest(
        `/api/v1/reports/complaint-sla?buildingId=${BUILDING_A_ID}`
      );
      assert.equal(res.status, 401);
    });

    it("should fail validation with 400 for unexpected query parameters", async () => {
      const res = await apiRequest(
        `/api/v1/reports/complaint-sla?buildingId=${BUILDING_A_ID}&filter=unknown`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );
      assert.equal(res.status, 400);
    });
  });

  // =====================  SUITE 4: PURE ANALYTICAL HELPERS  ===
  describe("Pure Analytical Helpers Unit Tests", () => {
    it("calculateCollectionRate: should handle zero billed without throwing or producing NaN", () => {
      assert.equal(calculateCollectionRate(0, 0), 0);
      assert.equal(calculateCollectionRate(500, 0), 0);
      assert.equal(calculateCollectionRate(500, -100), 0);
      assert.equal(calculateCollectionRate(250, 1000), 25);
      assert.equal(calculateCollectionRate(333.33, 1000), 33.33);
    });

    it("calculateResolutionVelocityHours: should handle edge cases gracefully", () => {
      assert.equal(calculateResolutionVelocityHours(null, null), 0);
      assert.equal(calculateResolutionVelocityHours("invalid", "invalid"), 0);
      // Completed before started
      assert.equal(
        calculateResolutionVelocityHours(
          "2026-09-11T10:00:00Z",
          "2026-09-11T09:00:00Z"
        ),
        0
      );
      // Exactly 2.5 hours
      assert.equal(
        calculateResolutionVelocityHours(
          "2026-09-11T10:00:00Z",
          "2026-09-11T12:30:00Z"
        ),
        2.5
      );
    });

    it("calculateSlaComplianceRate: should handle zero denominator safely", () => {
      assert.equal(calculateSlaComplianceRate(0, 0), 0);
      assert.equal(calculateSlaComplianceRate(5, 0), 0);
      assert.equal(calculateSlaComplianceRate(8, 10), 80);
      assert.equal(calculateSlaComplianceRate(1, 3), 33.33);
    });
  });
});
