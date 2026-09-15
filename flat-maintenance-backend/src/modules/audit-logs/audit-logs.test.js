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
import { AuditLog } from "./audit-logs.model.js";
import { auditLogService } from "./audit-logs.service.js";
import { AUDIT_ACTIONS, AUDIT_RESOURCE_TYPES } from "./audit-logs.constants.js";
import { sanitizeAuditSnapshot } from "./audit-logs.sanitizer.js";
import { usersService } from "../users/users.service.js";
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

const FLAT_A_101_ID = new mongoose.Types.ObjectId();

const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_A_ID = new mongoose.Types.ObjectId();
const MANAGER_A_ID = new mongoose.Types.ObjectId();
const ACCOUNTANT_A_ID = new mongoose.Types.ObjectId();
const OWNER_A_101_ID = new mongoose.Types.ObjectId();
const TENANT_A_102_ID = new mongoose.Types.ObjectId();
const TARGET_USER_ID = new mongoose.Types.ObjectId();

// JWT Tokens
let superAdminToken;
let buildingAdminAToken;
let managerAToken;
let accountantAToken;
let ownerA101Token;
let tenantA102Token;

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
describe("Module 24: Audit Logs & Append-Only Event Trail (audit-logs)", () => {
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
      AuditLog.collection.deleteMany({}).catch(() => {}),
      Building.deleteMany({}),
      Flat.deleteMany({}),
      User.deleteMany({}),
    ]);

    // Seed test buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Emerald Heights Tower A",
        code: `AUDIT-A-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Forensic Boulevard",
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
        code: `AUDIT-B-${Date.now().toString().slice(-4)}`,
        address: {
          street: "200 Forensic Court",
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
    await Flat.create({
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
    });

    // Seed test users
    await User.create([
      {
        _id: SUPER_ADMIN_ID,
        firstName: "Super",
        lastName: "Admin",
        email: "super.audit@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: BUILDING_ADMIN_A_ID,
        firstName: "Building",
        lastName: "AdminA",
        email: "badmin.a.audit@test.local",
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
        email: "mgr.a.audit@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: ACCOUNTANT_A_ID,
        firstName: "Accountant",
        lastName: "TowerA",
        email: "acct.a.audit@test.local",
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
        email: "owner.101.audit@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: TENANT_A_102_ID,
        firstName: "Teresa",
        lastName: "Tenant",
        email: "tenant.102.audit@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: TARGET_USER_ID,
        firstName: "Target",
        lastName: "Resident",
        email: "target.resident@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
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
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await Promise.all([
      AuditLog.collection.deleteMany({}).catch(() => {}),
      Building.deleteMany({}),
      Flat.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  beforeEach(async () => {
    // Reset audit collection between tests using direct native collection to bypass Mongoose hooks if needed,
    // or test specifically against hooks
    await AuditLog.collection.deleteMany({});
  });

  // =====================  SUITE 1: MODEL IMMUTABILITY  ========
  describe("Model Immutability & Mutation Prevention", () => {
    it("should allow initial document creation", async () => {
      const doc = await AuditLog.create({
        action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
        actorUserId: SUPER_ADMIN_ID,
        actorRole: ROLES.SUPER_ADMIN,
        buildingId: BUILDING_A_ID,
        resourceType: AUDIT_RESOURCE_TYPES.USER,
        resourceId: TARGET_USER_ID,
        beforeState: { status: "ACTIVE" },
        afterState: { status: "SUSPENDED" },
      });

      assert.ok(doc._id);
      assert.equal(doc.action, "USER_STATUS_UPDATED");
      assert.ok(doc.createdAt instanceof Date);
    });

    it("should throw when attempting updateOne on AuditLog", async () => {
      const doc = await AuditLog.create({
        action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
        actorUserId: SUPER_ADMIN_ID,
        actorRole: ROLES.SUPER_ADMIN,
        buildingId: BUILDING_A_ID,
        resourceType: AUDIT_RESOURCE_TYPES.USER,
        resourceId: TARGET_USER_ID,
      });

      await assert.rejects(async () => {
        await AuditLog.updateOne(
          { _id: doc._id },
          { $set: { action: "TAMPERED" } }
        );
      }, /AuditLog is an append-only collection/);
    });

    it("should throw when attempting findOneAndUpdate on AuditLog", async () => {
      const doc = await AuditLog.create({
        action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
        actorUserId: SUPER_ADMIN_ID,
        actorRole: ROLES.SUPER_ADMIN,
        buildingId: BUILDING_A_ID,
        resourceType: AUDIT_RESOURCE_TYPES.USER,
        resourceId: TARGET_USER_ID,
      });

      await assert.rejects(async () => {
        await AuditLog.findOneAndUpdate(
          { _id: doc._id },
          { $set: { action: "TAMPERED" } }
        );
      }, /AuditLog is an append-only collection/);
    });

    it("should throw when attempting deleteOne or deleteMany on AuditLog", async () => {
      const doc = await AuditLog.create({
        action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
        actorUserId: SUPER_ADMIN_ID,
        actorRole: ROLES.SUPER_ADMIN,
        buildingId: BUILDING_A_ID,
        resourceType: AUDIT_RESOURCE_TYPES.USER,
        resourceId: TARGET_USER_ID,
      });

      await assert.rejects(async () => {
        await AuditLog.deleteOne({ _id: doc._id });
      }, /AuditLog is an append-only collection/);

      await assert.rejects(async () => {
        await AuditLog.deleteMany({});
      }, /AuditLog is an append-only collection/);
    });

    it("should throw when calling save() on an existing AuditLog document", async () => {
      const doc = await AuditLog.create({
        action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
        actorUserId: SUPER_ADMIN_ID,
        actorRole: ROLES.SUPER_ADMIN,
        buildingId: BUILDING_A_ID,
        resourceType: AUDIT_RESOURCE_TYPES.USER,
        resourceId: TARGET_USER_ID,
      });

      doc.action = "TAMPERED_SAVE";
      await assert.rejects(async () => {
        await doc.save();
      }, /AuditLog records are immutable/);
    });

    it("should reject modifying createdAt field", async () => {
      const initialDate = new Date("2026-01-01T00:00:00Z");
      const doc = await AuditLog.create({
        action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
        actorUserId: SUPER_ADMIN_ID,
        actorRole: ROLES.SUPER_ADMIN,
        buildingId: BUILDING_A_ID,
        resourceType: AUDIT_RESOURCE_TYPES.USER,
        resourceId: TARGET_USER_ID,
        createdAt: initialDate,
      });

      await assert.rejects(async () => {
        await AuditLog.findByIdAndUpdate(doc._id, {
          $set: { createdAt: new Date() },
        });
      }, /AuditLog is an append-only collection/);

      const refreshed = await AuditLog.findById(doc._id).lean();
      assert.equal(refreshed.createdAt.getTime(), initialDate.getTime());
    });
  });

  // =====================  SUITE 2: SNAPSHOT SANITIZER  ========
  describe("Snapshot Credential & Secret Sanitizer", () => {
    it("should redact raw credentials, hashes, tokens, and api secrets recursively", () => {
      const rawState = {
        _id: new mongoose.Types.ObjectId(),
        email: "resident@test.local",
        password: "PlaintextPassword123!",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuv",
        refreshTokens: [
          {
            token: "jwt.secret.token",
            tokenHash: "sha256hash",
            isUsed: false,
          },
        ],
        apiKey: "sk_live_1234567890",
        apiSecret: "secret_value_xyz",
        status: "ACTIVE",
        buildingId: BUILDING_A_ID,
        profile: {
          invitationToken: "inv_token_abc",
          invitationTokenHash: "inv_hash_abc",
          phone: "+1234567890",
        },
      };

      const sanitized = sanitizeAuditSnapshot(rawState);

      // Redacted fields
      assert.equal(sanitized.password, "[REDACTED]");
      assert.equal(sanitized.passwordHash, "[REDACTED]");
      assert.equal(sanitized.apiKey, "[REDACTED]");
      assert.equal(sanitized.apiSecret, "[REDACTED]");
      assert.equal(sanitized.refreshTokens[0].token, "[REDACTED]");
      assert.equal(sanitized.refreshTokens[0].tokenHash, "[REDACTED]");
      assert.equal(sanitized.profile.invitationToken, "[REDACTED]");
      assert.equal(sanitized.profile.invitationTokenHash, "[REDACTED]");

      // Preserved business fields
      assert.equal(sanitized.email, "resident@test.local");
      assert.equal(sanitized.status, "ACTIVE");
      assert.equal(sanitized.profile.phone, "+1234567890");
      assert.equal(sanitized.buildingId, BUILDING_A_ID.toString());
    });

    it("should handle null, undefined, dates, and circular references gracefully", () => {
      assert.equal(sanitizeAuditSnapshot(null), null);
      assert.equal(sanitizeAuditSnapshot(undefined), null);

      const now = new Date();
      assert.equal(sanitizeAuditSnapshot(now), now.toISOString());

      // Circular reference object
      const circularObj = { name: "test" };
      circularObj.self = circularObj;

      const sanitized = sanitizeAuditSnapshot(circularObj);
      assert.equal(sanitized.name, "test");
      assert.equal(sanitized.self, "[CIRCULAR]");
    });
  });

  // =====================  SUITE 3: APPEND AUDIT LOG API  ======
  describe("auditLogService.appendAuditLog", () => {
    it("should successfully append an audit log with sanitized snapshots", async () => {
      const created = await auditLogService.appendAuditLog({
        action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
        actorUserId: SUPER_ADMIN_ID,
        actorRole: ROLES.SUPER_ADMIN,
        buildingId: BUILDING_A_ID,
        resourceType: AUDIT_RESOURCE_TYPES.USER,
        resourceId: TARGET_USER_ID,
        beforeState: { status: "ACTIVE", passwordHash: "secret123" },
        afterState: { status: "SUSPENDED", passwordHash: "secret123" },
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0 Test",
        correlationId: "corr-1234-5678",
      });

      assert.ok(created._id);
      assert.equal(created.action, "USER_STATUS_UPDATED");
      assert.equal(created.actorRole, "SUPER_ADMIN");
      assert.equal(created.beforeState.status, "ACTIVE");
      assert.equal(created.beforeState.passwordHash, "[REDACTED]");
      assert.equal(created.afterState.status, "SUSPENDED");
      assert.equal(created.correlationId, "corr-1234-5678");
    });

    it("should reject append if required fields are missing", async () => {
      await assert.rejects(async () => {
        await auditLogService.appendAuditLog({
          actorUserId: SUPER_ADMIN_ID,
          actorRole: ROLES.SUPER_ADMIN,
          resourceType: AUDIT_RESOURCE_TYPES.USER,
          resourceId: TARGET_USER_ID,
        });
      }, /'action' is required/);

      await assert.rejects(async () => {
        await auditLogService.appendAuditLog({
          action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
          actorRole: ROLES.SUPER_ADMIN,
          resourceType: AUDIT_RESOURCE_TYPES.USER,
          resourceId: TARGET_USER_ID,
        });
      }, /'actorUserId' is required/);
    });

    it("should preserve historical actor role", async () => {
      // Create log when actor was BUILDING_ADMIN
      const created = await auditLogService.appendAuditLog({
        action: AUDIT_ACTIONS.INVOICE_VOIDED,
        actorUserId: BUILDING_ADMIN_A_ID,
        actorRole: ROLES.BUILDING_ADMIN,
        buildingId: BUILDING_A_ID,
        resourceType: AUDIT_RESOURCE_TYPES.INVOICE,
        resourceId: new mongoose.Types.ObjectId(),
      });

      const retrieved = await AuditLog.findById(created._id).lean();
      assert.equal(retrieved.actorRole, "BUILDING_ADMIN");
    });
  });

  // =====================  SUITE 4: ACID TRANSACTIONS  =========
  describe("ACID Transaction Participation", () => {
    it("should commit audit log atomically with domain mutation when transaction succeeds", async () => {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const testUser = new User({
          firstName: "Tx",
          lastName: "Commit",
          email: `tx.commit.${Date.now()}@test.local`,
          password: "Password123!",
          passwordHash: "hash",
          role: ROLES.TENANT,
          status: ACCOUNT_STATUS.ACTIVE,
        });
        await testUser.save({ session });

        await auditLogService.appendAuditLog(
          {
            action: AUDIT_ACTIONS.USER_INVITED,
            actorUserId: SUPER_ADMIN_ID,
            actorRole: ROLES.SUPER_ADMIN,
            buildingId: BUILDING_A_ID,
            resourceType: AUDIT_RESOURCE_TYPES.USER,
            resourceId: testUser._id,
            afterState: { email: testUser.email },
          },
          { session }
        );

        await session.commitTransaction();
      } finally {
        await session.endSession();
      }

      const log = await AuditLog.findOne({
        action: AUDIT_ACTIONS.USER_INVITED,
      }).lean();
      assert.ok(log);
    });

    it("should rollback audit log atomically when transaction is aborted", async () => {
      const session = await mongoose.startSession();
      session.startTransaction();

      const uniqueEmail = `tx.abort.${Date.now()}@test.local`;
      try {
        const testUser = new User({
          firstName: "Tx",
          lastName: "Abort",
          email: uniqueEmail,
          password: "Password123!",
          passwordHash: "hash",
          role: ROLES.TENANT,
          status: ACCOUNT_STATUS.ACTIVE,
        });
        await testUser.save({ session });

        await auditLogService.appendAuditLog(
          {
            action: AUDIT_ACTIONS.USER_INVITED,
            actorUserId: SUPER_ADMIN_ID,
            actorRole: ROLES.SUPER_ADMIN,
            buildingId: BUILDING_A_ID,
            resourceType: AUDIT_RESOURCE_TYPES.USER,
            resourceId: testUser._id,
            afterState: { email: uniqueEmail },
          },
          { session }
        );

        // Intentionally abort
        await session.abortTransaction();
      } finally {
        await session.endSession();
      }

      const userExists = await User.findOne({ email: uniqueEmail });
      assert.equal(userExists, null);

      const logExists = await AuditLog.findOne({
        "afterState.email": uniqueEmail,
      });
      assert.equal(logExists, null);
    });
  });

  // =====================  SUITE 5: HTTP QUERY & RBAC/OBAC  ===
  describe("GET /api/v1/audit-logs", () => {
    beforeEach(async () => {
      await AuditLog.collection.deleteMany({});

      // Seed baseline audit logs
      // Building A logs (3 logs)
      await AuditLog.create([
        {
          action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
          actorUserId: BUILDING_ADMIN_A_ID,
          actorRole: ROLES.BUILDING_ADMIN,
          buildingId: BUILDING_A_ID,
          resourceType: AUDIT_RESOURCE_TYPES.USER,
          resourceId: TARGET_USER_ID,
          beforeState: { status: "ACTIVE" },
          afterState: { status: "SUSPENDED" },
          createdAt: new Date("2026-09-01T10:00:00Z"),
        },
        {
          action: AUDIT_ACTIONS.INVOICE_VOIDED,
          actorUserId: BUILDING_ADMIN_A_ID,
          actorRole: ROLES.BUILDING_ADMIN,
          buildingId: BUILDING_A_ID,
          resourceType: AUDIT_RESOURCE_TYPES.INVOICE,
          resourceId: new mongoose.Types.ObjectId(),
          createdAt: new Date("2026-09-05T12:00:00Z"),
        },
        {
          action: AUDIT_ACTIONS.EXPENSE_APPROVED,
          actorUserId: BUILDING_ADMIN_A_ID,
          actorRole: ROLES.BUILDING_ADMIN,
          buildingId: BUILDING_A_ID,
          resourceType: AUDIT_RESOURCE_TYPES.EXPENSE,
          resourceId: new mongoose.Types.ObjectId(),
          createdAt: new Date("2026-09-10T14:00:00Z"),
        },
      ]);

      // Building B logs (2 logs)
      await AuditLog.create([
        {
          action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
          actorUserId: SUPER_ADMIN_ID,
          actorRole: ROLES.SUPER_ADMIN,
          buildingId: BUILDING_B_ID,
          resourceType: AUDIT_RESOURCE_TYPES.USER,
          resourceId: new mongoose.Types.ObjectId(),
          createdAt: new Date("2026-09-02T10:00:00Z"),
        },
        {
          action: AUDIT_ACTIONS.INVOICE_VOIDED,
          actorUserId: SUPER_ADMIN_ID,
          actorRole: ROLES.SUPER_ADMIN,
          buildingId: BUILDING_B_ID,
          resourceType: AUDIT_RESOURCE_TYPES.INVOICE,
          resourceId: new mongoose.Types.ObjectId(),
          createdAt: new Date("2026-09-06T12:00:00Z"),
        },
      ]);
    });

    it("should allow Building Admin to query only assigned building audit logs", async () => {
      const res = await apiRequest("/api/v1/audit-logs", {
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.length, 3);
      assert.equal(res.data.meta.totalRecords, 3);

      // Verify every log belongs to Building A
      for (const log of res.data.data) {
        assert.equal(log.buildingId, BUILDING_A_ID.toString());
      }
    });

    it("should reject Building Admin with 403 when querying Building B (OBAC enforcement)", async () => {
      const res = await apiRequest(
        `/api/v1/audit-logs?buildingId=${BUILDING_B_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        }
      );

      assert.equal(res.status, 403);
    });

    it("should allow Super Admin to query globally across all buildings", async () => {
      const res = await apiRequest("/api/v1/audit-logs", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.length, 5);
      assert.equal(res.data.meta.totalRecords, 5);
    });

    it("should allow Super Admin to filter by a specific buildingId", async () => {
      const res = await apiRequest(
        `/api/v1/audit-logs?buildingId=${BUILDING_B_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.length, 2);
      for (const log of res.data.data) {
        assert.equal(log.buildingId, BUILDING_B_ID.toString());
      }
    });

    it("should reject Manager, Accountant, Owner, and Tenant with 403 Forbidden (RBAC gate)", async () => {
      const mgrRes = await apiRequest("/api/v1/audit-logs", {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });
      assert.equal(mgrRes.status, 403);

      const acctRes = await apiRequest("/api/v1/audit-logs", {
        headers: { Authorization: `Bearer ${accountantAToken}` },
      });
      assert.equal(acctRes.status, 403);

      const ownerRes = await apiRequest("/api/v1/audit-logs", {
        headers: { Authorization: `Bearer ${ownerA101Token}` },
      });
      assert.equal(ownerRes.status, 403);

      const tenantRes = await apiRequest("/api/v1/audit-logs", {
        headers: { Authorization: `Bearer ${tenantA102Token}` },
      });
      assert.equal(tenantRes.status, 403);
    });

    it("should reject unauthenticated requests with 401 Unauthorized", async () => {
      const res = await apiRequest("/api/v1/audit-logs");
      assert.equal(res.status, 401);
    });

    it("should filter by resourceId (Forensic Entity Timeline)", async () => {
      const res = await apiRequest(
        `/api/v1/audit-logs?resourceId=${TARGET_USER_ID.toString()}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.length, 1);
      assert.equal(res.data.data[0].resourceId, TARGET_USER_ID.toString());
      assert.equal(res.data.data[0].action, AUDIT_ACTIONS.USER_STATUS_UPDATED);
    });

    it("should prevent IDOR: querying a Building B resourceId from Building A admin returns 0 records", async () => {
      // Find a Building B log's resourceId
      const bLog = await AuditLog.findOne({ buildingId: BUILDING_B_ID }).lean();

      const res = await apiRequest(
        `/api/v1/audit-logs?resourceId=${bLog.resourceId.toString()}`,
        {
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.length, 0);
      assert.equal(res.data.meta.totalRecords, 0);
    });

    it("should filter by action and resourceType", async () => {
      const res = await apiRequest(
        `/api/v1/audit-logs?action=INVOICE_VOIDED&resourceType=INVOICE`,
        {
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.length, 1);
      assert.equal(res.data.data[0].action, "INVOICE_VOIDED");
    });

    it("should filter by date range (from and to)", async () => {
      const res = await apiRequest(
        `/api/v1/audit-logs?from=2026-09-04T00:00:00Z&to=2026-09-06T23:59:59Z`,
        {
          headers: { Authorization: `Bearer ${buildingAdminAToken}` },
        }
      );

      assert.equal(res.status, 200);
      assert.equal(res.data.data.length, 1);
      assert.equal(res.data.data[0].action, AUDIT_ACTIONS.INVOICE_VOIDED);
    });

    it("should paginate correctly with page and limit", async () => {
      const page1 = await apiRequest(`/api/v1/audit-logs?page=1&limit=2`, {
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
      });

      assert.equal(page1.status, 200);
      assert.equal(page1.data.data.length, 2);
      assert.equal(page1.data.meta.page, 1);
      assert.equal(page1.data.meta.limit, 2);
      assert.equal(page1.data.meta.totalRecords, 3);
      assert.equal(page1.data.meta.totalPages, 2);
      assert.equal(page1.data.meta.hasNextPage, true);
      assert.equal(page1.data.meta.hasPrevPage, false);

      const page2 = await apiRequest(`/api/v1/audit-logs?page=2&limit=2`, {
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
      });

      assert.equal(page2.status, 200);
      assert.equal(page2.data.data.length, 1);
      assert.equal(page2.data.meta.page, 2);
      assert.equal(page2.data.meta.hasNextPage, false);
      assert.equal(page2.data.meta.hasPrevPage, true);
    });

    it("should reject unexpected query parameters with 400 Bad Request", async () => {
      const res = await apiRequest(`/api/v1/audit-logs?malicious=true`, {
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
      });

      assert.equal(res.status, 400);
    });

    it("should return 404 for public mutation routes (POST, PATCH, DELETE)", async () => {
      const postRes = await apiRequest("/api/v1/audit-logs", {
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: { action: "HACK" },
      });
      assert.equal(postRes.status, 404);

      const patchRes = await apiRequest(
        `/api/v1/audit-logs/${new mongoose.Types.ObjectId()}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${superAdminToken}` },
          body: { action: "HACK" },
        }
      );
      assert.equal(patchRes.status, 404);

      const deleteRes = await apiRequest(
        `/api/v1/audit-logs/${new mongoose.Types.ObjectId()}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );
      assert.equal(deleteRes.status, 404);
    });
  });

  // =====================  SUITE 6: REAL DOMAIN MUTATION =======
  describe("Real Domain Mutation Integration", () => {
    it("should record an audit log when userService.updateUserStatus is executed", async () => {
      await AuditLog.collection.deleteMany({});

      // Update target resident status to SUSPENDED by Super Admin
      await usersService.updateUserStatus(
        {
          actor: { id: SUPER_ADMIN_ID.toString(), role: ROLES.SUPER_ADMIN },
          id: TARGET_USER_ID.toString(),
          status: ACCOUNT_STATUS.SUSPENDED,
        },
        { ipAddress: "192.168.1.100", userAgent: "AdminBrowser/1.0" }
      );

      const log = await AuditLog.findOne({
        action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
        resourceId: TARGET_USER_ID,
      }).lean();

      assert.ok(log);
      assert.equal(log.actorRole, "SUPER_ADMIN");
      assert.equal(log.resourceType, "USER");
      assert.equal(log.beforeState.status, "ACTIVE");
      assert.equal(log.afterState.status, "SUSPENDED");
      assert.equal(log.ipAddress, "192.168.1.100");
    });
  });
});
