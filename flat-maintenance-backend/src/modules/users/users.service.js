import { User } from "../../models/user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ERROR_CODES } from "../../constants/error-codes.constant.js";
import { ROLES } from "../../constants/roles.constant.js";
import { ACCOUNT_STATUS } from "../../constants/status.constant.js";
import {
  canAssignRole,
  ROLE_HIERARCHY_LEVEL,
} from "../../constants/permissions.constant.js";
import { AUTH_CONSTANTS } from "../auth/auth.constants.js";
import { USERS_CONSTANTS } from "./users.constants.js";
import { hashToken, generateCryptoToken } from "../../utils/crypto.util.js";
import { USER_SECURITY_EVENTS, emitUserSecurityEvent } from "./users.events.js";

/**
 * Principal Users Domain Service.
 *
 * Enforces all user lifecycle and identity invariants:
 * - Anti-privilege escalation on invitation and status mutations.
 * - OBAC building-scope isolation across directory queries and detail retrieval.
 * - Single-use cryptographic invitation tokens (SHA-256 hashed at rest, 72h expiry).
 * - Safe directory filtering, deterministic pagination, and soft-delete protection.
 * - Automatic session revocation upon account suspension.
 * - Self-profile management with strict mass-assignment prevention.
 */
class UsersService {
  /**
   * Provisions a pending user account via cryptographic invitation token (FR-AUTH-04).
   *
   * Security Boundaries:
   * - Validates that the inviter possesses authority to grant the target role.
   * - Enforces that Building Admins cannot assign buildings outside their authorized scope.
   * - Generates high-entropy 32-byte (64 hex char) random invitation token.
   * - Stores ONLY the SHA-256 digest in MongoDB; never plaintext.
   * - Transitions user to PENDING status with 72-hour expiration.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal (req.user).
   * @param {Object} params.input - Validated invitation payload.
   * @param {Object} [context={}] - Request telemetry.
   * @returns {Promise<{ user: Object, testOnlyInvitationToken?: string }>}
   */
  async inviteUser({ actor, input }, context = {}) {
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      assignedBuildingIds = [],
    } = input;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Anti-Privilege Escalation Check (FR-AUTH-04 / Security Invariant)
    if (!canAssignRole(actor.role, role)) {
      throw new ApiError(
        403,
        `Privilege escalation rejected: role '${actor.role}' cannot grant equal or higher role '${role}'`,
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    // 2. OBAC Building Scope Check for non-SuperAdmins
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const actorBuildings = new Set(actor.assignedBuildingIds || []);

      // If assigning building IDs, every ID must be within the actor's scope
      for (const bId of assignedBuildingIds) {
        if (!actorBuildings.has(bId)) {
          throw new ApiError(
            403,
            `Unauthorized building assignment: complex '${bId}' is outside your authorized scope`,
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
      }
    }

    // 3. Email Uniqueness among non-deleted accounts
    const existingUser = await User.findOne({
      email: normalizedEmail,
      isDeleted: false,
    });

    const rawInvitationToken = generateCryptoToken(32);
    const invitationTokenHash = hashToken(rawInvitationToken);
    const invitationExpiresAt = new Date(
      Date.now() + AUTH_CONSTANTS.INVITATION_EXPIRY_MS
    );

    let targetUser;

    if (existingUser) {
      // If user is already ACTIVE, duplicate creation is rejected
      if (existingUser.status === ACCOUNT_STATUS.ACTIVE) {
        throw new ApiError(
          409,
          "An active account with this email address already exists",
          [],
          ERROR_CODES.CONFLICT
        );
      }

      // If existing user is PENDING, refresh/reissue the invitation token
      if (existingUser.status === ACCOUNT_STATUS.PENDING) {
        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        existingUser.phone = phone;
        existingUser.role = role;
        existingUser.assignedBuildingIds = assignedBuildingIds;
        existingUser.invitationTokenHash = invitationTokenHash;
        existingUser.invitationExpiresAt = invitationExpiresAt;
        await existingUser.save();
        targetUser = existingUser;
      } else {
        throw new ApiError(
          409,
          `An account with this email exists in ${existingUser.status} state`,
          [],
          ERROR_CODES.CONFLICT
        );
      }
    } else {
      // Create new pending user
      targetUser = new User({
        firstName,
        lastName,
        email: normalizedEmail,
        phone,
        role,
        assignedBuildingIds,
        status: ACCOUNT_STATUS.PENDING,
        invitationTokenHash,
        invitationExpiresAt,
      });
      await targetUser.save();
    }

    emitUserSecurityEvent(USER_SECURITY_EVENTS.USER_INVITED, {
      actorId: actor.id,
      userId: targetUser._id.toString(),
      email: normalizedEmail,
      role,
      assignedBuildingIds,
      ...context,
    });

    const isTestEnv =
      process.env.NODE_ENV === "test" ||
      process.env.npm_lifecycle_event?.includes("test") ||
      process.argv.some((arg) => arg.includes("test"));

    return {
      user: targetUser.toSafeUser(),
      ...(isTestEnv ? { testOnlyInvitationToken: rawInvitationToken } : {}),
    };
  }

  /**
   * Retrieves a paginated directory of users filtered by role, building, and status.
   *
   * Security Boundaries:
   * - Applies OBAC building-scope filtering automatically based on actor identity.
   * - Excludes soft-deleted identities (isDeleted: false).
   * - Prohibits exposure of sensitive credentials, hashes, and session arrays.
   * - Prevents scope escalation from client query parameters.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal.
   * @param {Object} params.query - Validated query parameters.
   * @returns {Promise<{ users: Array<Object>, meta: Object }>}
   */
  async listUsers({ actor, query }) {
    const page = Number(query.page) || USERS_CONSTANTS.DEFAULT_PAGE;
    const limit = Number(query.limit) || USERS_CONSTANTS.DEFAULT_LIMIT;
    const { role, status, buildingId, search } = query;

    // Prohibit resident roles from viewing global directory
    if (actor.role === ROLES.OWNER || actor.role === ROLES.TENANT) {
      throw new ApiError(
        403,
        "Access denied: directory browsing is restricted to administrative personnel",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    const filter = { isDeleted: false };

    // 1. OBAC Building Scope Intersection
    if (actor.role === ROLES.SUPER_ADMIN) {
      // SuperAdmin has global visibility; optional building filter narrows query
      if (buildingId) {
        filter.assignedBuildingIds = buildingId;
      }
    } else {
      // Scoped administrative roles (BuildingAdmin, Manager, Accountant)
      const actorBuildings = actor.assignedBuildingIds || [];

      if (actorBuildings.length === 0) {
        return {
          users: [],
          meta: {
            page,
            limit,
            totalRecords: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }

      if (buildingId) {
        // Intersect requested building with authorized scope
        if (!actorBuildings.includes(buildingId)) {
          throw new ApiError(
            403,
            "Cannot filter users by a building complex outside your authorized scope",
            [],
            ERROR_CODES.FORBIDDEN
          );
        }
        filter.assignedBuildingIds = buildingId;
      } else {
        filter.assignedBuildingIds = { $in: actorBuildings };
      }

      // Role-specific scope constraints per Section 14 Role-Permission matrix
      if (actor.role === ROLES.MANAGER) {
        filter.role = {
          $in: [
            ROLES.MAINTENANCE_STAFF,
            ROLES.SECURITY_STAFF,
            ROLES.OWNER,
            ROLES.TENANT,
          ],
        };
      } else if (actor.role === ROLES.ACCOUNTANT) {
        filter.role = {
          $in: [ROLES.OWNER, ROLES.TENANT],
        };
      }
    }

    // 2. Optional Field Filters
    if (role) {
      // If a role filter was already applied by scope constraint, ensure intersection
      if (filter.role && filter.role.$in) {
        if (!filter.role.$in.includes(role)) {
          return {
            users: [],
            meta: {
              page,
              limit,
              totalRecords: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          };
        }
      }
      filter.role = role;
    }

    if (status) {
      filter.status = status;
    }

    // 3. Search Filter (across name and email)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    // 4. Paginated Database Execution
    const skip = (page - 1) * limit;
    const [totalRecords, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      users: users.map((u) => u.toSafeUser()),
      meta: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves single user details with OBAC building-scope authorization.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal.
   * @param {string} params.id - Target user ObjectId.
   * @returns {Promise<Object>} Sanitized user record.
   */
  async getUserById({ actor, id }) {
    const user = await User.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!user) {
      throw new ApiError(404, "User not found", [], ERROR_CODES.NOT_FOUND);
    }

    // SuperAdmin and Self can always access
    if (actor.role === ROLES.SUPER_ADMIN || actor.id === id) {
      return user.toSafeUser();
    }

    // BuildingAdmin, Manager, Accountant scope check: must share at least one building
    if (
      actor.role === ROLES.BUILDING_ADMIN ||
      actor.role === ROLES.MANAGER ||
      actor.role === ROLES.ACCOUNTANT
    ) {
      const actorBuildings = new Set(actor.assignedBuildingIds || []);
      const userBuildings = user.assignedBuildingIds || [];

      const hasScopeOverlap = userBuildings.some((b) =>
        actorBuildings.has(b.toString())
      );

      if (!hasScopeOverlap) {
        throw new ApiError(
          403,
          "Access denied: user is outside your authorized building scope",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }

      return user.toSafeUser();
    }

    // Owner / Tenant cannot view profiles of other users
    throw new ApiError(
      403,
      "Access denied: insufficient permissions to view this user",
      [],
      ERROR_CODES.FORBIDDEN
    );
  }

  /**
   * Transitions an account status with session revocation on suspension.
   *
   * Security Boundaries:
   * - Prohibits self-status modification (anti-self-elevation).
   * - Prohibits modifying accounts outside authorized building scope.
   * - Prohibits modifying equal or higher authority principals.
   * - Revokes active JWT refresh sessions upon suspension.
   *
   * @param {Object} params
   * @param {Object} params.actor - Authenticated principal.
   * @param {string} params.id - Target user ObjectId.
   * @param {string} params.status - Target status (ACTIVE, SUSPENDED, INACTIVE).
   * @param {Object} [context={}] - Request telemetry.
   * @returns {Promise<Object>} Updated safe user.
   */
  async updateUserStatus({ actor, id, status }, context = {}) {
    // 1. Prohibit self-status mutation
    if (actor.id === id) {
      throw new ApiError(
        403,
        "Self status modification is prohibited",
        [],
        ERROR_CODES.FORBIDDEN
      );
    }

    const targetUser = await User.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!targetUser) {
      throw new ApiError(404, "User not found", [], ERROR_CODES.NOT_FOUND);
    }

    // 2. Anti-Peer Tampering & Authority Check for non-SuperAdmins
    if (actor.role !== ROLES.SUPER_ADMIN) {
      const actorLevel = ROLE_HIERARCHY_LEVEL[actor.role];
      const targetLevel = ROLE_HIERARCHY_LEVEL[targetUser.role];

      if (actorLevel >= targetLevel) {
        throw new ApiError(
          403,
          `Cannot modify account status of user with equal or higher role '${targetUser.role}'`,
          [],
          ERROR_CODES.FORBIDDEN
        );
      }

      // Building scope verification
      const actorBuildings = new Set(actor.assignedBuildingIds || []);
      const userBuildings = targetUser.assignedBuildingIds || [];

      const hasScopeOverlap = userBuildings.some((b) =>
        actorBuildings.has(b.toString())
      );

      if (!hasScopeOverlap) {
        throw new ApiError(
          403,
          "Cannot modify account status of user outside your authorized building scope",
          [],
          ERROR_CODES.FORBIDDEN
        );
      }
    }

    // 3. Invariant: Status change to SUSPENDED or INACTIVE terminates active sessions
    if (
      status === ACCOUNT_STATUS.SUSPENDED ||
      status === ACCOUNT_STATUS.INACTIVE
    ) {
      targetUser.refreshTokens.forEach((token) => {
        token.isUsed = true;
      });
    }

    targetUser.status = status;
    await targetUser.save();

    emitUserSecurityEvent(USER_SECURITY_EVENTS.USER_STATUS_UPDATED, {
      actorId: actor.id,
      targetUserId: targetUser._id.toString(),
      newStatus: status,
      ...context,
    });

    return targetUser.toSafeUser();
  }

  /**
   * Retrieves self profile for the currently authenticated principal.
   *
   * @param {string} userId - Authenticated user ObjectId.
   * @returns {Promise<Object>} Sanitized user identity.
   */
  async getProfile(userId) {
    const user = await User.findOne({
      _id: userId,
      isDeleted: false,
    });

    if (!user) {
      throw new ApiError(404, "Profile not found", [], ERROR_CODES.NOT_FOUND);
    }

    return user.toSafeUser();
  }

  /**
   * Updates personal self-profile metadata with strict mass-assignment protection.
   *
   * Security Boundary:
   * Whitelists ONLY personal attributes: firstName, lastName, phone, avatarUrl.
   * Strictly prevents mutation of role, status, assignedBuildingIds, password, or session data.
   *
   * @param {string} userId - Authenticated user ObjectId.
   * @param {Object} input - Validated self-profile input.
   * @param {Object} [context={}] - Request telemetry.
   * @returns {Promise<Object>} Updated safe user.
   */
  async updateProfile(userId, input, context = {}) {
    const user = await User.findOne({
      _id: userId,
      isDeleted: false,
    });

    if (!user) {
      throw new ApiError(404, "User not found", [], ERROR_CODES.NOT_FOUND);
    }

    // Strict allowlist mapping
    if (input.firstName !== undefined) user.firstName = input.firstName;
    if (input.lastName !== undefined) user.lastName = input.lastName;
    if (input.phone !== undefined) user.phone = input.phone;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl;

    await user.save();

    emitUserSecurityEvent(USER_SECURITY_EVENTS.USER_PROFILE_UPDATED, {
      userId,
      ...context,
    });

    return user.toSafeUser();
  }
}

export const usersService = new UsersService();
export default usersService;
