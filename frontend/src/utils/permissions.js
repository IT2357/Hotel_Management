// Frontend permission constants and helpers

export const PERMISSION_MODULES = [
  "invitations",
  "notification",
  "users",
  "rooms",
  "bookings",
  "inventory",
  "staff",
  "finance",
  "reports",
  "settings",
];

export const PERMISSION_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
//   "approve",
//   "reject",
//   "export",
//   "manage",
];

// Helper to flatten adminProfile permissions array -> Set("module:action")
export function flattenAdminPermissions(adminProfile) {
  const set = new Set();
  if (!adminProfile?.permissions) return set;
  adminProfile.permissions.forEach((p) => {
    (p.actions || []).forEach((action) => set.add(`${p.module}:${action}`));
  });
  return set;
}

// Map ManagerProfile boolean flags to common permission keys
export function mapManagerPermissions(managerProfile) {
  const set = new Set();
  if (!managerProfile) return set;
  const perms = managerProfile.permissions || {};
  if (perms.canManageInventory) set.add("inventory:manage");
  if (perms.canApproveLeave) set.add("staff:approve");
  if (perms.canAuthorizePayments) set.add("finance:approve");
  if (perms.canOverridePricing) set.add("rooms:manage");
  if (perms.canViewFinancials) set.add("finance:read");
  return set;
}

// Optionally map Staff to minimal operational permissions (kept empty by default to not change vision)
export function mapStaffPermissions(staffProfile) {
  // Intentionally minimal to respect current backend design
  return new Set();
}
