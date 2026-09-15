// =====================  USERS SERVICE  ==========================
import { usersApi } from "../features/users/api/users.api.js";

/**
 * Service for identity management, user invitations, and account governance.
 */
export const usersService = {
  /**
   * List users with optional filtering
   * @param {Object} [params]
   * @returns {Promise<Object>}
   */
  getUsers: (params) => usersApi.getUsers(params),

  /**
   * Get single user by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  getUserById: (id) => usersApi.getUserById(id),

  /**
   * Invite a new user
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  inviteUser: (payload) => usersApi.inviteUser(payload),

  /**
   * Update user status
   * @param {string} id
   * @param {'PENDING'|'ACTIVE'|'INACTIVE'|'SUSPENDED'} status
   * @returns {Promise<Object>}
   */
  updateUserStatus: (id, status) => usersApi.updateUserStatus(id, status),

  /**
   * Update user details
   * @param {string} id
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  updateUser: (id, payload) => usersApi.updateUser(id, payload),
};

export default usersService;
