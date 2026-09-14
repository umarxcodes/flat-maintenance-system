// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.config.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/role.model.js";
import { Building } from "../models/building.model.js";
import { Block } from "../models/block.model.js";
import { Floor } from "../models/floor.model.js";
import { Flat, FLAT_TYPES, FLAT_STATUS } from "../models/flat.model.js";
import { Owner } from "../models/owner.model.js";
import { Tenant } from "../models/tenant.model.js";
import { Staff } from "../models/staff.model.js";
import { MaintenanceConfiguration } from "../models/maintenance-configuration.model.js";
import { MaintenanceRequest } from "../models/maintenance-request.model.js";
import { Invoice } from "../models/invoice.model.js";
import { Payment } from "../models/payment.model.js";
import { Complaint } from "../models/complaint.model.js";
import { Review } from "../models/review.model.js";
import { Notice } from "../models/notice.model.js";
import { Notification } from "../models/notification.model.js";
import { Expense } from "../models/expense.model.js";
import { Visitor } from "../models/visitor.model.js";
import { Document } from "../models/document.model.js";
import { AuditLog } from "../models/audit-log.model.js";
import { rolesService } from "../modules/roles/roles.service.js";
import { permissionsService } from "../modules/permissions/permissions.service.js";
import { ROLES } from "../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../constants/status.constant.js";
import { BUILDING_STATUS } from "../modules/buildings/buildings.constants.js";
import { OWNERS_CONSTANTS } from "../modules/owners/owners.constants.js";
import { TENANTS_CONSTANTS } from "../modules/tenants/tenants.constants.js";
import { STAFF_CONSTANTS } from "../modules/staff/staff.constants.js";
import { CHARGE_TYPES } from "../modules/maintenance-configurations/maintenance-configuration.constants.js";
import {
  MAINTENANCE_REQUEST_STATUS,
  MAINTENANCE_REQUEST_CATEGORY,
  MAINTENANCE_REQUEST_PRIORITY,
} from "../modules/maintenance-requests/maintenance-requests.constants.js";
import { INVOICE_STATUS } from "../modules/invoices/invoices.constants.js";
import { PAYMENT_METHODS } from "../modules/payments/payments.constants.js";
import {
  COMPLAINT_TYPE,
  COMPLAINT_STATUS,
} from "../modules/complaints/complaints.constants.js";
import { MODERATION_STATUS } from "../modules/reviews/reviews.constants.js";
import {
  NOTICE_CATEGORY,
  NOTICE_PRIORITY,
  TARGET_AUDIENCE,
} from "../modules/notices/notices.constants.js";
import { NOTIFICATION_CATEGORY } from "../modules/notifications/notifications.constants.js";
import {
  EXPENSE_CATEGORY,
  EXPENSE_STATUS,
} from "../modules/expenses/expenses.constants.js";
import {
  VISITOR_TYPES,
  VISITOR_STATUS,
} from "../modules/visitors/visitors.constants.js";
import {
  DOCUMENT_TYPES,
  DOCUMENT_VISIBILITY,
} from "../modules/documents/documents.constants.js";

dotenv.config();

const seedComprehensiveData = async () => {
  try {
    await connectDB();
    console.log("\x1b[36m%s\x1b[0m", "--- Starting Comprehensive Dummy Data Seeder ---");

    // 1. Synchronize Canonical Permissions & System Roles
    console.log("[1/14] Synchronizing platform permissions and system roles...");
    await permissionsService.seedPermissions();
    await rolesService.seedSystemRoles();

    const roleMap = {};
    const roles = await Role.find({});
    roles.forEach((r) => {
      roleMap[r.name] = r._id;
    });

    // 2. Provision or Synchronize Super Admin
    console.log("[2/14] Verifying Super Admin...");
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "muhammadumar.codes@gmail.com").toLowerCase().trim();
    let superAdmin = await User.findOne({ email: superAdminEmail, isDeleted: false });
    if (!superAdmin) {
      superAdmin = new User({
        firstName: "Muhammad",
        lastName: "Umar",
        email: superAdminEmail,
        password: process.env.SUPER_ADMIN_PASSWORD || "umarkhan",
        phone: "+923001234567",
        role: ROLES.SUPER_ADMIN,
        roleId: roleMap[ROLES.SUPER_ADMIN],
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      });
      await superAdmin.save();
      console.log(`[INFO] Created Super Admin: ${superAdminEmail}`);
    } else {
      console.log(`[INFO] Super Admin already exists: ${superAdminEmail}`);
    }

    // 3. Create or Find Primary Building Complex
    console.log("[3/14] Provisioning Primary Building Complex...");
    let building = await Building.findOne({ code: "GVR-01", isDeleted: false });
    if (!building) {
      building = new Building({
        name: "Greenwood Valley Residences",
        code: "GVR-01",
        address: {
          street: "42 Palm Boulevard",
          city: "Metropolis",
          state: "Central",
          postalCode: "54000",
          country: "United States",
        },
        totalBlocks: 2,
        totalFlats: 8,
        status: BUILDING_STATUS.ACTIVE,
      });
      await building.save();
      console.log(`[INFO] Created Building: ${building.name} (${building.code})`);
    } else {
      console.log(`[INFO] Found Building: ${building.name}`);
    }

    // Associate Super Admin with Building
    if (!superAdmin.assignedBuildingIds.some((id) => id.toString() === building._id.toString())) {
      superAdmin.assignedBuildingIds.push(building._id);
      await superAdmin.save();
    }

    // 4. Create Blocks
    console.log("[4/14] Provisioning Blocks...");
    let blockA = await Block.findOne({ buildingId: building._id, name: "Tower A", isDeleted: false });
    if (!blockA) {
      blockA = new Block({
        buildingId: building._id,
        name: "Tower A",
        code: "T-A",
        totalFloors: 4,
      });
      await blockA.save();
    }

    let blockB = await Block.findOne({ buildingId: building._id, name: "Tower B", isDeleted: false });
    if (!blockB) {
      blockB = new Block({
        buildingId: building._id,
        name: "Tower B",
        code: "T-B",
        totalFloors: 4,
      });
      await blockB.save();
    }

    // 5. Create Floors
    console.log("[5/14] Provisioning Floors...");
    const getOrCreateFloor = async (blockId, floorNum, name) => {
      let fl = await Floor.findOne({ buildingId: building._id, blockId, floorNumber: floorNum, isDeleted: false });
      if (!fl) {
        fl = new Floor({
          buildingId: building._id,
          blockId,
          floorNumber: floorNum,
          name,
        });
        await fl.save();
      }
      return fl;
    };

    const floorA1 = await getOrCreateFloor(blockA._id, 1, "Level 1 - Garden Suites");
    const floorA2 = await getOrCreateFloor(blockA._id, 2, "Level 2 - Sky Terraces");
    const floorB1 = await getOrCreateFloor(blockB._id, 1, "Level 1 - Executive Wing");
    const floorB2 = await getOrCreateFloor(blockB._id, 2, "Level 2 - Panoramic Heights");

    // 6. Provision Users for each canonical system role
    console.log("[6/14] Provisioning Role Users (Password123!)...");
    const defaultPassword = "Password123!";

    const seedUsers = [
      {
        firstName: "Building",
        lastName: "Admin",
        email: "admin.greenwood@society.local",
        role: ROLES.BUILDING_ADMIN,
        phone: "+15551000001",
      },
      {
        firstName: "Sarah",
        lastName: "Jenkins",
        email: "manager.sarah@society.local",
        role: ROLES.MANAGER,
        phone: "+15551000002",
      },
      {
        firstName: "David",
        lastName: "Vance",
        email: "accountant.dave@society.local",
        role: ROLES.ACCOUNTANT,
        phone: "+15551000003",
      },
      {
        firstName: "Carlos",
        lastName: "Santana",
        email: "tech.carlos@society.local",
        role: ROLES.MAINTENANCE_STAFF,
        phone: "+15551000004",
      },
      {
        firstName: "Ahmed",
        lastName: "Raza",
        email: "guard.ahmed@society.local",
        role: ROLES.SECURITY_STAFF,
        phone: "+15551000005",
      },
      {
        firstName: "Elena",
        lastName: "Rostova",
        email: "owner.elena@society.local",
        role: ROLES.OWNER,
        phone: "+15551000006",
      },
      {
        firstName: "Marcus",
        lastName: "Vance",
        email: "tenant.marcus@society.local",
        role: ROLES.TENANT,
        phone: "+15551000007",
      },
    ];

    const userDocs = {};
    for (const u of seedUsers) {
      let doc = await User.findOne({ email: u.email, isDeleted: false });
      if (!doc) {
        doc = new User({
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          password: defaultPassword,
          phone: u.phone,
          role: u.role,
          roleId: roleMap[u.role],
          status: ACCOUNT_STATUS.ACTIVE,
          assignedBuildingIds: [building._id],
        });
        await doc.save();
      } else {
        doc.password = defaultPassword;
        doc.role = u.role;
        doc.roleId = roleMap[u.role];
        doc.status = ACCOUNT_STATUS.ACTIVE;
        if (!doc.assignedBuildingIds.some((id) => id.toString() === building._id.toString())) {
          doc.assignedBuildingIds.push(building._id);
        }
        await doc.save();
      }
      userDocs[u.role] = doc;
    }

    // 7. Provision Flats (Mix of Occupied, Vacant, Under Maintenance)
    console.log("[7/14] Provisioning Flats...");
    const getOrCreateFlat = async (blockId, floorId, flatNumber, areaSqFt, flatType, status) => {
      let fl = await Flat.findOne({ blockId, flatNumber, isDeleted: false });
      if (!fl) {
        fl = new Flat({
          buildingId: building._id,
          blockId,
          floorId,
          flatNumber,
          areaSqFt,
          flatType,
          status,
        });
        await fl.save();
      }
      return fl;
    };

    const flat101 = await getOrCreateFlat(blockA._id, floorA1._id, "101", 1200, FLAT_TYPES.TWO_BHK, FLAT_STATUS.OCCUPIED);
    const flat102 = await getOrCreateFlat(blockA._id, floorA1._id, "102", 1500, FLAT_TYPES.THREE_BHK, FLAT_STATUS.OCCUPIED);
    const flat201 = await getOrCreateFlat(blockA._id, floorA2._id, "201", 1800, FLAT_TYPES.THREE_BHK, FLAT_STATUS.VACANT);
    const flat202 = await getOrCreateFlat(blockA._id, floorA2._id, "202", 950, FLAT_TYPES.ONE_BHK, FLAT_STATUS.VACANT);
    const flat103 = await getOrCreateFlat(blockB._id, floorB1._id, "103", 1100, FLAT_TYPES.TWO_BHK, FLAT_STATUS.UNDER_MAINTENANCE);
    const flat104 = await getOrCreateFlat(blockB._id, floorB1._id, "104", 2400, FLAT_TYPES.PENTHOUSE, FLAT_STATUS.OCCUPIED);
    const flat203 = await getOrCreateFlat(blockB._id, floorB2._id, "203", 650, FLAT_TYPES.STUDIO, FLAT_STATUS.VACANT);
    const flat204 = await getOrCreateFlat(blockB._id, floorB2._id, "204", 1350, FLAT_TYPES.TWO_BHK, FLAT_STATUS.VACANT);

    // 8. Provision Owner & Tenant Profiles
    console.log("[8/14] Provisioning Owner & Tenant Profiles...");
    let ownerProfile = await Owner.findOne({ userId: userDocs[ROLES.OWNER]._id, isDeleted: false });
    if (!ownerProfile) {
      ownerProfile = new Owner({
        userId: userDocs[ROLES.OWNER]._id,
        buildingId: building._id,
        flatsOwned: [flat101._id, flat102._id, flat104._id],
        emergencyContact: {
          name: "Alexander Rostova",
          relationship: "Brother",
          phone: "+15559990001",
        },
        idProofType: OWNERS_CONSTANTS.ID_PROOF_TYPES.PASSPORT,
        idProofUrl: "https://example.com/proofs/owner_passport.pdf",
        isResidingInBuilding: false,
      });
      await ownerProfile.save();
    }

    let tenantProfile = await Tenant.findOne({ userId: userDocs[ROLES.TENANT]._id, isDeleted: false });
    if (!tenantProfile) {
      tenantProfile = new Tenant({
        userId: userDocs[ROLES.TENANT]._id,
        buildingId: building._id,
        flatId: flat101._id,
        ownerId: ownerProfile._id,
        leaseStartDate: new Date("2026-01-01"),
        leaseEndDate: new Date("2026-12-31"),
        rentAmount: 1600,
        securityDeposit: 3200,
        emergencyContact: {
          name: "Victoria Vance",
          relationship: "Spouse",
          phone: "+15559990002",
        },
        policeVerificationStatus: TENANTS_CONSTANTS.POLICE_VERIFICATION_STATUS.VERIFIED,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
      });
      await tenantProfile.save();
    }

    // Update Flat 101 associations
    flat101.currentOwnerId = ownerProfile._id;
    flat101.currentTenantId = tenantProfile._id;
    flat101.status = FLAT_STATUS.OCCUPIED;
    await flat101.save();

    flat102.currentOwnerId = ownerProfile._id;
    flat102.status = FLAT_STATUS.OCCUPIED;
    await flat102.save();

    flat104.currentOwnerId = ownerProfile._id;
    flat104.status = FLAT_STATUS.OCCUPIED;
    await flat104.save();

    // 9. Provision Staff Profiles
    console.log("[9/14] Provisioning Staff Operational Profiles...");
    let staffMaint = await Staff.findOne({ userId: userDocs[ROLES.MAINTENANCE_STAFF]._id });
    if (!staffMaint) {
      staffMaint = new Staff({
        userId: userDocs[ROLES.MAINTENANCE_STAFF]._id,
        buildingId: building._id,
        category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.PLUMBER,
        designation: "Lead Plumber & Mechanical Specialist",
        assignedShift: STAFF_CONSTANTS.SHIFTS.MORNING,
        averageRating: 4.8,
        totalRatingsCount: 16,
        status: STAFF_CONSTANTS.STATUS.ACTIVE,
      });
      await staffMaint.save();
    }

    let staffSecurity = await Staff.findOne({ userId: userDocs[ROLES.SECURITY_STAFF]._id });
    if (!staffSecurity) {
      staffSecurity = new Staff({
        userId: userDocs[ROLES.SECURITY_STAFF]._id,
        buildingId: building._id,
        category: STAFF_CONSTANTS.CATEGORIES.SECURITY,
        subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.GATE_GUARD,
        designation: "Senior Gate Controller",
        assignedShift: STAFF_CONSTANTS.SHIFTS.MORNING,
        averageRating: 4.9,
        totalRatingsCount: 22,
        status: STAFF_CONSTANTS.STATUS.ACTIVE,
      });
      await staffSecurity.save();
    }

    // 10. Provision Maintenance Configuration
    console.log("[10/14] Provisioning Active Maintenance Configuration...");
    let maintConfig = await MaintenanceConfiguration.findOne({ buildingId: building._id, isActive: true });
    if (!maintConfig) {
      maintConfig = new MaintenanceConfiguration({
        buildingId: building._id,
        chargeType: CHARGE_TYPES.PER_SQFT,
        baseRate: 3.2,
        parkingCharge: 120,
        waterCharge: 180,
        sinkingFundCharge: 95,
        lateFeePercentage: 5,
        gracePeriodDays: 10,
        effectiveFrom: new Date("2026-01-01"),
        isActive: true,
      });
      await maintConfig.save();
    }

    // 11. Provision Invoices & Payments
    console.log("[11/14] Provisioning Invoices & Payments...");
    let inv1 = await Invoice.findOne({ invoiceNumber: "INV-2026-08-00001" });
    if (!inv1) {
      inv1 = new Invoice({
        invoiceNumber: "INV-2026-08-00001",
        buildingId: building._id,
        flatId: flat101._id,
        ownerId: ownerProfile._id,
        tenantId: tenantProfile._id,
        billingPeriod: "2026-08",
        configurationSnapshot: {
          chargeType: maintConfig.chargeType,
          baseRate: maintConfig.baseRate,
          parkingCharge: maintConfig.parkingCharge,
          waterCharge: maintConfig.waterCharge,
          sinkingFundCharge: maintConfig.sinkingFundCharge,
        },
        lineItems: [
          { title: "Base Maintenance (1,200 sqft @ 3.20/sqft)", amount: 3840 },
          { title: "Covered Parking Charge", amount: 120 },
          { title: "Water Supply & Sewage", amount: 180 },
          { title: "Building Sinking Fund", amount: 95 },
        ],
        subTotal: 4235,
        totalAmount: 4235,
        dueAmount: 0,
        paidAmount: 4235,
        lateFee: 0,
        dueDate: new Date("2026-08-15"),
        status: INVOICE_STATUS.PAID,
        paidAt: new Date("2026-08-10"),
      });
      await inv1.save();

      // Create matching payment ledger record
      let payment1 = await Payment.findOne({ paymentNumber: "PAY-2026-08-00001" });
      if (!payment1) {
        payment1 = new Payment({
          paymentNumber: "PAY-2026-08-00001",
          invoiceId: inv1._id,
          buildingId: building._id,
          flatId: flat101._id,
          payerUserId: userDocs[ROLES.TENANT]._id,
          amountPaid: 4235,
          paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
          transactionRef: "TXN-CITI-98421045",
          receiptNumber: "RCPT-2026-08-00001",
          receiptPdfUrl: "https://example.com/receipts/rcpt-00001.pdf",
          paymentDate: new Date("2026-08-10"),
          notes: "August maintenance settled via direct ACH bank transfer.",
        });
        await payment1.save();
      }
    }

    let inv2 = await Invoice.findOne({ invoiceNumber: "INV-2026-09-00001" });
    if (!inv2) {
      inv2 = new Invoice({
        invoiceNumber: "INV-2026-09-00001",
        buildingId: building._id,
        flatId: flat101._id,
        ownerId: ownerProfile._id,
        tenantId: tenantProfile._id,
        billingPeriod: "2026-09",
        configurationSnapshot: {
          chargeType: maintConfig.chargeType,
          baseRate: maintConfig.baseRate,
          parkingCharge: maintConfig.parkingCharge,
          waterCharge: maintConfig.waterCharge,
          sinkingFundCharge: maintConfig.sinkingFundCharge,
        },
        lineItems: [
          { title: "Base Maintenance (1,200 sqft @ 3.20/sqft)", amount: 3840 },
          { title: "Covered Parking Charge", amount: 120 },
          { title: "Water Supply & Sewage", amount: 180 },
          { title: "Building Sinking Fund", amount: 95 },
        ],
        subTotal: 4235,
        totalAmount: 4235,
        dueAmount: 4235,
        paidAmount: 0,
        lateFee: 0,
        dueDate: new Date("2026-09-20"),
        status: INVOICE_STATUS.ISSUED,
      });
      await inv2.save();
    }

    let inv3 = await Invoice.findOne({ invoiceNumber: "INV-2026-08-00002" });
    if (!inv3) {
      inv3 = new Invoice({
        invoiceNumber: "INV-2026-08-00002",
        buildingId: building._id,
        flatId: flat102._id,
        ownerId: ownerProfile._id,
        tenantId: null,
        billingPeriod: "2026-08",
        configurationSnapshot: {
          chargeType: maintConfig.chargeType,
          baseRate: maintConfig.baseRate,
          parkingCharge: maintConfig.parkingCharge,
          waterCharge: maintConfig.waterCharge,
          sinkingFundCharge: maintConfig.sinkingFundCharge,
        },
        lineItems: [
          { title: "Base Maintenance (1,500 sqft @ 3.20/sqft)", amount: 4800 },
          { title: "Covered Parking Charge", amount: 120 },
          { title: "Water Supply & Sewage", amount: 180 },
          { title: "Building Sinking Fund", amount: 95 },
        ],
        subTotal: 5195,
        lateFee: 259.75,
        totalAmount: 5454.75,
        dueAmount: 5454.75,
        paidAmount: 0,
        dueDate: new Date("2026-08-15"),
        status: INVOICE_STATUS.OVERDUE,
      });
      await inv3.save();
    }

    // 12. Provision Maintenance Requests & Reviews
    console.log("[12/14] Provisioning Maintenance Requests & Reviews...");
    let req1 = await MaintenanceRequest.findOne({ requestNumber: "MR-2026-00001" });
    if (!req1) {
      req1 = new MaintenanceRequest({
        requestNumber: "MR-2026-00001",
        buildingId: building._id,
        flatId: flat101._id,
        createdById: userDocs[ROLES.TENANT]._id,
        category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
        priority: MAINTENANCE_REQUEST_PRIORITY.HIGH,
        title: "Kitchen main drainage sink pipe leakage",
        description: "Under-sink PVC P-trap is actively dripping water whenever the dishwasher drains.",
        initialPhotos: ["https://example.com/photos/drain_leak_1.jpg"],
        assignedStaffId: staffMaint._id,
        status: MAINTENANCE_REQUEST_STATUS.IN_PROGRESS,
        slaDeadline: new Date(Date.now() + 24 * 3600 * 1000),
        startedAt: new Date(),
      });
      await req1.save();
    }

    let req2 = await MaintenanceRequest.findOne({ requestNumber: "MR-2026-00002" });
    if (!req2) {
      req2 = new MaintenanceRequest({
        requestNumber: "MR-2026-00002",
        buildingId: building._id,
        flatId: flat103._id,
        createdById: userDocs[ROLES.MANAGER]._id,
        category: MAINTENANCE_REQUEST_CATEGORY.ELECTRICAL,
        priority: MAINTENANCE_REQUEST_PRIORITY.EMERGENCY,
        title: "Main corridor sub-panel circuit breaker tripping",
        description: "Sub-panel B2 circuit breaker tripped twice this morning during peak corridor HVAC load.",
        initialPhotos: [],
        assignedStaffId: null,
        status: MAINTENANCE_REQUEST_STATUS.OPEN,
        slaDeadline: new Date(Date.now() + 4 * 3600 * 1000),
      });
      await req2.save();
    }

    let req3 = await MaintenanceRequest.findOne({ requestNumber: "MR-2026-00003" });
    if (!req3) {
      req3 = new MaintenanceRequest({
        requestNumber: "MR-2026-00003",
        buildingId: building._id,
        flatId: flat102._id,
        createdById: userDocs[ROLES.OWNER]._id,
        category: MAINTENANCE_REQUEST_CATEGORY.CARPENTRY,
        priority: MAINTENANCE_REQUEST_PRIORITY.LOW,
        title: "Balcony sliding glass door roller track replacement",
        description: "Heavy sliding door was jumping track and catching on threshold seal.",
        initialPhotos: [],
        completionPhotos: ["https://example.com/photos/slider_fixed.jpg"],
        assignedStaffId: staffMaint._id,
        status: MAINTENANCE_REQUEST_STATUS.COMPLETED,
        slaDeadline: new Date(Date.now() - 48 * 3600 * 1000),
        startedAt: new Date(Date.now() - 72 * 3600 * 1000),
        completedAt: new Date(Date.now() - 50 * 3600 * 1000),
      });
      await req3.save();

      // Create Review for Req 3
      let rev = await Review.findOne({ maintenanceRequestId: req3._id });
      if (!rev) {
        rev = new Review({
          maintenanceRequestId: req3._id,
          buildingId: building._id,
          flatId: flat102._id,
          residentUserId: userDocs[ROLES.OWNER]._id,
          staffId: staffMaint._id,
          rating: 5,
          title: "Prompt and immaculate carpentry work",
          comment: "Carlos arrived within 30 minutes with the correct replacement track rollers. Silent sliding now!",
          moderationStatus: MODERATION_STATUS.PUBLISHED,
          moderatedById: userDocs[ROLES.MANAGER]._id,
          moderatedAt: new Date(),
        });
        await rev.save();
      }
    }

    // 13. Provision Complaints, Notices, Visitors, Expenses, Documents, Notifications
    console.log("[13/14] Provisioning Complaints, Notices, Visitors, Expenses, Documents...");
    let comp1 = await Complaint.findOne({ complaintNumber: "CMP-2026-00001" });
    if (!comp1) {
      comp1 = new Complaint({
        complaintNumber: "CMP-2026-00001",
        buildingId: building._id,
        flatId: flat101._id,
        createdById: userDocs[ROLES.TENANT]._id,
        type: COMPLAINT_TYPE.NOISE_DISTURBANCE,
        title: "Unscheduled late night drilling and renovation sounds",
        description: "Loud power tools operating between 11:30 PM and 1:00 AM on the floor above.",
        status: COMPLAINT_STATUS.OPEN,
      });
      await comp1.save();
    }

    let comp2 = await Complaint.findOne({ complaintNumber: "CMP-2026-00002" });
    if (!comp2) {
      comp2 = new Complaint({
        complaintNumber: "CMP-2026-00002",
        buildingId: building._id,
        flatId: flat102._id,
        createdById: userDocs[ROLES.OWNER]._id,
        type: COMPLAINT_TYPE.PARKING_DISPUTE,
        title: "Unknown commercial van obstructing assigned parking bay A-12",
        description: "Delivery van left parked across parking stall A-12 preventing resident entry.",
        status: COMPLAINT_STATUS.RESOLVED,
        resolutionNotes: "Security contacted delivery courier dispatch and relocated vehicle to designated loading dock bay 3.",
        resolvedById: userDocs[ROLES.MANAGER]._id,
        resolvedAt: new Date(),
      });
      await comp2.save();
    }

    let notice1 = await Notice.findOne({ title: "Quarterly Central Water Tank Cleaning Schedule" });
    if (!notice1) {
      notice1 = new Notice({
        buildingId: building._id,
        authorUserId: userDocs[ROLES.BUILDING_ADMIN]._id,
        title: "Quarterly Central Water Tank Cleaning Schedule",
        content: "Please be advised that central overhead and underground water reservoirs will undergo high-pressure chemical sanitization on Saturday from 9:00 AM to 3:00 PM. Water supply will be temporarily throttled.",
        category: NOTICE_CATEGORY.MAINTENANCE,
        priority: NOTICE_PRIORITY.HIGH,
        targetAudience: TARGET_AUDIENCE.ALL,
        publishedAt: new Date(),
      });
      await notice1.save();
    }

    let notice2 = await Notice.findOne({ title: "Annual General Assembly & Community Enhancement Forum" });
    if (!notice2) {
      notice2 = new Notice({
        buildingId: building._id,
        authorUserId: userDocs[ROLES.MANAGER]._id,
        title: "Annual General Assembly & Community Enhancement Forum",
        content: "The 2026 Annual General Assembly will convene this Sunday at 6:00 PM in the Clubhouse Banquet Hall to present financial statements and vote on the rooftop solar installation initiative.",
        category: NOTICE_CATEGORY.GENERAL,
        priority: NOTICE_PRIORITY.NORMAL,
        targetAudience: TARGET_AUDIENCE.ALL,
        publishedAt: new Date(),
      });
      await notice2.save();
    }

    let visitor1 = await Visitor.findOne({ passCode: "849201" });
    if (!visitor1) {
      visitor1 = new Visitor({
        passCode: "849201",
        qrToken: "QR-GVR-849201-ELENA",
        buildingId: building._id,
        flatId: flat101._id,
        hostUserId: userDocs[ROLES.OWNER]._id,
        visitorName: "David Miller",
        visitorPhone: "+15554329876",
        vehicleNumber: "NY-7842",
        visitorType: VISITOR_TYPES.GUEST,
        visitorCount: 2,
        expectedArrivalDate: new Date(Date.now() + 4 * 3600 * 1000),
        status: VISITOR_STATUS.EXPECTED,
      });
      await visitor1.save();
    }

    let visitor2 = await Visitor.findOne({ passCode: "512894" });
    if (!visitor2) {
      visitor2 = new Visitor({
        passCode: "512894",
        qrToken: "QR-GVR-512894-MARCUS",
        buildingId: building._id,
        flatId: flat101._id,
        hostUserId: userDocs[ROLES.TENANT]._id,
        visitorName: "FedEx Express (Courier)",
        visitorPhone: "+15551239874",
        vehicleNumber: "COM-9912",
        visitorType: VISITOR_TYPES.DELIVERY,
        visitorCount: 1,
        expectedArrivalDate: new Date(),
        entryTimestamp: new Date(),
        verifiedByStaffId: userDocs[ROLES.SECURITY_STAFF]._id,
        status: VISITOR_STATUS.CHECKED_IN,
      });
      await visitor2.save();
    }

    let exp1 = await Expense.findOne({ expenseNumber: "EXP-2026-00001" });
    if (!exp1) {
      exp1 = new Expense({
        expenseNumber: "EXP-2026-00001",
        buildingId: building._id,
        title: "Central HVAC Chiller High-Efficiency Air Filter Replacements",
        vendorName: "Metro Climate Systems & Filtration LLC",
        category: EXPENSE_CATEGORY.REPAIRS,
        amount: 1450.0,
        expenseDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        createdById: userDocs[ROLES.ACCOUNTANT]._id,
        approvedById: userDocs[ROLES.BUILDING_ADMIN]._id,
        status: EXPENSE_STATUS.APPROVED,
        receiptUrl: "https://example.com/receipts/exp_001.pdf",
      });
      await exp1.save();
    }

    let exp2 = await Expense.findOne({ expenseNumber: "EXP-2026-00002" });
    if (!exp2) {
      exp2 = new Expense({
        expenseNumber: "EXP-2026-00002",
        buildingId: building._id,
        title: "Perimeter Security Night Patrol Tact-Gear & Radios",
        vendorName: "Apex Tactical & Security Supplies",
        category: EXPENSE_CATEGORY.SECURITY_SALARIES,
        amount: 875.5,
        expenseDate: new Date(),
        createdById: userDocs[ROLES.ACCOUNTANT]._id,
        status: EXPENSE_STATUS.PENDING_APPROVAL,
      });
      await exp2.save();
    }

    let doc1 = await Document.findOne({ title: "Greenwood Valley Master Society Bylaws 2026" });
    if (!doc1) {
      doc1 = new Document({
        buildingId: building._id,
        title: "Greenwood Valley Master Society Bylaws 2026",
        documentType: DOCUMENT_TYPES.SOCIETY_BYLAW,
        fileUrl: "https://example.com/docs/gvr-bylaws-2026.pdf",
        visibility: DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS,
        uploadedById: userDocs[ROLES.BUILDING_ADMIN]._id,
      });
      await doc1.save();
    }

    let doc2 = await Document.findOne({ title: "Annual Financial Statement & Reserves Audit FY2025" });
    if (!doc2) {
      doc2 = new Document({
        buildingId: building._id,
        title: "Annual Financial Statement & Reserves Audit FY2025",
        documentType: DOCUMENT_TYPES.AUDIT_REPORT,
        fileUrl: "https://example.com/docs/gvr-audit-2025.pdf",
        visibility: DOCUMENT_VISIBILITY.OWNERS_ONLY,
        uploadedById: userDocs[ROLES.ACCOUNTANT]._id,
      });
      await doc2.save();
    }

    let notif1 = await Notification.findOne({ title: "September 2026 Maintenance Invoice Issued" });
    if (!notif1) {
      notif1 = new Notification({
        recipientUserId: userDocs[ROLES.OWNER]._id,
        buildingId: building._id,
        title: "September 2026 Maintenance Invoice Issued",
        body: "Your monthly invoice INV-2026-09-00001 for Flat 101 has been posted. Due date is Sept 20.",
        category: NOTIFICATION_CATEGORY.INVOICE,
        referenceId: inv2._id,
        referenceModel: "Invoice",
        isRead: false,
      });
      await notif1.save();
    }

    let notif2 = await Notification.findOne({ title: "High-Priority Work Order Assigned: MR-2026-00001" });
    if (!notif2) {
      notif2 = new Notification({
        recipientUserId: userDocs[ROLES.MAINTENANCE_STAFF]._id,
        buildingId: building._id,
        title: "High-Priority Work Order Assigned: MR-2026-00001",
        body: "Kitchen pipe leakage at Flat 101 has been assigned to your dispatch queue.",
        category: NOTIFICATION_CATEGORY.WORK_ORDER,
        referenceId: req1._id,
        referenceModel: "MaintenanceRequest",
        isRead: false,
      });
      await notif2.save();
    }

    // 14. Provision Initial Immutable Audit Logs
    console.log("[14/14] Provisioning Immutable Audit Trail Logs...");
    let audit1 = await AuditLog.findOne({ action: "COMPLEX_INITIALIZED" });
    if (!audit1) {
      audit1 = new AuditLog({
        action: "COMPLEX_INITIALIZED",
        actorUserId: superAdmin._id,
        actorRole: ROLES.SUPER_ADMIN,
        buildingId: building._id,
        resourceType: "BUILDING",
        resourceId: building._id,
        afterState: { name: building.name, code: building.code, status: building.status },
        ipAddress: "127.0.0.1",
        userAgent: "SystemSeeder/1.0",
      });
      await audit1.save();
    }

    let audit2 = await AuditLog.findOne({ action: "INVOICE_PUBLISHED" });
    if (!audit2) {
      audit2 = new AuditLog({
        action: "INVOICE_PUBLISHED",
        actorUserId: userDocs[ROLES.ACCOUNTANT]._id,
        actorRole: ROLES.ACCOUNTANT,
        buildingId: building._id,
        resourceType: "INVOICE",
        resourceId: inv2._id,
        afterState: { invoiceNumber: inv2.invoiceNumber, totalAmount: inv2.totalAmount, status: inv2.status },
        ipAddress: "127.0.0.1",
        userAgent: "SystemSeeder/1.0",
      });
      await audit2.save();
    }

    console.log("\x1b[32m%s\x1b[0m", "--- ALL 24 MODULES SEEDED WITH REALISTIC PRODUCTION DATA SUCCESSFULLY ---");
    console.log("\n=======================================================");
    console.log("TEST CREDENTIALS SUMMARY (Password for all: Password123!)");
    console.log("=======================================================");
    console.log(`SUPER_ADMIN       : ${superAdminEmail} (password: ${process.env.SUPER_ADMIN_PASSWORD || "umarkhan"})`);
    console.log(`BUILDING_ADMIN    : admin.greenwood@society.local`);
    console.log(`MANAGER           : manager.sarah@society.local`);
    console.log(`ACCOUNTANT        : accountant.dave@society.local`);
    console.log(`MAINTENANCE_STAFF : tech.carlos@society.local`);
    console.log(`SECURITY_STAFF    : guard.ahmed@society.local`);
    console.log(`OWNER             : owner.elena@society.local`);
    console.log(`TENANT            : tenant.marcus@society.local`);
    console.log("=======================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "[ERROR] Comprehensive seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seedComprehensiveData();
