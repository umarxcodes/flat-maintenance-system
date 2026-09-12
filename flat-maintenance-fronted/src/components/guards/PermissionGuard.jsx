// =====================  PERMISSION GUARD  ====================
import React from "react";
import { useAuth } from "../../providers/auth-provider.jsx";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "../../lib/permissions/rbac.util.js";

export const PermissionGuard = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { user } = useAuth();

  if (!user) return fallback;

  if (permission) {
    return hasPermission(user, permission) ? children : fallback;
  }

  if (permissions.length > 0) {
    const isAuthorized = requireAll
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions);

    return isAuthorized ? children : fallback;
  }

  return children;
};

export default PermissionGuard;
