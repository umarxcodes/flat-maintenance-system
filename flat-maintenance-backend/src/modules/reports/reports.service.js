// =====================  IMPORTS  ==========================
import { Invoice } from "../invoices/invoices.model.js";
import { INVOICE_STATUS } from "../invoices/invoices.constants.js";
import { Staff } from "../staff/staff.model.js";
import { MaintenanceRequest } from "../maintenance-requests/maintenance-requests.model.js";
import { MAINTENANCE_REQUEST_STATUS } from "../maintenance-requests/maintenance-requests.constants.js";
import { Complaint } from "../complaints/complaints.model.js";
import {
  COMPLAINT_STATUS,
  COMPLAINT_TYPE,
} from "../complaints/complaints.constants.js";
import { Building } from "../../models/building.model.js";
import {
  calculateCollectionRate,
  calculateResolutionVelocityHours,
  calculateSlaComplianceRate,
  REPORT_SECURITY_EVENTS,
} from "./reports.constants.js";
import { emitReportSecurityEvent } from "./reports.events.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ApiError } from "../../utils/ApiError.js";

// =====================  SERVICE IMPLEMENTATION  ============
class ReportsService {
  /**
   * Asserts building existence and verifies that the caller possesses authorized building scope.
   *
   * @param {string} buildingId - Target building complex ObjectId.
   * @param {Object} actor - Authenticated JWT user principal.
   * @returns {Promise<Object>} Authoritative Building document.
   * @private
   */
  async _assertBuildingScope(buildingId, actor) {
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assigned = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );
      if (!assigned.includes(buildingId.toString())) {
        throw new ApiError(
          403,
          "Access forbidden: You are not authorized for this building",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    const building = await Building.findById(buildingId);
    if (!building || building.isDeleted) {
      throw new ApiError(
        404,
        "Referenced building not found or is no longer active",
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    return building;
  }

  /**
   * Aggregates building-scoped maintenance collection analytics for a specified billing period.
   *
   * Invariants:
   * - Computes collections strictly from authoritative Invoice documents (totalAmount, paidAmount, dueAmount).
   * - Excludes VOID invoices from active receivable calculations.
   * - Eliminates payment double-counting by utilizing the persisted invoice amounts.
   * - Multi-building isolation: Strictly filters by buildingId.
   *
   * @param {Object} params
   * @param {string} params.buildingId - Building complex ObjectId.
   * @param {string} params.period - Target billing period (YYYY-MM).
   * @param {Object} params.actor - Authenticated JWT user principal.
   * @returns {Promise<Object>} Analytical collection report DTO.
   */
  async getMaintenanceCollectionsReport({ buildingId, period, actor }) {
    const allowedRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.BUILDING_ADMIN,
      ROLES.ACCOUNTANT,
    ];
    if (!allowedRoles.includes(actor.role)) {
      throw new ApiError(
        403,
        "Access forbidden: Insufficient administrative privileges for maintenance collections report",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    await this._assertBuildingScope(buildingId, actor);

    // Indexed query on buildingId + billingPeriod
    const invoices = await Invoice.find({
      buildingId,
      billingPeriod: period,
      isDeleted: false,
    }).lean();

    const nonVoidInvoices = invoices.filter(
      (inv) => inv.status !== INVOICE_STATUS.VOID
    );
    const voidInvoicesCount = invoices.length - nonVoidInvoices.length;

    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalLateFees = 0;

    const statusBreakdown = {
      PAID: { count: 0, amount: 0 },
      PARTIALLY_PAID: { count: 0, amount: 0 },
      OVERDUE: { count: 0, amount: 0 },
      ISSUED: { count: 0, amount: 0 },
      DRAFT: { count: 0, amount: 0 },
      VOID: { count: voidInvoicesCount, amount: 0 },
    };

    for (const inv of nonVoidInvoices) {
      const invTotal = inv.totalAmount || 0;
      const invPaid = inv.paidAmount || 0;
      const invDue = inv.dueAmount || 0;
      const invLate = inv.lateFee || 0;

      totalBilled += invTotal;
      totalCollected += invPaid;
      totalOutstanding += invDue;
      totalLateFees += invLate;

      if (statusBreakdown[inv.status]) {
        statusBreakdown[inv.status].count += 1;
        statusBreakdown[inv.status].amount = Number(
          (statusBreakdown[inv.status].amount + invTotal).toFixed(2)
        );
      }
    }

    totalBilled = Number(totalBilled.toFixed(2));
    totalCollected = Number(totalCollected.toFixed(2));
    totalOutstanding = Number(totalOutstanding.toFixed(2));
    totalLateFees = Number(totalLateFees.toFixed(2));

    const collectionRate = calculateCollectionRate(totalCollected, totalBilled);

    // Security Audit Telemetry
    emitReportSecurityEvent(
      REPORT_SECURITY_EVENTS.REPORT_COLLECTIONS_ACCESSED,
      {
        buildingId: buildingId.toString(),
        period,
        actorId: (actor._id || actor.id).toString(),
        totalInvoices: invoices.length,
        collectionRate,
      }
    );

    return {
      buildingId: buildingId.toString(),
      period,
      totalInvoices: invoices.length,
      activeInvoicesCount: nonVoidInvoices.length,
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalLateFees,
      collectionRate,
      statusBreakdown,
    };
  }

  /**
   * Aggregates building-scoped technician resolution velocity, SLA compliance, and reviews.
   *
   * Invariants:
   * - Multi-building isolation: Constrained strictly to technicians belonging to target building.
   * - Eliminates N+1 database queries through single batch-aggregation of maintenance work orders.
   * - Resolution velocity computed from real domain timestamps (completedAt - startedAt/createdAt).
   * - Deterministic tie-breaking sort (averageRating desc, completedCount desc, staffId asc).
   *
   * @param {Object} params
   * @param {string} params.buildingId - Building complex ObjectId.
   * @param {Object} params.actor - Authenticated JWT user principal.
   * @returns {Promise<Object>} Analytical staff performance report DTO.
   */
  async getStaffPerformanceReport({ buildingId, actor }) {
    const allowedRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.BUILDING_ADMIN,
      ROLES.MANAGER,
    ];
    if (!allowedRoles.includes(actor.role)) {
      throw new ApiError(
        403,
        "Access forbidden: Insufficient administrative privileges for staff performance report",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    await this._assertBuildingScope(buildingId, actor);

    // 1. Fetch active operational staff assigned to this building
    const staffMembers = await Staff.find({
      buildingId,
      isDeleted: false,
    })
      .populate("userId", "firstName lastName email")
      .lean();

    if (staffMembers.length === 0) {
      return {
        buildingId: buildingId.toString(),
        totalStaff: 0,
        summary: {
          totalAssignedWorkOrders: 0,
          totalCompletedWorkOrders: 0,
          overallSlaComplianceRate: 0,
          overallAvgResolutionHours: 0,
        },
        technicians: [],
      };
    }

    const staffIds = staffMembers.map((s) => s._id);

    // 2. Batch fetch all work orders assigned to these staff members in target building
    const workOrders = await MaintenanceRequest.find({
      buildingId,
      assignedStaffId: { $in: staffIds },
    }).lean();

    // Group work orders by staff ID
    const workOrdersByStaff = new Map();
    for (const order of workOrders) {
      const sId = order.assignedStaffId.toString();
      if (!workOrdersByStaff.has(sId)) {
        workOrdersByStaff.set(sId, []);
      }
      workOrdersByStaff.get(sId).push(order);
    }

    // 3. Compute metrics per staff member
    const completedStatuses = [
      MAINTENANCE_REQUEST_STATUS.COMPLETED,
      MAINTENANCE_REQUEST_STATUS.VERIFIED,
      MAINTENANCE_REQUEST_STATUS.CLOSED,
    ];

    const technicians = staffMembers.map((staff) => {
      const staffIdStr = staff._id.toString();
      const staffOrders = workOrdersByStaff.get(staffIdStr) || [];

      const totalAssigned = staffOrders.length;
      const completedOrders = staffOrders.filter(
        (order) => completedStatuses.includes(order.status) && order.completedAt
      );
      const totalCompleted = completedOrders.length;

      // Resolution velocity (average hours for completed tasks)
      let totalResolutionHours = 0;
      let onTimeCount = 0;
      let totalWithSla = 0;

      for (const order of completedOrders) {
        const start = order.startedAt || order.createdAt;
        const velocity = calculateResolutionVelocityHours(
          start,
          order.completedAt
        );
        totalResolutionHours += velocity;

        if (order.slaDeadline) {
          totalWithSla += 1;
          if (new Date(order.completedAt) <= new Date(order.slaDeadline)) {
            onTimeCount += 1;
          }
        }
      }

      const averageResolutionHours =
        totalCompleted > 0
          ? Number((totalResolutionHours / totalCompleted).toFixed(2))
          : 0;

      const slaComplianceRate = calculateSlaComplianceRate(
        onTimeCount,
        totalWithSla
      );

      const user = staff.userId || {};
      const staffName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.firstName || "Operational Technician";

      const openOrders = staffOrders.filter(
        (order) => order.status === MAINTENANCE_REQUEST_STATUS.OPEN
      );
      const inProgressOrders = staffOrders.filter(
        (order) => order.status === MAINTENANCE_REQUEST_STATUS.IN_PROGRESS
      );

      return {
        staffId: staffIdStr,
        name: staffName,
        category: staff.category,
        subCategory: staff.subCategory || null,
        designation: staff.designation || null,
        totalAssigned,
        totalCompleted,
        open: openOrders.length,
        inProgress: inProgressOrders.length,
        averageResolutionHours,
        onTimeCompletedCount: onTimeCount,
        slaComplianceRate,
        averageRating: staff.averageRating || 0,
        totalRatingsCount: staff.totalRatingsCount || 0,
      };
    });

    // 4. Deterministic stable sort
    technicians.sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      if (b.totalCompleted !== a.totalCompleted) {
        return b.totalCompleted - a.totalCompleted;
      }
      return a.staffId.localeCompare(b.staffId);
    });

    // 5. Compute building aggregate summary
    let totalAssignedWorkOrders = 0;
    let totalCompletedWorkOrders = 0;
    let totalOnTimeCompleted = 0;
    let totalResolutionHoursSum = 0;

    for (const tech of technicians) {
      totalAssignedWorkOrders += tech.totalAssigned;
      totalCompletedWorkOrders += tech.totalCompleted;
      totalOnTimeCompleted += tech.onTimeCompletedCount;
      totalResolutionHoursSum +=
        tech.averageResolutionHours * tech.totalCompleted;
    }

    const overallSlaComplianceRate = calculateSlaComplianceRate(
      totalOnTimeCompleted,
      totalCompletedWorkOrders
    );
    const overallAvgResolutionHours =
      totalCompletedWorkOrders > 0
        ? Number(
            (totalResolutionHoursSum / totalCompletedWorkOrders).toFixed(2)
          )
        : 0;

    const summary = {
      totalAssignedWorkOrders,
      totalCompletedWorkOrders,
      overallSlaComplianceRate,
      overallAvgResolutionHours,
    };

    // Security Audit Telemetry
    emitReportSecurityEvent(
      REPORT_SECURITY_EVENTS.REPORT_STAFF_PERFORMANCE_ACCESSED,
      {
        buildingId: buildingId.toString(),
        actorId: (actor._id || actor.id).toString(),
        totalStaff: staffMembers.length,
      }
    );

    return {
      buildingId: buildingId.toString(),
      totalStaff: staffMembers.length,
      summary,
      technicians,
    };
  }

  /**
   * Aggregates building-scoped complaint resolution velocity, grievance types, and turnaround metrics.
   *
   * Invariants:
   * - Multi-building isolation: Strictly scoped by buildingId.
   * - Resolution velocity computed from real domain timestamps (resolvedAt - createdAt).
   * - Open complaints aging computed deterministically against provided reference timestamp.
   * - Administrative access only: Restricts building-wide grievance aggregates to managers/admins.
   *
   * @param {Object} params
   * @param {string} params.buildingId - Building complex ObjectId.
   * @param {Object} params.actor - Authenticated JWT user principal.
   * @param {Date} [params.now=new Date()] - Deterministic reference timestamp for aging calculations.
   * @returns {Promise<Object>} Analytical complaint report DTO.
   */
  async getComplaintSlaReport({ buildingId, actor, now = new Date() }) {
    await this._assertBuildingScope(buildingId, actor);

    // Administrative role restriction
    const allowedRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.BUILDING_ADMIN,
      ROLES.MANAGER,
    ];
    if (!allowedRoles.includes(actor.role)) {
      throw new ApiError(
        403,
        "Access forbidden: You do not possess authority to inspect building-wide grievance analytics",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    // Query complaints for target building
    const complaints = await Complaint.find({ buildingId }).lean();

    const totalComplaints = complaints.length;

    const statusBreakdown = {
      [COMPLAINT_STATUS.OPEN]: 0,
      [COMPLAINT_STATUS.UNDER_INVESTIGATION]: 0,
      [COMPLAINT_STATUS.RESOLVED]: 0,
      [COMPLAINT_STATUS.REJECTED]: 0,
    };

    const typeBreakdown = {};
    for (const type of Object.values(COMPLAINT_TYPE)) {
      typeBreakdown[type] = 0;
    }

    let totalResolutionHours = 0;
    let resolvedCount = 0;
    let totalUnresolvedAgeHours = 0;
    let unresolvedCount = 0;

    for (const c of complaints) {
      if (statusBreakdown[c.status] !== undefined) {
        statusBreakdown[c.status] += 1;
      }
      if (typeBreakdown[c.type] !== undefined) {
        typeBreakdown[c.type] += 1;
      }

      if (c.status === COMPLAINT_STATUS.RESOLVED && c.resolvedAt) {
        resolvedCount += 1;
        totalResolutionHours += calculateResolutionVelocityHours(
          c.createdAt,
          c.resolvedAt
        );
      } else if (
        c.status === COMPLAINT_STATUS.OPEN ||
        c.status === COMPLAINT_STATUS.UNDER_INVESTIGATION
      ) {
        unresolvedCount += 1;
        totalUnresolvedAgeHours += calculateResolutionVelocityHours(
          c.createdAt,
          now
        );
      }
    }

    const resolutionRate =
      totalComplaints > 0
        ? Number(((resolvedCount / totalComplaints) * 100).toFixed(2))
        : 0;

    const averageResolutionHours =
      resolvedCount > 0
        ? Number((totalResolutionHours / resolvedCount).toFixed(2))
        : 0;

    const unresolvedAverageAgeHours =
      unresolvedCount > 0
        ? Number((totalUnresolvedAgeHours / unresolvedCount).toFixed(2))
        : 0;

    // Security Audit Telemetry
    emitReportSecurityEvent(
      REPORT_SECURITY_EVENTS.REPORT_COMPLAINT_SLA_ACCESSED,
      {
        buildingId: buildingId.toString(),
        actorId: (actor._id || actor.id).toString(),
        totalComplaints,
        resolutionRate,
      }
    );

    return {
      buildingId: buildingId.toString(),
      totalComplaints,
      resolutionRate,
      averageResolutionHours,
      unresolvedAverageAgeHours,
      statusBreakdown,
      typeBreakdown,
    };
  }
}

// =====================  SINGLETON EXPORT  ==================
export const reportsService = new ReportsService();
export default reportsService;
