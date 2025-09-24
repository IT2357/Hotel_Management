import { useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { flattenAdminPermissions, mapManagerPermissions, mapStaffPermissions } from "../utils/permissions";

export default function usePermissions() {
  const { user } = useContext(AuthContext);

  const permissionsSet = useMemo(() => {
    if (!user) return new Set();

    // Super admin/full access bypass for admins only
    if (user.role === "admin" && user.adminProfile?.accessLevel === "Full") {
      return new Set(["__ALL__"]);
    }

    // Build a common Set of permission keys like "module:action"
    switch (user.role) {
      case "admin": {
        return flattenAdminPermissions(user.adminProfile);
      }
      case "manager": {
        return mapManagerPermissions(user.managerProfile);
      }
      case "staff": {
        return mapStaffPermissions(user.staffProfile);
      }
      default:
        return new Set(); // guests have no granular permissions
    }
  }, [user]);

  const hasPermission = (permissionKey) => {
    if (user?.role === "admin" && user?.adminProfile?.accessLevel === "Full") return true;
    return permissionsSet.has(permissionKey);
  };

  const hasAnyPermission = (permissionKeys = []) => {
    if (user?.role === "admin" && user?.adminProfile?.accessLevel === "Full") return true;
    return permissionKeys.some((k) => permissionsSet.has(k));
  };

  const hasAllPermissions = (permissionKeys = []) => {
    if (user?.role === "admin" && user?.adminProfile?.accessLevel === "Full") return true;
    return permissionKeys.every((k) => permissionsSet.has(k));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole: user?.role,
    permissionsSet,
  };
}
