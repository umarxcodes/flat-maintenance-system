// =====================  ROLE GUARD  ==========================
import React from "react";
import { useAuth } from "../../providers/auth-context.js";
import { hasRole } from "../../lib/permissions/rbac.util.js";

export const RoleGuard = ({ roles = [], fallback = null, children }) => {
  const { user } = useAuth();

  if (!user) return fallback;

  return hasRole(user, roles) ? children : fallback;
};

export default RoleGuard;
