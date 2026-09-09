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
import { hashToken, generateCryptoToken } from "../../utils/crypto.util.js";
import { AUTH_CONSTANTS } from "./auth.constants.js";

dotenv.config();

let server;
let baseUrl;

// Helper to parse cookies from Set-Cookie headers
const parseSetCookie = (headers) => {
  const raw = headers["set-cookie"];
  if (!raw) return {};
  const cookies = {};
  const array = Array.isArray(raw) ? raw : [raw];
  for (const str of array) {
    const parts = str.split(";")[0].split("=");
    cookies[parts[0].trim()] = parts[1] ? parts[1].trim() : "";
  }
  return cookies;
};

// Helper to make HTTP requests against test server
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
            cookies: parseSetCookie(res.headers),
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

describe("Authentication & Session Module (Module 1)", () => {
  const testRunId = Date.now();
  const testUsers = [];

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
  });

  after(async () => {
    if (testUsers.length > 0) {
      await User.deleteMany({ _id: { $in: testUsers } });
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  });

  // ========================================================
  // 1. LOGIN TESTS
  // ========================================================
  describe("1. Login (POST /api/v1/auth/login)", () => {
    const validEmail = `user.login.${testRunId}@test.local`;
    const validPassword = "SecurePassword123!";

    before(async () => {
      const user = new User({
        firstName: "Active",
        lastName: "Resident",
        email: validEmail,
        password: validPassword,
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });
      await user.save();
      testUsers.push(user._id);
    });

    test("Successfully authenticates with valid credentials and sets HttpOnly cookie", async () => {
      const res = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: {
          email: validEmail,
          password: validPassword,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(
        res.data.data.accessToken,
        "Access token must be returned in JSON data"
      );
      assert.equal(res.data.data.user.email, validEmail);
      assert.equal(res.data.data.user.role, ROLES.TENANT);
      assert.equal(
        res.data.data.refreshToken,
        undefined,
        "Refresh token MUST NOT be exposed in JSON body"
      );
      assert.ok(
        res.cookies.refreshToken,
        "HttpOnly refreshToken cookie must be set in response"
      );
    });

    test("Rejects non-existent email with generic safe 401 message", async () => {
      const res = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: {
          email: "unknown.account@test.local",
          password: "SomePassword123!",
        },
      });

      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
      assert.equal(res.data.message, "Invalid email or password");
    });

    test("Rejects incorrect password with generic safe 401 message", async () => {
      const res = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: {
          email: validEmail,
          password: "WrongPassword999!",
        },
      });

      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
      assert.equal(res.data.message, "Invalid email or password");
    });

    test("Rejects authentication for PENDING accounts", async () => {
      const pendingEmail = `pending.${testRunId}@test.local`;
      const pendingUser = new User({
        firstName: "Pending",
        lastName: "User",
        email: pendingEmail,
        password: validPassword,
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.PENDING,
      });
      await pendingUser.save();
      testUsers.push(pendingUser._id);

      const res = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: {
          email: pendingEmail,
          password: validPassword,
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /Account is not active/);
    });

    test("Rejects authentication for SUSPENDED accounts", async () => {
      const suspendedEmail = `suspended.${testRunId}@test.local`;
      const suspendedUser = new User({
        firstName: "Suspended",
        lastName: "User",
        email: suspendedEmail,
        password: validPassword,
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.SUSPENDED,
      });
      await suspendedUser.save();
      testUsers.push(suspendedUser._id);

      const res = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: {
          email: suspendedEmail,
          password: validPassword,
        },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /Account is not active/);
    });

    test("5 failed login attempts triggers account lock; resets on successful login", async () => {
      const lockoutEmail = `lockout.${testRunId}@test.local`;
      const lockoutUser = new User({
        firstName: "Lockout",
        lastName: "Test",
        email: lockoutEmail,
        password: validPassword,
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });
      await lockoutUser.save();
      testUsers.push(lockoutUser._id);

      // Attempt 1 to 5 with wrong password
      for (let i = 1; i <= 5; i++) {
        const res = await apiRequest("/api/v1/auth/login", {
          method: "POST",
          body: {
            email: lockoutEmail,
            password: "WrongPassword!",
          },
        });
        assert.equal(res.status, 401);
      }

      // 6th attempt: Account is now locked
      const lockedRes = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: {
          email: lockoutEmail,
          password: validPassword, // Even with correct password, locked accounts are rejected
        },
      });
      assert.equal(lockedRes.status, 401);
      assert.match(lockedRes.data.message, /locked/i);

      // Reset lock in DB to verify successful login resets failedLoginAttempts
      await User.updateOne(
        { _id: lockoutUser._id },
        { $set: { lockUntil: null, failedLoginAttempts: 4 } }
      );

      const successRes = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: {
          email: lockoutEmail,
          password: validPassword,
        },
      });
      assert.equal(successRes.status, 200);

      const verifiedUser = await User.findById(lockoutUser._id);
      assert.equal(verifiedUser.failedLoginAttempts, 0);
      assert.equal(verifiedUser.lockUntil, null);
    });
  });

  // ========================================================
  // 2. REFRESH & TOKEN ROTATION TESTS
  // ========================================================
  describe("2. Refresh & Token Rotation (POST /api/v1/auth/refresh)", () => {
    const refreshEmail = `refresh.${testRunId}@test.local`;
    const refreshPassword = "SecurePassword123!";
    let initialRefreshToken = "";
    let initialAccessToken = "";

    before(async () => {
      const user = new User({
        firstName: "Refresh",
        lastName: "User",
        email: refreshEmail,
        password: refreshPassword,
        role: ROLES.BUILDING_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
      });
      await user.save();
      testUsers.push(user._id);

      const loginRes = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: { email: refreshEmail, password: refreshPassword },
      });
      initialRefreshToken = loginRes.cookies.refreshToken;
      initialAccessToken = loginRes.data.data.accessToken;
    });

    test("Rejects refresh request if cookie is missing", async () => {
      const res = await apiRequest("/api/v1/auth/refresh", {
        method: "POST",
      });
      assert.equal(res.status, 401);
      assert.equal(res.data.success, false);
    });

    test("Rotates refresh token: marks old token as used, issues new access and refresh token", async () => {
      const res = await apiRequest("/api/v1/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: `refreshToken=${initialRefreshToken}`,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.ok(res.data.data.accessToken);
      assert.notEqual(res.data.data.accessToken, initialAccessToken);
      assert.ok(res.cookies.refreshToken);
      assert.notEqual(res.cookies.refreshToken, initialRefreshToken);

      // Verify DB state: old token is marked isUsed: true
      const user = await User.findOne({ email: refreshEmail });
      const oldHash = hashToken(initialRefreshToken);
      const oldRecord = user.refreshTokens.find((t) => t.tokenHash === oldHash);
      assert.ok(oldRecord, "Old token record must exist in DB");
      assert.equal(
        oldRecord.isUsed,
        true,
        "Old token must be marked isUsed: true"
      );

      const newHash = hashToken(res.cookies.refreshToken);
      const newRecord = user.refreshTokens.find((t) => t.tokenHash === newHash);
      assert.ok(newRecord, "New token record must exist in DB");
      assert.equal(newRecord.isUsed, false, "New token must be unused");
      assert.equal(
        newRecord.familyId,
        oldRecord.familyId,
        "Token family must be preserved across rotation"
      );
      assert.notEqual(
        newRecord.jti,
        oldRecord.jti,
        "New rotation must generate a new jti"
      );
    });

    test("FR-AUTH-03: Token Reuse Detection invalidates family and revokes active sessions", async () => {
      // Replaying initialRefreshToken which has ALREADY been consumed
      const replayRes = await apiRequest("/api/v1/auth/refresh", {
        method: "POST",
        headers: {
          Cookie: `refreshToken=${initialRefreshToken}`,
        },
      });

      assert.equal(replayRes.status, 401);
      assert.equal(replayRes.data.success, false);
      assert.match(replayRes.data.message, /Token reuse detected/);

      // Confirm that the entire family was revoked in DB
      const user = await User.findOne({ email: refreshEmail });
      const oldHash = hashToken(initialRefreshToken);
      const oldRecord = user.refreshTokens.find((t) => t.tokenHash === oldHash);
      const familyId = oldRecord.familyId;

      const familyTokens = user.refreshTokens.filter(
        (t) => t.familyId === familyId
      );
      assert.ok(familyTokens.length >= 2);
      for (const t of familyTokens) {
        assert.equal(
          t.isUsed,
          true,
          `All tokens in family ${familyId} must be invalidated upon reuse detection`
        );
      }
    });
  });

  // ========================================================
  // 3. CONCURRENCY SAFETY TEST
  // ========================================================
  describe("3. Concurrency Safety: Simultaneous Refresh Requests", () => {
    test("Two simultaneous refresh requests with the same token: exactly one succeeds", async () => {
      const raceEmail = `race.${testRunId}@test.local`;
      const racePassword = "RacePassword123!";

      const user = new User({
        firstName: "Race",
        lastName: "Condition",
        email: raceEmail,
        password: racePassword,
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });
      await user.save();
      testUsers.push(user._id);

      const loginRes = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: { email: raceEmail, password: racePassword },
      });
      const presentedToken = loginRes.cookies.refreshToken;

      // Dispatch two concurrent HTTP requests simultaneously
      const [reqA, reqB] = await Promise.all([
        apiRequest("/api/v1/auth/refresh", {
          method: "POST",
          headers: { Cookie: `refreshToken=${presentedToken}` },
        }),
        apiRequest("/api/v1/auth/refresh", {
          method: "POST",
          headers: { Cookie: `refreshToken=${presentedToken}` },
        }),
      ]);

      const statuses = [reqA.status, reqB.status];
      const successCount = statuses.filter((s) => s === 200).length;
      const errorCount = statuses.filter((s) => s === 401).length;

      assert.equal(
        successCount,
        1,
        "Exactly ONE concurrent refresh request must succeed"
      );
      assert.equal(
        errorCount,
        1,
        "The competing concurrent refresh request must fail"
      );
    });
  });

  // ========================================================
  // 4. LOGOUT & CURRENT USER (ME) TESTS
  // ========================================================
  describe("4. Logout & Current User Profile", () => {
    const meEmail = `me.${testRunId}@test.local`;
    const mePassword = "SecurePassword123!";
    let accessToken = "";
    let refreshToken = "";

    before(async () => {
      const user = new User({
        firstName: "Alice",
        lastName: "Wonderland",
        email: meEmail,
        password: mePassword,
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUS.ACTIVE,
      });
      await user.save();
      testUsers.push(user._id);

      const loginRes = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: { email: meEmail, password: mePassword },
      });
      accessToken = loginRes.data.data.accessToken;
      refreshToken = loginRes.cookies.refreshToken;
    });

    test("GET /api/v1/auth/me returns sanitized identity", async () => {
      const res = await apiRequest("/api/v1/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.email, meEmail);
      assert.equal(res.data.data.role, ROLES.MANAGER);
      assert.equal(res.data.data.password, undefined);
      assert.equal(res.data.data.refreshTokens, undefined);
    });

    test("POST /api/v1/auth/logout revokes session and clears cookie", async () => {
      const res = await apiRequest("/api/v1/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Cookie: `refreshToken=${refreshToken}`,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.message, "Logged out successfully");

      // Verify token in DB is marked used
      const user = await User.findOne({ email: meEmail });
      const hash = hashToken(refreshToken);
      const record = user.refreshTokens.find((t) => t.tokenHash === hash);
      assert.equal(record.isUsed, true);
    });
  });

  // ========================================================
  // 5. PASSWORD MANAGEMENT TESTS
  // ========================================================
  describe("5. Password Change, Forgot & Reset Flows", () => {
    const pwdEmail = `password.flow.${testRunId}@test.local`;
    const initialPassword = "OldPassword123!";
    let userId;
    let accessToken = "";

    before(async () => {
      const user = new User({
        firstName: "Password",
        lastName: "User",
        email: pwdEmail,
        password: initialPassword,
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });
      await user.save();
      userId = user._id;
      testUsers.push(userId);

      const loginRes = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: { email: pwdEmail, password: initialPassword },
      });
      accessToken = loginRes.data.data.accessToken;
    });

    test("PATCH /api/v1/auth/change-password validates current password and updates hash", async () => {
      const newPassword = "NewStrongPassword456!";

      // Fail with incorrect current password
      const badRes = await apiRequest("/api/v1/auth/change-password", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { currentPassword: "WrongCurrentPassword1!", newPassword },
      });
      assert.equal(badRes.status, 400);

      // Succeed with correct current password
      const goodRes = await apiRequest("/api/v1/auth/change-password", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { currentPassword: initialPassword, newPassword },
      });
      assert.equal(goodRes.status, 200);

      // Verify login with new password works
      const loginRes = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: { email: pwdEmail, password: newPassword },
      });
      assert.equal(loginRes.status, 200);
    });

    test("Forgot & Reset Password flow with SHA-256 token hashing and single-use invalidation", async () => {
      // 1. Forgot password request
      const forgotRes = await apiRequest("/api/v1/auth/forgot-password", {
        method: "POST",
        body: { email: pwdEmail },
      });
      assert.equal(forgotRes.status, 200);
      assert.match(forgotRes.data.message, /instructions have been dispatched/);

      // Retrieve reset token hash from database to simulate user receiving the raw token
      const rawResetToken = generateCryptoToken(32);
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            passwordResetTokenHash: hashToken(rawResetToken),
            passwordResetExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        }
      );

      // 2. Reset password with token
      const resetPasswordValue = "ResetCompleted789!";
      const resetRes = await apiRequest("/api/v1/auth/reset-password", {
        method: "POST",
        body: {
          token: rawResetToken,
          newPassword: resetPasswordValue,
        },
      });
      assert.equal(resetRes.status, 200);

      // 3. Reset token must be single-use: replaying it must fail
      const replayResetRes = await apiRequest("/api/v1/auth/reset-password", {
        method: "POST",
        body: {
          token: rawResetToken,
          newPassword: "AnotherPassword123!",
        },
      });
      assert.equal(replayResetRes.status, 400);

      // 4. Confirm login with newly reset password
      const loginRes = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: { email: pwdEmail, password: resetPasswordValue },
      });
      assert.equal(loginRes.status, 200);
    });
  });

  // ========================================================
  // 6. ACCOUNT ACTIVATION TESTS (FR-AUTH-04)
  // ========================================================
  describe("6. Account Activation (POST /api/v1/auth/activate-account)", () => {
    test("Activates invited user, verifies SHA-256 token, and prevents client role escalation", async () => {
      const inviteEmail = `invitee.${testRunId}@test.local`;
      const rawInviteToken = generateCryptoToken(32);
      const invitationTokenHash = hashToken(rawInviteToken);

      const invitedUser = new User({
        firstName: "Invited",
        lastName: "Staff",
        email: inviteEmail,
        password: "TemporaryPassword123!",
        role: ROLES.MAINTENANCE_STAFF, // Fixed role set by inviter
        status: ACCOUNT_STATUS.PENDING,
        invitationTokenHash,
        invitationExpiresAt: new Date(
          Date.now() + AUTH_CONSTANTS.INVITATION_EXPIRY_MS
        ),
      });
      await invitedUser.save();
      testUsers.push(invitedUser._id);

      const activationPassword = "StaffPassword2026!";

      // Attempt activation (client cannot supply or escalate role)
      const res = await apiRequest("/api/v1/auth/activate-account", {
        method: "POST",
        body: {
          invitationToken: rawInviteToken,
          password: activationPassword,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(
        res.data.data.user.role,
        ROLES.MAINTENANCE_STAFF,
        "Role must remain immutable from invitation"
      );
      assert.equal(
        res.data.data.user.status,
        ACCOUNT_STATUS.ACTIVE,
        "Account status must transition to ACTIVE"
      );

      // Verify token is single-use: second activation attempt must fail
      const secondRes = await apiRequest("/api/v1/auth/activate-account", {
        method: "POST",
        body: {
          invitationToken: rawInviteToken,
          password: "AnotherPassword123!",
        },
      });
      assert.equal(secondRes.status, 400);

      // Verify invited user can now log in
      const loginRes = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: {
          email: inviteEmail,
          password: activationPassword,
        },
      });
      assert.equal(loginRes.status, 200);
    });
  });

  // ========================================================
  // 7. TEST SECURITY INVARIANTS
  // ========================================================
  describe("7. Security Invariants Verification", () => {
    test("Invariant 1 & 2: Passwords and Refresh Tokens are NEVER in plaintext in MongoDB", async () => {
      const invariantEmail = `invariant.${testRunId}@test.local`;
      const rawPassword = "InvariantPassword123!";

      const user = new User({
        firstName: "Invariant",
        lastName: "Checker",
        email: invariantEmail,
        password: rawPassword,
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
      });
      await user.save();
      testUsers.push(user._id);

      const loginRes = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: { email: invariantEmail, password: rawPassword },
      });
      const rawRefreshToken = loginRes.cookies.refreshToken;

      // Inspect direct raw document in MongoDB
      const rawDoc = await User.findById(user._id).select("+password");

      // Invariant 2: Password must be bcrypt hash (starts with $2b$ and cost 12), NOT raw password
      assert.notEqual(rawDoc.password, rawPassword);
      assert.match(rawDoc.password, /^\$2[ab]\$12\$/);

      // Invariant 1: Refresh tokens array must ONLY contain SHA-256 hashes, NEVER the raw JWT
      assert.ok(rawDoc.refreshTokens.length > 0);
      for (const t of rawDoc.refreshTokens) {
        assert.notEqual(t.tokenHash, rawRefreshToken);
        assert.equal(
          t.tokenHash.length,
          64,
          "Token hash must be 64-char hex SHA-256 digest"
        );
      }
    });
  });
});
