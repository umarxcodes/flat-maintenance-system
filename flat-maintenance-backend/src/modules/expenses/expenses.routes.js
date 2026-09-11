// =====================  IMPORTS  ==========================
import { Router } from "express";
import {
  createExpense,
  listExpenses,
  approveExpense,
} from "./expenses.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  createExpenseSchema,
  listExpensesQuerySchema,
  approveExpenseSchema,
} from "./expenses.validation.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

// =====================  EXPENSE ROUTES  ====================
/**
 * @route   POST /api/v1/expenses
 * @desc    Log a society operational expense (vendors, utilities, AMC)
 * @access  Private (ACCOUNTANT, MANAGER, BUILDING_ADMIN, SUPER_ADMIN with EXPENSE_CREATE)
 */
router.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.EXPENSE_CREATE),
  validate(createExpenseSchema),
  createExpense
);

/**
 * @route   GET /api/v1/expenses
 * @desc    List society operational expenses with category, status, and date range filters
 * @access  Private (Authorized financial/management staff with EXPENSE_CREATE or EXPENSE_APPROVE)
 */
router.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.EXPENSE_CREATE, PERMISSIONS.EXPENSE_APPROVE),
  validate(listExpensesQuerySchema),
  listExpenses
);

/**
 * @route   PATCH /api/v1/expenses/:id/approve
 * @desc    Authorize an operational expense payout disbursement
 * @access  Private (BUILDING_ADMIN, ACCOUNTANT, SUPER_ADMIN with EXPENSE_APPROVE)
 */
router.patch(
  "/:id/approve",
  authenticate,
  authorize(PERMISSIONS.EXPENSE_APPROVE),
  validate(approveExpenseSchema),
  approveExpense
);

// =====================  EXPORTS  ===========================
export default router;
