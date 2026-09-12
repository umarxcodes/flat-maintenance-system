// =====================  IMPORTS  ==========================
import crypto from "node:crypto";
import mongoose from "mongoose";
import { Payment } from "./payments.model.js";
import { Outbox } from "../outbox/outbox.model.js";
import { Invoice } from "../invoices/invoices.model.js";
import { Owner } from "../../models/owner.model.js";
import { Tenant } from "../../models/tenant.model.js";
import { auditLogService } from "../audit-logs/audit-logs.service.js";
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
} from "../audit-logs/audit-logs.constants.js";
import {
  INVOICE_STATUS,
  PAYABLE_INVOICE_STATUSES,
} from "../invoices/invoices.constants.js";
import { PAYMENT_LIMITS, PAYMENT_OUTBOX_EVENTS } from "./payments.constants.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { TENANTS_CONSTANTS } from "../tenants/tenants.constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.util.js";

// =====================  SERVICE IMPLEMENTATION  ============
class PaymentService {
  // =====================  INTERNAL HELPER METHODS  ===========
  /**
   * Generates a collision-resistant unique payment identifier candidate.
   * Format: PAY-YYYY-XXXXXX (e.g., PAY-2026-849102)
   *
   * @returns {string} Unique paymentNumber string.
   */
  _generatePaymentNumber() {
    const year = new Date().getFullYear();
    const rand = crypto.randomInt(100000, 999999);
    return `PAY-${year}-${rand}`;
  }

  /**
   * Generates a collision-resistant unique tax receipt identifier candidate.
   * Format: REC-YYYY-XXXXXX (e.g., REC-2026-849102)
   *
   * @returns {string} Unique receiptNumber string.
   */
  _generateReceiptNumber() {
    const year = new Date().getFullYear();
    const rand = crypto.randomInt(100000, 999999);
    return `REC-${year}-${rand}`;
  }

  /**
   * Validates actor authorization against invoice building and flat boundaries.
   * Guarantees strict multi-building isolation and resident flat scoping.
   *
   * @param {Object} invoice - Authoritative target invoice.
   * @param {Object} actor - Authenticated caller context.
   * @throws {ApiError} 403 Forbidden if actor lacks permission for target invoice.
   */
  async _verifyInvoicePaymentAccess(invoice, actor) {
    const actorUserId = actor.userId || actor.id || actor._id;
    if (actor.role === ROLES.SUPER_ADMIN) {
      return;
    }

    if (
      actor.role === ROLES.BUILDING_ADMIN ||
      actor.role === ROLES.ACCOUNTANT
    ) {
      const assignedIds = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );
      if (!assignedIds.includes(invoice.buildingId.toString())) {
        throw new ApiError(
          403,
          `Access forbidden: Invoice belongs to complex '${invoice.buildingId}' outside your assigned building scope`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
      return;
    }

    if (actor.role === ROLES.OWNER) {
      const owner = await Owner.findOne({
        userId: actorUserId,
        isDeleted: false,
      });
      if (
        !owner ||
        !owner.flatsOwned.some(
          (flatId) => flatId.toString() === invoice.flatId.toString()
        )
      ) {
        throw new ApiError(
          403,
          "Access forbidden: You do not own the property billed in this invoice",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
      return;
    }

    if (actor.role === ROLES.TENANT) {
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
      return;
    }

    throw new ApiError(
      403,
      `Access forbidden: Role '${actor.role}' is not authorized to create payments`,
      [],
      ERROR_CODES.FORBIDDEN
    );
  }

  // =====================  PAYMENT TRANSACTION EXECUTION  =====
  /**
   * Executes invoice payment settlement within a multi-document ACID transaction session.
   *
   * Financial & Architectural Invariants:
   * - ACID Boundary: Payment insertion, Invoice balance updates, Outbox event generation,
   *   and Forensic audit logging are committed atomically or completely rolled back.
   * - Authoritative Scope Derivation: buildingId, flatId are authoritatively derived
   *   from the locked invoice, and payerUserId from authenticated actor context.
   * - Payable State Machine: Rejects non-payable states (DRAFT, PAID, VOID).
   * - Overpayment Invariant: Strictly rejects payment exceeding outstanding due balance.
   * - Immutability: Creates an append-only ledger entry with unique payment and receipt numbers.
   *
   * @param {Object} paymentData - Validated payment input payload.
   * @param {string} paymentData.invoiceId - Target invoice ObjectId string.
   * @param {number} paymentData.amount - Strictly positive financial settlement amount.
   * @param {string} paymentData.paymentMethod - Validated payment method enum.
   * @param {string} [paymentData.transactionRef] - Optional external gateway/bank transaction reference.
   * @param {string} [paymentData.notes] - Optional settlement remarks.
   * @param {Object} actorContext - Authenticated actor security context.
   * @returns {Promise<Object>} Committed payment and updated invoice representations.
   */
  async executePayment(paymentData, actorContext) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Authoritative Invoice Loading within Transaction Session
      const invoice = await Invoice.findById(paymentData.invoiceId).session(
        session
      );
      if (!invoice || invoice.isDeleted) {
        throw new ApiError(
          404,
          "Target invoice not found or has been voided/deleted",
          [],
          ERROR_CODES.NOT_FOUND
        );
      }

      // 2. Payable State Machine Invariant Check
      if (!PAYABLE_INVOICE_STATUSES.includes(invoice.status)) {
        throw new ApiError(
          400,
          `Invoice status '${invoice.status}' is not payable. Only ISSUED, PARTIALLY_PAID, and OVERDUE invoices can accept payment`,
          [],
          ERROR_CODES.BAD_REQUEST
        );
      }

      // 3. Object-Based Access Control (Anti-IDOR) Verification
      await this._verifyInvoicePaymentAccess(invoice, actorContext);

      // 4. Mathematical Balance & Overpayment Invariant Enforcement
      const currentDue =
        Math.round(
          Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0)) * 100
        ) / 100;

      if (paymentData.amount > currentDue) {
        throw new ApiError(
          400,
          `Payment amount (${paymentData.amount}) exceeds outstanding invoice due balance (${currentDue}). Overpayment is not permitted`,
          [],
          ERROR_CODES.BAD_REQUEST
        );
      }

      // 5. Generate Server-Owned Identifiers
      const paymentNumber = this._generatePaymentNumber();
      const receiptNumber = this._generateReceiptNumber();
      const paymentDate = new Date();

      // 6. Insert Append-Only Immutable Payment Record
      const [createdPayment] = await Payment.create(
        [
          {
            paymentNumber,
            invoiceId: invoice._id,
            buildingId: invoice.buildingId,
            flatId: invoice.flatId,
            payerUserId: actorContext.userId,
            amountPaid: paymentData.amount,
            paymentMethod: paymentData.paymentMethod,
            transactionRef: paymentData.transactionRef || null,
            receiptNumber,
            receiptPdfUrl: null,
            paymentDate,
            notes: paymentData.notes || null,
          },
        ],
        { session }
      );

      // 7. Atomically Update Invoice Balance and Lifecycle Status
      const previousInvoiceState = invoice.toObject
        ? invoice.toObject()
        : { ...invoice };
      const newPaidAmount =
        Math.round((invoice.paidAmount + paymentData.amount) * 100) / 100;
      const newDueAmount = Math.max(
        0,
        Math.round((invoice.totalAmount - newPaidAmount) * 100) / 100
      );

      invoice.paidAmount = newPaidAmount;
      invoice.dueAmount = newDueAmount;

      if (newDueAmount === 0) {
        invoice.status = INVOICE_STATUS.PAID;
        invoice.paidAt = paymentDate;
      } else {
        invoice.status = INVOICE_STATUS.PARTIALLY_PAID;
      }

      await invoice.save({ session });

      // 8. Append Forensic Audit Log Records in Same Session
      await auditLogService.appendAuditLog(
        {
          action: AUDIT_ACTIONS.PAYMENT_RECORDED,
          actorUserId: actorContext.userId,
          actorRole: actorContext.role,
          buildingId: invoice.buildingId,
          resourceType: AUDIT_RESOURCE_TYPES.PAYMENT,
          resourceId: createdPayment._id,
          beforeState: null,
          afterState: createdPayment.toSafeObject(),
          ipAddress: actorContext.ipAddress || null,
          userAgent: actorContext.userAgent || null,
          correlationId: actorContext.correlationId || null,
        },
        { session }
      );

      await auditLogService.appendAuditLog(
        {
          action: AUDIT_ACTIONS.PAYMENT_RECORDED,
          actorUserId: actorContext.userId,
          actorRole: actorContext.role,
          buildingId: invoice.buildingId,
          resourceType: AUDIT_RESOURCE_TYPES.INVOICE,
          resourceId: invoice._id,
          beforeState: {
            status: previousInvoiceState.status,
            paidAmount: previousInvoiceState.paidAmount,
            dueAmount: previousInvoiceState.dueAmount,
            paidAt: previousInvoiceState.paidAt,
          },
          afterState: {
            status: invoice.status,
            paidAmount: invoice.paidAmount,
            dueAmount: invoice.dueAmount,
            paidAt: invoice.paidAt,
          },
          ipAddress: actorContext.ipAddress || null,
          userAgent: actorContext.userAgent || null,
          correlationId: actorContext.correlationId || null,
        },
        { session }
      );

      // 9. Persist Transactional Outbox Event in Same Session
      const eventId = crypto.randomUUID();
      await Outbox.create(
        [
          {
            eventId,
            eventType: PAYMENT_OUTBOX_EVENTS.PAYMENT_RECEIVED,
            payload: {
              paymentId: createdPayment._id.toString(),
              paymentNumber: createdPayment.paymentNumber,
              invoiceId: invoice._id.toString(),
              invoiceNumber: invoice.invoiceNumber,
              buildingId: invoice.buildingId.toString(),
              flatId: invoice.flatId.toString(),
              payerUserId: actorContext.userId.toString(),
              amount: paymentData.amount,
              paymentMethod: paymentData.paymentMethod,
              receiptNumber: createdPayment.receiptNumber,
              paymentDate: createdPayment.paymentDate,
            },
            status: "PENDING",
          },
        ],
        { session }
      );

      // 10. Commit Multi-Document ACID Transaction
      await session.commitTransaction();

      logger.security("PAYMENT_SETTLED_SUCCESSFULLY", {
        paymentNumber: createdPayment.paymentNumber,
        receiptNumber: createdPayment.receiptNumber,
        invoiceId: invoice._id.toString(),
        buildingId: invoice.buildingId.toString(),
        flatId: invoice.flatId.toString(),
        amount: paymentData.amount,
        dueAmount: invoice.dueAmount,
        status: invoice.status,
        payerUserId: actorContext.userId.toString(),
        correlationId: actorContext.correlationId,
      });

      return {
        payment: createdPayment.toSafeObject(),
        invoice: {
          id: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          paidAmount: invoice.paidAmount,
          dueAmount: invoice.dueAmount,
          paidAt: invoice.paidAt,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      if (error.code === 11000) {
        throw new ApiError(
          409,
          "Unique constraint violation: Duplicate payment or receipt number detected. Transaction aborted.",
          [],
          ERROR_CODES.CONFLICT
        );
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // =====================  PAYMENT LEDGER QUERYING  ===========
  /**
   * Queries payment transaction ledger with role-based multi-building isolation.
   *
   * @param {Object} query - Validated query parameters.
   * @param {Object} actor - Authenticated caller context.
   * @returns {Promise<Object>} Paginated payment records.
   */
  async listPayments(query, actor) {
    const filter = {};

    const actorUserId = actor.userId || actor.id || actor._id;

    // 1. Role-Based Resource Scoping (OBAC / Anti-IDOR)
    if (actor.role === ROLES.SUPER_ADMIN) {
      if (query.buildingId) {
        filter.buildingId = query.buildingId;
      }
      if (query.flatId) {
        filter.flatId = query.flatId;
      }
    } else if (
      actor.role === ROLES.BUILDING_ADMIN ||
      actor.role === ROLES.ACCOUNTANT
    ) {
      const assignedIds = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );
      if (query.buildingId) {
        if (!assignedIds.includes(query.buildingId.toString())) {
          throw new ApiError(
            403,
            `Access forbidden: Building '${query.buildingId}' is outside your authorized building scope`,
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = query.buildingId;
      } else {
        filter.buildingId = { $in: assignedIds };
      }
      if (query.flatId) {
        filter.flatId = query.flatId;
      }
    } else if (actor.role === ROLES.OWNER) {
      const owner = await Owner.findOne({
        userId: actorUserId,
        isDeleted: false,
      });
      const flatIds = owner ? owner.flatsOwned : [];
      if (query.flatId) {
        if (
          !flatIds.some((fId) => fId.toString() === query.flatId.toString())
        ) {
          throw new ApiError(
            403,
            "Access forbidden: You do not own the requested flat",
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.flatId = query.flatId;
      } else {
        filter.flatId = { $in: flatIds };
      }
    } else if (actor.role === ROLES.TENANT) {
      const tenant = await Tenant.findOne({
        userId: actorUserId,
        status: TENANTS_CONSTANTS.TENANT_STATUS.ACTIVE,
        isDeleted: false,
      });
      const activeFlatId = tenant ? tenant.flatId : null;
      if (
        query.flatId &&
        query.flatId.toString() !== activeFlatId?.toString()
      ) {
        throw new ApiError(
          403,
          "Access forbidden: You do not occupy the requested flat",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
      filter.flatId = activeFlatId || new mongoose.Types.ObjectId();
    } else {
      throw new ApiError(
        403,
        `Access forbidden: Role '${actor.role}' is not authorized to read payments`,
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    // 2. Query Filters
    if (query.invoiceId) {
      filter.invoiceId = query.invoiceId;
    }
    if (query.paymentMethod) {
      filter.paymentMethod = query.paymentMethod;
    }
    if (query.transactionRef) {
      filter.transactionRef = query.transactionRef;
    }
    if (query.paymentNumber) {
      filter.paymentNumber = query.paymentNumber.toUpperCase();
    }
    if (query.receiptNumber) {
      filter.receiptNumber = query.receiptNumber.toUpperCase();
    }
    if (query.startDate || query.endDate) {
      filter.paymentDate = {};
      if (query.startDate) {
        filter.paymentDate.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.paymentDate.$lte = new Date(query.endDate);
      }
    }

    // 3. Deterministic Pagination & Sorting
    const page = Math.max(
      1,
      parseInt(query.page, 10) || PAYMENT_LIMITS.DEFAULT_PAGE
    );
    const limit = Math.min(
      PAYMENT_LIMITS.MAX_LIMIT,
      Math.max(1, parseInt(query.limit, 10) || PAYMENT_LIMITS.DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    const [payments, totalRecords] = await Promise.all([
      Payment.find(filter)
        .sort({ paymentDate: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    const safePayments = payments.map((p) => ({
      id: p._id.toString(),
      paymentNumber: p.paymentNumber,
      invoiceId: p.invoiceId.toString(),
      buildingId: p.buildingId.toString(),
      flatId: p.flatId.toString(),
      payerUserId: p.payerUserId.toString(),
      amountPaid: p.amountPaid,
      paymentMethod: p.paymentMethod,
      transactionRef: p.transactionRef,
      receiptNumber: p.receiptNumber,
      receiptPdfUrl: p.receiptPdfUrl,
      paymentDate: p.paymentDate,
      notes: p.notes,
      createdAt: p.createdAt,
    }));

    return {
      payments: safePayments,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // =====================  RECEIPT RETRIEVAL  =================
  /**
   * Retrieves official payment tax receipt representation with strict IDOR protection.
   *
   * @param {string} paymentId - Target payment ObjectId.
   * @param {Object} actor - Authenticated caller context.
   * @returns {Promise<Object>} Verified receipt presentation DTO.
   */
  async getPaymentReceipt(paymentId, actor) {
    const payment = await Payment.findById(paymentId).lean();
    if (!payment) {
      throw new ApiError(
        404,
        "Payment record not found",
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    const actorUserId = actor.userId || actor.id || actor._id;

    // Scope verification
    if (actor.role === ROLES.SUPER_ADMIN) {
      // Unrestricted
    } else if (
      actor.role === ROLES.BUILDING_ADMIN ||
      actor.role === ROLES.ACCOUNTANT
    ) {
      const assignedIds = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );
      if (!assignedIds.includes(payment.buildingId.toString())) {
        throw new ApiError(
          403,
          "Access forbidden: Receipt belongs to a complex outside your assigned building scope",
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
          (fId) => fId.toString() === payment.flatId.toString()
        )
      ) {
        throw new ApiError(
          403,
          "Access forbidden: You do not own the property associated with this receipt",
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
      if (!tenant || tenant.flatId.toString() !== payment.flatId.toString()) {
        throw new ApiError(
          403,
          "Access forbidden: You do not occupy the flat associated with this receipt",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    } else {
      throw new ApiError(
        403,
        `Access forbidden: Role '${actor.role}' is not authorized to read payment receipts`,
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    // Load invoice details for presentation
    const invoice = await Invoice.findById(payment.invoiceId)
      .select("invoiceNumber billingPeriod totalAmount dueDate status")
      .lean();

    return {
      receiptNumber: payment.receiptNumber,
      paymentNumber: payment.paymentNumber,
      invoiceId: payment.invoiceId.toString(),
      invoiceNumber: invoice ? invoice.invoiceNumber : null,
      billingPeriod: invoice ? invoice.billingPeriod : null,
      buildingId: payment.buildingId.toString(),
      flatId: payment.flatId.toString(),
      payerUserId: payment.payerUserId.toString(),
      amountPaid: payment.amountPaid,
      paymentMethod: payment.paymentMethod,
      transactionRef: payment.transactionRef,
      paymentDate: payment.paymentDate,
      receiptPdfUrl: payment.receiptPdfUrl || null,
      notes: payment.notes,
      invoiceStatus: invoice ? invoice.status : null,
    };
  }
}

// =====================  SINGLETON EXPORT  ==================
export const paymentService = new PaymentService();
export default paymentService;
