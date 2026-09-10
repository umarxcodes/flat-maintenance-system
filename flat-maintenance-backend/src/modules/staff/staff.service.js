// =====================  IMPORTS  ==========================
import mongoose from "mongoose";
import { Staff } from "./staff.model.js";
import { User } from "../../models/user.model.js";
import { Building } from "../../models/building.model.js";
import { Role } from "../../models/role.model.js";
import { STAFF_CONSTANTS } from "./staff.constants.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { logger } from "../../utils/logger.util.js";

// =====================  STAFF DOMAIN SERVICE  ==============
/**
 * Authoritative Staff Domain Service.
 *
 * Sourced directly from BACKEND_TECHNICAL_DOCUMENTATION.md Section 41 (Module 11: Staff).
 * Governs staff lifecycle, trade categorization, building assignment, OBAC building scope,
 * operational role synchronization, and performance card telemetry.
 */
export class StaffService {
  /**
   * Onboards a new staff personnel and assigns trade category.
   *
   * Security & Architectural Invariants:
   * - OBAC Building Scope: Non-SuperAdmins can only onboard staff in their assigned buildings.
   * - 1:1 Staff Profile: Each user can have at most one staff profile (unique userId).
   * - User Role Eligibility: Privileged admin roles and resident roles cannot be assigned as staff.
   * - Category-Role Consistency: Enforces SECURITY_STAFF for SECURITY, MAINTENANCE_STAFF for MAINTENANCE/CLEANING.
   * - Server-Controlled Aggregates: averageRating and totalRatingsCount are initialized to 0.0 and 0.
   * - User Building Sync: Appends buildingId to user.assignedBuildingIds.
   *
   * @param {Object} input - Validated staff payload.
   * @param {Object} actor - Authenticated JWT user object.
   * @returns {Promise<Object>} Sanitized staff document.
   */
  async createStaff(input, actor) {
    const {
      userId,
      buildingId,
      category,
      subCategory,
      designation,
      assignedShift,
    } = input;

    // 1. OBAC Building Scope Validation (Non-SuperAdmin)
    if (actor.role !== ROLES.SUPER_ADMIN) {
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

    // 2. Target Building Existence and Active State Verification
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

    // 3. Target User Existence and Active State Verification
    const user = await User.findOne({
      _id: userId,
      isDeleted: false,
    });

    if (!user) {
      throw new ApiError(
        404,
        `Referenced user '${userId}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    if (
      user.status === ACCOUNT_STATUS.SUSPENDED ||
      user.status === ACCOUNT_STATUS.DEACTIVATED
    ) {
      throw new ApiError(
        403,
        `Cannot onboard staff profile for ${user.status.toLowerCase()} user account '${userId}'`,
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    // 4. User Role Eligibility Guards
    // Reject privileged administrative roles
    const privilegedAdminRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.BUILDING_ADMIN,
      ROLES.MANAGER,
      ROLES.ACCOUNTANT,
    ];

    if (privilegedAdminRoles.includes(user.role)) {
      throw new ApiError(
        400,
        `Cannot onboard user with privileged administrative role '${user.role}' as operational staff profile`,
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    // Reject resident roles
    if (user.role === ROLES.OWNER || user.role === ROLES.TENANT) {
      throw new ApiError(
        400,
        `Incompatible user role: user with resident role '${user.role}' cannot be onboarded as on-site staff. Please provision a dedicated staff user account.`,
        [],
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 5. Category-to-Role Consistency Enforcement
    const targetRole = STAFF_CONSTANTS.CATEGORY_ROLE_MAP[category];
    if (targetRole && user.role !== targetRole) {
      // Synchronize User role with operational specialization
      const roleDoc = await Role.findOne({ name: targetRole });
      await User.updateOne(
        { _id: userId },
        {
          role: targetRole,
          roleId: roleDoc ? roleDoc._id : user.roleId,
        }
      );
    }

    // 6. 1:1 Staff Profile Uniqueness Guard
    const existingStaff = await Staff.findOne({
      userId,
      isDeleted: false,
    });

    if (existingStaff) {
      throw new ApiError(
        409,
        `An active staff profile already exists for user '${userId}'`,
        [],
        ERROR_CODES.CONFLICT
      );
    }

    // 7. Safe Document Construction (Mass-assignment protection)
    let createdStaff;
    try {
      createdStaff = await Staff.create({
        userId,
        buildingId,
        category,
        subCategory: subCategory || null,
        designation: designation ? designation.trim() : null,
        assignedShift: assignedShift || STAFF_CONSTANTS.SHIFTS.MORNING,
        averageRating: STAFF_CONSTANTS.RATINGS.DEFAULT_AVERAGE,
        totalRatingsCount: STAFF_CONSTANTS.RATINGS.DEFAULT_COUNT,
        status: STAFF_CONSTANTS.STATUS.ACTIVE,
        isDeleted: false,
      });
    } catch (err) {
      if (err.code === 11000) {
        throw new ApiError(
          409,
          "Conflict: an active staff profile already exists for this user",
          [],
          ERROR_CODES.CONFLICT
        );
      }
      throw err;
    }

    // 8. Synchronize User's assignedBuildingIds
    await User.updateOne(
      { _id: userId },
      { $addToSet: { assignedBuildingIds: buildingId } }
    );

    // 9. Security Audit Logging
    logger.security("STAFF_ONBOARDED", {
      staffId: createdStaff._id,
      userId,
      buildingId,
      category,
      subCategory: subCategory || null,
      actorId: actor.id || actor._id,
    });

    // 10. Populate safe fields and return
    const populated = await Staff.findById(createdStaff._id)
      .populate(
        "userId",
        "firstName lastName email phone avatarUrl status role"
      )
      .populate("buildingId", "name code address");

    return populated.toSafeStaff();
  }

  /**
   * Retrieves a paginated list of staff personnel with building scope and filters.
   *
   * @param {Object} query - Validated query parameters.
   * @param {Object} actor - Authenticated JWT user object.
   * @returns {Promise<Object>} Paginated staff records and telemetry.
   */
  async listStaff(query, actor) {
    const {
      page = STAFF_CONSTANTS.PAGINATION.DEFAULT_PAGE,
      limit = STAFF_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
      buildingId,
      category,
      subCategory,
      assignedShift,
      status,
      availability,
      search,
    } = query;

    const filter = { isDeleted: false };

    // 1. Multi-Tenant OBAC Scope Resolution
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const assignedIds = (actor.assignedBuildingIds || []).map((id) =>
        id.toString()
      );

      if (assignedIds.length === 0) {
        return {
          staff: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }

      if (buildingId) {
        if (!assignedIds.includes(buildingId.toString())) {
          throw new ApiError(
            403,
            `Access forbidden: building complex '${buildingId}' is outside your authorized scope`,
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.buildingId = buildingId;
      } else {
        filter.buildingId = { $in: actor.assignedBuildingIds };
      }
    } else if (buildingId) {
      filter.buildingId = buildingId;
    }

    // 2. Field Filters
    if (category) {
      filter.category = category;
    }

    if (subCategory) {
      filter.subCategory = subCategory;
    }

    if (assignedShift) {
      filter.assignedShift = assignedShift;
    }

    // 3. Status and Availability Resolution
    if (status) {
      filter.status = status;
    } else if (availability) {
      const upperAvail = availability.toUpperCase();
      if (upperAvail === "AVAILABLE" || upperAvail === "ACTIVE") {
        filter.status = STAFF_CONSTANTS.STATUS.ACTIVE;
      } else if (Object.values(STAFF_CONSTANTS.STATUS).includes(upperAvail)) {
        filter.status = upperAvail;
      }
    }

    // 4. Designation Search
    if (search) {
      filter.designation = { $regex: search, $options: "i" };
    }

    // 5. Pagination Calculation
    const skip = (page - 1) * limit;
    const [records, total] = await Promise.all([
      Staff.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(
          "userId",
          "firstName lastName email phone avatarUrl status role"
        )
        .populate("buildingId", "name code address")
        .exec(),
      Staff.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      staff: records.map((r) => r.toSafeStaff()),
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
   * Retrieves a staff profile, performance card, and rating history.
   *
   * @param {string} id - Staff ObjectId.
   * @param {Object} actor - Authenticated JWT user object.
   * @returns {Promise<Object>} Staff profile and performance card telemetry.
   */
  async getStaffById(id, actor) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(
        400,
        `Invalid staff ObjectId format: '${id}'`,
        [],
        ERROR_CODES.INVALID_ID
      );
    }

    const staff = await Staff.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate(
        "userId",
        "firstName lastName email phone avatarUrl status role"
      )
      .populate("buildingId", "name code address");

    if (!staff) {
      throw new ApiError(
        404,
        `Staff profile '${id}' not found or has been deleted`,
        [],
        ERROR_CODES.NOT_FOUND
      );
    }

    // IDOR Building Scope Check
    const isSelf =
      actor.id && staff.userId && staff.userId._id
        ? actor.id === staff.userId._id.toString()
        : false;

    if (actor.role !== ROLES.SUPER_ADMIN && !isSelf) {
      const assignedIds = (actor.assignedBuildingIds || []).map((bId) =>
        bId.toString()
      );

      const staffBuildingId = staff.buildingId._id
        ? staff.buildingId._id.toString()
        : staff.buildingId.toString();

      if (!assignedIds.includes(staffBuildingId)) {
        throw new ApiError(
          403,
          `Access forbidden: staff profile '${id}' belongs to building complex '${staffBuildingId}' outside your authorized scope`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    const safeStaff = staff.toSafeStaff();

    // Attach Performance Card & Rating History DTO
    // Note: Rating History is populated via Module 17 (Reviews).
    safeStaff.performanceCard = {
      averageRating: staff.averageRating,
      totalRatingsCount: staff.totalRatingsCount,
      ratingHistory: [],
    };

    return safeStaff;
  }
}

// =====================  EXPORTS  ===========================
export const staffService = new StaffService();
export default staffService;
