// =====================  IMPORTS & TEST RUNNER  =============
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Expense } from "./expenses.model.js";
import { EXPENSE_CATEGORY, EXPENSE_STATUS } from "./expenses.constants.js";
import { Building } from "../../models/building.model.js";
import { User } from "../../models/user.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { generateAccessToken } from "../../utils/token.util.js";
import { rolesService } from "../roles/roles.service.js";

// =====================  TEST SETUP & FIXTURES  =============
dotenv.config();

let server;
let baseUrl;

// Fixture ObjectIds
const BUILDING_A_ID = new mongoose.Types.ObjectId();
const BUILDING_B_ID = new mongoose.Types.ObjectId();
const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_A_ID = new mongoose.Types.ObjectId();
const ACCOUNTANT_A_ID = new mongoose.Types.ObjectId();
const MANAGER_B_ID = new mongoose.Types.ObjectId();
const RESIDENT_A_ID = new mongoose.Types.ObjectId();

// JWT Tokens
let superAdminToken;
let buildingAdminAToken;
let accountantAToken;
let managerBToken;
let residentAToken;

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
describe("Module 20: Society Operational Expenses (expenses)", () => {
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
      Expense.deleteMany({}),
      Building.deleteMany({}),
      User.deleteMany({}),
    ]);

    // Seed test buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Emerald Heights Tower A",
        code: `EHTA-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Financial Boulevard",
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
          street: "200 Treasury Court",
          city: "Metropolis",
          state: "NY",
          postalCode: "10001",
          country: "USA",
        },
        status: "ACTIVE",
        isDeleted: false,
      },
    ]);

    // Seed test users
    await User.create([
      {
        _id: SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: "super.expenses@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: BUILDING_ADMIN_A_ID,
        firstName: "Building",
        lastName: "AdminA",
        email: "badmin.a.expenses@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: ACCOUNTANT_A_ID,
        firstName: "Accountant",
        lastName: "TowerA",
        email: "acct.a.expenses@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.ACCOUNTANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: MANAGER_B_ID,
        firstName: "Manager",
        lastName: "TowerB",
        email: "mgr.b.expenses@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
      },
      {
        _id: RESIDENT_A_ID,
        firstName: "Resident",
        lastName: "Alice",
        email: "resident.a.expenses@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
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

    accountantAToken = generateAccessToken({
      sub: ACCOUNTANT_A_ID.toString(),
      role: ROLES.ACCOUNTANT,
      buildingIds: [BUILDING_A_ID.toString()],
    });

    managerBToken = generateAccessToken({
      sub: MANAGER_B_ID.toString(),
      role: ROLES.MANAGER,
      buildingIds: [BUILDING_B_ID.toString()],
    });

    residentAToken = generateAccessToken({
      sub: RESIDENT_A_ID.toString(),
      role: ROLES.TENANT,
    });

    await Expense.syncIndexes();
  });

  after(async () => {
    await Promise.all([
      Expense.deleteMany({}),
      Building.deleteMany({}),
      User.deleteMany({}),
    ]);
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Expense.deleteMany({});
  });

  // =====================  SUITE 1: SCHEMA & MODEL  ===========
  describe("1. Schema, Model & Index Invariants", () => {
    it("should reject creation when required fields are missing", async () => {
      const doc = new Expense({});
      let err;
      try {
        await doc.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err, "Validation error expected");
      assert.ok(err.errors.expenseNumber);
      assert.ok(err.errors.buildingId);
      assert.ok(err.errors.title);
      assert.ok(err.errors.vendorName);
      assert.ok(err.errors.category);
      assert.ok(err.errors.amount);
      assert.ok(err.errors.expenseDate);
      assert.ok(err.errors.createdById);
    });

    it("should reject invalid category enum values", async () => {
      const doc = new Expense({
        expenseNumber: "EXP-2026-0001",
        buildingId: BUILDING_A_ID,
        title: "Lift Repair",
        vendorName: "Otis Elevators",
        category: "INVALID_CAT",
        amount: 500,
        expenseDate: new Date(),
        createdById: ACCOUNTANT_A_ID,
      });
      let err;
      try {
        await doc.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err);
      assert.ok(err.errors.category);
    });

    it("should reject negative or zero amount", async () => {
      const docZero = new Expense({
        expenseNumber: "EXP-2026-0001",
        buildingId: BUILDING_A_ID,
        title: "Diesel Generator Fuel",
        vendorName: "Shell Fuel",
        category: EXPENSE_CATEGORY.UTILITIES,
        amount: 0,
        expenseDate: new Date(),
        createdById: ACCOUNTANT_A_ID,
      });
      let errZero;
      try {
        await docZero.validate();
      } catch (e) {
        errZero = e;
      }
      assert.ok(errZero);
      assert.ok(errZero.errors.amount);
    });

    it("should reject amount exceeding 2 decimal places", async () => {
      const docFraction = new Expense({
        expenseNumber: "EXP-2026-0001",
        buildingId: BUILDING_A_ID,
        title: "Cleaning Detergent",
        vendorName: "CleanCorp",
        category: EXPENSE_CATEGORY.CLEANING_SUPPLIES,
        amount: 145.555,
        expenseDate: new Date(),
        createdById: ACCOUNTANT_A_ID,
      });
      let errFraction;
      try {
        await docFraction.validate();
      } catch (e) {
        errFraction = e;
      }
      assert.ok(errFraction);
      assert.ok(errFraction.errors.amount);
    });

    it("should initialize with default status PENDING_APPROVAL and approvedById null", async () => {
      const doc = await Expense.create({
        expenseNumber: `EXP-2026-INIT-${Date.now().toString().slice(-4)}`,
        buildingId: BUILDING_A_ID,
        title: "Annual Lift AMC",
        vendorName: "Schindler Lifts",
        category: EXPENSE_CATEGORY.MAINTENANCE_AMC,
        amount: 2500.0,
        expenseDate: new Date(),
        createdById: ACCOUNTANT_A_ID,
      });

      assert.strictEqual(doc.status, EXPENSE_STATUS.PENDING_APPROVAL);
      assert.strictEqual(doc.approvedById, null);
    });

    it("should verify unique index on expenseNumber and compound indexes", async () => {
      const indexes = await Expense.collection.indexes();
      const uniqueNumIdx = indexes.find(
        (idx) => idx.key && idx.key.expenseNumber === 1 && idx.unique
      );
      assert.ok(uniqueNumIdx, "Expected unique index on expenseNumber");

      const ledgerIdx = indexes.find(
        (idx) =>
          idx.key && idx.key.buildingId === 1 && idx.key.expenseDate === -1
      );
      assert.ok(ledgerIdx, "Expected compound ledger index");
    });

    it("should sanitize output via toSafeExpense()", async () => {
      const doc = await Expense.create({
        expenseNumber: `EXP-2026-SAFE-${Date.now().toString().slice(-4)}`,
        buildingId: BUILDING_A_ID,
        title: "Security Guard Wages",
        vendorName: "Shield Security Ltd",
        category: EXPENSE_CATEGORY.SECURITY_SALARIES,
        amount: 4800.5,
        receiptUrl:
          "https://res.cloudinary.com/society/image/upload/v1/receipt.pdf",
        expenseDate: new Date("2026-09-01T00:00:00Z"),
        createdById: ACCOUNTANT_A_ID,
      });

      const safe = doc.toSafeExpense();
      assert.strictEqual(safe._id, doc._id.toString());
      assert.strictEqual(safe.id, doc._id.toString());
      assert.strictEqual(safe.expenseNumber, doc.expenseNumber);
      assert.strictEqual(safe.buildingId, BUILDING_A_ID.toString());
      assert.strictEqual(safe.createdById, ACCOUNTANT_A_ID.toString());
      assert.strictEqual(safe.approvedById, null);
      assert.strictEqual(safe.status, EXPENSE_STATUS.PENDING_APPROVAL);
      assert.strictEqual(safe.receiptUrl, doc.receiptUrl);
      assert.strictEqual(safe.__v, undefined);
    });
  });

  // =====================  SUITE 2: CREATE EXPENSE  ===========
  describe("2. Record Operational Expense (POST /api/v1/expenses)", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await apiRequest("/api/v1/expenses", {
        method: "POST",
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Water Tank Cleaning",
          vendorName: "AquaClean",
          category: EXPENSE_CATEGORY.MAINTENANCE_AMC,
          amount: 600,
          expenseDate: "2026-09-10T10:00:00Z",
        },
      });
      assert.strictEqual(res.status, 401);
    });

    it("should reject unauthorized roles (Resident / Tenant) with 403", async () => {
      const res = await apiRequest("/api/v1/expenses", {
        method: "POST",
        headers: { Authorization: `Bearer ${residentAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Unauthorized Expense",
          vendorName: "Vendor X",
          category: EXPENSE_CATEGORY.OTHER,
          amount: 100,
          expenseDate: "2026-09-10T10:00:00Z",
        },
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
    });

    it("should enforce building OBAC: reject Accountant A attempting to record expense for Building B with 403", async () => {
      const res = await apiRequest("/api/v1/expenses", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_B_ID.toString(), // Accountant A is only assigned to Building A
          title: "CCTV Servicing",
          vendorName: "VisionTech",
          category: EXPENSE_CATEGORY.REPAIRS,
          amount: 350.0,
          expenseDate: "2026-09-10T10:00:00Z",
        },
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /outside your assigned building complex/i);
    });

    it("should return 404 when target building does not exist", async () => {
      const nonExistentBuildingId = new mongoose.Types.ObjectId();
      const res = await apiRequest("/api/v1/expenses", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          buildingId: nonExistentBuildingId.toString(),
          title: "Ghost Building Expense",
          vendorName: "Vendor",
          category: EXPENSE_CATEGORY.OTHER,
          amount: 200,
          expenseDate: "2026-09-10T10:00:00Z",
        },
      });
      assert.strictEqual(res.status, 404);
    });

    it("should successfully record expense for authorized Accountant A (201 Created)", async () => {
      const res = await apiRequest("/api/v1/expenses", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Transformer Oil Replacement",
          vendorName: "Grid Power Services",
          category: EXPENSE_CATEGORY.UTILITIES,
          amount: 1250.75,
          receiptUrl:
            "https://res.cloudinary.com/society/image/upload/v1/inv-1250.pdf",
          expenseDate: "2026-09-08T09:30:00Z",
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.expenseNumber);
      assert.match(res.data.data.expenseNumber, /^EXP-\d{4}-\d{4}$/);
      assert.strictEqual(res.data.data.buildingId, BUILDING_A_ID.toString());
      assert.strictEqual(res.data.data.amount, 1250.75);
      assert.strictEqual(res.data.data.status, EXPENSE_STATUS.PENDING_APPROVAL);
      assert.strictEqual(res.data.data.createdById, ACCOUNTANT_A_ID.toString());
      assert.strictEqual(res.data.data.approvedById, null);

      // Verify in DB
      const dbDoc = await Expense.findById(res.data.data.id);
      assert.ok(dbDoc);
      assert.strictEqual(dbDoc.status, EXPENSE_STATUS.PENDING_APPROVAL);
    });

    it("should successfully record expense for authorized Manager B on Building B (201 Created)", async () => {
      const res = await apiRequest("/api/v1/expenses", {
        method: "POST",
        headers: { Authorization: `Bearer ${managerBToken}` },
        body: {
          buildingId: BUILDING_B_ID.toString(),
          title: "Fire Extinguisher Refill",
          vendorName: "SafeFire Corp",
          category: EXPENSE_CATEGORY.REPAIRS,
          amount: 420.0,
          expenseDate: "2026-09-09T14:00:00Z",
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.buildingId, BUILDING_B_ID.toString());
      assert.strictEqual(res.data.data.createdById, MANAGER_B_ID.toString());
    });

    it("should strictly reject mass assignment status injection", async () => {
      const res = await apiRequest("/api/v1/expenses", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Hacked Legal Expense",
          vendorName: "Law Corp",
          category: EXPENSE_CATEGORY.LEGAL,
          amount: 5000.0,
          expenseDate: "2026-09-10T10:00:00Z",
          status: "APPROVED", // Malicious injection
          approvedById: SUPER_ADMIN_ID.toString(), // Malicious injection
          expenseNumber: "EXP-9999-9999", // Malicious injection
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });

    it("should reject invalid amount or date formatting", async () => {
      const resBadAmount = await apiRequest("/api/v1/expenses", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Negative Expense",
          vendorName: "Vendor",
          category: EXPENSE_CATEGORY.OTHER,
          amount: -50.0,
          expenseDate: "2026-09-10T10:00:00Z",
        },
      });
      assert.strictEqual(resBadAmount.status, 400);

      const resBadDate = await apiRequest("/api/v1/expenses", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          buildingId: BUILDING_A_ID.toString(),
          title: "Bad Date Expense",
          vendorName: "Vendor",
          category: EXPENSE_CATEGORY.OTHER,
          amount: 100.0,
          expenseDate: "not-a-real-date",
        },
      });
      assert.strictEqual(resBadDate.status, 400);
    });
  });

  // =====================  SUITE 3: LIST EXPENSES  ============
  describe("3. Query Expenses Ledger (GET /api/v1/expenses)", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await apiRequest("/api/v1/expenses");
      assert.strictEqual(res.status, 401);
    });

    it("should reject resident role with 403 (financial confidentiality)", async () => {
      const res = await apiRequest("/api/v1/expenses", {
        headers: { Authorization: `Bearer ${residentAToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it("should strictly enforce building OBAC: Accountant A only sees Building A expenses", async () => {
      // Seed 3 expenses for Building A
      await Expense.create([
        {
          expenseNumber: `EXP-2026-A1-${Date.now().toString().slice(-4)}`,
          buildingId: BUILDING_A_ID,
          title: "Building A Utilities",
          vendorName: "City Power",
          category: EXPENSE_CATEGORY.UTILITIES,
          amount: 800.0,
          expenseDate: new Date("2026-09-02"),
          createdById: ACCOUNTANT_A_ID,
        },
        {
          expenseNumber: `EXP-2026-A2-${Date.now().toString().slice(-4)}`,
          buildingId: BUILDING_A_ID,
          title: "Building A Cleaning",
          vendorName: "CleanCorp",
          category: EXPENSE_CATEGORY.CLEANING_SUPPLIES,
          amount: 300.0,
          expenseDate: new Date("2026-09-04"),
          createdById: ACCOUNTANT_A_ID,
        },
        {
          expenseNumber: `EXP-2026-A3-${Date.now().toString().slice(-4)}`,
          buildingId: BUILDING_A_ID,
          title: "Building A Repairs",
          vendorName: "FixIt",
          category: EXPENSE_CATEGORY.REPAIRS,
          amount: 450.0,
          expenseDate: new Date("2026-09-06"),
          createdById: ACCOUNTANT_A_ID,
        },
      ]);

      // Seed 2 expenses for Building B
      await Expense.create([
        {
          expenseNumber: `EXP-2026-B1-${Date.now().toString().slice(-4)}`,
          buildingId: BUILDING_B_ID,
          title: "Building B Security",
          vendorName: "Shield Corp",
          category: EXPENSE_CATEGORY.SECURITY_SALARIES,
          amount: 3000.0,
          expenseDate: new Date("2026-09-05"),
          createdById: MANAGER_B_ID,
        },
        {
          expenseNumber: `EXP-2026-B2-${Date.now().toString().slice(-4)}`,
          buildingId: BUILDING_B_ID,
          title: "Building B AMC",
          vendorName: "Kone",
          category: EXPENSE_CATEGORY.MAINTENANCE_AMC,
          amount: 1500.0,
          expenseDate: new Date("2026-09-07"),
          createdById: MANAGER_B_ID,
        },
      ]);

      // Query as Accountant A (assigned to Building A)
      const resA = await apiRequest("/api/v1/expenses", {
        headers: { Authorization: `Bearer ${accountantAToken}` },
      });
      assert.strictEqual(resA.status, 200);
      assert.strictEqual(resA.data.data.pagination.total, 3);
      resA.data.data.items.forEach((item) => {
        assert.strictEqual(item.buildingId, BUILDING_A_ID.toString());
      });

      // Cross-building tamper attempt: Accountant A explicitly requests ?buildingId=BUILDING_B_ID -> 403 Forbidden
      const resTamper = await apiRequest(
        `/api/v1/expenses?buildingId=${BUILDING_B_ID}`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );
      assert.strictEqual(resTamper.status, 403);
      assert.strictEqual(resTamper.data.success, false);

      // Query as Super Admin (global scope sees both buildings)
      const resSuper = await apiRequest("/api/v1/expenses", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      assert.strictEqual(resSuper.status, 200);
      assert.strictEqual(resSuper.data.data.pagination.total, 5);
    });

    it("should filter expenses by category", async () => {
      await Expense.create([
        {
          expenseNumber: `EXP-2026-CAT1-${Date.now().toString().slice(-4)}`,
          buildingId: BUILDING_A_ID,
          title: "Generator Gas",
          vendorName: "GasCo",
          category: EXPENSE_CATEGORY.UTILITIES,
          amount: 500,
          expenseDate: new Date(),
          createdById: ACCOUNTANT_A_ID,
        },
        {
          expenseNumber: `EXP-2026-CAT2-${Date.now().toString().slice(-4)}`,
          buildingId: BUILDING_A_ID,
          title: "Legal Advice",
          vendorName: "Lex Partners",
          category: EXPENSE_CATEGORY.LEGAL,
          amount: 1500,
          expenseDate: new Date(),
          createdById: ACCOUNTANT_A_ID,
        },
      ]);

      const res = await apiRequest(
        `/api/v1/expenses?category=${EXPENSE_CATEGORY.LEGAL}`,
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.pagination.total, 1);
      assert.strictEqual(res.data.data.items[0].category, "LEGAL");
    });

    it("should filter expenses by date range (fromDate, toDate)", async () => {
      await Expense.create([
        {
          expenseNumber: `EXP-2026-D1-${Date.now().toString().slice(-4)}`,
          buildingId: BUILDING_A_ID,
          title: "August Bill",
          vendorName: "Vendor A",
          category: EXPENSE_CATEGORY.UTILITIES,
          amount: 200,
          expenseDate: new Date("2026-08-15T00:00:00Z"),
          createdById: ACCOUNTANT_A_ID,
        },
        {
          expenseNumber: `EXP-2026-D2-${Date.now().toString().slice(-4)}`,
          buildingId: BUILDING_A_ID,
          title: "September Mid Bill",
          vendorName: "Vendor B",
          category: EXPENSE_CATEGORY.UTILITIES,
          amount: 300,
          expenseDate: new Date("2026-09-15T00:00:00Z"),
          createdById: ACCOUNTANT_A_ID,
        },
        {
          expenseNumber: `EXP-2026-D3-${Date.now().toString().slice(-4)}`,
          buildingId: BUILDING_A_ID,
          title: "October Bill",
          vendorName: "Vendor C",
          category: EXPENSE_CATEGORY.UTILITIES,
          amount: 400,
          expenseDate: new Date("2026-10-15T00:00:00Z"),
          createdById: ACCOUNTANT_A_ID,
        },
      ]);

      const res = await apiRequest(
        "/api/v1/expenses?fromDate=2026-09-01T00:00:00Z&toDate=2026-09-30T23:59:59Z",
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.pagination.total, 1);
      assert.strictEqual(res.data.data.items[0].title, "September Mid Bill");
    });

    it("should reject date range where fromDate > toDate with 400", async () => {
      const res = await apiRequest(
        "/api/v1/expenses?fromDate=2026-09-30&toDate=2026-09-01",
        {
          headers: { Authorization: `Bearer ${accountantAToken}` },
        }
      );
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });

    it("should reject Mongo operator injection via strict query validation", async () => {
      const res = await apiRequest("/api/v1/expenses?buildingId[$ne]=null", {
        headers: { Authorization: `Bearer ${accountantAToken}` },
      });
      assert.strictEqual(res.status, 400);
    });
  });

  // =====================  SUITE 4: APPROVE EXPENSE  ==========
  describe("4. Authorize Expense Payout (PATCH /api/v1/expenses/:id/approve)", () => {
    it("should reject unauthenticated request with 401", async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await apiRequest(`/api/v1/expenses/${id}/approve`, {
        method: "PATCH",
      });
      assert.strictEqual(res.status, 401);
    });

    it("should reject unauthorized roles (Manager without EXPENSE_APPROVE) with 403", async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await apiRequest(`/api/v1/expenses/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${managerBToken}` }, // Manager only has EXPENSE_CREATE
      });
      assert.strictEqual(res.status, 403);
    });

    it("should return 404 for non-existent expense ID", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await apiRequest(
        `/api/v1/expenses/${nonExistentId}/approve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        }
      );
      assert.strictEqual(res.status, 404);
    });

    it("should enforce building OBAC: Building Admin A cannot approve Building B expense", async () => {
      // Create expense in Building B
      const expenseB = await Expense.create({
        expenseNumber: `EXP-2026-OBAC-${Date.now().toString().slice(-4)}`,
        buildingId: BUILDING_B_ID,
        title: "Tower B Lift Inspection",
        vendorName: "Elevate Pro",
        category: EXPENSE_CATEGORY.MAINTENANCE_AMC,
        amount: 750,
        expenseDate: new Date(),
        createdById: MANAGER_B_ID,
        status: EXPENSE_STATUS.PENDING_APPROVAL,
      });

      // Building Admin A (assigned to Building A) attempts to approve
      const res = await apiRequest(`/api/v1/expenses/${expenseB._id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.success, false);

      // Verify status in DB is still PENDING_APPROVAL
      const dbDoc = await Expense.findById(expenseB._id);
      assert.strictEqual(dbDoc.status, EXPENSE_STATUS.PENDING_APPROVAL);
      assert.strictEqual(dbDoc.approvedById, null);
    });

    it("should successfully authorize payout for authorized Building Admin A (200 OK)", async () => {
      const expenseA = await Expense.create({
        expenseNumber: `EXP-2026-APP-${Date.now().toString().slice(-4)}`,
        buildingId: BUILDING_A_ID,
        title: "Main Water Pump Replacement",
        vendorName: "HydroFlow Mechanics",
        category: EXPENSE_CATEGORY.REPAIRS,
        amount: 3200.0,
        expenseDate: new Date(),
        createdById: ACCOUNTANT_A_ID,
        status: EXPENSE_STATUS.PENDING_APPROVAL,
      });

      const res = await apiRequest(`/api/v1/expenses/${expenseA._id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.status, EXPENSE_STATUS.APPROVED);
      assert.strictEqual(
        res.data.data.approvedById,
        BUILDING_ADMIN_A_ID.toString()
      );

      // Verify DB persistence
      const dbDoc = await Expense.findById(expenseA._id);
      assert.strictEqual(dbDoc.status, EXPENSE_STATUS.APPROVED);
      assert.strictEqual(
        dbDoc.approvedById.toString(),
        BUILDING_ADMIN_A_ID.toString()
      );
    });

    it("should reject re-approval with 409 Conflict when expense is already APPROVED", async () => {
      const alreadyApprovedExpense = await Expense.create({
        expenseNumber: `EXP-2026-ALREADY-${Date.now().toString().slice(-4)}`,
        buildingId: BUILDING_A_ID,
        title: "Already Approved Landscaping",
        vendorName: "GreenScape",
        category: EXPENSE_CATEGORY.OTHER,
        amount: 500,
        expenseDate: new Date(),
        createdById: ACCOUNTANT_A_ID,
        status: EXPENSE_STATUS.APPROVED,
        approvedById: BUILDING_ADMIN_A_ID,
      });

      const res = await apiRequest(
        `/api/v1/expenses/${alreadyApprovedExpense._id}/approve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        }
      );

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /not pending approval/i);
    });

    it("should reject mass assignment request body on approval", async () => {
      const pendingExpense = await Expense.create({
        expenseNumber: `EXP-2026-BODY-${Date.now().toString().slice(-4)}`,
        buildingId: BUILDING_A_ID,
        title: "Painting Supplies",
        vendorName: "Dulux Paints",
        category: EXPENSE_CATEGORY.REPAIRS,
        amount: 800,
        expenseDate: new Date(),
        createdById: ACCOUNTANT_A_ID,
        status: EXPENSE_STATUS.PENDING_APPROVAL,
      });

      const res = await apiRequest(
        `/api/v1/expenses/${pendingExpense._id}/approve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
          body: { amount: 1200, status: "PAID" },
        }
      );

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });
  });

  // =====================  SUITE 5: CONCURRENCY  ==============
  describe("5. Concurrency & Uniqueness Guards", () => {
    it("should generate unique expense numbers under concurrent creation requests", async () => {
      const concurrentCount = 5;
      const promises = Array.from({ length: concurrentCount }).map((_, i) =>
        apiRequest("/api/v1/expenses", {
          method: "POST",
          headers: { Authorization: `Bearer ${accountantAToken}` },
          body: {
            buildingId: BUILDING_A_ID.toString(),
            title: `Concurrent Bill ${i + 1}`,
            vendorName: "MultiVendor",
            category: EXPENSE_CATEGORY.CLEANING_SUPPLIES,
            amount: 100.0 + i,
            expenseDate: "2026-09-10T10:00:00Z",
          },
        })
      );

      const responses = await Promise.all(promises);
      const successful = responses.filter((r) => r.status === 201);
      assert.strictEqual(successful.length, concurrentCount);

      const numbers = successful.map((r) => r.data.data.expenseNumber);
      const uniqueNumbers = new Set(numbers);
      assert.strictEqual(
        uniqueNumbers.size,
        concurrentCount,
        "All generated expense numbers must be strictly unique"
      );
    });

    it("should allow only one winner when two approvers concurrently approve the same expense", async () => {
      const pendingExpense = await Expense.create({
        expenseNumber: `EXP-2026-RACE-${Date.now().toString().slice(-4)}`,
        buildingId: BUILDING_A_ID,
        title: "Race Condition Expense",
        vendorName: "Urgent Fixers",
        category: EXPENSE_CATEGORY.REPAIRS,
        amount: 999.0,
        expenseDate: new Date(),
        createdById: ACCOUNTANT_A_ID,
        status: EXPENSE_STATUS.PENDING_APPROVAL,
      });

      // Both Super Admin and Building Admin A attempt to approve simultaneously
      const [res1, res2] = await Promise.all([
        apiRequest(`/api/v1/expenses/${pendingExpense._id}/approve`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        }),
        apiRequest(`/api/v1/expenses/${pendingExpense._id}/approve`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one 200 OK and one 409 Conflict
      assert.deepStrictEqual(
        statuses,
        [200, 409],
        "One approval must succeed (200) and the other must conflict (409)"
      );

      const dbDoc = await Expense.findById(pendingExpense._id);
      assert.strictEqual(dbDoc.status, EXPENSE_STATUS.APPROVED);
      assert.ok(dbDoc.approvedById);
    });
  });
});
