import { ROLES } from "../../constants/roles.constant.js";

/**
 * Canonical system persona descriptions.
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 10.
 */
export const ROLE_DESCRIPTIONS = Object.freeze({
  [ROLES.SUPER_ADMIN]:
    "Global platform governance, multi-society provisioning, and cross-society administrative oversight.",
  [ROLES.BUILDING_ADMIN]:
    "Society executive administration, physical hierarchy governance, and staff/resident onboarding within assigned complexes.",
  [ROLES.MANAGER]:
    "Daily facility and operational management, resident complaint triage, work order dispatch, and society announcements.",
  [ROLES.ACCOUNTANT]:
    "Financial governance, billing formula configuration, automated batch invoicing, expense tracking, and payment reconciliation.",
  [ROLES.MAINTENANCE_STAFF]:
    "Operational maintenance technician responsible for executing work orders, updating ticket statuses, and logging repair completion.",
  [ROLES.SECURITY_STAFF]:
    "Gate security personnel managing visitor verification, vehicle entry/exit logging, and access control.",
  [ROLES.OWNER]:
    "Property owner with financial accountability for flat maintenance invoices, online payments, and tenancy leasing.",
  [ROLES.TENANT]:
    "Lawful resident occupying a flat unit with access to bill viewing, digital payments, and maintenance complaint submissions.",
});

/**
 * Deterministic presentation order for system roles.
 * Ranked by organizational authority hierarchy.
 */
export const ROLE_ORDER = Object.freeze([
  ROLES.SUPER_ADMIN,
  ROLES.BUILDING_ADMIN,
  ROLES.MANAGER,
  ROLES.ACCOUNTANT,
  ROLES.MAINTENANCE_STAFF,
  ROLES.SECURITY_STAFF,
  ROLES.OWNER,
  ROLES.TENANT,
]);
