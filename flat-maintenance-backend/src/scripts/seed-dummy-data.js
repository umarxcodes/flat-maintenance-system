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
    console.log("\x1b[36m%s\x1b[0m", "--- Starting Comprehensive Pakistani Data Seeder ---");

    // 1. Purge previous dummy/foreign data across collections
    console.log("[1/15] Purging previous foreign dummy data to guarantee 100% Pakistani data...");
    await Building.collection.deleteMany({});
    await Block.collection.deleteMany({});
    await Floor.collection.deleteMany({});
    await Flat.collection.deleteMany({});
    await Owner.collection.deleteMany({});
    await Tenant.collection.deleteMany({});
    await Staff.collection.deleteMany({});
    await MaintenanceConfiguration.collection.deleteMany({});
    await MaintenanceRequest.collection.deleteMany({});
    await Invoice.collection.deleteMany({});
    await Payment.collection.deleteMany({});
    await Complaint.collection.deleteMany({});
    await Review.collection.deleteMany({});
    await Notice.collection.deleteMany({});
    await Notification.collection.deleteMany({});
    await Expense.collection.deleteMany({});
    await Visitor.collection.deleteMany({});
    await Document.collection.deleteMany({});
    await AuditLog.collection.deleteMany({});

    // Keep Super Admin, remove other seeded demo accounts to ensure clean state
    await User.collection.deleteMany({ role: { $ne: ROLES.SUPER_ADMIN } });
    console.log("[INFO] Foreign collections purged successfully.");

    // 2. Synchronize Canonical Permissions & System Roles
    console.log("[2/15] Synchronizing platform permissions and system roles...");
    await permissionsService.seedPermissions();
    await rolesService.seedSystemRoles();

    const roleMap = {};
    const roles = await Role.find({});
    roles.forEach((r) => {
      roleMap[r.name] = r._id;
    });

    // 3. Provision or Synchronize Super Admin (Muhammad Umar)
    console.log("[3/15] Verifying Super Admin (Muhammad Umar)...");
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "muhammadumar.codes@gmail.com").toLowerCase().trim();
    let superAdmin = await User.findOne({ email: superAdminEmail, isDeleted: false });
    if (!superAdmin) {
      superAdmin = new User({
        firstName: "Muhammad",
        lastName: "Umar",
        email: superAdminEmail,
        password: process.env.SUPER_ADMIN_PASSWORD || "umarkhan",
        phone: "+923010568885",
        role: ROLES.SUPER_ADMIN,
        roleId: roleMap[ROLES.SUPER_ADMIN],
        status: ACCOUNT_STATUS.ACTIVE,
        assignedBuildingIds: [],
      });
      await superAdmin.save();
      console.log(`[INFO] Created Super Admin: ${superAdminEmail}`);
    } else {
      superAdmin.firstName = "Muhammad";
      superAdmin.lastName = "Umar";
      superAdmin.phone = "+923010568885";
      await superAdmin.save();
      console.log(`[INFO] Super Admin verified: ${superAdminEmail}`);
    }

    // 4. Create Primary Building Complex: Al-Raziq Heights (Karachi, Pakistan)
    console.log("[4/15] Provisioning Pakistani Residential Complex: Al-Raziq Heights...");
    const building = new Building({
      name: "Al-Raziq Heights",
      code: "ARH-01",
      address: {
        street: "Plot 14-C, Main Khayaban-e-Ittehad, Phase 6, DHA",
        city: "Karachi",
        state: "Sindh",
        postalCode: "75500",
        country: "Pakistan",
      },
      totalBlocks: 2,
      totalFlats: 8,
      status: BUILDING_STATUS.ACTIVE,
    });
    await building.save();
    console.log(`[INFO] Created Building: ${building.name} (${building.code})`);

    // Associate Super Admin with Building
    superAdmin.assignedBuildingIds = [building._id];
    await superAdmin.save();

    // 5. Create Blocks: Jinnah Block & Iqbal Block
    console.log("[5/15] Provisioning Blocks (Jinnah Block & Iqbal Block)...");
    const blockA = new Block({
      buildingId: building._id,
      name: "Jinnah Block",
      code: "JB-01",
      totalFloors: 4,
    });
    await blockA.save();

    const blockB = new Block({
      buildingId: building._id,
      name: "Iqbal Block",
      code: "IB-01",
      totalFloors: 4,
    });
    await blockB.save();

    // 6. Create Floors
    console.log("[6/15] Provisioning Floors...");
    const floorA1 = new Floor({
      buildingId: building._id,
      blockId: blockA._id,
      floorNumber: 1,
      name: "Level 1 - Executive Suites",
    });
    await floorA1.save();

    const floorA2 = new Floor({
      buildingId: building._id,
      blockId: blockA._id,
      floorNumber: 2,
      name: "Level 2 - Sky Terraces",
    });
    await floorA2.save();

    const floorB1 = new Floor({
      buildingId: building._id,
      blockId: blockB._id,
      floorNumber: 1,
      name: "Level 1 - Premier Wing",
    });
    await floorB1.save();

    const floorB2 = new Floor({
      buildingId: building._id,
      blockId: blockB._id,
      floorNumber: 2,
      name: "Level 2 - Panoramic Penthouses",
    });
    await floorB2.save();

    // 7. Provision Authentic Pakistani System Users
    console.log("[7/15] Provisioning Pakistani Role Users (Password123!)...");
    const defaultPassword = "Password123!";

    const seedUsers = [
      {
        firstName: "Tariq",
        lastName: "Mahmood",
        email: "admin.alraziq@society.local",
        role: ROLES.BUILDING_ADMIN,
        phone: "+923214567890",
      },
      {
        firstName: "Sarah",
        lastName: "Khan",
        email: "manager.sarah@society.local",
        role: ROLES.MANAGER,
        phone: "+923331234567",
      },
      {
        firstName: "Dawood",
        lastName: "Ahmed",
        email: "accountant.dawood@society.local",
        role: ROLES.ACCOUNTANT,
        phone: "+923009876543",
      },
      {
        firstName: "Kamran",
        lastName: "Akram",
        email: "tech.kamran@society.local",
        role: ROLES.MAINTENANCE_STAFF,
        phone: "+923451122334",
      },
      {
        firstName: "Ahmed",
        lastName: "Raza",
        email: "guard.ahmed@society.local",
        role: ROLES.SECURITY_STAFF,
        phone: "+923129988776",
      },
      {
        firstName: "Fatima",
        lastName: "Zahra",
        email: "owner.fatima@society.local",
        role: ROLES.OWNER,
        phone: "+923023344556",
      },
      {
        firstName: "Hamza",
        lastName: "Tariq",
        email: "tenant.hamza@society.local",
        role: ROLES.TENANT,
        phone: "+923057788990",
      },
    ];

    const userDocs = {};
    for (const u of seedUsers) {
      let doc = new User({
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
      userDocs[u.role] = doc;
    }

    // 8. Provision Flats
    console.log("[8/15] Provisioning Flats across Jinnah and Iqbal Blocks...");
    const flat101 = new Flat({
      buildingId: building._id,
      blockId: blockA._id,
      floorId: floorA1._id,
      flatNumber: "101",
      areaSqFt: 1200,
      flatType: FLAT_TYPES.TWO_BHK,
      status: FLAT_STATUS.OCCUPIED,
    });
    await flat101.save();

    const flat102 = new Flat({
      buildingId: building._id,
      blockId: blockA._id,
      floorId: floorA1._id,
      flatNumber: "102",
      areaSqFt: 1500,
      flatType: FLAT_TYPES.THREE_BHK,
      status: FLAT_STATUS.OCCUPIED,
    });
    await flat102.save();

    const flat201 = new Flat({
      buildingId: building._id,
      blockId: blockA._id,
      floorId: floorA2._id,
      flatNumber: "201",
      areaSqFt: 1800,
      flatType: FLAT_TYPES.THREE_BHK,
      status: FLAT_STATUS.VACANT,
    });
    await flat201.save();

    const flat202 = new Flat({
      buildingId: building._id,
      blockId: blockA._id,
      floorId: floorA2._id,
      flatNumber: "202",
      areaSqFt: 950,
      flatType: FLAT_TYPES.ONE_BHK,
      status: FLAT_STATUS.VACANT,
    });
    await flat202.save();

    const flat103 = new Flat({
      buildingId: building._id,
      blockId: blockB._id,
      floorId: floorB1._id,
      flatNumber: "103",
      areaSqFt: 1100,
      flatType: FLAT_TYPES.TWO_BHK,
      status: FLAT_STATUS.UNDER_MAINTENANCE,
    });
    await flat103.save();

    const flat104 = new Flat({
      buildingId: building._id,
      blockId: blockB._id,
      floorId: floorB1._id,
      flatNumber: "104",
      areaSqFt: 2400,
      flatType: FLAT_TYPES.PENTHOUSE,
      status: FLAT_STATUS.OCCUPIED,
    });
    await flat104.save();

    const flat203 = new Flat({
      buildingId: building._id,
      blockId: blockB._id,
      floorId: floorB2._id,
      flatNumber: "203",
      areaSqFt: 650,
      flatType: FLAT_TYPES.STUDIO,
      status: FLAT_STATUS.VACANT,
    });
    await flat203.save();

    const flat204 = new Flat({
      buildingId: building._id,
      blockId: blockB._id,
      floorId: floorB2._id,
      flatNumber: "204",
      areaSqFt: 1350,
      flatType: FLAT_TYPES.TWO_BHK,
      status: FLAT_STATUS.VACANT,
    });
    await flat204.save();

    // 9. Provision Owner & Tenant Profiles (Pakistani Details)
    console.log("[9/15] Provisioning Owner (Fatima Zahra) & Tenant (Hamza Tariq) Profiles...");
    const ownerProfile = new Owner({
      userId: userDocs[ROLES.OWNER]._id,
      buildingId: building._id,
      flatsOwned: [flat101._id, flat102._id, flat104._id],
      emergencyContact: {
        name: "Bilal Zahra",
        relationship: "Brother",
        phone: "+923008765432",
      },
      idProofType: OWNERS_CONSTANTS.ID_PROOF_TYPES.CNIC,
      idProofNumber: "42201-1234567-8",
      idProofUrl: "https://example.com/proofs/fatima_cnic.pdf",
      isResidingInBuilding: false,
    });
    await ownerProfile.save();

    const tenantProfile = new Tenant({
      userId: userDocs[ROLES.TENANT]._id,
      buildingId: building._id,
      flatId: flat101._id,
      ownerId: ownerProfile._id,
      leaseStartDate: new Date("2026-01-01"),
      leaseEndDate: new Date("2026-12-31"),
      rentAmount: 125000,
      securityDeposit: 250000,
      emergencyContact: {
        name: "Ayesha Hamza",
        relationship: "Spouse",
        phone: "+923015566778",
      },
      policeVerificationStatus: TENANTS_CONSTANTS.POLICE_VERIFICATION_STATUS.VERIFIED,
      status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
    });
    await tenantProfile.save();

    // Link Flat 101, 102, 104 with Owner and Tenant
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

    // 10. Provision Staff Profiles
    console.log("[10/15] Provisioning Staff Operational Profiles (Kamran Akram & Ahmed Raza)...");
    const staffMaint = new Staff({
      userId: userDocs[ROLES.MAINTENANCE_STAFF]._id,
      buildingId: building._id,
      category: STAFF_CONSTANTS.CATEGORIES.MAINTENANCE,
      subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.PLUMBER,
      designation: "Lead Plumber & Mechanical Specialist",
      assignedShift: STAFF_CONSTANTS.SHIFTS.MORNING,
      averageRating: 4.9,
      totalRatingsCount: 24,
      status: STAFF_CONSTANTS.STATUS.ACTIVE,
    });
    await staffMaint.save();

    const staffSecurity = new Staff({
      userId: userDocs[ROLES.SECURITY_STAFF]._id,
      buildingId: building._id,
      category: STAFF_CONSTANTS.CATEGORIES.SECURITY,
      subCategory: STAFF_CONSTANTS.SUB_CATEGORIES.GATE_GUARD,
      designation: "Chief Gate Controller & CCTV Supervisor",
      assignedShift: STAFF_CONSTANTS.SHIFTS.MORNING,
      averageRating: 4.8,
      totalRatingsCount: 30,
      status: STAFF_CONSTANTS.STATUS.ACTIVE,
    });
    await staffSecurity.save();

    // 11. Provision Maintenance Configuration (PKR Standard Rates)
    console.log("[11/15] Provisioning Maintenance Configuration (PKR)...");
    const maintConfig = new MaintenanceConfiguration({
      buildingId: building._id,
      chargeType: CHARGE_TYPES.PER_SQFT,
      baseRate: 12.0,
      parkingCharge: 2500,
      waterCharge: 3500,
      sinkingFundCharge: 2000,
      lateFeePercentage: 5,
      gracePeriodDays: 10,
      effectiveFrom: new Date("2026-01-01"),
      isActive: true,
    });
    await maintConfig.save();

    // 12. Provision Invoices & Payments (PKR)
    console.log("[12/15] Provisioning Invoices & Payments (Meezan Bank Raast Transfers)...");
    const inv1 = new Invoice({
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
        { title: "Base Maintenance (1,200 sqft @ ₨12/sqft)", amount: 14400 },
        { title: "Designated Basement Parking", amount: 2500 },
        { title: "Water Supply & RO Filtration", amount: 3500 },
        { title: "Diesel Generator Reserve & Sinking Fund", amount: 2000 },
      ],
      subTotal: 22400,
      totalAmount: 22400,
      dueAmount: 0,
      paidAmount: 22400,
      lateFee: 0,
      dueDate: new Date("2026-08-15"),
      status: INVOICE_STATUS.PAID,
      paidAt: new Date("2026-08-10"),
    });
    await inv1.save();

    const payment1 = new Payment({
      paymentNumber: "PAY-2026-08-00001",
      invoiceId: inv1._id,
      buildingId: building._id,
      flatId: flat101._id,
      payerUserId: userDocs[ROLES.TENANT]._id,
      amountPaid: 22400,
      paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
      transactionRef: "TXN-MEEZAN-98421045",
      receiptNumber: "RCPT-2026-08-00001",
      receiptPdfUrl: "https://example.com/receipts/rcpt-00001.pdf",
      paymentDate: new Date("2026-08-10"),
      notes: "August maintenance settled via Meezan Bank Raast instant transfer.",
    });
    await payment1.save();

    const inv2 = new Invoice({
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
        { title: "Base Maintenance (1,200 sqft @ ₨12/sqft)", amount: 14400 },
        { title: "Designated Basement Parking", amount: 2500 },
        { title: "Water Supply & RO Filtration", amount: 3500 },
        { title: "Diesel Generator Reserve & Sinking Fund", amount: 2000 },
      ],
      subTotal: 22400,
      totalAmount: 22400,
      dueAmount: 22400,
      paidAmount: 0,
      lateFee: 0,
      dueDate: new Date("2026-09-20"),
      status: INVOICE_STATUS.ISSUED,
    });
    await inv2.save();

    const inv3 = new Invoice({
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
        { title: "Base Maintenance (1,500 sqft @ ₨12/sqft)", amount: 18000 },
        { title: "Designated Basement Parking", amount: 2500 },
        { title: "Water Supply & RO Filtration", amount: 3500 },
        { title: "Diesel Generator Reserve & Sinking Fund", amount: 2000 },
      ],
      subTotal: 26000,
      lateFee: 1300,
      totalAmount: 27300,
      dueAmount: 27300,
      paidAmount: 0,
      dueDate: new Date("2026-08-15"),
      status: INVOICE_STATUS.OVERDUE,
    });
    await inv3.save();

    // 13. Provision Maintenance Requests & Reviews
    console.log("[13/15] Provisioning Maintenance Requests & Reviews...");
    const req1 = new MaintenanceRequest({
      requestNumber: "MR-2026-00001",
      buildingId: building._id,
      flatId: flat101._id,
      createdById: userDocs[ROLES.TENANT]._id,
      category: MAINTENANCE_REQUEST_CATEGORY.PLUMBING,
      priority: MAINTENANCE_REQUEST_PRIORITY.HIGH,
      title: "Kitchen main drainage sink pipe leakage",
      description: "Under-sink PVC P-trap is actively dripping water whenever the sink is in heavy use.",
      initialPhotos: ["https://example.com/photos/drain_leak_1.jpg"],
      assignedStaffId: staffMaint._id,
      status: MAINTENANCE_REQUEST_STATUS.IN_PROGRESS,
      slaDeadline: new Date(Date.now() + 24 * 3600 * 1000),
      startedAt: new Date(),
    });
    await req1.save();

    const req2 = new MaintenanceRequest({
      requestNumber: "MR-2026-00002",
      buildingId: building._id,
      flatId: flat103._id,
      createdById: userDocs[ROLES.MANAGER]._id,
      category: MAINTENANCE_REQUEST_CATEGORY.ELECTRICAL,
      priority: MAINTENANCE_REQUEST_PRIORITY.EMERGENCY,
      title: "Corridor backup generator sub-panel circuit breaker tripping",
      description: "Sub-panel J2 circuit breaker tripped twice during K-Electric peak load shedding changeover.",
      initialPhotos: [],
      assignedStaffId: null,
      status: MAINTENANCE_REQUEST_STATUS.OPEN,
      slaDeadline: new Date(Date.now() + 4 * 3600 * 1000),
    });
    await req2.save();

    const req3 = new MaintenanceRequest({
      requestNumber: "MR-2026-00003",
      buildingId: building._id,
      flatId: flat102._id,
      createdById: userDocs[ROLES.OWNER]._id,
      category: MAINTENANCE_REQUEST_CATEGORY.CARPENTRY,
      priority: MAINTENANCE_REQUEST_PRIORITY.LOW,
      title: "Balcony sliding glass door roller track replacement",
      description: "Heavy sliding glass door was jumping track and sticking on threshold aluminum seal.",
      initialPhotos: [],
      completionPhotos: ["https://example.com/photos/slider_fixed.jpg"],
      assignedStaffId: staffMaint._id,
      status: MAINTENANCE_REQUEST_STATUS.COMPLETED,
      slaDeadline: new Date(Date.now() - 48 * 3600 * 1000),
      startedAt: new Date(Date.now() - 72 * 3600 * 1000),
      completedAt: new Date(Date.now() - 50 * 3600 * 1000),
    });
    await req3.save();

    const rev = new Review({
      maintenanceRequestId: req3._id,
      buildingId: building._id,
      flatId: flat102._id,
      residentUserId: userDocs[ROLES.OWNER]._id,
      staffId: staffMaint._id,
      rating: 5,
      title: "Prompt and immaculate repair work",
      comment: "Kamran bhai arrived within 30 minutes with genuine replacement track rollers. Silent sliding now!",
      moderationStatus: MODERATION_STATUS.PUBLISHED,
      moderatedById: userDocs[ROLES.MANAGER]._id,
      moderatedAt: new Date(),
    });
    await rev.save();

    // 14. Provision Complaints, Notices, Visitors, Expenses, Documents, Notifications
    console.log("[14/15] Provisioning Complaints, Notices, Visitors, Expenses, Documents...");
    const comp1 = new Complaint({
      complaintNumber: "CMP-2026-00001",
      buildingId: building._id,
      flatId: flat101._id,
      createdById: userDocs[ROLES.TENANT]._id,
      type: COMPLAINT_TYPE.NOISE_DISTURBANCE,
      title: "Unscheduled late night renovation hammering in upper floor",
      description: "Heavy hammering and drilling heard between 11:30 PM and 1:00 AM.",
      status: COMPLAINT_STATUS.OPEN,
    });
    await comp1.save();

    const comp2 = new Complaint({
      complaintNumber: "CMP-2026-00002",
      buildingId: building._id,
      flatId: flat102._id,
      createdById: userDocs[ROLES.OWNER]._id,
      type: COMPLAINT_TYPE.PARKING_DISPUTE,
      title: "Unknown courier van obstructing assigned parking bay A-12",
      description: "Delivery van left parked across parking stall A-12 preventing resident entry.",
      status: COMPLAINT_STATUS.RESOLVED,
      resolutionNotes: "Security contacted TCS courier driver and relocated van to designated visitor loading dock.",
      resolvedById: userDocs[ROLES.MANAGER]._id,
      resolvedAt: new Date(),
    });
    await comp2.save();

    const notice1 = new Notice({
      buildingId: building._id,
      authorUserId: userDocs[ROLES.BUILDING_ADMIN]._id,
      title: "Quarterly Central Overhead & Underground Water Tank Sanitization",
      content: "Please be advised that central underground water reservoirs will undergo high-pressure chlorine sanitization on Saturday from 9:00 AM to 3:00 PM. Water supply will be temporarily throttled.",
      category: NOTICE_CATEGORY.MAINTENANCE,
      priority: NOTICE_PRIORITY.HIGH,
      targetAudience: TARGET_AUDIENCE.ALL,
      publishedAt: new Date(),
    });
    await notice1.save();

    const notice2 = new Notice({
      buildingId: building._id,
      authorUserId: userDocs[ROLES.MANAGER]._id,
      title: "K-Electric Scheduled Maintenance & Standby Diesel Generator Protocol",
      content: "K-Electric has announced scheduled grid maintenance for DHA Phase 6 on Tuesday from 10:00 AM to 2:00 PM. The complex standby 250kVA diesel generator will operate continuously with full elevator and water pump backup.",
      category: NOTICE_CATEGORY.GENERAL,
      priority: NOTICE_PRIORITY.NORMAL,
      targetAudience: TARGET_AUDIENCE.ALL,
      publishedAt: new Date(),
    });
    await notice2.save();

    const visitor1 = new Visitor({
      passCode: "849201",
      qrToken: "QR-ARH-849201-FATIMA",
      buildingId: building._id,
      flatId: flat101._id,
      hostUserId: userDocs[ROLES.OWNER]._id,
      visitorName: "Tariq Bashir",
      visitorPhone: "+923218877665",
      vehicleNumber: "KHI-BGP-4821",
      visitorType: VISITOR_TYPES.GUEST,
      visitorCount: 2,
      expectedArrivalDate: new Date(Date.now() + 4 * 3600 * 1000),
      status: VISITOR_STATUS.EXPECTED,
    });
    await visitor1.save();

    const visitor2 = new Visitor({
      passCode: "512894",
      qrToken: "QR-ARH-512894-HAMZA",
      buildingId: building._id,
      flatId: flat101._id,
      hostUserId: userDocs[ROLES.TENANT]._id,
      visitorName: "TCS Express Delivery Rider",
      visitorPhone: "+923001239874",
      vehicleNumber: "KHI-KDL-9902",
      visitorType: VISITOR_TYPES.DELIVERY,
      visitorCount: 1,
      expectedArrivalDate: new Date(),
      entryTimestamp: new Date(),
      verifiedByStaffId: userDocs[ROLES.SECURITY_STAFF]._id,
      status: VISITOR_STATUS.CHECKED_IN,
    });
    await visitor2.save();

    const exp1 = new Expense({
      expenseNumber: "EXP-2026-00001",
      buildingId: building._id,
      title: "Standby Generator Diesel Fuel Refill (450 Litres)",
      vendorName: "Pakistan State Oil (PSO) Defence Commercial Fuel Services",
      category: EXPENSE_CATEGORY.REPAIRS,
      amount: 125000.0,
      expenseDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      createdById: userDocs[ROLES.ACCOUNTANT]._id,
      approvedById: userDocs[ROLES.BUILDING_ADMIN]._id,
      status: EXPENSE_STATUS.APPROVED,
      receiptUrl: "https://example.com/receipts/pso_diesel_exp_001.pdf",
    });
    await exp1.save();

    const exp2 = new Expense({
      expenseNumber: "EXP-2026-00002",
      buildingId: building._id,
      title: "Main 3-Phase HT Sub-Panel Preventive Overhaul & Testing",
      vendorName: "Karachi MEP Engineering & Electrical Works",
      category: EXPENSE_CATEGORY.REPAIRS,
      amount: 38500.0,
      expenseDate: new Date(),
      createdById: userDocs[ROLES.ACCOUNTANT]._id,
      status: EXPENSE_STATUS.PENDING_APPROVAL,
    });
    await exp2.save();

    const doc1 = new Document({
      buildingId: building._id,
      title: "Al-Raziq Heights Master Society Bylaws & Guidelines 2026",
      documentType: DOCUMENT_TYPES.SOCIETY_BYLAW,
      fileUrl: "https://example.com/docs/al-raziq-bylaws-2026.pdf",
      visibility: DOCUMENT_VISIBILITY.PUBLIC_ALL_RESIDENTS,
      uploadedById: userDocs[ROLES.BUILDING_ADMIN]._id,
    });
    await doc1.save();

    const doc2 = new Document({
      buildingId: building._id,
      title: "Annual Financial Statement & Generator Diesel Reserve Audit FY2025-26",
      documentType: DOCUMENT_TYPES.AUDIT_REPORT,
      fileUrl: "https://example.com/docs/al-raziq-audit-2025-26.pdf",
      visibility: DOCUMENT_VISIBILITY.OWNERS_ONLY,
      uploadedById: userDocs[ROLES.ACCOUNTANT]._id,
    });
    await doc2.save();

    const notif1 = new Notification({
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

    const notif2 = new Notification({
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

    // 15. Provision Initial Immutable Audit Logs
    console.log("[15/15] Provisioning Immutable Audit Trail Logs...");
    const audit1 = new AuditLog({
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

    const audit2 = new AuditLog({
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

    console.log("\x1b[32m%s\x1b[0m", "--- ALL 24 MODULES SEEDED WITH AUTHENTIC PAKISTANI DATA SUCCESSFULLY ---");
    console.log("\n=======================================================");
    console.log("PAKISTANI TEST CREDENTIALS (Password for all: Password123!)");
    console.log("=======================================================");
    console.log(`SUPER_ADMIN       : ${superAdminEmail} (password: ${process.env.SUPER_ADMIN_PASSWORD || "umarkhan"})`);
    console.log(`BUILDING_ADMIN    : admin.alraziq@society.local  (Tariq Mahmood)`);
    console.log(`MANAGER           : manager.sarah@society.local   (Sarah Khan)`);
    console.log(`ACCOUNTANT        : accountant.dawood@society.local (Dawood Ahmed)`);
    console.log(`MAINTENANCE_STAFF : tech.kamran@society.local     (Kamran Akram)`);
    console.log(`SECURITY_STAFF    : guard.ahmed@society.local     (Ahmed Raza)`);
    console.log(`OWNER             : owner.fatima@society.local    (Fatima Zahra)`);
    console.log(`TENANT            : tenant.hamza@society.local    (Hamza Tariq)`);
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
