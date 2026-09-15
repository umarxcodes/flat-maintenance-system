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
import { Owner } from "../../models/owner.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { Invoice } from "../invoices/invoices.model.js";
import { Payment } from "./payments.model.js";
import { Outbox } from "../outbox/outbox.model.js";
import { AuditLog } from "../audit-logs/audit-logs.model.js";
import { paymentService } from "./payments.service.js";
import {
  PAYMENT_METHODS,
  PAYMENT_OUTBOX_EVENTS,
} from "./payments.constants.js";
import { INVOICE_STATUS } from "../invoices/invoices.constants.js";
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "../audit-logs/audit-logs.constants.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { TENANTS_CONSTANTS } from "../tenants/tenants.constants.js";
import { generateAccessToken } from "../../utils/token.util.js";
import { rolesService } from "../roles/roles.service.js";

// =====================  TEST SETUP & FIXTURES  =============
dotenv.config();

let server;
let baseUrl;

// Fixture ObjectIds
const BUILDING_A_ID = new mongoose.Types.ObjectId();
const BUILDING_B_ID = new mongoose.Types.ObjectId();

const BLOCK_A_ID = new mongoose.Types.ObjectId();
const BLOCK_B_ID = new mongoose.Types.ObjectId();
const FLOOR_A_ID = new mongoose.Types.ObjectId();
const FLOOR_B_ID = new mongoose.Types.ObjectId();

const FLAT_A_101_ID = new mongoose.Types.ObjectId();
const FLAT_A_102_ID = new mongoose.Types.ObjectId();
const FLAT_B_201_ID = new mongoose.Types.ObjectId();

const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_A_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_B_ID = new mongoose.Types.ObjectId();
const ACCOUNTANT_A_ID = new mongoose.Types.ObjectId();
const MANAGER_A_ID = new mongoose.Types.ObjectId();
const OWNER_A_ID = new mongoose.Types.ObjectId();
const OWNER_B_ID = new mongoose.Types.ObjectId();
const TENANT_A_ID = new mongoose.Types.ObjectId();

// JWT Tokens
let superAdminToken;
let buildingAdminAToken;
let accountantAToken;
let managerAToken;
let ownerAToken;
let ownerBToken;
let tenantAToken;

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
describe("Module 15: Payments & ACID Financial Transactions (payments)", () => {
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
      Payment.collection.deleteMany({}).catch(() => {}),
      Outbox.collection.deleteMany({}).catch(() => {}),
      AuditLog.collection.deleteMany({}).catch(() => {}),
      Invoice.collection.deleteMany({}).catch(() => {}),
      Building.deleteMany({}),
      Flat.deleteMany({}),
      User.deleteMany({}),
      Owner.deleteMany({}),
      Tenant.deleteMany({}),
    ]);

    // Seed test buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Emerald Heights Tower A",
        code: `PAY-BLD-A-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Finance Boulevard",
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
        code: `PAY-BLD-B-${Date.now().toString().slice(-4)}`,
        address: {
          street: "200 Ledger Court",
          city: "Metropolis",
          state: "NY",
          postalCode: "10002",
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
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "A-101",
        areaSqFt: 1200,
        status: "OCCUPIED",
        isDeleted: false,
      },
      {
        _id: FLAT_A_102_ID,
        buildingId: BUILDING_A_ID,
        blockId: BLOCK_A_ID,
        floorId: FLOOR_A_ID,
        flatNumber: "A-102",
        areaSqFt: 1400,
        status: "OCCUPIED",
        isDeleted: false,
      },
      {
        _id: FLAT_B_201_ID,
        buildingId: BUILDING_B_ID,
        blockId: BLOCK_B_ID,
        floorId: FLOOR_B_ID,
        flatNumber: "B-201",
        areaSqFt: 1100,
        status: "OCCUPIED",
        isDeleted: false,
      },
    ]);

    // Seed test users
    await User.create([
      {
        _id: SUPER_ADMIN_ID,
        email: `superadmin-pay-${Date.now()}@platform.local`,
        password: "Password123!",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
        firstName: "Super",
        lastName: "Admin",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
        isDeleted: false,
      },
      {
        _id: BUILDING_ADMIN_A_ID,
        email: `admin-a-pay-${Date.now()}@platform.local`,
        password: "Password123!",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
        firstName: "Admin",
        lastName: "Alpha",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
        isDeleted: false,
      },
      {
        _id: BUILDING_ADMIN_B_ID,
        email: `admin-b-pay-${Date.now()}@platform.local`,
        password: "Password123!",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
        firstName: "Admin",
        lastName: "Beta",
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
        isDeleted: false,
      },
      {
        _id: ACCOUNTANT_A_ID,
        email: `accountant-a-pay-${Date.now()}@platform.local`,
        password: "Password123!",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
        firstName: "Accountant",
        lastName: "Alpha",
        role: ROLES.ACCOUNTANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
        isDeleted: false,
      },
      {
        _id: MANAGER_A_ID,
        email: `manager-a-pay-${Date.now()}@platform.local`,
        password: "Password123!",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
        firstName: "Manager",
        lastName: "Alpha",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
        isDeleted: false,
      },
      {
        _id: OWNER_A_ID,
        email: `owner-a-pay-${Date.now()}@platform.local`,
        password: "Password123!",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
        firstName: "Owner",
        lastName: "Alpha",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
        isDeleted: false,
      },
      {
        _id: OWNER_B_ID,
        email: `owner-b-pay-${Date.now()}@platform.local`,
        password: "Password123!",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
        firstName: "Owner",
        lastName: "Beta",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_B_ID],
        isDeleted: false,
      },
      {
        _id: TENANT_A_ID,
        email: `tenant-a-pay-${Date.now()}@platform.local`,
        password: "Password123!",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
        firstName: "Tenant",
        lastName: "Alpha",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
        isDeleted: false,
      },
    ]);

    // Seed Owner and Tenant occupancy records
    await Owner.create([
      {
        userId: OWNER_A_ID,
        buildingId: BUILDING_A_ID,
        flatsOwned: [FLAT_A_101_ID],
        isDeleted: false,
      },
      {
        userId: OWNER_B_ID,
        buildingId: BUILDING_B_ID,
        flatsOwned: [FLAT_B_201_ID],
        isDeleted: false,
      },
    ]);

    await Tenant.create([
      {
        userId: TENANT_A_ID,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2027-01-01"),
        monthlyRent: 2500,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
        isDeleted: false,
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
    });
    accountantAToken = generateAccessToken({
      sub: ACCOUNTANT_A_ID.toString(),
      role: ROLES.ACCOUNTANT,
    });
    managerAToken = generateAccessToken({
      sub: MANAGER_A_ID.toString(),
      role: ROLES.MANAGER,
    });
    ownerAToken = generateAccessToken({
      sub: OWNER_A_ID.toString(),
      role: ROLES.OWNER,
    });
    ownerBToken = generateAccessToken({
      sub: OWNER_B_ID.toString(),
      role: ROLES.OWNER,
    });
    tenantAToken = generateAccessToken({
      sub: TENANT_A_ID.toString(),
      role: ROLES.TENANT,
    });
  });

  after(async () => {
    await Promise.all([
      Payment.collection.deleteMany({}).catch(() => {}),
      Outbox.collection.deleteMany({}).catch(() => {}),
      AuditLog.collection.deleteMany({}).catch(() => {}),
      Invoice.collection.deleteMany({}).catch(() => {}),
      Building.deleteMany({}),
      Flat.deleteMany({}),
      User.deleteMany({}),
      Owner.deleteMany({}),
      Tenant.deleteMany({}),
    ]);
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(async () => {
    // Clean financial transaction records between tests
    await Promise.all([
      Payment.collection.deleteMany({}).catch(() => {}),
      Outbox.collection.deleteMany({}).catch(() => {}),
      AuditLog.collection.deleteMany({}).catch(() => {}),
      Invoice.collection.deleteMany({}).catch(() => {}),
    ]);
  });

  // =====================  GROUP 1: MODEL & IMMUTABILITY  ======
  describe("Group 1: Model Invariants & ADR-012 Immutability", () => {
    it("should enforce required schema fields for payment record", async () => {
      const invalid = new Payment({});
      let err;
      try {
        await invalid.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err, "Validation error expected");
      assert.ok(err.errors.paymentNumber);
      assert.ok(err.errors.invoiceId);
      assert.ok(err.errors.buildingId);
      assert.ok(err.errors.flatId);
      assert.ok(err.errors.payerUserId);
      assert.ok(err.errors.amountPaid);
      assert.ok(err.errors.paymentMethod);
      assert.ok(err.errors.receiptNumber);
    });

    it("should reject non-positive amountPaid", async () => {
      const invalid = new Payment({
        paymentNumber: "PAY-2026-000001",
        invoiceId: new mongoose.Types.ObjectId(),
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        payerUserId: OWNER_A_ID,
        amountPaid: 0,
        paymentMethod: PAYMENT_METHODS.CASH,
        receiptNumber: "REC-2026-000001",
      });
      let err;
      try {
        await invalid.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err);
      assert.ok(err.errors.amountPaid);
    });

    it("should reject invalid paymentMethod enum value", async () => {
      const invalid = new Payment({
        paymentNumber: "PAY-2026-000002",
        invoiceId: new mongoose.Types.ObjectId(),
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        payerUserId: OWNER_A_ID,
        amountPaid: 100,
        paymentMethod: "CRYPTO_CURRENCY",
        receiptNumber: "REC-2026-000002",
      });
      let err;
      try {
        await invalid.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err);
      assert.ok(err.errors.paymentMethod);
    });

    it("should reject updates on existing payment records (ADR-012)", async () => {
      const [doc] = await Payment.create([
        {
          paymentNumber: `PAY-2026-${Date.now().toString().slice(-6)}`,
          invoiceId: new mongoose.Types.ObjectId(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A_101_ID,
          payerUserId: OWNER_A_ID,
          amountPaid: 500,
          paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
          receiptNumber: `REC-2026-${Date.now().toString().slice(-6)}`,
        },
      ]);

      doc.amountPaid = 999;
      await assert.rejects(
        () => doc.save(),
        /Financial Ledger Mutation Rejected: Payments are append-only immutable records/
      );
    });

    it("should block update queries (updateOne, findOneAndUpdate, etc.)", async () => {
      const pNum = `PAY-2026-${Date.now().toString().slice(-6)}`;
      await Payment.create([
        {
          paymentNumber: pNum,
          invoiceId: new mongoose.Types.ObjectId(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A_101_ID,
          payerUserId: OWNER_A_ID,
          amountPaid: 300,
          paymentMethod: PAYMENT_METHODS.UPI,
          receiptNumber: `REC-2026-${Date.now().toString().slice(-6)}`,
        },
      ]);

      await assert.rejects(
        () => Payment.updateOne({ paymentNumber: pNum }, { amountPaid: 1000 }),
        /Financial Ledger Mutation Rejected: Payment updates are strictly prohibited/
      );

      await assert.rejects(
        () =>
          Payment.findOneAndUpdate(
            { paymentNumber: pNum },
            { amountPaid: 1000 }
          ),
        /Financial Ledger Mutation Rejected: Payment updates are strictly prohibited/
      );
    });

    it("should block delete queries (deleteOne, deleteMany, etc.)", async () => {
      const pNum = `PAY-2026-${Date.now().toString().slice(-6)}`;
      await Payment.create([
        {
          paymentNumber: pNum,
          invoiceId: new mongoose.Types.ObjectId(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A_101_ID,
          payerUserId: OWNER_A_ID,
          amountPaid: 300,
          paymentMethod: PAYMENT_METHODS.UPI,
          receiptNumber: `REC-2026-${Date.now().toString().slice(-6)}`,
        },
      ]);

      await assert.rejects(
        () => Payment.deleteOne({ paymentNumber: pNum }),
        /Financial Ledger Deletion Rejected: Payment records cannot be deleted/
      );

      await assert.rejects(
        () => Payment.deleteMany({ paymentNumber: pNum }),
        /Financial Ledger Deletion Rejected: Payment records cannot be deleted/
      );
    });

    it("should enforce unique index on paymentNumber and receiptNumber", async () => {
      const pNum = "PAY-2026-DUP001";
      const rNum = "REC-2026-DUP001";

      await Payment.create([
        {
          paymentNumber: pNum,
          invoiceId: new mongoose.Types.ObjectId(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A_101_ID,
          payerUserId: OWNER_A_ID,
          amountPaid: 100,
          paymentMethod: PAYMENT_METHODS.CASH,
          receiptNumber: rNum,
        },
      ]);

      await assert.rejects(
        () =>
          Payment.create([
            {
              paymentNumber: pNum,
              invoiceId: new mongoose.Types.ObjectId(),
              buildingId: BUILDING_A_ID,
              flatId: FLAT_A_101_ID,
              payerUserId: OWNER_A_ID,
              amountPaid: 200,
              paymentMethod: PAYMENT_METHODS.CASH,
              receiptNumber: `REC-2026-${Date.now().toString().slice(-6)}`,
            },
          ]),
        (err) => err.code === 11000
      );
    });
  });

  // =====================  GROUP 2: ACID SETTLEMENT FLOW  ======
  describe("Group 2: ACID Payment Settlement & Invoice State Transitions", () => {
    it("should execute partial payment successfully (PARTIALLY_PAID)", async () => {
      // Create test invoice
      const invoice = await Invoice.create({
        invoiceNumber: `INV-2026-09-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Monthly Maintenance", amount: 10000 }],
        subTotal: 10000,
        totalAmount: 10000,
        dueAmount: 10000,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.ISSUED,
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          invoiceId: invoice._id.toString(),
          amount: 4000,
          paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
          transactionRef: "TXN-BANK-001",
          notes: "September partial maintenance payment",
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.payment.amountPaid, 4000);
      assert.strictEqual(res.data.data.invoice.paidAmount, 4000);
      assert.strictEqual(res.data.data.invoice.dueAmount, 6000);
      assert.strictEqual(
        res.data.data.invoice.status,
        INVOICE_STATUS.PARTIALLY_PAID
      );
      assert.strictEqual(res.data.data.invoice.paidAt, null);

      // Verify invoice in database
      const updatedInvoice = await Invoice.findById(invoice._id);
      assert.strictEqual(updatedInvoice.paidAmount, 4000);
      assert.strictEqual(updatedInvoice.dueAmount, 6000);
      assert.strictEqual(updatedInvoice.status, INVOICE_STATUS.PARTIALLY_PAID);
      assert.strictEqual(updatedInvoice.paidAt, null);
    });

    it("should execute full settlement successfully (transitions to PAID with paidAt)", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: `INV-2026-09-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Monthly Maintenance", amount: 5000 }],
        subTotal: 5000,
        totalAmount: 5000,
        dueAmount: 5000,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.ISSUED,
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantAToken}` },
        body: {
          invoiceId: invoice._id.toString(),
          amount: 5000,
          paymentMethod: PAYMENT_METHODS.UPI,
          transactionRef: "UPI-SETTLE-FULL",
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.payment.amountPaid, 5000);
      assert.strictEqual(res.data.data.invoice.paidAmount, 5000);
      assert.strictEqual(res.data.data.invoice.dueAmount, 0);
      assert.strictEqual(res.data.data.invoice.status, INVOICE_STATUS.PAID);
      assert.ok(res.data.data.invoice.paidAt);

      const updatedInvoice = await Invoice.findById(invoice._id);
      assert.strictEqual(updatedInvoice.status, INVOICE_STATUS.PAID);
      assert.strictEqual(updatedInvoice.dueAmount, 0);
      assert.ok(updatedInvoice.paidAt);
    });

    it("should settle OVERDUE invoice successfully and clear arrears to PAID", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: `INV-2026-08-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-08",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Arrears Maintenance", amount: 7500 }],
        subTotal: 7500,
        totalAmount: 7500,
        dueAmount: 7500,
        paidAmount: 0,
        dueDate: new Date("2026-09-01"),
        status: INVOICE_STATUS.OVERDUE,
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${accountantAToken}` },
        body: {
          invoiceId: invoice._id.toString(),
          amount: 7500,
          paymentMethod: PAYMENT_METHODS.CHEQUE,
          transactionRef: "CHQ-849102",
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.invoice.status, INVOICE_STATUS.PAID);
      assert.strictEqual(res.data.data.invoice.dueAmount, 0);
    });

    it("should reject payment on DRAFT invoice", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: `INV-2026-09-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Draft line", amount: 1000 }],
        subTotal: 1000,
        totalAmount: 1000,
        dueAmount: 1000,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.DRAFT,
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          invoiceId: invoice._id.toString(),
          amount: 1000,
          paymentMethod: PAYMENT_METHODS.CASH,
        },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /not payable/);
    });

    it("should reject payment on already PAID invoice", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: `INV-2026-09-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Settled line", amount: 2000 }],
        subTotal: 2000,
        totalAmount: 2000,
        dueAmount: 0,
        paidAmount: 2000,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.PAID,
        paidAt: new Date(),
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          invoiceId: invoice._id.toString(),
          amount: 500,
          paymentMethod: PAYMENT_METHODS.CASH,
        },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /not payable/);
    });

    it("should reject payment on VOID invoice", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: `INV-2026-09-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Void line", amount: 2000 }],
        subTotal: 2000,
        totalAmount: 2000,
        dueAmount: 2000,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.VOID,
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          invoiceId: invoice._id.toString(),
          amount: 500,
          paymentMethod: PAYMENT_METHODS.CASH,
        },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /not payable/);
    });

    it("should reject overpayment exceeding invoice dueAmount", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: `INV-2026-09-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Balance check", amount: 3000 }],
        subTotal: 3000,
        totalAmount: 3000,
        dueAmount: 3000,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.ISSUED,
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          invoiceId: invoice._id.toString(),
          amount: 3001,
          paymentMethod: PAYMENT_METHODS.DEBIT_CARD,
        },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /exceeds outstanding invoice due balance/);
    });
  });

  // =====================  GROUP 3: OUTBOX & AUDIT LOGS  =======
  describe("Group 3: Transactional Outbox & Forensic Audit Trail", () => {
    it("should persist PAYMENT_RECEIVED outbox event atomically in same session", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: `INV-2026-09-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Line Item", amount: 4500 }],
        subTotal: 4500,
        totalAmount: 4500,
        dueAmount: 4500,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.ISSUED,
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          invoiceId: invoice._id.toString(),
          amount: 4500,
          paymentMethod: PAYMENT_METHODS.CREDIT_CARD,
          transactionRef: "AUTH-NET-991",
        },
      });

      assert.strictEqual(res.status, 201);
      const paymentId = res.data.data.payment.id;

      // Verify outbox record
      const outboxEvent = await Outbox.findOne({
        "payload.paymentId": paymentId,
        eventType: PAYMENT_OUTBOX_EVENTS.PAYMENT_RECEIVED,
      });

      assert.ok(outboxEvent, "Expected transactional outbox event");
      assert.strictEqual(outboxEvent.status, "PENDING");
      assert.strictEqual(outboxEvent.payload.amount, 4500);
      assert.strictEqual(outboxEvent.payload.invoiceId, invoice._id.toString());
      assert.strictEqual(
        outboxEvent.payload.buildingId,
        BUILDING_A_ID.toString()
      );
      assert.strictEqual(outboxEvent.payload.flatId, FLAT_A_101_ID.toString());
      assert.strictEqual(
        outboxEvent.payload.paymentMethod,
        PAYMENT_METHODS.CREDIT_CARD
      );
    });

    it("should append PAYMENT_RECORDED forensic audit log records for payment and invoice", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: `INV-2026-09-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Line Item", amount: 6000 }],
        subTotal: 6000,
        totalAmount: 6000,
        dueAmount: 6000,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.ISSUED,
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ownerAToken}`,
          "x-correlation-id": "CORR-PAY-AUDIT-99",
        },
        body: {
          invoiceId: invoice._id.toString(),
          amount: 2500,
          paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
        },
      });

      assert.strictEqual(res.status, 201);
      const paymentId = res.data.data.payment.id;

      // Check Payment audit log
      const paymentAudit = await AuditLog.findOne({
        resourceType: AUDIT_RESOURCE_TYPES.PAYMENT,
        resourceId: paymentId,
        action: AUDIT_ACTIONS.PAYMENT_RECORDED,
      });

      assert.ok(paymentAudit, "Expected payment audit log");
      assert.strictEqual(
        paymentAudit.actorUserId.toString(),
        OWNER_A_ID.toString()
      );
      assert.strictEqual(
        paymentAudit.buildingId.toString(),
        BUILDING_A_ID.toString()
      );
      assert.strictEqual(paymentAudit.correlationId, "CORR-PAY-AUDIT-99");
      assert.strictEqual(paymentAudit.afterState.amountPaid, 2500);

      // Check Invoice audit log
      const invoiceAudit = await AuditLog.findOne({
        resourceType: AUDIT_RESOURCE_TYPES.INVOICE,
        resourceId: invoice._id,
        action: AUDIT_ACTIONS.PAYMENT_RECORDED,
      });

      assert.ok(invoiceAudit, "Expected invoice financial state audit log");
      assert.strictEqual(invoiceAudit.beforeState.dueAmount, 6000);
      assert.strictEqual(invoiceAudit.afterState.dueAmount, 3500);
      assert.strictEqual(
        invoiceAudit.afterState.status,
        INVOICE_STATUS.PARTIALLY_PAID
      );
    });
  });

  // =====================  GROUP 4: ATOMIC ROLLBACK  ===========
  describe("Group 4: Transaction Rollback & Zero Partial Writes", () => {
    it("should abort transaction and leave zero partial writes if outbox or audit fails", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: `INV-2026-09-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Line Item", amount: 5000 }],
        subTotal: 5000,
        totalAmount: 5000,
        dueAmount: 5000,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.ISSUED,
      });

      // Force outbox creation failure by mocking Outbox.create
      const originalCreate = Outbox.create;
      Outbox.create = async () => {
        throw new Error("Simulated outbox storage engine failure");
      };

      try {
        await assert.rejects(
          () =>
            paymentService.executePayment(
              {
                invoiceId: invoice._id.toString(),
                amount: 5000,
                paymentMethod: PAYMENT_METHODS.CASH,
              },
              {
                userId: OWNER_A_ID.toString(),
                role: ROLES.OWNER,
                assignedBuildingIds: [BUILDING_A_ID.toString()],
              }
            ),
          /Simulated outbox storage engine failure/
        );

        // Verify zero payments were committed
        const paymentCount = await Payment.countDocuments({
          invoiceId: invoice._id,
        });
        assert.strictEqual(paymentCount, 0, "No payment records should exist");

        // Verify invoice was untouched
        const untouchedInvoice = await Invoice.findById(invoice._id);
        assert.strictEqual(untouchedInvoice.paidAmount, 0);
        assert.strictEqual(untouchedInvoice.dueAmount, 5000);
        assert.strictEqual(untouchedInvoice.status, INVOICE_STATUS.ISSUED);

        // Verify no audit logs were committed
        const auditCount = await AuditLog.countDocuments({
          resourceId: invoice._id,
        });
        assert.strictEqual(auditCount, 0, "No audit records should exist");
      } finally {
        Outbox.create = originalCreate;
      }
    });
  });

  // =====================  GROUP 5: OBAC & AUTHORIZATION  ======
  describe("Group 5: Multi-Building & Resident Flat OBAC (Anti-IDOR)", () => {
    it("should prevent BuildingAdmin A from settling invoice in Building B (403)", async () => {
      const invoiceB = await Invoice.create({
        invoiceNumber: `INV-2026-09-B-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_B_ID,
        flatId: FLAT_B_201_ID,
        ownerId: OWNER_B_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Tower B Maintenance", amount: 8000 }],
        subTotal: 8000,
        totalAmount: 8000,
        dueAmount: 8000,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.ISSUED,
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        body: {
          invoiceId: invoiceB._id.toString(),
          amount: 8000,
          paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
        },
      });

      assert.strictEqual(res.status, 403);
      assert.match(res.data.message, /outside your assigned building scope/);
    });

    it("should prevent Owner B from paying an invoice for Flat A1 (403)", async () => {
      const invoiceA = await Invoice.create({
        invoiceNumber: `INV-2026-09-A-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Tower A Maintenance", amount: 6000 }],
        subTotal: 6000,
        totalAmount: 6000,
        dueAmount: 6000,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.ISSUED,
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerBToken}` },
        body: {
          invoiceId: invoiceA._id.toString(),
          amount: 6000,
          paymentMethod: PAYMENT_METHODS.CASH,
        },
      });

      assert.strictEqual(res.status, 403);
      assert.match(res.data.message, /do not own the property/);
    });

    it("should prevent Tenant A from paying an invoice for another Flat (403)", async () => {
      const invoiceA2 = await Invoice.create({
        invoiceNumber: `INV-2026-09-A2-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_102_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Flat A102 Maintenance", amount: 7000 }],
        subTotal: 7000,
        totalAmount: 7000,
        dueAmount: 7000,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.ISSUED,
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantAToken}` },
        body: {
          invoiceId: invoiceA2._id.toString(),
          amount: 7000,
          paymentMethod: PAYMENT_METHODS.UPI,
        },
      });

      assert.strictEqual(res.status, 403);
      assert.match(res.data.message, /do not have an active lease/);
    });

    it("should deny Manager without PAYMENT_CREATE permission (403)", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: `INV-2026-09-M-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Maintenance", amount: 3000 }],
        subTotal: 3000,
        totalAmount: 3000,
        dueAmount: 3000,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.ISSUED,
      });

      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${managerAToken}` },
        body: {
          invoiceId: invoice._id.toString(),
          amount: 3000,
          paymentMethod: PAYMENT_METHODS.CASH,
        },
      });

      assert.strictEqual(res.status, 403);
    });

    it("should reject mass assignment of server-owned fields in POST body (400)", async () => {
      const res = await apiRequest("/api/v1/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerAToken}` },
        body: {
          invoiceId: new mongoose.Types.ObjectId().toString(),
          amount: 1000,
          paymentMethod: PAYMENT_METHODS.CASH,
          paymentNumber: "PAY-MALICIOUS-INJECT",
          receiptNumber: "REC-MALICIOUS-INJECT",
          buildingId: BUILDING_B_ID.toString(),
          flatId: FLAT_B_201_ID.toString(),
          payerUserId: SUPER_ADMIN_ID.toString(),
          receiptPdfUrl: "https://evil.example.com/receipt.pdf",
          status: "PAID",
          paidAmount: 1000,
          dueAmount: 0,
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(
        res.data.message,
        "Validation failed on incoming request"
      );
      assert.ok(
        res.data.errors.some((e) =>
          e.message.toLowerCase().includes("unrecognized key")
        ),
        "Expected unrecognized key rejection message"
      );
    });
  });

  // =====================  GROUP 6: LEDGER QUERIES  ============
  describe("Group 6: Payment Transaction Ledger Querying (GET /api/v1/payments)", () => {
    it("should allow SuperAdmin to query global payment ledger with pagination", async () => {
      // Seed two payments
      await Payment.collection.insertMany([
        {
          paymentNumber: "PAY-2026-GLOB001",
          invoiceId: new mongoose.Types.ObjectId(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A_101_ID,
          payerUserId: OWNER_A_ID,
          amountPaid: 1500,
          paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
          receiptNumber: "REC-2026-GLOB001",
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          paymentNumber: "PAY-2026-GLOB002",
          invoiceId: new mongoose.Types.ObjectId(),
          buildingId: BUILDING_B_ID,
          flatId: FLAT_B_201_ID,
          payerUserId: OWNER_B_ID,
          amountPaid: 2500,
          paymentMethod: PAYMENT_METHODS.UPI,
          receiptNumber: "REC-2026-GLOB002",
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await apiRequest("/api/v1/payments", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.payments.length, 2);
      assert.strictEqual(res.data.data.pagination.totalRecords, 2);
    });

    it("should enforce building isolation when BuildingAdmin queries payments", async () => {
      await Payment.collection.insertMany([
        {
          paymentNumber: "PAY-2026-ISOL001",
          invoiceId: new mongoose.Types.ObjectId(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A_101_ID,
          payerUserId: OWNER_A_ID,
          amountPaid: 1500,
          paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
          receiptNumber: "REC-2026-ISOL001",
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          paymentNumber: "PAY-2026-ISOL002",
          invoiceId: new mongoose.Types.ObjectId(),
          buildingId: BUILDING_B_ID,
          flatId: FLAT_B_201_ID,
          payerUserId: OWNER_B_ID,
          amountPaid: 2500,
          paymentMethod: PAYMENT_METHODS.UPI,
          receiptNumber: "REC-2026-ISOL002",
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // BuildingAdmin A should only see Building A payments
      const resA = await apiRequest("/api/v1/payments", {
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
      });

      assert.strictEqual(resA.status, 200);
      assert.strictEqual(resA.data.data.payments.length, 1);
      assert.strictEqual(
        resA.data.data.payments[0].buildingId,
        BUILDING_A_ID.toString()
      );

      // Attempting to query Building B explicitly should return 403 Forbidden
      const resForbidden = await apiRequest(
        `/api/v1/payments?buildingId=${BUILDING_B_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        }
      );
      assert.strictEqual(resForbidden.status, 403);
    });

    it("should enforce flat isolation when Owner queries payments", async () => {
      await Payment.collection.insertMany([
        {
          paymentNumber: "PAY-2026-OWN001",
          invoiceId: new mongoose.Types.ObjectId(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A_101_ID,
          payerUserId: OWNER_A_ID,
          amountPaid: 1000,
          paymentMethod: PAYMENT_METHODS.CASH,
          receiptNumber: "REC-2026-OWN001",
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          paymentNumber: "PAY-2026-OWN002",
          invoiceId: new mongoose.Types.ObjectId(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A_102_ID,
          payerUserId: new mongoose.Types.ObjectId(),
          amountPaid: 2000,
          paymentMethod: PAYMENT_METHODS.CASH,
          receiptNumber: "REC-2026-OWN002",
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await apiRequest("/api/v1/payments", {
        headers: { Authorization: `Bearer ${ownerAToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.payments.length, 1);
      assert.strictEqual(
        res.data.data.payments[0].flatId,
        FLAT_A_101_ID.toString()
      );
    });

    it("should filter by paymentMethod", async () => {
      await Payment.collection.insertMany([
        {
          paymentNumber: "PAY-2026-METH001",
          invoiceId: new mongoose.Types.ObjectId(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A_101_ID,
          payerUserId: OWNER_A_ID,
          amountPaid: 1000,
          paymentMethod: PAYMENT_METHODS.UPI,
          receiptNumber: "REC-2026-METH001",
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          paymentNumber: "PAY-2026-METH002",
          invoiceId: new mongoose.Types.ObjectId(),
          buildingId: BUILDING_A_ID,
          flatId: FLAT_A_101_ID,
          payerUserId: OWNER_A_ID,
          amountPaid: 2000,
          paymentMethod: PAYMENT_METHODS.CASH,
          receiptNumber: "REC-2026-METH002",
          paymentDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await apiRequest("/api/v1/payments?paymentMethod=UPI", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.payments.length, 1);
      assert.strictEqual(
        res.data.data.payments[0].paymentMethod,
        PAYMENT_METHODS.UPI
      );
    });

    it("should reject invalid query operators or unknown fields (400)", async () => {
      const res = await apiRequest("/api/v1/payments?unknownField=true", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(
        res.data.message,
        "Validation failed on incoming request"
      );
      assert.ok(
        res.data.errors.some((e) =>
          e.message.toLowerCase().includes("unrecognized key")
        ),
        "Expected unrecognized key rejection message"
      );
    });
  });

  // =====================  GROUP 7: RECEIPT RETRIEVAL  =========
  describe("Group 7: Tax Receipt Retrieval (GET /api/v1/payments/:id/receipt)", () => {
    it("should retrieve official tax receipt details for authorized user", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: "INV-2026-RCP-001",
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Receipt line", amount: 3500 }],
        subTotal: 3500,
        totalAmount: 3500,
        dueAmount: 0,
        paidAmount: 3500,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.PAID,
        paidAt: new Date(),
      });

      const [payment] = await Payment.collection
        .insertMany([
          {
            paymentNumber: "PAY-2026-RCP001",
            invoiceId: invoice._id,
            buildingId: BUILDING_A_ID,
            flatId: FLAT_A_101_ID,
            payerUserId: OWNER_A_ID,
            amountPaid: 3500,
            paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
            transactionRef: "TXN-RCP-001",
            receiptNumber: "REC-2026-RCP001",
            paymentDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
        .then((r) => Object.values(r.insertedIds).map((id) => ({ _id: id })));

      const res = await apiRequest(`/api/v1/payments/${payment._id}/receipt`, {
        headers: { Authorization: `Bearer ${ownerAToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.receiptNumber, "REC-2026-RCP001");
      assert.strictEqual(res.data.data.paymentNumber, "PAY-2026-RCP001");
      assert.strictEqual(res.data.data.invoiceNumber, "INV-2026-RCP-001");
      assert.strictEqual(res.data.data.amountPaid, 3500);
      assert.strictEqual(
        res.data.data.paymentMethod,
        PAYMENT_METHODS.BANK_TRANSFER
      );
    });

    it("should prevent unauthorized cross-building receipt download (IDOR 403)", async () => {
      const [paymentB] = await Payment.collection
        .insertMany([
          {
            paymentNumber: "PAY-2026-IDOR-B",
            invoiceId: new mongoose.Types.ObjectId(),
            buildingId: BUILDING_B_ID,
            flatId: FLAT_B_201_ID,
            payerUserId: OWNER_B_ID,
            amountPaid: 4000,
            paymentMethod: PAYMENT_METHODS.CASH,
            receiptNumber: "REC-2026-IDOR-B",
            paymentDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
        .then((r) => Object.values(r.insertedIds).map((id) => ({ _id: id })));

      // BuildingAdmin A attempts to get receipt for payment in Building B
      const res = await apiRequest(`/api/v1/payments/${paymentB._id}/receipt`, {
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.match(res.data.message, /outside your assigned building scope/);
    });

    it("should prevent cross-flat resident from accessing neighbor receipt (IDOR 403)", async () => {
      const [paymentA] = await Payment.collection
        .insertMany([
          {
            paymentNumber: "PAY-2026-IDOR-A",
            invoiceId: new mongoose.Types.ObjectId(),
            buildingId: BUILDING_A_ID,
            flatId: FLAT_A_101_ID,
            payerUserId: OWNER_A_ID,
            amountPaid: 4000,
            paymentMethod: PAYMENT_METHODS.CASH,
            receiptNumber: "REC-2026-IDOR-A",
            paymentDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
        .then((r) => Object.values(r.insertedIds).map((id) => ({ _id: id })));

      // Owner B attempts to access Owner A's receipt
      const res = await apiRequest(`/api/v1/payments/${paymentA._id}/receipt`, {
        headers: { Authorization: `Bearer ${ownerBToken}` },
      });

      assert.strictEqual(res.status, 403);
      assert.match(res.data.message, /do not own the property/);
    });

    it("should return 404 for non-existent receipt ID", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await apiRequest(
        `/api/v1/payments/${nonExistentId}/receipt`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      assert.strictEqual(res.status, 404);
    });
  });

  // =====================  GROUP 8: CONCURRENCY DEFENSE  =======
  describe("Group 8: Concurrency & Mathematical Balance Protection", () => {
    it("should protect invoice from balance overruns under concurrent settlement attempts", async () => {
      // Create invoice with 10,000 due
      const invoice = await Invoice.create({
        invoiceNumber: `INV-2026-09-CONC-${Date.now().toString().slice(-5)}`,
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        ownerId: OWNER_A_ID,
        billingPeriod: "2026-09",
        configurationSnapshot: { baseRate: 100 },
        lineItems: [{ title: "Concurrent Line", amount: 10000 }],
        subTotal: 10000,
        totalAmount: 10000,
        dueAmount: 10000,
        paidAmount: 0,
        dueDate: new Date("2026-10-05"),
        status: INVOICE_STATUS.ISSUED,
      });

      // Attempt two parallel payments that together exceed 10,000 (6,000 + 5,000 = 11,000)
      const [res1, res2] = await Promise.all([
        apiRequest("/api/v1/payments", {
          method: "POST",
          headers: { Authorization: `Bearer ${ownerAToken}` },
          body: {
            invoiceId: invoice._id.toString(),
            amount: 6000,
            paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
          },
        }),
        apiRequest("/api/v1/payments", {
          method: "POST",
          headers: { Authorization: `Bearer ${ownerAToken}` },
          body: {
            invoiceId: invoice._id.toString(),
            amount: 5000,
            paymentMethod: PAYMENT_METHODS.UPI,
          },
        }),
      ]);

      // Either:
      // Case 1: One succeeds (201) and one is rejected (400 overpayment or concurrency abort)
      // Case 2: Both executed sequentially if timing serialized, but second must reject if it exceeds remaining
      const statuses = [res1.status, res2.status];
      assert.ok(statuses.includes(201), "At least one payment must succeed");

      // Verify invoice final state is never mathematically overdrawn
      const finalInvoice = await Invoice.findById(invoice._id);
      assert.ok(
        finalInvoice.paidAmount <= 10000,
        `paidAmount (${finalInvoice.paidAmount}) must not exceed total (10000)`
      );
      assert.ok(
        finalInvoice.dueAmount >= 0,
        `dueAmount (${finalInvoice.dueAmount}) must not be negative`
      );
      assert.strictEqual(
        finalInvoice.paidAmount + finalInvoice.dueAmount,
        10000,
        "paidAmount + dueAmount must strictly equal totalAmount"
      );
    });
  });
});
