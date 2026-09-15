// =====================  REPORT DOMAIN MODEL  ==================
/**
 * @typedef {Object} CollectionSummary
 * @property {number} totalBilled
 * @property {number} totalCollected
 * @property {number} totalOutstanding
 * @property {number} collectionRate
 */

/**
 * @typedef {Object} StaffPerformanceSummary
 * @property {number} averageResolutionHours
 * @property {number} completedRequests
 * @property {number} slaComplianceRate
 * @property {number} averageRating
 * @property {number} totalReviews
 */

/**
 * @typedef {Object} ComplaintSlaSummary
 * @property {number} totalComplaints
 * @property {number} resolvedComplaints
 * @property {number} openComplaints
 * @property {number} breachedComplaints
 * @property {number} resolutionRate
 */

export const REPORT_TYPES = Object.freeze({
  COLLECTIONS: "COLLECTIONS",
  STAFF_PERFORMANCE: "STAFF_PERFORMANCE",
  COMPLAINT_SLA: "COMPLAINT_SLA",
  OCCUPANCY: "OCCUPANCY",
});
