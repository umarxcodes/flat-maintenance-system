// =====================  IMPORTS & TEST RUNNER  =============
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { Writable } from "node:stream";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../../app.js";
import connectDB from "../../config/db.config.js";
import { Document } from "./documents.model.js";
import {
  DOCUMENT_TYPES,
  DOCUMENT_VISIBILITY,
  DOCUMENT_CONSTRAINTS,
  DOCUMENT_ALLOWED_MIME_TYPES,
} from "./documents.constants.js";
import { Building } from "../../models/building.model.js";
import { Flat } from "../../models/flat.model.js";
import { User } from "../../models/user.model.js";
import { Owner } from "../owners/owners.model.js";
import { Tenant } from "../tenants/tenants.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { generateAccessToken } from "../../utils/token.util.js";
import { rolesService } from "../roles/roles.service.js";
import { cloudinary } from "../../utils/cloudinary.util.js";

// =====================  TEST SETUP & FIXTURES  =============
dotenv.config();

let server;
let baseUrl;
let originalUploadStream;

// Fixture ObjectIds
const BUILDING_A_ID = new mongoose.Types.ObjectId();
const BUILDING_B_ID = new mongoose.Types.ObjectId();

const FLAT_A_101_ID = new mongoose.Types.ObjectId();
const FLAT_A_102_ID = new mongoose.Types.ObjectId();
const FLAT_B_201_ID = new mongoose.Types.ObjectId();

const SUPER_ADMIN_ID = new mongoose.Types.ObjectId();
const BUILDING_ADMIN_A_ID = new mongoose.Types.ObjectId();
const MANAGER_A_ID = new mongoose.Types.ObjectId();
const MANAGER_B_ID = new mongoose.Types.ObjectId();
const ACCOUNTANT_A_ID = new mongoose.Types.ObjectId();
const OWNER_A_101_ID = new mongoose.Types.ObjectId();
const TENANT_A_102_ID = new mongoose.Types.ObjectId();
const SECURITY_STAFF_A_ID = new mongoose.Types.ObjectId();

// JWT Tokens
let superAdminToken;
let buildingAdminAToken;
let managerAToken;
let managerBToken;
let accountantAToken;
let ownerA101Token;
let tenantA102Token;
let securityStaffAToken;

// Mock failure toggle
let simulateCloudinaryError = false;

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

/**
 * Helper to execute multipart FormData requests against test server.
 */
const apiMultipartRequest = async (path, formData, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = {
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
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
describe("Module 22: Documents Repository & Access Control (documents)", () => {
  before(async () => {
    process.env.NODE_ENV = "test";
    await connectDB();
    await rolesService.seedSystemRoles();

    // Mock Cloudinary in-memory upload stream
    originalUploadStream = cloudinary.uploader.upload_stream;
    cloudinary.uploader.upload_stream = (options, callback) => {
      const writable = new Writable({
        write(_chunk, _encoding, next) {
          next();
        },
        final(callbackFn) {
          if (simulateCloudinaryError) {
            callback(new Error("Cloudinary CDN connection timeout"));
          } else {
            callback(null, {
              secure_url: `https://res.cloudinary.com/test-cloud/image/upload/v1234567890/flat-maintenance/documents/test-doc-${Date.now()}.pdf`,
              public_id: "flat-maintenance/documents/test-doc",
            });
          }
          callbackFn();
        },
      });
      return writable;
    };

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Clean up collections
    await Promise.all([
      Document.deleteMany({}),
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
        code: `EHTA-${Date.now().toString().slice(-4)}`,
        address: {
          street: "100 Archive Boulevard",
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
          street: "200 Registry Court",
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
        email: "super.docs@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
      },
      {
        _id: BUILDING_ADMIN_A_ID,
        firstName: "Building",
        lastName: "AdminA",
        email: "badmin.a.docs@test.local",
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
        email: "mgr.a.docs@test.local",
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
        email: "mgr.b.docs@test.local",
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
        email: "acct.a.docs@test.local",
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
        email: "owner.101.docs@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.OWNER,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: TENANT_A_102_ID,
        firstName: "Teresa",
        lastName: "Tenant",
        email: "tenant.102.docs@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.TENANT,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
      {
        _id: SECURITY_STAFF_A_ID,
        firstName: "Sam",
        lastName: "Security",
        email: "security.a.docs@test.local",
        password: "Password123!",
        passwordHash: "hash",
        role: ROLES.SECURITY_STAFF,
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [BUILDING_A_ID],
      },
    ]);

    // Seed Owner profile for Flat 101
    await Owner.create({
      userId: OWNER_A_101_ID,
      buildingId: BUILDING_A_ID,
      flatsOwned: [FLAT_A_101_ID],
      isPrimaryResident: true,
      ownershipType: "INDIVIDUAL",
      isDeleted: false,
    });

    // Seed Tenant profile for Flat 102
    await Tenant.create({
      userId: TENANT_A_102_ID,
      buildingId: BUILDING_A_ID,
      flatId: FLAT_A_102_ID,
      ownerId: OWNER_A_101_ID,
      rentAmount: 1600,
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
      buildingIds: [BUILDING_A_ID.toString()],
    });

    tenantA102Token = generateAccessToken({
      sub: TENANT_A_102_ID.toString(),
      role: ROLES.TENANT,
      buildingIds: [BUILDING_A_ID.toString()],
    });

    securityStaffAToken = generateAccessToken({
      sub: SECURITY_STAFF_A_ID.toString(),
      role: ROLES.SECURITY_STAFF,
      buildingIds: [BUILDING_A_ID.toString()],
    });
  });

  after(async () => {
    cloudinary.uploader.upload_stream = originalUploadStream;
    await Promise.all([
      Document.deleteMany({}),
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
    simulateCloudinaryError = false;
    await Document.deleteMany({});
  });

  // =====================  DATABASE MODEL & SCHEMA  ===========
  describe("Database Model & Schema Invariants", () => {
    it("Enforces required fields, enums, and default soft-delete attributes", async () => {
      const doc = await Document.create({
        buildingId: BUILDING_A_ID,
        title: "Society Fire Insurance Policy",
        documentType: DOCUMENT_TYPES.INSURANCE_POLICY,
        fileUrl: "https://res.cloudinary.com/test-cloud/documents/policy.pdf",
        visibility: DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS,
        uploadedById: MANAGER_A_ID,
      });

      assert.equal(DOCUMENT_CONSTRAINTS.TITLE_MIN_LENGTH, 3);
      assert.ok(DOCUMENT_ALLOWED_MIME_TYPES.includes("application/pdf"));
      assert.ok(doc._id);
      assert.equal(doc.isDeleted, false);
      assert.equal(doc.deletedAt, null);
      assert.equal(doc.flatId, null);
      assert.ok(doc.createdAt);
      assert.ok(doc.updatedAt);
    });

    it("Rejects invalid documentType enum", async () => {
      await assert.rejects(async () => {
        await Document.create({
          buildingId: BUILDING_A_ID,
          title: "Invalid Type Document",
          documentType: "UNKNOWN_TYPE",
          fileUrl: "https://res.cloudinary.com/test-cloud/documents/test.pdf",
          visibility: DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS,
          uploadedById: MANAGER_A_ID,
        });
      }, /Invalid document classification type/i);
    });

    it("Rejects invalid visibility enum", async () => {
      await assert.rejects(async () => {
        await Document.create({
          buildingId: BUILDING_A_ID,
          title: "Invalid Visibility Document",
          documentType: DOCUMENT_TYPES.OTHER,
          fileUrl: "https://res.cloudinary.com/test-cloud/documents/test.pdf",
          visibility: "FOR_EVERYONE",
          uploadedById: MANAGER_A_ID,
        });
      }, /Invalid document visibility level/i);
    });
  });

  // =====================  UPLOAD & FILE PIPELINE (POST)  ======
  describe("POST /api/v1/documents — Upload & Streaming Pipeline", () => {
    it("Manager uploads valid PDF document to Cloudinary (201 Created)", async () => {
      const formData = new FormData();
      formData.append("title", "2026 Annual Society Bylaws");
      formData.append("documentType", DOCUMENT_TYPES.SOCIETY_BYLAW);
      formData.append("visibility", DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS);
      formData.append("buildingId", BUILDING_A_ID.toString());
      formData.append(
        "file",
        new Blob(["%PDF-1.4 Mock PDF Stream Buffer"], {
          type: "application/pdf",
        }),
        "bylaws.pdf"
      );

      const res = await apiMultipartRequest("/api/v1/documents", formData, {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 201);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.title, "2026 Annual Society Bylaws");
      assert.equal(res.data.data.documentType, DOCUMENT_TYPES.SOCIETY_BYLAW);
      assert.equal(
        res.data.data.visibility,
        DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS
      );
      assert.equal(res.data.data.buildingId, BUILDING_A_ID.toString());
      assert.equal(res.data.data.uploadedById, MANAGER_A_ID.toString());
      assert.ok(res.data.data.fileUrl.startsWith("https://res.cloudinary.com"));

      // Verify persisted in MongoDB
      const inDb = await Document.findById(res.data.data._id);
      assert.ok(inDb);
      assert.equal(inDb.isDeleted, false);
    });

    it("Rejects upload when file payload is missing (400 Bad Request)", async () => {
      const formData = new FormData();
      formData.append("title", "Missing File Document");
      formData.append("documentType", DOCUMENT_TYPES.OTHER);
      formData.append("visibility", DOCUMENT_VISIBILITY.ADMIN_ONLY);
      formData.append("buildingId", BUILDING_A_ID.toString());

      const res = await apiMultipartRequest("/api/v1/documents", formData, {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /file upload is required/i);
    });

    it("Rejects unsupported file MIME types e.g. text/plain or exe (400 Bad Request)", async () => {
      const formData = new FormData();
      formData.append("title", "Executable Malware Attempt");
      formData.append("documentType", DOCUMENT_TYPES.OTHER);
      formData.append("visibility", DOCUMENT_VISIBILITY.ADMIN_ONLY);
      formData.append("buildingId", BUILDING_A_ID.toString());
      formData.append(
        "file",
        new Blob(["malicious payload"], { type: "application/x-msdownload" }),
        "virus.exe"
      );

      const res = await apiMultipartRequest("/api/v1/documents", formData, {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /Unsupported document format/i);
    });

    it("Rejects oversized files exceeding 10MB limit (400 Bad Request)", async () => {
      const formData = new FormData();
      formData.append("title", "Giant File");
      formData.append("documentType", DOCUMENT_TYPES.OTHER);
      formData.append("visibility", DOCUMENT_VISIBILITY.ADMIN_ONLY);
      formData.append("buildingId", BUILDING_A_ID.toString());

      // Create 11MB fake buffer
      const largeBuffer = new Uint8Array(11 * 1024 * 1024);
      formData.append(
        "file",
        new Blob([largeBuffer], { type: "application/pdf" }),
        "giant.pdf"
      );

      const res = await apiMultipartRequest("/api/v1/documents", formData, {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /10MB/i);
    });

    it("Rolls back gracefully if Cloudinary upload fails without creating DB record", async () => {
      simulateCloudinaryError = true;

      const formData = new FormData();
      formData.append("title", "Failed Cloudinary Upload");
      formData.append("documentType", DOCUMENT_TYPES.AGM_MINUTES);
      formData.append("visibility", DOCUMENT_VISIBILITY.OWNERS_ONLY);
      formData.append("buildingId", BUILDING_A_ID.toString());
      formData.append(
        "file",
        new Blob(["mock pdf"], { type: "application/pdf" }),
        "agm.pdf"
      );

      const res = await apiMultipartRequest("/api/v1/documents", formData, {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 500);
      assert.equal(res.data.success, false);

      // Verify no document record was persisted in MongoDB
      const count = await Document.countDocuments({});
      assert.equal(count, 0);
    });
  });

  // =====================  AUTHORIZATION & RBAC GATES  ========
  describe("Role-Based Access Control (RBAC) on Endpoints", () => {
    it("BuildingAdmin and Accountant can upload documents (201 Created)", async () => {
      // BuildingAdmin
      const formData1 = new FormData();
      formData1.append("title", "Admin Uploaded Document");
      formData1.append("documentType", DOCUMENT_TYPES.AGM_MINUTES);
      formData1.append("visibility", DOCUMENT_VISIBILITY.ADMIN_ONLY);
      formData1.append("buildingId", BUILDING_A_ID.toString());
      formData1.append(
        "file",
        new Blob(["pdf content"], { type: "application/pdf" }),
        "admin.pdf"
      );

      const res1 = await apiMultipartRequest("/api/v1/documents", formData1, {
        headers: { Authorization: `Bearer ${buildingAdminAToken}` },
      });
      assert.equal(res1.status, 201);

      // Accountant
      const formData2 = new FormData();
      formData2.append("title", "Audited Financial Report 2026");
      formData2.append("documentType", DOCUMENT_TYPES.AUDIT_REPORT);
      formData2.append("visibility", DOCUMENT_VISIBILITY.OWNERS_ONLY);
      formData2.append("buildingId", BUILDING_A_ID.toString());
      formData2.append(
        "file",
        new Blob(["pdf content"], { type: "application/pdf" }),
        "audit.pdf"
      );

      const res2 = await apiMultipartRequest("/api/v1/documents", formData2, {
        headers: { Authorization: `Bearer ${accountantAToken}` },
      });
      assert.equal(res2.status, 201);
    });

    it("Residents (Owner/Tenant) cannot upload documents (403 Forbidden)", async () => {
      const formData = new FormData();
      formData.append("title", "Owner Upload Attempt");
      formData.append("documentType", DOCUMENT_TYPES.OTHER);
      formData.append("visibility", DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS);
      formData.append("buildingId", BUILDING_A_ID.toString());
      formData.append(
        "file",
        new Blob(["pdf content"], { type: "application/pdf" }),
        "owner.pdf"
      );

      const resOwner = await apiMultipartRequest(
        "/api/v1/documents",
        formData,
        {
          headers: { Authorization: `Bearer ${ownerA101Token}` },
        }
      );
      assert.equal(resOwner.status, 403);

      const resTenant = await apiMultipartRequest(
        "/api/v1/documents",
        formData,
        {
          headers: { Authorization: `Bearer ${tenantA102Token}` },
        }
      );
      assert.equal(resTenant.status, 403);
    });

    it("Security Staff cannot upload or read documents (403 Forbidden)", async () => {
      const formData = new FormData();
      formData.append("title", "Security Upload Attempt");
      formData.append("documentType", DOCUMENT_TYPES.OTHER);
      formData.append("visibility", DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS);
      formData.append("buildingId", BUILDING_A_ID.toString());
      formData.append(
        "file",
        new Blob(["pdf content"], { type: "application/pdf" }),
        "security.pdf"
      );

      const resUpload = await apiMultipartRequest(
        "/api/v1/documents",
        formData,
        {
          headers: { Authorization: `Bearer ${securityStaffAToken}` },
        }
      );
      assert.equal(resUpload.status, 403);

      const resRead = await apiRequest("/api/v1/documents", {
        headers: { Authorization: `Bearer ${securityStaffAToken}` },
      });
      assert.equal(resRead.status, 403);
    });

    it("Unauthenticated request is rejected (401 Unauthorized)", async () => {
      const res = await apiRequest("/api/v1/documents");
      assert.equal(res.status, 401);
    });
  });

  // =====================  MULTI-BUILDING OBAC ISOLATION  =====
  describe("Multi-Building Isolation & Scope Guards", () => {
    it("Manager A cannot upload documents to Building B (403 Forbidden)", async () => {
      const formData = new FormData();
      formData.append("title", "Cross Building Upload");
      formData.append("documentType", DOCUMENT_TYPES.OTHER);
      formData.append("visibility", DOCUMENT_VISIBILITY.ADMIN_ONLY);
      formData.append("buildingId", BUILDING_B_ID.toString()); // Manager A is only assigned Building A
      formData.append(
        "file",
        new Blob(["pdf"], { type: "application/pdf" }),
        "doc.pdf"
      );

      const res = await apiMultipartRequest("/api/v1/documents", formData, {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 403);
      assert.match(res.data.message, /not authorized to upload documents/i);
    });

    it("Manager A cannot query Building B documents (403 Forbidden)", async () => {
      const res = await apiRequest(
        `/api/v1/documents?buildingId=${BUILDING_B_ID}`,
        {
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );

      assert.equal(res.status, 403);
      assert.match(res.data.message, /not authorized for this building/i);
    });

    it("Manager A cannot soft-delete Building B documents (403 Forbidden)", async () => {
      const docB = await Document.create({
        buildingId: BUILDING_B_ID,
        title: "Building B Confidential Audit",
        documentType: DOCUMENT_TYPES.AUDIT_REPORT,
        fileUrl: "https://res.cloudinary.com/test-cloud/documents/b.pdf",
        visibility: DOCUMENT_VISIBILITY.ADMIN_ONLY,
        uploadedById: MANAGER_B_ID,
      });

      const res = await apiRequest(`/api/v1/documents/${docB._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 403);
      assert.match(res.data.message, /not authorized to delete documents/i);

      // Verify document still active in DB
      const inDb = await Document.findById(docB._id);
      assert.equal(inDb.isDeleted, false);

      // Manager B (assigned Building B) can delete Building B document
      const resB = await apiRequest(`/api/v1/documents/${docB._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${managerBToken}` },
      });
      assert.equal(resB.status, 200);
      assert.equal(resB.data.success, true);
      assert.equal(resB.data.data.isDeleted, true);
    });
  });

  // =====================  VISIBILITY RULES & PRIVACY  ========
  describe("Visibility Rule Engine & Resident Privacy", () => {
    let publicDoc;
    let ownersOnlyDoc;
    let adminOnlyDoc;
    let flat101DeedDoc;
    let flat102LeaseDoc;

    beforeEach(async () => {
      // Seed documents with various visibilities in Building A
      publicDoc = await Document.create({
        buildingId: BUILDING_A_ID,
        title: "Society Fire Drill Guidelines",
        documentType: DOCUMENT_TYPES.OTHER,
        fileUrl: "https://res.cloudinary.com/test/public.pdf",
        visibility: DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS,
        uploadedById: MANAGER_A_ID,
      });

      ownersOnlyDoc = await Document.create({
        buildingId: BUILDING_A_ID,
        title: "Annual General Meeting Minutes 2026",
        documentType: DOCUMENT_TYPES.AGM_MINUTES,
        fileUrl: "https://res.cloudinary.com/test/agm.pdf",
        visibility: DOCUMENT_VISIBILITY.OWNERS_ONLY,
        uploadedById: MANAGER_A_ID,
      });

      adminOnlyDoc = await Document.create({
        buildingId: BUILDING_A_ID,
        title: "Staff Salaries & Vendor Contract Negotiation",
        documentType: DOCUMENT_TYPES.OTHER,
        fileUrl: "https://res.cloudinary.com/test/admin.pdf",
        visibility: DOCUMENT_VISIBILITY.ADMIN_ONLY,
        uploadedById: MANAGER_A_ID,
      });

      flat101DeedDoc = await Document.create({
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_101_ID,
        title: "Flat A-101 Registered Sale Deed",
        documentType: DOCUMENT_TYPES.FLAT_DEED,
        fileUrl: "https://res.cloudinary.com/test/deed-101.pdf",
        visibility: DOCUMENT_VISIBILITY.FLAT_SPECIFIC,
        uploadedById: MANAGER_A_ID,
      });

      flat102LeaseDoc = await Document.create({
        buildingId: BUILDING_A_ID,
        flatId: FLAT_A_102_ID,
        title: "Flat A-102 Signed Lease Agreement",
        documentType: DOCUMENT_TYPES.LEASE_CONTRACT,
        fileUrl: "https://res.cloudinary.com/test/lease-102.pdf",
        visibility: DOCUMENT_VISIBILITY.FLAT_SPECIFIC,
        uploadedById: MANAGER_A_ID,
      });
    });

    it("Owner of Flat 101 receives PUBLIC, OWNERS_ONLY, and Flat 101 documents; NEVER Flat 102 or ADMIN_ONLY", async () => {
      const res = await apiRequest("/api/v1/documents", {
        headers: { Authorization: `Bearer ${ownerA101Token}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      const returnedIds = res.data.data.map((d) => d._id);

      // Allowed
      assert.ok(returnedIds.includes(publicDoc._id.toString()));
      assert.ok(returnedIds.includes(ownersOnlyDoc._id.toString()));
      assert.ok(returnedIds.includes(flat101DeedDoc._id.toString()));

      // Forbidden - Must NEVER leak
      assert.ok(!returnedIds.includes(adminOnlyDoc._id.toString()));
      assert.ok(!returnedIds.includes(flat102LeaseDoc._id.toString()));
    });

    it("Tenant of Flat 102 receives PUBLIC and Flat 102 documents; NEVER OWNERS_ONLY, ADMIN_ONLY, or Flat 101", async () => {
      const res = await apiRequest("/api/v1/documents", {
        headers: { Authorization: `Bearer ${tenantA102Token}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      const returnedIds = res.data.data.map((d) => d._id);

      // Allowed
      assert.ok(returnedIds.includes(publicDoc._id.toString()));
      assert.ok(returnedIds.includes(flat102LeaseDoc._id.toString()));

      // Forbidden - Must NEVER leak
      assert.ok(!returnedIds.includes(ownersOnlyDoc._id.toString()));
      assert.ok(!returnedIds.includes(adminOnlyDoc._id.toString()));
      assert.ok(!returnedIds.includes(flat101DeedDoc._id.toString()));
    });

    it("Building Manager receives ALL visibilities within assigned building complex", async () => {
      const res = await apiRequest("/api/v1/documents", {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 200);
      const returnedIds = res.data.data.map((d) => d._id);

      assert.ok(returnedIds.includes(publicDoc._id.toString()));
      assert.ok(returnedIds.includes(ownersOnlyDoc._id.toString()));
      assert.ok(returnedIds.includes(adminOnlyDoc._id.toString()));
      assert.ok(returnedIds.includes(flat101DeedDoc._id.toString()));
      assert.ok(returnedIds.includes(flat102LeaseDoc._id.toString()));
    });

    it("Super Admin receives all documents across entire platform", async () => {
      const res = await apiRequest("/api/v1/documents", {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });

      assert.equal(res.status, 200);
      assert.ok(res.data.data.length >= 5);
    });

    it("Flat Specific document creation rejects missing flatId (400 Bad Request)", async () => {
      const formData = new FormData();
      formData.append("title", "Missing Flat ID Deed");
      formData.append("documentType", DOCUMENT_TYPES.FLAT_DEED);
      formData.append("visibility", DOCUMENT_VISIBILITY.FLAT_SPECIFIC);
      formData.append("buildingId", BUILDING_A_ID.toString());
      formData.append(
        "file",
        new Blob(["pdf content"], { type: "application/pdf" }),
        "deed.pdf"
      );

      const res = await apiMultipartRequest("/api/v1/documents", formData, {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 400);
      assert.match(res.data.message, /Flat ID is required/i);
    });

    it("Flat Specific document creation rejects cross-building flat hierarchy mismatch (400 Bad Request)", async () => {
      const formData = new FormData();
      formData.append("title", "Mismatched Flat Hierarchy Deed");
      formData.append("documentType", DOCUMENT_TYPES.FLAT_DEED);
      formData.append("visibility", DOCUMENT_VISIBILITY.FLAT_SPECIFIC);
      formData.append("buildingId", BUILDING_A_ID.toString());
      formData.append("flatId", FLAT_B_201_ID.toString()); // Flat from Building B into Building A
      formData.append(
        "file",
        new Blob(["pdf content"], { type: "application/pdf" }),
        "deed.pdf"
      );

      const res = await apiMultipartRequest("/api/v1/documents", formData, {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 400);
      assert.match(res.data.message, /Hierarchy mismatch/i);
    });
  });

  // =====================  SOFT-DELETE (DELETE /:id)  =========
  describe("DELETE /api/v1/documents/:id — Soft-Delete Lifecycle", () => {
    let docToDelete;

    beforeEach(async () => {
      docToDelete = await Document.create({
        buildingId: BUILDING_A_ID,
        title: "Obsolete Parking Policy 2024",
        documentType: DOCUMENT_TYPES.OTHER,
        fileUrl: "https://res.cloudinary.com/test/obsolete.pdf",
        visibility: DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS,
        uploadedById: MANAGER_A_ID,
      });
    });

    it("Manager soft-deletes document successfully (200 OK)", async () => {
      const res = await apiRequest(`/api/v1/documents/${docToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert.equal(res.data.data.isDeleted, true);
      assert.ok(res.data.data.deletedAt);

      // Verify excluded from subsequent GET requests
      const listRes = await apiRequest("/api/v1/documents", {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });
      const returnedIds = listRes.data.data.map((d) => d._id);
      assert.ok(!returnedIds.includes(docToDelete._id.toString()));

      // Verify underlying MongoDB record still exists with soft-delete flags (NEVER physical delete)
      const rawInDb = await Document.findById(docToDelete._id);
      assert.ok(rawInDb);
      assert.equal(rawInDb.isDeleted, true);
      assert.ok(rawInDb.deletedAt instanceof Date);
    });

    it("Rejects deletion of already soft-deleted document (404 Not Found)", async () => {
      // First deletion
      await apiRequest(`/api/v1/documents/${docToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      // Second deletion attempt
      const resSecond = await apiRequest(
        `/api/v1/documents/${docToDelete._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${managerAToken}` },
        }
      );

      assert.equal(resSecond.status, 404);
      assert.equal(resSecond.data.success, false);
    });

    it("Non-administrative residents cannot delete documents (403 Forbidden)", async () => {
      const res = await apiRequest(`/api/v1/documents/${docToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${ownerA101Token}` },
      });

      assert.equal(res.status, 403);
      assert.equal(res.data.success, false);

      // Verify document still active
      const inDb = await Document.findById(docToDelete._id);
      assert.equal(inDb.isDeleted, false);
    });
  });

  // =====================  SECURITY, IDOR & INJECTION GUARDS  =
  describe("Security Hardening, IDOR & Mass-Assignment Defenses", () => {
    it("Rejects client attempts to inject server-owned fields like uploadedById or isDeleted (Strict Zod 400)", async () => {
      const formData = new FormData();
      formData.append("title", "Malicious Mass Assignment Attempt");
      formData.append("documentType", DOCUMENT_TYPES.OTHER);
      formData.append("visibility", DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS);
      formData.append("buildingId", BUILDING_A_ID.toString());
      formData.append("uploadedById", SUPER_ADMIN_ID.toString()); // Client spoof attempt
      formData.append("isDeleted", "true"); // Client spoof attempt
      formData.append(
        "file",
        new Blob(["pdf content"], { type: "application/pdf" }),
        "hack.pdf"
      );

      const res = await apiMultipartRequest("/api/v1/documents", formData, {
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });

    it("Validates ObjectId parameter on delete endpoint (400 Bad Request)", async () => {
      const res = await apiRequest("/api/v1/documents/invalid-mongo-id-123", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${managerAToken}` },
      });

      assert.equal(res.status, 400);
      assert.equal(res.data.success, false);
    });
  });
});
