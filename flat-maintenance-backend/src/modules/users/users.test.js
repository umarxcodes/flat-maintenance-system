// =====================  IMPORTS  ==========================
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { User } from "../../models/user.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { generateAccessToken } from "../../utils/token.util.js";
import { hashToken } from "../../utils/crypto.util.js";

dotenv.config();

// =====================  TEST HELPERS & FIXTURES  ==========
let server;
let baseUrl;

// Helper to make HTTP requests against the test server
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
    if (requestBody) req.write(requestBody);
    req.end();
  });
};

describe("Users Domain Module (Module 2)", () => {
  const testRunId = Date.now();
  const testUsers = [];

  // Mock building IDs
  const buildingA = new mongoose.Types.ObjectId().toString();
  const buildingB = new mongoose.Types.ObjectId().toString();
  const buildingC = new mongoose.Types.ObjectId().toString(); // Outside building admin's scope

  let superAdminToken;
  let buildingAdminToken;
  let buildingAdminId;
  let tenantToken;
  let tenantId;

  before(async () => {
    await connectDB();
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 1. Create SuperAdmin
    const superAdmin = new User({
      firstName: "Super",
      lastName: "Governor",
      email: `super.${testRunId}@test.local`,
      password: "SuperPassword123!",
      phone: "+923001111111",
      role: ROLES.SUPER_ADMIN,
      status: ACCOUNT_STATUS.ACTIVE,
      assignedBuildingIds: [],
    });
    await superAdmin.save();
    testUsers.push(superAdmin._id);
    superAdminToken = generateAccessToken({
      sub: superAdmin._id.toString(),
      role: superAdmin.role,
      buildingIds: [],
      jti: "super-jti",
    });

    // 2. Create BuildingAdmin scoped to Building A and B
    const buildingAdmin = new User({
      firstName: "Building",
      lastName: "Admin",
      email: `admin.${testRunId}@test.local`,
      password: "AdminPassword123!",
      phone: "+923002222222",
      role: ROLES.BUILDING_ADMIN,
      status: ACCOUNT_STATUS.ACTIVE,
      assignedBuildingIds: [buildingA, buildingB],
    });
    await buildingAdmin.save();
    buildingAdminId = buildingAdmin._id.toString();
    testUsers.push(buildingAdmin._id);
    buildingAdminToken = generateAccessToken({
      sub: buildingAdmin._id.toString(),
      role: buildingAdmin.role,
      buildingIds: [buildingA, buildingB],
      jti: "admin-jti",
    });

    // 3. Create Tenant in Building A
    const tenant = new User({
      firstName: "Resident",
      lastName: "Tenant",
      email: `tenant.${testRunId}@test.local`,
      password: "TenantPassword123!",
      phone: "+923003333333",
      role: ROLES.TENANT,
      status: ACCOUNT_STATUS.ACTIVE,
      assignedBuildingIds: [buildingA],
    });
    await tenant.save();
    tenantId = tenant._id.toString();
    testUsers.push(tenant._id);
    tenantToken = generateAccessToken({
      sub: tenant._id.toString(),
      role: tenant.role,
      buildingIds: [buildingA],
      jti: "tenant-jti",
    });
  });

  after(async () => {
    if (testUsers.length > 0) {
      await User.deleteMany({ _id: { $in: testUsers } });
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  });

  // =====================  1. USER INVITATION  ===============
  describe("1. User Invitation (POST /api/v1/users/invite)", () => {
    test("Building Admin successfully invites a Manager within authorized building scope", async () => {
      const inviteEmail = `invited.manager.${testRunId}@test.local`;

      const res = await apiRequest("/api/v1/users/invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          firstName: "Facility",
          lastName: "Manager",
          email: inviteEmail,
          phone: "+923004444444",
          role: ROLES.MANAGER,
          assignedBuildingIds: [buildingA],
        },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.user.email, inviteEmail);
      assert.equal(res.data.data.user.role, ROLES.MANAGER);
      assert.equal(res.data.data.user.status, ACCOUNT_STATUS.PENDING);
      assert.equal(res.data.data.user.password, undefined);

      // Verify DB persistence: stored token is SHA-256 hash only
      const userInDb = await User.findOne({ email: inviteEmail }).select(
        "+invitationTokenHash"
      );
      assert.ok(userInDb);
      assert.equal(userInDb.status, ACCOUNT_STATUS.PENDING);
      assert.ok(userInDb.invitationTokenHash);
      assert.equal(userInDb.invitationTokenHash.length, 64);
      testUsers.push(userInDb._id);
    });

    test("Anti-Privilege Escalation: Building Admin CANNOT invite a SUPER_ADMIN (fails 403)", async () => {
      const res = await apiRequest("/api/v1/users/invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          firstName: "Escalated",
          lastName: "Admin",
          email: `escalate.super.${testRunId}@test.local`,
          phone: "+923005555555",
          role: ROLES.SUPER_ADMIN,
          assignedBuildingIds: [],
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /Privilege escalation rejected/);
    });

    test("Anti-Privilege Escalation: Building Admin CANNOT invite another BUILDING_ADMIN (fails 403)", async () => {
      const res = await apiRequest("/api/v1/users/invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          firstName: "Peer",
          lastName: "Admin",
          email: `peer.admin.${testRunId}@test.local`,
          phone: "+923006666666",
          role: ROLES.BUILDING_ADMIN,
          assignedBuildingIds: [buildingA],
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /Privilege escalation rejected/);
    });

    test("OBAC Scope Guard: Building Admin CANNOT assign a building outside their scope (fails 403)", async () => {
      const res = await apiRequest("/api/v1/users/invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          firstName: "Technician",
          lastName: "Unauthorized",
          email: `unauthorized.bld.${testRunId}@test.local`,
          phone: "+923007777777",
          role: ROLES.MAINTENANCE_STAFF,
          assignedBuildingIds: [buildingC], // buildingC is NOT in [buildingA, buildingB]
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /outside your authorized scope/);
    });

    test("Duplicate Active Email: Cannot invite email that is already an active user (fails 409)", async () => {
      // tenantId user is already ACTIVE with email tenant.<testRunId>@test.local
      const res = await apiRequest("/api/v1/users/invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          firstName: "Duplicate",
          lastName: "Attempt",
          email: `tenant.${testRunId}@test.local`,
          phone: "+923008888888",
          role: ROLES.TENANT,
          assignedBuildingIds: [buildingA],
        },
      });

      assert.equal(res.status, 409);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /already exists/);
    });

    test("Duplicate Pending Re-invitation: Re-inviting a pending user refreshes the invitation", async () => {
      const pendingEmail = `pending.refresh.${testRunId}@test.local`;

      // First invite
      const res1 = await apiRequest("/api/v1/users/invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          firstName: "Pending",
          lastName: "Initial",
          email: pendingEmail,
          phone: "+923009999991",
          role: ROLES.TENANT,
          assignedBuildingIds: [buildingA],
        },
      });
      assert.equal(res1.status, 201);
      const userInDb1 = await User.findOne({ email: pendingEmail }).select(
        "+invitationTokenHash"
      );
      testUsers.push(userInDb1._id);

      // Re-invite same pending user
      const res2 = await apiRequest("/api/v1/users/invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: {
          firstName: "PendingUpdated",
          lastName: "Refreshed",
          email: pendingEmail,
          phone: "+923009999992",
          role: ROLES.TENANT,
          assignedBuildingIds: [buildingA],
        },
      });

      assert.equal(res2.status, 201);
      assert.equal(res2.data.data.user.firstName, "PendingUpdated");

      const userInDb2 = await User.findOne({ email: pendingEmail }).select(
        "+invitationTokenHash"
      );
      assert.notEqual(
        userInDb1.invitationTokenHash,
        userInDb2.invitationTokenHash,
        "Invitation token hash must be refreshed"
      );
    });

    test("Tenant / Resident cannot invoke user invitation (fails 403 Forbidden)", async () => {
      const res = await apiRequest("/api/v1/users/invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantToken}` },
        body: {
          firstName: "Unauthorized",
          lastName: "Invite",
          email: `unauth.${testRunId}@test.local`,
          phone: "+923009999993",
          role: ROLES.TENANT,
          assignedBuildingIds: [buildingA],
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });
  });

  // =====================  2. USER DIRECTORY  ================
  describe("2. User Directory (GET /api/v1/users)", () => {
    test("Super Admin can view global directory with pagination", async () => {
      const res = await apiRequest("/api/v1/users?page=1&limit=10", {
        method: "GET",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.meta);
      assert.equal(res.data.meta.page, 1);
      assert.equal(res.data.meta.limit, 10);
      assert.ok(res.data.meta.totalRecords >= 3);
    });

    test("Building Admin only sees users within their assigned building scope", async () => {
      // Create user strictly in Building C (outside Building Admin's scope)
      const outsideUser = new User({
        firstName: "Outside",
        lastName: "Resident",
        email: `outside.${testRunId}@test.local`,
        password: "OutsidePassword123!",
        phone: "+923009999994",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [buildingC],
      });
      await outsideUser.save();
      testUsers.push(outsideUser._id);

      const res = await apiRequest("/api/v1/users", {
        method: "GET",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);

      // Verify no users from building C are present
      const returnedEmails = res.data.data.map((u) => u.email);
      assert.ok(
        !returnedEmails.includes(outsideUser.email),
        "Building Admin must NOT see users belonging strictly to outside buildings"
      );
    });

    test("Building Admin attempting to filter by unauthorized building is rejected (fails 403)", async () => {
      const res = await apiRequest(`/api/v1/users?buildingId=${buildingC}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /outside your authorized scope/);
    });

    test("Soft-deleted users are never returned in directory queries", async () => {
      const deletedUser = new User({
        firstName: "Deleted",
        lastName: "Account",
        email: `deleted.${testRunId}@test.local`,
        password: "DeletedPassword123!",
        phone: "+923009999995",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [buildingA],
        isDeleted: true,
        deletedAt: new Date(),
      });
      await deletedUser.save();
      testUsers.push(deletedUser._id);

      const res = await apiRequest("/api/v1/users", {
        method: "GET",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      const returnedEmails = res.data.data.map((u) => u.email);
      assert.ok(!returnedEmails.includes(deletedUser.email));
    });

    test("Tenant calling user directory is rejected with 403 Forbidden", async () => {
      const res = await apiRequest("/api/v1/users", {
        method: "GET",
        headers: { Authorization: `Bearer ${tenantToken}` },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });
  });

  // =====================  3. USER DETAILS  ==================
  describe("3. User Details (GET /api/v1/users/:id)", () => {
    test("Super Admin can view details of any user", async () => {
      const res = await apiRequest(`/api/v1/users/${tenantId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.id, tenantId);
      assert.equal(res.data.data.password, undefined);
      assert.equal(res.data.data.refreshTokens, undefined);
    });

    test("Building Admin can view details of user within their building scope", async () => {
      const res = await apiRequest(`/api/v1/users/${tenantId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.id, tenantId);
    });

    test("Building Admin CANNOT view details of user outside their building scope (fails 403)", async () => {
      const outsideUser = new User({
        firstName: "Isolated",
        lastName: "Complex",
        email: `isolated.${testRunId}@test.local`,
        password: "Password123!",
        phone: "+923009999996",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [buildingC],
      });
      await outsideUser.save();
      testUsers.push(outsideUser._id);

      const res = await apiRequest(`/api/v1/users/${outsideUser._id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /outside your authorized building scope/);
    });

    test("Tenant querying another user ID is rejected with 403 Forbidden", async () => {
      const res = await apiRequest(`/api/v1/users/${buildingAdminId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tenantToken}` },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
    });

    test("Invalid ObjectId format returns 400 Bad Request", async () => {
      const res = await apiRequest("/api/v1/users/not-a-valid-id", {
        method: "GET",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });
  });

  // =====================  4. STATUS MANAGEMENT  =============
  describe("4. Status Management (PATCH /api/v1/users/:id/status)", () => {
    test("Super Admin can suspend an active user and revokes their active sessions", async () => {
      // Create user with active refresh session
      const targetUser = new User({
        firstName: "ToSuspend",
        lastName: "User",
        email: `suspend.me.${testRunId}@test.local`,
        password: "Password123!",
        phone: "+923009999997",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [buildingA],
        refreshTokens: [
          {
            jti: "sess-1",
            tokenHash: hashToken("dummyToken1"),
            familyId: "fam-1",
            isUsed: false,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 86400000),
          },
        ],
      });
      await targetUser.save();
      testUsers.push(targetUser._id);

      const res = await apiRequest(`/api/v1/users/${targetUser._id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: { status: ACCOUNT_STATUS.SUSPENDED },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.status, ACCOUNT_STATUS.SUSPENDED);

      // Verify that active refresh session was invalidated
      const userInDb = await User.findById(targetUser._id);
      assert.equal(userInDb.status, ACCOUNT_STATUS.SUSPENDED);
      assert.equal(
        userInDb.refreshTokens[0].isUsed,
        true,
        "Suspending user must revoke all active refresh token sessions"
      );
    });

    test("Self-modification: Actor cannot update their own account status (fails 403)", async () => {
      const res = await apiRequest(
        `/api/v1/users/${superAdminToken ? testUsers[0] : ""}/status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${superAdminToken}` },
          body: { status: ACCOUNT_STATUS.INACTIVE },
        }
      );

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /Self status modification is prohibited/);
    });

    test("Building Admin CANNOT modify status of SUPER_ADMIN or another BUILDING_ADMIN (fails 403)", async () => {
      const res = await apiRequest(`/api/v1/users/${testUsers[0]}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${buildingAdminToken}` },
        body: { status: ACCOUNT_STATUS.SUSPENDED },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /equal or higher role/);
    });
  });

  // =====================  5. SELF-SERVICE PROFILE  ==========
  describe("5. Self-Service Profile (/api/v1/users/profile)", () => {
    test("GET /api/v1/users/profile returns authenticated user's profile", async () => {
      const res = await apiRequest("/api/v1/users/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${tenantToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.id, tenantId);
      assert.equal(res.data.data.role, ROLES.TENANT);
      assert.equal(res.data.data.password, undefined);
    });

    test("PATCH /api/v1/users/profile allows updating personal profile information", async () => {
      const res = await apiRequest("/api/v1/users/profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tenantToken}` },
        body: {
          firstName: "UpdatedTenantName",
          phone: "+923009999998",
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.firstName, "UpdatedTenantName");
      assert.equal(res.data.data.phone, "+923009999998");
    });

    test("Mass-Assignment Protection: Self-profile update cannot alter role, status, or buildingIds", async () => {
      const res = await apiRequest("/api/v1/users/profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tenantToken}` },
        body: {
          firstName: "SecureTenant",
          role: ROLES.SUPER_ADMIN, // Malicious attempt to elevate role
          status: ACCOUNT_STATUS.SUSPENDED,
          assignedBuildingIds: [buildingC],
        },
      });

      assert.equal(res.status, 200);

      // Verify in DB that role and status were NOT altered
      const userInDb = await User.findById(tenantId);
      assert.equal(
        userInDb.role,
        ROLES.TENANT,
        "Role must remain immutable from self-profile endpoint"
      );
      assert.equal(userInDb.status, ACCOUNT_STATUS.ACTIVE);
      assert.deepEqual(
        userInDb.assignedBuildingIds.map((b) => b.toString()),
        [buildingA],
        "Building scope must remain immutable from self-profile endpoint"
      );
    });

    test("DELETE /api/v1/users/profile/avatar removes user avatarUrl", async () => {
      // First set an avatarUrl directly in DB
      await User.findByIdAndUpdate(tenantId, {
        avatarUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      });

      const res = await apiRequest("/api/v1/users/profile/avatar", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tenantToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.avatarUrl, null);

      const userInDb = await User.findById(tenantId);
      assert.equal(userInDb.avatarUrl, null);
    });

    test("POST /api/v1/users/profile/avatar returns 400 when no file is uploaded", async () => {
      const res = await apiRequest("/api/v1/users/profile/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${tenantToken}` },
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });
  });

  // =====================  6. SECURITY INVARIANTS  ==========
  describe("6. Security Invariants Verification", () => {
    test("Active email addresses remain unique via partial index", async () => {
      const uniqueEmail = `unique.index.${testRunId}@test.local`;
      const user1 = new User({
        firstName: "First",
        lastName: "User",
        email: uniqueEmail,
        password: "Password123!",
        phone: "+923009999999",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });
      await user1.save();
      testUsers.push(user1._id);

      // Creating second user with same active email must fail MongoDB duplicate key
      const user2 = new User({
        firstName: "Second",
        lastName: "User",
        email: uniqueEmail,
        password: "Password123!",
        phone: "+923009999900",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });

      await assert.rejects(
        async () => {
          await user2.save();
        },
        { name: "MongoServerError" }
      );
    });
  });
});
