// =====================  IMPORTS  ==========================
import asyncHandler from "express-async-handler";
import { expensesService } from "./expenses.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLERS  =======================
/**
 * Controller: Logs a society operational expense.
 *
 * POST /api/v1/expenses
 */
export const createExpense = asyncHandler(async (req, res) => {
  const input = req.validated?.body || req.body;
  const result = await expensesService.createExpense({
    actor: req.user,
    input,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, result, "Operational expense recorded successfully")
    );
});

/**
 * Controller: Lists society operational expenses with filters and building OBAC.
 *
 * GET /api/v1/expenses
 */
export const listExpenses = asyncHandler(async (req, res) => {
  const query = req.validated?.query || req.query;
  const result = await expensesService.listExpenses({
    actor: req.user,
    query,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        "Operational expenses retrieved successfully"
      )
    );
});

/**
 * Controller: Authorizes an operational expense disbursement.
 *
 * PATCH /api/v1/expenses/:id/approve
 */
export const approveExpense = asyncHandler(async (req, res) => {
  const result = await expensesService.approveExpense({
    actor: req.user,
    id: req.params.id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Operational expense approved successfully")
    );
});
