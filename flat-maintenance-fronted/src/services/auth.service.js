// =====================  AUTH SERVICE  ===========================
import { authApi } from "../features/auth/api/auth.api.js";

/**
 * Service for authentication, session lifecycle, and profile operations.
 */
export const authService = {
  /**
   * Log in user
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<Object>}
   */
  login: (credentials) => authApi.login(credentials),

  /**
   * Log out current user session
   * @returns {Promise<Object>}
   */
  logout: () => authApi.logout(),

  /**
   * Get current authenticated user profile
   * @returns {Promise<Object>}
   */
  getMe: () => authApi.getMe(),

  /**
   * Request password reset token
   * @param {{ email: string }} payload
   * @returns {Promise<Object>}
   */
  forgotPassword: (payload) => authApi.forgotPassword(payload),

  /**
   * Reset password with token
   * @param {{ token: string, password: string }} payload
   * @returns {Promise<Object>}
   */
  resetPassword: (payload) => authApi.resetPassword(payload),
};

export default authService;
