// =====================  AUTH CONTEXT PROVIDER  ================
import React, { createContext, useContext, useState, useEffect } from "react";
import { tokenStorage } from "../lib/auth/token-storage.js";
import { queryClient } from "../lib/query/query-client.js";

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  activeBuildingId: null,
  login: () => {},
  logout: () => {},
  switchBuilding: () => {},
  refreshUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeBuildingId, setActiveBuildingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session from localStorage
  useEffect(() => {
    try {
      const storedToken = tokenStorage.getToken();
      const storedUser = tokenStorage.getUser();
      const storedBuildingId = tokenStorage.getActiveBuildingId();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setActiveBuildingId(storedBuildingId || storedUser.assignedBuildingIds?.[0] || null);
      }
    } catch (e) {
      console.error("Failed to restore auth state", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (authData) => {
    const { token: receivedToken, user: receivedUser } = authData;
    tokenStorage.setToken(receivedToken);
    tokenStorage.setUser(receivedUser);

    const initialBuildingId = receivedUser?.assignedBuildingIds?.[0] || null;
    tokenStorage.setActiveBuildingId(initialBuildingId);

    setToken(receivedToken);
    setUser(receivedUser);
    setActiveBuildingId(initialBuildingId);
  };

  const logout = () => {
    tokenStorage.clearAll();
    queryClient.clear();
    setToken(null);
    setUser(null);
    setActiveBuildingId(null);
  };

  const switchBuilding = (buildingId) => {
    tokenStorage.setActiveBuildingId(buildingId);
    setActiveBuildingId(buildingId);
    // Invalidate building-scoped queries
    queryClient.invalidateQueries();
  };

  const refreshUser = (updatedUser) => {
    tokenStorage.setUser(updatedUser);
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    activeBuildingId,
    login,
    logout,
    switchBuilding,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
