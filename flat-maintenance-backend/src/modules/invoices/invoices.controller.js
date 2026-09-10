// =====================  IMPORTS  ==========================
import { invoiceService } from "./invoices.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// =====================  CONTROLLER HANDLERS  ==============
/**
 * Thin HTTP controller for Invoices & Batch Billing Engine.
 * Delegates all domain calculations, cursor batching, and authorization to invoiceService.
 */
export class InvoiceController {
  /**
   * Triggers monthly batch invoice generation run.
   * POST /api/v1/invoices/generate-batch
   */
  async generateBatch(req, res, next) {
    try {
      const result = await invoiceService.generateBatch(req.body, req.user);
      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            result,
            "Monthly batch invoices generated successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves role-filtered list of invoices.
   * GET /api/v1/invoices
   */
  async listInvoices(req, res, next) {
    try {
      const query = req.validated?.query || req.query;
      const result = await invoiceService.listInvoices(query, req.user);
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Invoices retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves single invoice details and line-item breakdown.
   * GET /api/v1/invoices/:id
   */
  async getInvoiceById(req, res, next) {
    try {
      const result = await invoiceService.getInvoiceById(
        req.params.id,
        req.user
      );
      return res
        .status(200)
        .json(
          new ApiResponse(200, result, "Invoice details retrieved successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Voids an erroneous or draft invoice.
   * PATCH /api/v1/invoices/:id/void
   */
  async voidInvoice(req, res, next) {
    try {
      const result = await invoiceService.voidInvoice(req.params.id, req.user);
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Invoice voided successfully"));
    } catch (error) {
      next(error);
    }
  }
}

export const invoiceController = new InvoiceController();
export default invoiceController;
