// =====================  IMPORTS  ==========================
import { paymentService } from "./payments.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLER IMPLEMENTATION  =========
/**
 * Controller adapter for Module 15: Payments & ACID Financial Transactions.
 *
 * Strictly acts as an HTTP transport adapter:
 * - Extracts validated request input and authenticated actor context.
 * - Delegates all business rules, ACID transaction execution, and scoping to paymentService.
 * - Formats responses using standard ApiResponse envelopes.
 */
class PaymentController {
  /**
   * Settle invoice within multi-document ACID transaction session.
   * POST /api/v1/payments
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async createPayment(req, res, next) {
    try {
      const actorContext = {
        userId: req.user.id || req.user._id,
        role: req.user.role,
        assignedBuildingIds: req.user.assignedBuildingIds || [],
        ipAddress: req.ip || null,
        userAgent: req.headers["user-agent"] || null,
        correlationId:
          req.headers["x-correlation-id"] || req.correlationId || null,
      };

      const result = await paymentService.executePayment(
        req.body,
        actorContext
      );

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            result,
            "Invoice payment executed and settled successfully within ACID session"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Query payment transaction ledger and reconciliation history.
   * GET /api/v1/payments
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async listPayments(req, res, next) {
    try {
      const query = req.validated?.query || req.query;
      const result = await paymentService.listPayments(query, req.user);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Payment transaction ledger retrieved successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download or inspect official tax receipt.
   * GET /api/v1/payments/:id/receipt
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async getPaymentReceipt(req, res, next) {
    try {
      const { id } = req.params;
      const result = await paymentService.getPaymentReceipt(id, req.user);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Official tax receipt retrieved successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }
}

// =====================  SINGLETON EXPORT  ==================
export const paymentController = new PaymentController();
export default paymentController;
