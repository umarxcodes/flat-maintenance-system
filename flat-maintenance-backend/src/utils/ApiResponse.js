// =====================  API RESPONSE  ======================
/**
 * Standardized success response envelope for all HTTP controllers.
 *
 * Adheres strictly to the documented ApiResponse contract:
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": { ... },
 *   "meta": null | { page, limit, totalRecords, totalPages, hasNextPage, hasPrevPage }
 * }
 */
export class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code.
   * @param {any} data - Response payload (object, array, or null).
   * @param {string} [message="Success"] - Informative confirmation message.
   * @param {Object|null} [meta=null] - Optional pagination or cursor metadata.
   */
  constructor(statusCode, data = null, message = "Success", meta = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }
}

// =====================  EXPORTS  ===========================
export default ApiResponse;
