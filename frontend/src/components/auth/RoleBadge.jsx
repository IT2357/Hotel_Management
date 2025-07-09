// src/components/auth/RoleBadge.jsx

import React from 'react';

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  user: 'bg-blue-100 text-blue-800',
  manager: 'bg-green-100 text-green-800',
  guest: 'bg-yellow-100 text-yellow-800',
  default: 'bg-gray-100 text-gray-800',
};

export default function RoleBadge({ role }) {
  const normalizedRole = role?.toLowerCase() || 'default';
  const colorClass = roleColors[normalizedRole] || roleColors.default;

  return (
    <span
      className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${colorClass}`}
    >
      {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unknown Role'}
    </span>
  );
}
