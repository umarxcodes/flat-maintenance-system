// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { MaintenanceConfiguration } from "./maintenance-configuration.model.js";
import { Building } from "../../models/building.model.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { logger } from "../../utils/logger.util.js";
import { MAINTENANCE_CONFIG_CONSTANTS } from "./maintenance-configuration.constants.js";
import { createConfigurationSnapshot } from "./maintenance-configuration.calculator.js";

// =====================  DOMAIN SERVICE  ====================
/**
 * Authoritative Domain Service for Maintenance Billing Configurations.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 42.
 * Governing financial billing rule publication, append-only versioning,
 * active configuration resolution, and anti-IDOR building-scoped security.
 */
export class MaintenanceConfigurationService {
  /**
   * Helper to verify actor's building-scoped authority.
   *
   * @param {string|mongoose.Types.ObjectId} buildingId - Target building.
   * @param {Object} actor - Authenticated JWT user object.
   * @private
   */
  _assertBuildingScope(buildingId, actor) {
    if (actor.role === ROLES.SUPER_ADMIN) {
      return;
    }

    const assignedIds = (actor.assignedBuildingIds || []).map((id) =>
      id.toString()
    );

    if (!assignedIds.includes(buildingId.toString())) {
      throw new ApiError(
        403,
        `Access forbidden: complex '${buildingId}' is outside your authorized building complex scope`,
        [],
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  /**
   * Helper to verify that target building exists and is active.
   *
   * @param {string|mongoose.Types.ObjectId} buildingId - Target building.
   * @returns {Promise<Object>} Building document.
   * @private
   */
  async _assertBuildingExists(buildingId) {
    const building = await Building.findOne({
      _id: buildingId,
      isDeleted: false,
    });

    if (!building) {
      throw new ApiError(
        404,
        `Referenced building complex '${buildingId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    return building;
  }

  /**
   * Publishes a new building-scoped maintenance billing configuration.
   *
   * Architectural & Financial Invariants:
   * - Append-only versioning: Old configurations are never mutated, overwritten, or deleted.
   * - Multi-Document ACID Session: Atomically deactivates older active records if effective immediately.
   * - Building Isolation (OBAC): Non-SuperAdmin actors must have buildingId in assignedBuildingIds.
   * - Security Audit Trail: Emits structured security audit event upon publication.
   *
   * @param {Object} input - Validated configuration payload.
   * @param {Object} actor - Authenticated JWT user object.
   * @returns {Promise<Object>} Sanitized configuration document.
   */
  async publishConfiguration(input, actor) {
    const {
      buildingId,
      chargeType,
      baseRate,
      parkingCharge = MAINTENANCE_CONFIG_CONSTANTS.DEFAULTS.PARKING_CHARGE,
      waterCharge = MAINTENANCE_CONFIG_CONSTANTS.DEFAULTS.WATER_CHARGE,
      sinkingFundCharge = MAINTENANCE_CONFIG_CONSTANTS.DEFAULTS
        .SINKING_FUND_CHARGE,
      lateFeePercentage = MAINTENANCE_CONFIG_CONSTANTS.DEFAULTS
        .LATE_FEE_PERCENTAGE,
      gracePeriodDays = MAINTENANCE_CONFIG_CONSTANTS.DEFAULTS.GRACE_PERIOD_DAYS,
      effectiveFrom,
    } = input;

    // 1. OBAC Building Scope Verification
    this._assertBuildingScope(buildingId, actor);

    // 2. Building Existence Verification
    await this._assertBuildingExists(buildingId);

    const effectiveDate = new Date(effectiveFrom);
    const now = new Date();

    // 3. ACID Transactional Publication Execution
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // If new configuration is effective immediately or in the past,
      // retire older active configurations for this building.
      if (effectiveDate <= now) {
        await MaintenanceConfiguration.updateMany(
          {
            buildingId,
            isActive: true,
            effectiveFrom: { $lte: effectiveDate },
          },
          { $set: { isActive: false } },
          { session }
        );
      }

      // Append new configuration record
      const [newConfig] = await MaintenanceConfiguration.create(
        [
          {
            buildingId,
            chargeType,
            baseRate,
            parkingCharge,
            waterCharge,
            sinkingFundCharge,
            lateFeePercentage,
            gracePeriodDays,
            effectiveFrom: effectiveDate,
            isActive: true,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      // 4. Structured Security Audit Logging
      logger.security("MAINTENANCE_CONFIG_PUBLISHED", {
        configurationId: newConfig._id.toString(),
        buildingId: buildingId.toString(),
        chargeType,
        baseRate,
        effectiveFrom: effectiveDate.toISOString(),
        actorId: actor._id ? actor._id.toString() : actor.sub,
        actorRole: actor.role,
      });

      return newConfig.toSafeConfiguration();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Resolves the active maintenance configuration for a building as of a reference date.
   *
   * Deterministic Resolution Rule:
   * Finds the latest record where buildingId = target, isActive = true, and effectiveFrom <= asOfDate,
   * sorted by effectiveFrom DESC, createdAt DESC.
   *
   * @param {string|mongoose.Types.ObjectId} buildingId - Target building.
   * @param {Date|string} [asOfDate=new Date()] - Reference date for applicability.
   * @param {Object} actor - Authenticated JWT user object.
   * @returns {Promise<Object>} Sanitized active configuration document.
   */
  async getActiveConfiguration(buildingId, asOfDate = new Date(), actor) {
    // 1. OBAC Building Scope Verification
    this._assertBuildingScope(buildingId, actor);

    // 2. Building Existence Verification
    await this._assertBuildingExists(buildingId);

    const targetDate = asOfDate ? new Date(asOfDate) : new Date();

    // 3. Authoritative Active Resolution Query
    const config = await MaintenanceConfiguration.findOne({
      buildingId,
      isActive: true,
      effectiveFrom: { $lte: targetDate },
    }).sort({ effectiveFrom: -1, createdAt: -1 });

    if (!config) {
      throw new ApiError(
        404,
        `No active maintenance billing configuration found for building complex '${buildingId}' as of ${targetDate.toISOString()}`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    return config.toSafeConfiguration();
  }

  /**
   * Retrieves complete historical maintenance rate configurations for audit and reconciliation.
   *
   * Historical configurations are immutable and returned in deterministic chronological order.
   *
   * @param {string|mongoose.Types.ObjectId} buildingId - Target building.
   * @param {Object} query - Pagination query parameters.
   * @param {Object} actor - Authenticated JWT user object.
   * @returns {Promise<Object>} Paginated configuration items and metadata.
   */
  async getConfigurationHistory(buildingId, query = {}, actor) {
    // 1. OBAC Building Scope Verification
    this._assertBuildingScope(buildingId, actor);

    // 2. Building Existence Verification
    await this._assertBuildingExists(buildingId);

    const page =
      Number(query.page) ||
      MAINTENANCE_CONFIG_CONSTANTS.PAGINATION.DEFAULT_PAGE;
    const limit =
      Number(query.limit) ||
      MAINTENANCE_CONFIG_CONSTANTS.PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const filter = { buildingId };

    const [total, items] = await Promise.all([
      MaintenanceConfiguration.countDocuments(filter),
      MaintenanceConfiguration.find(filter)
        .sort({ effectiveFrom: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map((c) => c.toSafeConfiguration()),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Shared Domain Method for Downstream Invoice Engine (Module 14).
   *
   * Authoritatively resolves the applicable configuration snapshot for batch billing.
   *
   * @param {string|mongoose.Types.ObjectId} buildingId - Building complex ID.
   * @param {Date|string} billingDate - Billing period effective date.
   * @returns {Promise<Object>} Immutable configuration snapshot.
   */
  async resolveConfigurationForBilling(buildingId, billingDate = new Date()) {
    const targetDate = new Date(billingDate);

    const config = await MaintenanceConfiguration.findOne({
      buildingId,
      isActive: true,
      effectiveFrom: { $lte: targetDate },
    }).sort({ effectiveFrom: -1, createdAt: -1 });

    if (!config) {
      throw new ApiError(
        404,
        `Billing configuration resolution failed: No active formula found for building '${buildingId}' at date ${targetDate.toISOString()}`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    return createConfigurationSnapshot(config);
  }
}

export const maintenanceConfigurationService =
  new MaintenanceConfigurationService();

export default maintenanceConfigurationService;
