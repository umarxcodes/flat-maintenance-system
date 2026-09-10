// =====================  IMPORTS  ==========================
import { Router } from "express";
import { invoiceController } from "./invoices.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.constant.js";
import {
  generateBatchSchema,
  listInvoicesQuerySchema,
  invoiceIdParamSchema,
} from "./invoices.validation.js";

// =====================  ROUTER SETUP  ======================
const router = Router();

/**
 * @route   POST /api/v1/invoices/generate-batch
 * @desc    Trigger monthly batch invoice run
 * @access  Accountant / Building Admin (INVOICE_GENERATE)
 */
router.post(
  "/generate-batch",
  authenticate,
  authorize(PERMISSIONS.INVOICE_GENERATE),
  validate(generateBatchSchema),
  invoiceController.generateBatch
);

/**
 * @route   GET /api/v1/invoices
 * @desc    List invoices with status, building, flat, and period filters
 * @access  Authed with INVOICE_READ (Accountant, Admin, Owner, Tenant)
 */
router.get(
  "/",
  authenticate,
  authorize(PERMISSIONS.INVOICE_READ),
  validate(listInvoicesQuerySchema),
  invoiceController.listInvoices
);

/**
 * @route   GET /api/v1/invoices/:id
 * @desc    Retrieve invoice details and itemized breakdown
 * @access  Authed with INVOICE_READ (Building Admin/Accountant or Flat Owner/Tenant)
 */
router.get(
  "/:id",
  authenticate,
  authorize(PERMISSIONS.INVOICE_READ),
  validate(invoiceIdParamSchema),
  invoiceController.getInvoiceById
);

/**
 * @route   PATCH /api/v1/invoices/:id/void
 * @desc    Void draft or erroneous invoice
 * @access  Accountant / Building Admin (INVOICE_UPDATE)
 */
router.patch(
  "/:id/void",
  authenticate,
  authorize(PERMISSIONS.INVOICE_UPDATE),
  validate(invoiceIdParamSchema),
  invoiceController.voidInvoice
);

export default router;
