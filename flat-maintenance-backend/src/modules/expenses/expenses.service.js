// =====================  IMPORTS  ==========================
import crypto from "node:crypto";
import { Expense } from "./expenses.model.js";
import { Building } from "../../models/building.model.js";
import { EXPENSE_STATUS, EXPENSE_PAGINATION } from "./expenses.constants.js";
import {
  EXPENSE_SECURITY_EVENTS,
  emitExpenseSecurityEvent,
} from "./expenses.events.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ROLES } from "../../constants/roles.constant.js";

// =====================  EXPENSES SERVICE  ==================
export class ExpensesService {
  /**
   * Generates a globally unique expense number using a concurrency-safe numbering strategy.
   * Format: EXP-YYYY-XXXX (e.g. EXP-2026-0034).
   *
   * A database uniqueness constraint remains the final integrity boundary;
   * callers catch duplicate-key collisions and retry with a randomized candidate.
   *
   * @private
   * @returns {Promise<string>} Candidate unique expense number.
   */
  async _generateExpenseNumber(attempt = 0) {
    const year = new Date().getFullYear();
    if (attempt > 0) {
      const rand = crypto.randomInt(1000, 9999);
      return `EXP-${year}-${rand}`;
    }

    const count = await Expense.countDocuments();
    const seq = String(count + 1).padStart(4, "0");
    let candidate = `EXP-${year}-${seq}`;

    const exists = await Expense.findOne({ expenseNumber: candidate });
    if (exists) {
      const rand = crypto.randomInt(1000, 9999);
      candidate = `EXP-${year}-${rand}`;
    }

    return candidate;
  }

  /**
   * Records a society operational expense within the authenticated actor's
   * authorized building scope.
   *
   * Architectural & Financial Invariants:
   * - Derives createdById directly from the authenticated JWT actor. Client-supplied
   *   creator identities, approver identities, or statuses are strictly prohibited.
   * - Newly logged expenses unconditionally initialize in PENDING_APPROVAL status.
   * - Enforces Building OBAC: non-SuperAdmins can only log expenses for buildings
   *   explicitly in their assignedBuildingIds portfolio.
   * - Concurrency-safe expense number generation retries up to MAX_RETRY_ATTEMPTS
   *   on E11000 duplicate-key collisions.
   * - Emits structured security audit telemetry upon successful persistence.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal context.
   * @param {Object} params.input - Validated expense creation payload.
   * @returns {Promise<Object>} Safe expense presentation DTO.
   */
  async createExpense({ actor, input }) {
    const actorUserId = actor._id || actor.id || actor.sub;

    // 1. Verify Building Existence
    const building = await Building.findOne({
      _id: input.buildingId,
      isDeleted: false,
    });
    if (!building) {
      throw new ApiError(
        404,
        `Building complex with ID '${input.buildingId}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. Enforce Building OBAC Scope
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = (actor.assignedBuildingIds || []).map(String);
      if (!assignedIds.includes(input.buildingId.toString())) {
        throw new ApiError(
          403,
          "Access forbidden: You cannot record operational expenses outside your assigned building complex",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 3. Concurrency-Safe Generation & Insertion with Collision Retry
    let expense;
    const maxRetries = 10;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const expenseNumber = await this._generateExpenseNumber(attempt);

      try {
        expense = await Expense.create({
          expenseNumber,
          buildingId: input.buildingId,
          title: input.title,
          vendorName: input.vendorName,
          category: input.category,
          amount: input.amount,
          receiptUrl: input.receiptUrl || null,
          expenseDate: input.expenseDate,
          createdById: actorUserId,
          approvedById: null,
          status: EXPENSE_STATUS.PENDING_APPROVAL,
        });
        break;
      } catch (err) {
        if (
          err.code === 11000 ||
          (err.message && err.message.includes("E11000"))
        ) {
          if (attempt === maxRetries - 1) {
            throw new ApiError(
              409,
              "Failed to allocate a unique expense number due to concurrency collision. Please retry.",
              [],
              ERROR_CODES.CONFLICT
            );
          }
          await new Promise((resolve) =>
            setTimeout(resolve, 20 + Math.random() * 50)
          );
          continue;
        }
        throw err;
      }
    }

    // 4. Security Audit Telemetry
    emitExpenseSecurityEvent(EXPENSE_SECURITY_EVENTS.EXPENSE_CREATED, {
      expenseId: expense._id.toString(),
      expenseNumber: expense.expenseNumber,
      buildingId: expense.buildingId.toString(),
      actorUserId: actorUserId.toString(),
      actorRole: actor.role,
      amount: expense.amount,
      category: expense.category,
    });

    return expense.toSafeExpense();
  }

  /**
   * Lists financially authorized expense records using explicit category and
   * expense-date filters while preserving building-level OBAC isolation.
   *
   * Architectural & Financial Invariants:
   * - Non-SuperAdmins can only query records across buildings in assignedBuildingIds.
   * - Client-supplied building filters can narrow, but never expand, authorized scope.
   * - Protects financial data by enforcing deterministic chronological sorting
   *   and bounded pagination.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal.
   * @param {Object} params.query - Validated query parameters.
   * @returns {Promise<Object>} Paginated expense records with metadata.
   */
  async listExpenses({ actor, query }) {
    const filter = {};

    // 1. Enforce Building OBAC Scope
    if (actor.role === ROLES.SUPER_ADMIN) {
      if (query.buildingId) {
        filter.buildingId = query.buildingId;
      }
    } else {
      const assignedIds = (actor.assignedBuildingIds || []).map(String);
      if (query.buildingId) {
        if (!assignedIds.includes(query.buildingId.toString())) {
          throw new ApiError(
            403,
            "Access forbidden: You cannot view financial records outside your assigned building complex",
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = query.buildingId;
      } else {
        filter.buildingId = { $in: assignedIds };
      }
    }

    // 2. Optional Attribute Filters
    if (query.category) {
      filter.category = query.category;
    }
    if (query.status) {
      filter.status = query.status;
    }

    // 3. Date Range Filter on expenseDate
    if (query.fromDate || query.toDate) {
      filter.expenseDate = {};
      if (query.fromDate) {
        filter.expenseDate.$gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        filter.expenseDate.$lte = new Date(query.toDate);
      }
    }

    // 4. Bounded Pagination Execution
    const page = Math.max(
      1,
      parseInt(query.page, 10) || EXPENSE_PAGINATION.DEFAULT_PAGE
    );
    const limit = Math.min(
      EXPENSE_PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(query.limit, 10) || EXPENSE_PAGINATION.DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ expenseDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ]);

    return {
      items: expenses.map((e) => ({
        _id: e._id.toString(),
        id: e._id.toString(),
        expenseNumber: e.expenseNumber,
        buildingId: e.buildingId.toString(),
        title: e.title,
        vendorName: e.vendorName,
        category: e.category,
        amount: e.amount,
        receiptUrl: e.receiptUrl || null,
        expenseDate:
          e.expenseDate instanceof Date
            ? e.expenseDate.toISOString()
            : e.expenseDate,
        createdById: e.createdById.toString(),
        approvedById: e.approvedById ? e.approvedById.toString() : null,
        status: e.status,
        createdAt:
          e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
        updatedAt:
          e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Authorizes a pending society expense for a building within the
   * authenticated approver's financial scope.
   *
   * Architectural & Financial Invariants:
   * - Verifies existence (404) and approver building OBAC scope (403).
   * - Conditional State Transition: expense must currently be in PENDING_APPROVAL status.
   *   Attempts to re-approve an already approved or transitioned expense yield 409 Conflict.
   * - Single-document atomic findOneAndUpdate eliminates race windows under concurrent approval requests.
   * - approvedById is derived server-side from the authenticated approver.
   * - Emits structured security audit telemetry upon successful state change.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal context.
   * @param {string} params.id - Expense ObjectId string.
   * @returns {Promise<Object>} Safe approved expense presentation DTO.
   */
  async approveExpense({ actor, id }) {
    const actorUserId = actor._id || actor.id || actor.sub;

    // 1. Verify Expense Existence
    const expense = await Expense.findById(id);
    if (!expense) {
      throw new ApiError(
        404,
        `Expense record with ID '${id}' not found`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. Enforce Building OBAC Scope
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = (actor.assignedBuildingIds || []).map(String);
      if (!assignedIds.includes(expense.buildingId.toString())) {
        throw new ApiError(
          403,
          "Access forbidden: You cannot authorize expenses outside your assigned building complex",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 3. Verify PENDING_APPROVAL Precondition
    if (expense.status !== EXPENSE_STATUS.PENDING_APPROVAL) {
      throw new ApiError(
        409,
        `Expense is not pending approval (current status: '${expense.status}')`,
        [],
        ERROR_CODES.CONFLICT
      );
    }

    // 4. Atomic State Transition
    // The query predicate checks status=PENDING_APPROVAL atomically to guard against concurrent approvers.
    const updated = await Expense.findOneAndUpdate(
      {
        _id: id,
        status: EXPENSE_STATUS.PENDING_APPROVAL,
      },
      {
        $set: {
          status: EXPENSE_STATUS.APPROVED,
          approvedById: actorUserId,
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      throw new ApiError(
        409,
        "Expense approval state conflict: record was modified concurrently",
        [],
        ERROR_CODES.CONFLICT
      );
    }

    // 5. Security Audit Telemetry
    emitExpenseSecurityEvent(EXPENSE_SECURITY_EVENTS.EXPENSE_APPROVED, {
      expenseId: updated._id.toString(),
      expenseNumber: updated.expenseNumber,
      buildingId: updated.buildingId.toString(),
      approvedById: actorUserId.toString(),
      approverRole: actor.role,
      amount: updated.amount,
      category: updated.category,
    });

    return updated.toSafeExpense();
  }
}

// =====================  SINGLETON EXPORT  ==================
export const expensesService = new ExpensesService();
export default expensesService;
