// =====================  IMPORTS & TEST RUNNER  =============
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Notification } from "./notifications.model.js";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_LIMITS,
  NOTIFICATION_TTL_SECONDS,
} from "./notifications.constants.js";
import { notificationsService } from "./notifications.service.js";
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
const USER_A_ID = new mongoose.Types.ObjectId();
const USER_B_ID = new mongoose.Types.ObjectId();
const USER_C_ID = new mongoose.Types.ObjectId();

// JWT Tokens
let userAToken;
let userBToken;
let userCToken;

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
describe("Module 19: In-App Notifications (notifications)", () => {
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
      Notification.deleteMany({}),
      Building.deleteMany({}),
      User.deleteMany({}),
    ]);

    // Seed test buildings
    await Building.create([
      {
        _id: BUILDING_A_ID,
        name: "Alert Complex Alpha",
        code: `ACA-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Notification Way",
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
        name: "Alert Complex Beta",
        code: `ACB-${Date.now().toString().slice(-4)}`,
        address: {
          street: "200 Signal Boulevard",
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
        _id: USER_A_ID,
        firstName: "Alice",
        lastName: "Resident",
        email: "alice.notif@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: USER_B_ID,
        firstName: "Bob",
        lastName: "Tenant",
        email: "bob.notif@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: USER_C_ID,
        firstName: "Charlie",
        lastName: "Manager",
        email: "charlie.notif@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
    ]);

    // Generate JWT access tokens
    userAToken = generateAccessToken({
      sub: USER_A_ID.toString(),
      role: ROLES.OWNER,
    });

    userBToken = generateAccessToken({
      sub: USER_B_ID.toString(),
      role: ROLES.TENANT,
    });

    userCToken = generateAccessToken({
      sub: USER_C_ID.toString(),
      role: ROLES.MANAGER,
      buildingIds: [BUILDING_A_ID.toString()],
    });

    // Ensure indexes are synchronized
    await Notification.syncIndexes();
  });

  after(async () => {
    await Promise.all([
      Notification.deleteMany({}),
      Building.deleteMany({}),
      User.deleteMany({}),
    ]);
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
  });

  // =====================  SUITE 1: MODEL & SCHEMA  ===========
  describe("1. Schema, Model & Index Invariants", () => {
    it("should reject creation when required fields are missing", async () => {
      const doc = new Notification({});
      let err;
      try {
        await doc.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err, "Validation error expected");
      assert.ok(err.errors.recipientUserId);
      assert.ok(err.errors.buildingId);
      assert.ok(err.errors.title);
      assert.ok(err.errors.body);
      assert.ok(err.errors.category);
    });

    it("should reject invalid category enums", async () => {
      const doc = new Notification({
        recipientUserId: USER_A_ID,
        buildingId: BUILDING_A_ID,
        title: "Test Notice",
        body: "Test Body",
        category: "INVALID_CATEGORY",
      });
      let err;
      try {
        await doc.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err, "Expected invalid category enum rejection");
      assert.ok(err.errors.category);
    });

    it("should reject title or body exceeding maximum bounds", async () => {
      const longTitle = "A".repeat(NOTIFICATION_LIMITS.TITLE_MAX_LENGTH + 1);
      const doc = new Notification({
        recipientUserId: USER_A_ID,
        buildingId: BUILDING_A_ID,
        title: longTitle,
        body: "Short body",
        category: NOTIFICATION_CATEGORY.INVOICE,
      });
      let err;
      try {
        await doc.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err);
      assert.ok(err.errors.title);
    });

    it("should default isRead to false and readAt to null", async () => {
      const doc = await Notification.create({
        recipientUserId: USER_A_ID,
        buildingId: BUILDING_A_ID,
        title: "Maintenance Bill",
        body: "Your monthly invoice is ready",
        category: NOTIFICATION_CATEGORY.INVOICE,
      });
      assert.strictEqual(doc.isRead, false);
      assert.strictEqual(doc.readAt, null);
    });

    it("should verify 90-day TTL index on createdAt", async () => {
      const indexes = await Notification.collection.indexes();
      const ttlIndex = indexes.find(
        (idx) => idx.key && idx.key.createdAt === 1 && idx.expireAfterSeconds
      );
      assert.ok(ttlIndex, "Expected TTL index on createdAt");
      assert.strictEqual(
        ttlIndex.expireAfterSeconds,
        NOTIFICATION_TTL_SECONDS,
        "TTL must be exactly 7,776,000 seconds (90 days)"
      );
    });

    it("should verify compound queries indexes exist", async () => {
      const indexes = await Notification.collection.indexes();
      const feedIndex = indexes.find(
        (idx) =>
          idx.key && idx.key.recipientUserId === 1 && idx.key.createdAt === -1
      );
      assert.ok(feedIndex, "Expected compound feed index");

      const filteredIndex = indexes.find(
        (idx) =>
          idx.key &&
          idx.key.recipientUserId === 1 &&
          idx.key.isRead === 1 &&
          idx.key.createdAt === -1
      );
      assert.ok(filteredIndex, "Expected compound filtered feed index");
    });

    it("should sanitize output via toSafeNotification()", async () => {
      const refId = new mongoose.Types.ObjectId();
      const doc = await Notification.create({
        recipientUserId: USER_A_ID,
        buildingId: BUILDING_A_ID,
        title: "Security Alert",
        body: "Gate 1 maintenance",
        category: NOTIFICATION_CATEGORY.SECURITY,
        referenceId: refId,
        referenceModel: "SecurityLog",
      });

      const safe = doc.toSafeNotification();
      assert.strictEqual(safe._id, doc._id.toString());
      assert.strictEqual(safe.id, doc._id.toString());
      assert.strictEqual(safe.recipientUserId, USER_A_ID.toString());
      assert.strictEqual(safe.buildingId, BUILDING_A_ID.toString());
      assert.strictEqual(safe.referenceId, refId.toString());
      assert.strictEqual(safe.referenceModel, "SecurityLog");
      assert.strictEqual(safe.isRead, false);
      assert.strictEqual(safe.readAt, null);
      assert.ok(typeof safe.createdAt === "string");
      assert.strictEqual(safe.__v, undefined);
    });
  });

  // =====================  SUITE 2: GET FEED  =================
  describe("2. Personal Notifications Feed (GET /api/v1/notifications)", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await apiRequest("/api/v1/notifications");
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
    });

    it("should strictly enforce personal data isolation: User A sees only User A alerts", async () => {
      // Seed 3 notifications for User A
      await Notification.create([
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "User A Alert 1",
          body: "Notice A1",
          category: NOTIFICATION_CATEGORY.NOTICE,
        },
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "User A Alert 2",
          body: "Invoice A2",
          category: NOTIFICATION_CATEGORY.INVOICE,
        },
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "User A Alert 3",
          body: "Complaint A3",
          category: NOTIFICATION_CATEGORY.COMPLAINT,
        },
      ]);

      // Seed 2 notifications for User B
      await Notification.create([
        {
          recipientUserId: USER_B_ID,
          buildingId: BUILDING_A_ID,
          title: "User B Alert 1",
          body: "Payment B1",
          category: NOTIFICATION_CATEGORY.PAYMENT,
        },
        {
          recipientUserId: USER_B_ID,
          buildingId: BUILDING_B_ID,
          title: "User B Alert 2",
          body: "Visitor B2",
          category: NOTIFICATION_CATEGORY.VISITOR,
        },
      ]);

      // Query as User A
      const resA = await apiRequest("/api/v1/notifications", {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.strictEqual(resA.status, 200);
      assert.strictEqual(resA.data.success, true);
      assert.strictEqual(resA.data.data.pagination.total, 3);
      assert.strictEqual(resA.data.data.items.length, 3);
      resA.data.data.items.forEach((item) => {
        assert.strictEqual(item.recipientUserId, USER_A_ID.toString());
      });

      // Query as User B
      const resB = await apiRequest("/api/v1/notifications", {
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      assert.strictEqual(resB.status, 200);
      assert.strictEqual(resB.data.success, true);
      assert.strictEqual(resB.data.data.pagination.total, 2);
      assert.strictEqual(resB.data.data.items.length, 2);
      resB.data.data.items.forEach((item) => {
        assert.strictEqual(item.recipientUserId, USER_B_ID.toString());
      });

      // Query as User C (no notifications)
      const resC = await apiRequest("/api/v1/notifications", {
        headers: { Authorization: `Bearer ${userCToken}` },
      });
      assert.strictEqual(resC.status, 200);
      assert.strictEqual(resC.data.data.pagination.total, 0);
      assert.strictEqual(resC.data.data.items.length, 0);
    });

    it("should return newest-first deterministic chronological order", async () => {
      const t1 = new Date(Date.now() - 30000);
      const t2 = new Date(Date.now() - 20000);
      const t3 = new Date(Date.now() - 10000);

      await Notification.create([
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "Oldest Alert",
          body: "Body 1",
          category: NOTIFICATION_CATEGORY.NOTICE,
          createdAt: t1,
        },
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "Middle Alert",
          body: "Body 2",
          category: NOTIFICATION_CATEGORY.INVOICE,
          createdAt: t2,
        },
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "Newest Alert",
          body: "Body 3",
          category: NOTIFICATION_CATEGORY.SECURITY,
          createdAt: t3,
        },
      ]);

      const res = await apiRequest("/api/v1/notifications", {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.items[0].title, "Newest Alert");
      assert.strictEqual(res.data.data.items[1].title, "Middle Alert");
      assert.strictEqual(res.data.data.items[2].title, "Oldest Alert");
    });

    it("should support bounded pagination", async () => {
      const items = Array.from({ length: 15 }).map((_, idx) => ({
        recipientUserId: USER_A_ID,
        buildingId: BUILDING_A_ID,
        title: `Alert ${idx + 1}`,
        body: `Body ${idx + 1}`,
        category: NOTIFICATION_CATEGORY.WORK_ORDER,
      }));
      await Notification.insertMany(items);

      const resPage1 = await apiRequest(
        "/api/v1/notifications?page=1&limit=5",
        {
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );
      assert.strictEqual(resPage1.status, 200);
      assert.strictEqual(resPage1.data.data.items.length, 5);
      assert.strictEqual(resPage1.data.data.pagination.page, 1);
      assert.strictEqual(resPage1.data.data.pagination.limit, 5);
      assert.strictEqual(resPage1.data.data.pagination.total, 15);
      assert.strictEqual(resPage1.data.data.pagination.totalPages, 3);
      assert.strictEqual(resPage1.data.data.pagination.hasNextPage, true);
      assert.strictEqual(resPage1.data.data.pagination.hasPrevPage, false);

      const resPage2 = await apiRequest(
        "/api/v1/notifications?page=2&limit=5",
        {
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );
      assert.strictEqual(resPage2.status, 200);
      assert.strictEqual(resPage2.data.data.items.length, 5);
      assert.strictEqual(resPage2.data.data.pagination.page, 2);
      assert.strictEqual(resPage2.data.data.pagination.hasPrevPage, true);

      // Verify no duplicate keys across pages
      const idsPage1 = resPage1.data.data.items.map((i) => i.id);
      const idsPage2 = resPage2.data.data.items.map((i) => i.id);
      idsPage1.forEach((id) => assert.ok(!idsPage2.includes(id)));
    });

    it("should filter notifications by isRead=false and isRead=true", async () => {
      await Notification.create([
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "Unread Alert 1",
          body: "B1",
          category: NOTIFICATION_CATEGORY.NOTICE,
          isRead: false,
        },
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "Unread Alert 2",
          body: "B2",
          category: NOTIFICATION_CATEGORY.NOTICE,
          isRead: false,
        },
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "Read Alert 1",
          body: "B3",
          category: NOTIFICATION_CATEGORY.NOTICE,
          isRead: true,
          readAt: new Date(),
        },
      ]);

      // Query unread
      const unreadRes = await apiRequest("/api/v1/notifications?isRead=false", {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.strictEqual(unreadRes.status, 200);
      assert.strictEqual(unreadRes.data.data.pagination.total, 2);
      unreadRes.data.data.items.forEach((item) => {
        assert.strictEqual(item.isRead, false);
      });

      // Query read
      const readRes = await apiRequest("/api/v1/notifications?isRead=true", {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.strictEqual(readRes.status, 200);
      assert.strictEqual(readRes.data.data.pagination.total, 1);
      assert.strictEqual(readRes.data.data.items[0].isRead, true);
    });

    it("should filter notifications by category", async () => {
      await Notification.create([
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "Invoice 1",
          body: "Inv",
          category: NOTIFICATION_CATEGORY.INVOICE,
        },
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "Payment 1",
          body: "Pay",
          category: NOTIFICATION_CATEGORY.PAYMENT,
        },
      ]);

      const res = await apiRequest("/api/v1/notifications?category=INVOICE", {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.pagination.total, 1);
      assert.strictEqual(res.data.data.items[0].category, "INVOICE");
    });

    it("should reject invalid category with 400 validation error", async () => {
      const res = await apiRequest(
        "/api/v1/notifications?category=INVALID_CAT",
        {
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });

    it("should reject query injection of recipientUserId via strict schema", async () => {
      const res = await apiRequest(
        `/api/v1/notifications?recipientUserId=${USER_B_ID}`,
        {
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });

    it("should reject Mongo operator injection in query params", async () => {
      const res = await apiRequest("/api/v1/notifications?isRead[$ne]=true", {
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });
  });

  // =====================  SUITE 3: MARK ONE READ  ============
  describe("3. Mark Single Notification Read (PATCH /api/v1/notifications/:id/read)", () => {
    it("should reject unauthenticated request with 401", async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await apiRequest(`/api/v1/notifications/${id}/read`, {
        method: "PATCH",
      });
      assert.strictEqual(res.status, 401);
    });

    it("should reject invalid ObjectId format with 400", async () => {
      const res = await apiRequest(
        "/api/v1/notifications/not-an-object-id/read",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });

    it("should return 404 for non-existent notification ID", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await apiRequest(
        `/api/v1/notifications/${nonExistentId}/read`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);
    });

    it("should prevent cross-user mutation (Anti-IDOR): returns 404 and leaves other user's alert unchanged", async () => {
      // Create notification belonging to User B
      const notifB = await Notification.create({
        recipientUserId: USER_B_ID,
        buildingId: BUILDING_A_ID,
        title: "Confidential Bob Notice",
        body: "Bob private data",
        category: NOTIFICATION_CATEGORY.INVOICE,
        isRead: false,
      });

      // User A attempts to mark User B's notification read
      const res = await apiRequest(`/api/v1/notifications/${notifB._id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.success, false);

      // Verify User B's notification is completely untouched in database
      const dbDoc = await Notification.findById(notifB._id);
      assert.strictEqual(dbDoc.isRead, false);
      assert.strictEqual(dbDoc.readAt, null);
    });

    it("should successfully mark own unread notification as read", async () => {
      const notifA = await Notification.create({
        recipientUserId: USER_A_ID,
        buildingId: BUILDING_A_ID,
        title: "Alice Rent Notice",
        body: "Rent received",
        category: NOTIFICATION_CATEGORY.PAYMENT,
        isRead: false,
      });

      const before = new Date();
      const res = await apiRequest(`/api/v1/notifications/${notifA._id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.isRead, true);
      assert.ok(res.data.data.readAt);

      const readAtDate = new Date(res.data.data.readAt);
      assert.ok(readAtDate >= before);

      // Verify in DB
      const dbDoc = await Notification.findById(notifA._id);
      assert.strictEqual(dbDoc.isRead, true);
      assert.ok(dbDoc.readAt instanceof Date);
    });

    it("should be idempotent: repeated call preserves initial readAt timestamp", async () => {
      const initialReadAt = new Date(Date.now() - 10000);
      const notifA = await Notification.create({
        recipientUserId: USER_A_ID,
        buildingId: BUILDING_A_ID,
        title: "Already Read Notice",
        body: "Some content",
        category: NOTIFICATION_CATEGORY.NOTICE,
        isRead: true,
        readAt: initialReadAt,
      });

      const res = await apiRequest(`/api/v1/notifications/${notifA._id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.isRead, true);
      assert.strictEqual(
        new Date(res.data.data.readAt).getTime(),
        initialReadAt.getTime(),
        "readAt must not be overwritten when already read"
      );
    });

    it("should reject mass assignment request body", async () => {
      const notifA = await Notification.create({
        recipientUserId: USER_A_ID,
        buildingId: BUILDING_A_ID,
        title: "Alice Alert",
        body: "Original body",
        category: NOTIFICATION_CATEGORY.NOTICE,
      });

      const res = await apiRequest(`/api/v1/notifications/${notifA._id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${userAToken}` },
        body: {
          recipientUserId: USER_B_ID.toString(),
          title: "Hacked Title",
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);

      // Verify document unchanged
      const dbDoc = await Notification.findById(notifA._id);
      assert.strictEqual(dbDoc.title, "Alice Alert");
      assert.strictEqual(
        dbDoc.recipientUserId.toString(),
        USER_A_ID.toString()
      );
    });
  });

  // =====================  SUITE 4: MARK ALL READ  ===========
  describe("4. Mark All Notifications Read (PATCH /api/v1/notifications/read-all)", () => {
    it("should reject unauthenticated request with 401", async () => {
      const res = await apiRequest("/api/v1/notifications/read-all", {
        method: "PATCH",
      });
      assert.strictEqual(res.status, 401);
    });

    it("should return updatedCount=0 when user has no unread alerts", async () => {
      await Notification.create({
        recipientUserId: USER_A_ID,
        buildingId: BUILDING_A_ID,
        title: "Already Read",
        body: "Done",
        category: NOTIFICATION_CATEGORY.NOTICE,
        isRead: true,
        readAt: new Date(),
      });

      const res = await apiRequest("/api/v1/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.updatedCount, 0);
    });

    it("should mark all own unread notifications read while leaving User B completely untouched", async () => {
      const originalReadAt = new Date(Date.now() - 50000);

      // User A has 3 unread and 2 read
      await Notification.create([
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "A Unread 1",
          body: "A1",
          category: NOTIFICATION_CATEGORY.INVOICE,
          isRead: false,
        },
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "A Unread 2",
          body: "A2",
          category: NOTIFICATION_CATEGORY.WORK_ORDER,
          isRead: false,
        },
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "A Unread 3",
          body: "A3",
          category: NOTIFICATION_CATEGORY.SECURITY,
          isRead: false,
        },
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "A Read 1",
          body: "AR1",
          category: NOTIFICATION_CATEGORY.PAYMENT,
          isRead: true,
          readAt: originalReadAt,
        },
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "A Read 2",
          body: "AR2",
          category: NOTIFICATION_CATEGORY.VISITOR,
          isRead: true,
          readAt: originalReadAt,
        },
      ]);

      // User B has 4 unread
      await Notification.create([
        {
          recipientUserId: USER_B_ID,
          buildingId: BUILDING_A_ID,
          title: "B Unread 1",
          body: "B1",
          category: NOTIFICATION_CATEGORY.INVOICE,
          isRead: false,
        },
        {
          recipientUserId: USER_B_ID,
          buildingId: BUILDING_A_ID,
          title: "B Unread 2",
          body: "B2",
          category: NOTIFICATION_CATEGORY.INVOICE,
          isRead: false,
        },
        {
          recipientUserId: USER_B_ID,
          buildingId: BUILDING_A_ID,
          title: "B Unread 3",
          body: "B3",
          category: NOTIFICATION_CATEGORY.NOTICE,
          isRead: false,
        },
        {
          recipientUserId: USER_B_ID,
          buildingId: BUILDING_A_ID,
          title: "B Unread 4",
          body: "B4",
          category: NOTIFICATION_CATEGORY.COMPLAINT,
          isRead: false,
        },
      ]);

      // Execute read-all as User A
      const res = await apiRequest("/api/v1/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${userAToken}` },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.updatedCount, 3);

      // Verify User A has 0 unread
      const aDocs = await Notification.find({ recipientUserId: USER_A_ID });
      assert.strictEqual(aDocs.length, 5);
      aDocs.forEach((doc) => {
        assert.strictEqual(doc.isRead, true);
        assert.ok(doc.readAt instanceof Date);
      });

      // Verify previously read alerts retained their original readAt
      const preservedDoc = aDocs.find((d) => d.title === "A Read 1");
      assert.strictEqual(
        preservedDoc.readAt.getTime(),
        originalReadAt.getTime()
      );

      // Verify User B's alerts are COMPLETELY untouched (still 4 unread)
      const bDocs = await Notification.find({ recipientUserId: USER_B_ID });
      assert.strictEqual(bDocs.length, 4);
      bDocs.forEach((doc) => {
        assert.strictEqual(doc.isRead, false);
        assert.strictEqual(doc.readAt, null);
      });
    });

    it("should reject extraneous query parameters or body payloads on read-all", async () => {
      const resWithBody = await apiRequest("/api/v1/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${userAToken}` },
        body: { buildingId: BUILDING_A_ID.toString() },
      });
      assert.strictEqual(resWithBody.status, 400);

      const resWithQuery = await apiRequest(
        "/api/v1/notifications/read-all?force=true",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${userAToken}` },
        }
      );
      assert.strictEqual(resWithQuery.status, 400);
    });
  });

  // =====================  SUITE 5: INTERNAL HELPERS  =========
  describe("5. Internal Notification Factory & Batch Helpers", () => {
    it("should create single notification via createNotification", async () => {
      const refId = new mongoose.Types.ObjectId();
      const notif = await notificationsService.createNotification({
        recipientUserId: USER_A_ID,
        buildingId: BUILDING_A_ID,
        title: "Direct Internal Alert",
        body: "Work order completed",
        category: NOTIFICATION_CATEGORY.WORK_ORDER,
        referenceId: refId,
        referenceModel: "MaintenanceRequest",
      });

      assert.strictEqual(notif.recipientUserId, USER_A_ID.toString());
      assert.strictEqual(notif.title, "Direct Internal Alert");
      assert.strictEqual(notif.referenceModel, "MaintenanceRequest");
      assert.strictEqual(notif.isRead, false);
    });

    it("should batch insert notifications via createManyNotifications", async () => {
      const items = [
        {
          recipientUserId: USER_A_ID,
          buildingId: BUILDING_A_ID,
          title: "Broadcast 1",
          body: "Body 1",
          category: NOTIFICATION_CATEGORY.NOTICE,
        },
        {
          recipientUserId: USER_B_ID,
          buildingId: BUILDING_A_ID,
          title: "Broadcast 2",
          body: "Body 2",
          category: NOTIFICATION_CATEGORY.NOTICE,
        },
      ];

      const results = await notificationsService.createManyNotifications(items);
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].recipientUserId, USER_A_ID.toString());
      assert.strictEqual(results[1].recipientUserId, USER_B_ID.toString());
    });
  });
});
