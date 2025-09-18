import React from "react";
import { PERMISSION_MODULES, PERMISSION_ACTIONS } from "../../../utils/permissions";

export default function PermissionSelector({ selectedPermissions = [], onPermissionChange }) {
  const handleModuleToggle = (module, isChecked) => {
    let newPermissions = [...selectedPermissions];
    if (isChecked) {
      const existingModule = newPermissions.find((p) => p.module === module);
      if (!existingModule) {
        newPermissions.push({ module, actions: [...PERMISSION_ACTIONS] });
      } else {
        PERMISSION_ACTIONS.forEach((action) => {
          if (!existingModule.actions.includes(action)) existingModule.actions.push(action);
        });
      }
    } else {
      newPermissions = newPermissions.filter((p) => p.module !== module);
    }
    onPermissionChange(newPermissions);
  };

  const handleActionToggle = (module, action, isChecked) => {
    let newPermissions = [...selectedPermissions];
    let modulePerm = newPermissions.find((p) => p.module === module);

    if (isChecked) {
      if (!modulePerm) {
        modulePerm = { module, actions: [] };
        newPermissions.push(modulePerm);
      }
      if (!modulePerm.actions.includes(action)) modulePerm.actions.push(action);
    } else {
      if (modulePerm) {
        modulePerm.actions = modulePerm.actions.filter((a) => a !== action);
        if (modulePerm.actions.length === 0) {
          newPermissions = newPermissions.filter((p) => p.module !== module);
        }
      }
    }
    onPermissionChange(newPermissions);
  };

  const isModuleChecked = (module) => {
    const modulePerm = selectedPermissions.find((p) => p.module === module);
    return !!modulePerm && modulePerm.actions.length === PERMISSION_ACTIONS.length;
  };

  const isActionChecked = (module, action) => {
    const modulePerm = selectedPermissions.find((p) => p.module === module);
    return !!modulePerm && modulePerm.actions.includes(action);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Granular Permissions</h3>
      <div className="space-y-4">
        {PERMISSION_MODULES.map((module) => (
          <div key={module} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center mb-3">
              <label className="inline-flex items-center gap-2 text-lg font-semibold text-gray-800 capitalize">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                  checked={isModuleChecked(module)}
                  onChange={(e) => handleModuleToggle(module, e.target.checked)}
                />
                {module}
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pl-1 sm:pl-8">
              {PERMISSION_ACTIONS.map((action) => (
                <label key={`${module}-${action}`} className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                    checked={isActionChecked(module, action)}
                    onChange={(e) => handleActionToggle(module, action, e.target.checked)}
                  />
                  {action}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
