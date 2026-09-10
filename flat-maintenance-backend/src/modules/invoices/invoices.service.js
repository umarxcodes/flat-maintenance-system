// =====================  IMPORTS  ==========================
import crypto from "node:crypto";
import { Invoice } from "./invoices.model.js";
import { Building } from "../../models/building.model.js";
import { Flat } from "../../models/flat.model.js";
import { Owner } from "../../models/owner.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { FLAT_STATUS } from "../../models/flat.model.js";
import { TENANTS_CONSTANTS } from "../tenants/tenants.constants.js";
import {
  INVOICE_STATUS,
  INVOICE_LIMITS,
  INVOICES_PAGINATION,
} from "./invoices.constants.js";
import {
  calculateInvoiceAmounts,
  resolveBillingDueDate,
} from "./invoices.calculator.js";
import { validateInvoiceTransition } from "./invoices.state-machine.js";
import { maintenanceConfigurationService } from "../maintenance-configurations/maintenance-configuration.service.js";
import {
  emitInvoiceSecurityEvent,
  INVOICE_SECURITY_EVENTS,
} from "./invoices.events.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";

// =====================  DOMAIN SERVICE  ====================
/**
 * Authoritative Domain Service for Invoices & Batch Billing Engine.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 44 and Section 23.
 */
export class InvoiceService {
  /**
   * Generates a collision-safe, unique invoice number format:
   * INV-YYYY-MM-XXXXX (e.g. INV-2026-09-101-4912)
   *
   * @private
   * @param {string} billingPeriod - YYYY-MM
   * @param {string} flatNumber - Flat number string
   * @returns {string} Unique invoice identifier candidate.
   */
  _generateInvoiceNumber(billingPeriod, flatNumber) {
    const cleanFlat = String(flatNumber).replace(/[^a-zA-Z0-9]/g, "");
    const rand = crypto.randomInt(1000, 9999);
    return `INV-${billingPeriod}-${cleanFlat}-${rand}`;
  }

  /**
   * Generates monthly maintenance invoices for eligible Flats within an authorized building scope.
   *
   * The batch is intentionally cursor-driven rather than loading the entire building into memory.
   * Invoice creation is idempotent on `(flatId, billingPeriod)`, with the database unique
   * constraint serving as the final concurrency guard when multiple workers retry the same period.
   *
   * @param {Object} input - Batch input parameters ({ buildingId, billingPeriod, dueDate, status }).
   * @param {Object} actor - Authenticated JWT actor context.
   * @returns {Promise<Object>} Summary of batch execution metrics.
   */
  async generateBatch(input, actor) {
    const { buildingId, billingPeriod, dueDate, status } = input;
    const actorUserId = actor._id || actor.id;

    // 1. Enforce Building Scope (Anti-IDOR)
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );
      if (!assignedIds.includes(buildingId.toString())) {
        throw new ApiError(
          403,
          `Access forbidden: complex '${buildingId}' is outside your authorized building scope`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 2. Verify Building exists and is active
    const building = await Building.findOne({
      _id: buildingId,
      isDeleted: false,
    });
    if (!building) {
      throw new ApiError(
        404,
        `Building complex '${buildingId}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 3. Resolve active configuration formula for this billing period
    const targetDate = new Date(`${billingPeriod}-01T00:00:00.000Z`);
    const configSnapshot =
      await maintenanceConfigurationService.resolveConfigurationForBilling(
        buildingId,
        targetDate
      );

    // 4. Resolve canonical Due Date
    const resolvedDueDate = resolveBillingDueDate(billingPeriod, dueDate);

    // 5. Cursor-driven processing of eligible (OCCUPIED, non-deleted) flats
    const flatsCursor = Flat.find({
      buildingId,
      status: FLAT_STATUS.OCCUPIED,
      isDeleted: false,
    })
      .lean()
      .cursor({ batchSize: INVOICE_LIMITS.BATCH_STREAM_SIZE });

    let totalEligibleFlats = 0;
    let created = 0;
    let skippedExisting = 0;
    let failed = 0;
    const errors = [];

    for await (const flat of flatsCursor) {
      totalEligibleFlats++;

      // Idempotency pre-check on (flatId, billingPeriod)
      const existingInvoice = await Invoice.findOne({
        flatId: flat._id,
        billingPeriod,
        isDeleted: false,
      })
        .select("_id")
        .lean();

      if (existingInvoice) {
        skippedExisting++;
        continue;
      }

      // Resolve authoritative Owner
      let ownerId = flat.currentOwnerId;
      if (!ownerId) {
        const ownerDoc = await Owner.findOne({
          flatsOwned: flat._id,
          buildingId,
          isDeleted: false,
        })
          .select("_id")
          .lean();
        if (ownerDoc) {
          ownerId = ownerDoc._id;
        }
      }

      if (!ownerId) {
        failed++;
        errors.push({
          flatId: flat._id.toString(),
          flatNumber: flat.flatNumber,
          reason: "No active owner profile registered for flat",
        });
        continue;
      }

      // Resolve active Tenant (Optional)
      let tenantId = flat.currentTenantId;
      if (!tenantId) {
        const tenantDoc = await Tenant.findOne({
          flatId: flat._id,
          status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
          isDeleted: false,
        })
          .select("_id")
          .lean();
        if (tenantDoc) {
          tenantId = tenantDoc._id;
        }
      }

      // Calculate mathematical amounts and line items
      const { lineItems, subTotal, totalAmount, dueAmount } =
        calculateInvoiceAmounts({
          chargeType: configSnapshot.chargeType,
          baseRate: configSnapshot.baseRate,
          areaSqFt: flat.areaSqFt,
          parkingCharge: configSnapshot.parkingCharge,
          waterCharge: configSnapshot.waterCharge,
          sinkingFundCharge: configSnapshot.sinkingFundCharge,
        });

      // Persist with retry loop handling concurrent unique index collisions
      const maxRetries = INVOICE_LIMITS.MAX_RETRY_ATTEMPTS;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const invoiceNumber = this._generateInvoiceNumber(
          billingPeriod,
          flat.flatNumber
        );

        try {
          await Invoice.create({
            invoiceNumber,
            buildingId,
            flatId: flat._id,
            ownerId,
            tenantId: tenantId || null,
            billingPeriod,
            configurationSnapshot: configSnapshot,
            lineItems,
            subTotal,
            totalAmount,
            dueAmount,
            paidAmount: 0,
            lateFee: 0,
            dueDate: resolvedDueDate,
            status: status || INVOICE_STATUS.ISSUED,
          });
          created++;
          break;
        } catch (err) {
          // Check for duplicate key error on (flatId, billingPeriod)
          if (
            err.code === 11000 &&
            err.keyPattern &&
            err.keyPattern.flatId &&
            err.keyPattern.billingPeriod
          ) {
            // Already created concurrently by another batch worker
            skippedExisting++;
            break;
          }

          // Check for invoiceNumber collision -> retry with new random suffix
          if (
            err.code === 11000 &&
            err.keyPattern &&
            err.keyPattern.invoiceNumber
          ) {
            if (attempt === maxRetries - 1) {
              failed++;
              errors.push({
                flatId: flat._id.toString(),
                flatNumber: flat.flatNumber,
                reason: "Exhausted invoiceNumber uniqueness retry attempts",
              });
            }
            continue;
          }

          failed++;
          errors.push({
            flatId: flat._id.toString(),
            flatNumber: flat.flatNumber,
            reason: err.message,
          });
          break;
        }
      }
    }

    // 6. Security Audit Telemetry
    emitInvoiceSecurityEvent(INVOICE_SECURITY_EVENTS.INVOICE_BATCH_GENERATED, {
      buildingId: buildingId.toString(),
      billingPeriod,
      totalEligibleFlats,
      created,
      skippedExisting,
      failed,
      actorId: actorUserId.toString(),
      actorRole: actor.role,
    });

    return {
      buildingId: buildingId.toString(),
      billingPeriod,
      totalEligibleFlats,
      created,
      skippedExisting,
      failed,
      errors,
    };
  }

  /**
   * Retrieves role-filtered list of invoices with pagination.
   *
   * @param {Object} query - Request query parameters.
   * @param {Object} actor - Authenticated JWT user.
   * @returns {Promise<Object>} Paginated invoice list and pagination envelope.
   */
  async listInvoices(query, actor) {
    const { status, buildingId, flatId, billingPeriod } = query;
    const page = Number(query.page) || INVOICES_PAGINATION.DEFAULT_PAGE;
    const limit = Number(query.limit) || INVOICES_PAGINATION.DEFAULT_LIMIT;
    const actorUserId = actor._id || actor.id;
    const filter = { isDeleted: false };

    // 1. Role-Based Resource Scoping (Anti-IDOR)
    if (actor.role === ROLES.TENANT) {
      const tenant = await Tenant.findOne({
        userId: actorUserId,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
        isDeleted: false,
      });
      filter.flatId = tenant ? tenant.flatId : new Flat()._id;
    } else if (actor.role === ROLES.OWNER) {
      const owner = await Owner.findOne({
        userId: actorUserId,
        isDeleted: false,
      });
      filter.flatId = { $in: owner ? owner.flatsOwned : [] };
    } else if (
      actor.role === ROLES.ACCOUNTANT ||
      actor.role === ROLES.BUILDING_ADMIN
    ) {
      const assignedIds = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );
      if (buildingId) {
        if (!assignedIds.includes(buildingId.toString())) {
          throw new ApiError(
            403,
            `Access forbidden: complex '${buildingId}' is outside your authorized building scope`,
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = buildingId;
      } else {
        filter.buildingId = { $in: assignedIds };
      }
    } else if (actor.role === ROLES.SUPER_ADMIN) {
      if (buildingId) {
        filter.buildingId = buildingId;
      }
    }

    // 2. Query Filters
    if (status) {
      filter.status = status;
    }
    if (billingPeriod) {
      filter.billingPeriod = billingPeriod;
    }
    if (
      flatId &&
      (actor.role === ROLES.SUPER_ADMIN ||
        actor.role === ROLES.BUILDING_ADMIN ||
        actor.role === ROLES.ACCOUNTANT)
    ) {
      filter.flatId = flatId;
    }

    // 3. Pagination Execution
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      Invoice.countDocuments(filter),
      Invoice.find(filter)
        .sort({ billingPeriod: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map((invoice) => invoice.toSafeInvoice()),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves single invoice details with line-item breakdown.
   *
   * @param {string} id - Invoice document ID.
   * @param {Object} actor - Authenticated JWT user.
   * @returns {Promise<Object>} Safe invoice presentation DTO.
   */
  async getInvoiceById(id, actor) {
    const invoice = await Invoice.findOne({ _id: id, isDeleted: false });
    if (!invoice) {
      throw new ApiError(
        404,
        `Invoice '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    const actorUserId = actor._id || actor.id;

    // Anti-IDOR Authorization Check
    if (actor.role === ROLES.SUPER_ADMIN) {
      // Global bypass
    } else if (
      actor.role === ROLES.ACCOUNTANT ||
      actor.role === ROLES.BUILDING_ADMIN
    ) {
      const assignedIds = (actor.assignedBuildingIds || []).map((bId) =>
        bId.toString()
      );
      if (!assignedIds.includes(invoice.buildingId.toString())) {
        throw new ApiError(
          403,
          `Access forbidden: Invoice belongs to complex '${invoice.buildingId}' outside your authorized scope`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    } else if (actor.role === ROLES.OWNER) {
      const owner = await Owner.findOne({
        userId: actorUserId,
        isDeleted: false,
      });
      if (
        !owner ||
        !owner.flatsOwned.some(
          (fId) => fId.toString() === invoice.flatId.toString()
        )
      ) {
        throw new ApiError(
          403,
          "Access forbidden: You do not own the property billed in this invoice",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    } else if (actor.role === ROLES.TENANT) {
      const tenant = await Tenant.findOne({
        userId: actorUserId,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
        isDeleted: false,
      });
      if (!tenant || tenant.flatId.toString() !== invoice.flatId.toString()) {
        throw new ApiError(
          403,
          "Access forbidden: You do not have an active lease for the flat billed in this invoice",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    } else {
      throw new ApiError(
        403,
        "Access forbidden: Insufficient permissions to view invoice details",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    return invoice.toSafeInvoice();
  }

  /**
   * Voids an erroneous or draft maintenance invoice.
   *
   * Invariants:
   * - Only invoices in DRAFT status can be voided per Section 70.5 state machine.
   * - Restricts voiding to Accountant / Administrator within authorized building scope.
   *
   * @param {string} id - Invoice document ID.
   * @param {Object} actor - Authenticated JWT user.
   * @returns {Promise<Object>} Updated invoice DTO in VOID status.
   */
  async voidInvoice(id, actor) {
    const invoice = await Invoice.findOne({ _id: id, isDeleted: false });
    if (!invoice) {
      throw new ApiError(
        404,
        `Invoice '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    const actorUserId = actor._id || actor.id;

    // Building Scope Check
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = (actor.assignedBuildingIds || []).map((bId) =>
        bId.toString()
      );
      if (!assignedIds.includes(invoice.buildingId.toString())) {
        throw new ApiError(
          403,
          `Access forbidden: Invoice belongs to building '${invoice.buildingId}' outside your authorized scope`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // State Machine Validation (DRAFT -> VOID)
    validateInvoiceTransition(invoice.status, INVOICE_STATUS.VOID, actor.role);

    // Apply Mutation
    invoice.status = INVOICE_STATUS.VOID;
    await invoice.save();

    // Security Audit Telemetry
    emitInvoiceSecurityEvent(INVOICE_SECURITY_EVENTS.INVOICE_VOIDED, {
      invoiceId: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      buildingId: invoice.buildingId.toString(),
      actorId: actorUserId.toString(),
      actorRole: actor.role,
    });

    return invoice.toSafeInvoice();
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
