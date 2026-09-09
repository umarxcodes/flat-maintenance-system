/**
 * Standard entity status lifecycle states for user accounts.
 *
 * Invariants:
 * - PENDING: Account provisioned via invitation but not yet activated with a password.
 * - ACTIVE: Lawful operational status; permitted to authenticate and perform operations.
 * - INACTIVE: Account deactivated administratively; authentication prohibited.
 * - SUSPENDED: Account locked/penalized due to disciplinary or security reasons; authentication prohibited.
 */
export const ACCOUNT_STATUS = Object.freeze({
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
});
