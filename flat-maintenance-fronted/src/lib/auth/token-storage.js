// =====================  AUTH TOKEN STORAGE ENGINE  ===========
const ACCESS_TOKEN_KEY = "flat_mgt_auth_token";
const USER_DATA_KEY = "flat_mgt_auth_user";
const BUILDING_SCOPE_KEY = "flat_mgt_active_building";

/**
 * Safe local storage wrapper ensuring SSR/client-side safety
 */
export const tokenStorage = {
  getToken: () => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken: (token) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
      }
    } catch (e) {
      console.error("Failed to store access token", e);
    }
  },

  removeToken: () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    } catch (e) {
      console.error("Failed to remove access token", e);
    }
  },

  hasToken: () => {
    return Boolean(tokenStorage.getToken());
  },

  getUser: () => {
    try {
      if (typeof window === "undefined") return null;
      const data = localStorage.getItem(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser: (user) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      }
    } catch (e) {
      console.error("Failed to store user profile", e);
    }
  },

  removeUser: () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_DATA_KEY);
      }
    } catch (e) {
      console.error("Failed to remove user profile", e);
    }
  },

  getActiveBuildingId: () => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(BUILDING_SCOPE_KEY);
    } catch {
      return null;
    }
  },

  setActiveBuildingId: (buildingId) => {
    try {
      if (typeof window !== "undefined") {
        if (buildingId) {
          localStorage.setItem(BUILDING_SCOPE_KEY, buildingId);
        } else {
          localStorage.removeItem(BUILDING_SCOPE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to store active building scope", e);
    }
  },

  clearAll: () => {
    tokenStorage.removeToken();
    tokenStorage.removeUser();
    tokenStorage.setActiveBuildingId(null);
  },
};

export default tokenStorage;
