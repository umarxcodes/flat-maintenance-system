// =====================  IMPORTS  ==========================
import { Router } from "express";
import { paymentController } from "./payments.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  executePaymentSchema,
  listPaymentsQuerySchema,
  paymentIdParamSchema,
} from "./payments.validation.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

// =====================  ROUTE DEFINITIONS  =================
/**
 * @route   POST /api/v1/payments
 * @desc    Settle invoice within multi-document ACID transaction session
 * @access  Protected (PAYMENT_CREATE)
 */
router.post(
  "/",
  authenticate,
  authorize(PERMISSIONS.PAYMENT_CREATE),
  validate(executePaymentSchema),
  paymentController.createPayment
);

/**
 * @route   GET /api/v1/payments
 * @desc    Query payment transaction ledger and reconciliation history
 * @access  Protected (PAYMENT_READ)
 */
router.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.PAYMENT_READ),
  validate(listPaymentsQuerySchema),
  paymentController.listPayments
);

/**
 * @route   GET /api/v1/payments/:id/receipt
 * @desc    Download official tax receipt
 * @access  Protected (PAYMENT_READ)
 */
router.get(
  "/:id/receipt",
  authenticate,
  authorize(PERMISSIONS.PAYMENT_READ),
  validate(paymentIdParamSchema),
  paymentController.getPaymentReceipt
);

// =====================  EXPORTS  ===========================
export default router;
