// =====================  AUTH CONTEXT & HOOK  ==================
import { createContext, useContext } from "react";

export const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  activeBuildingId: null,
  login: () => {},
  logout: () => {},
  switchBuilding: () => {},
  refreshUser: () => {},
});

export const useAuth = () => useContext(AuthContext);
