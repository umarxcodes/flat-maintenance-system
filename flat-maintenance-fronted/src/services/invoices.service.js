// =====================  INVOICES SERVICE  =======================
import { invoicesApi } from "../features/invoices/api/invoices.api.js";

/**
 * Service for maintenance fee invoicing and batch generation.
 */
export const invoicesService = {
  getInvoices: (params) => invoicesApi.getInvoices(params),
  getInvoiceById: (id) => invoicesApi.getInvoiceById(id),
  generateBatch: (payload) => invoicesApi.generateBatch(payload),
  voidInvoice: (id, payload) => invoicesApi.voidInvoice(id, payload),
};

export default invoicesService;
