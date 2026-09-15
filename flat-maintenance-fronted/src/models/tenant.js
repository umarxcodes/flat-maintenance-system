// =====================  TENANT DOMAIN MODEL  ==================
/**
 * @typedef {Object} Tenant
 * @property {string} id
 * @property {string} userId
 * @property {string} flatId
 * @property {string} buildingId
 * @property {string} [ownerId]
 * @property {string} leaseStartDate
 * @property {string} leaseEndDate
 * @property {number} [monthlyRent]
 * @property {number} [securityDeposit]
 * @property {'PENDING'|'VERIFIED'|'REJECTED'} [policeVerificationStatus]
 * @property {'ACTIVE'|'MOVED_OUT'|'TERMINATED'} status
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

export const TENANT_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  MOVED_OUT: "MOVED_OUT",
  TERMINATED: "TERMINATED",
});

export const POLICE_VERIFICATION_STATUS = Object.freeze({
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
});
