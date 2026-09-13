// =====================  AUTH CONTEXT PROVIDER  ================
import React, { useState } from "react";
import { AuthContext } from "./auth-context.js";
import { tokenStorage } from "../lib/auth/token-storage.js";
import { queryClient } from "../lib/query/query-client.js";

const getInitialAuthState = () => {
  try {
    const storedToken = tokenStorage.getToken();
    const storedUser = tokenStorage.getUser();
    const storedBuildingId = tokenStorage.getActiveBuildingId();

    if (storedToken && storedUser) {
      return {
        token: storedToken,
        user: storedUser,
        activeBuildingId: storedBuildingId || storedUser.assignedBuildingIds?.[0] || null,
      };
    }
  } catch (e) {
    console.error("Failed to restore auth state", e);
  }
  return { token: null, user: null, activeBuildingId: null };
};

export const AuthProvider = ({ children }) => {
  const [initial] = useState(getInitialAuthState);
  const [user, setUser] = useState(initial.user);
  const [token, setToken] = useState(initial.token);
  const [activeBuildingId, setActiveBuildingId] = useState(initial.activeBuildingId);

  const login = (authData) => {
    const receivedToken = authData?.token || authData?.accessToken;
    const receivedUser = authData?.user;
    if (receivedToken) {
      tokenStorage.setToken(receivedToken);
    }
    if (receivedUser) {
      tokenStorage.setUser(receivedUser);
    }

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
    isLoading: false,
    activeBuildingId,
    login,
    logout,
    switchBuilding,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
