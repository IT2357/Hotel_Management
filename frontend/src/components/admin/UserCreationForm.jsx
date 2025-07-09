//src/components/auth/UserCreationForm.jsx

import { useState } from 'react';
import AuthForm from '../../auth/components/AuthForm';
import RoleBadge from '../../auth/components/RoleBadge';
import api from '../../services/adminService';

export default function UserCreationForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('staff');
  const [permissions, setPermissions] = useState([]);

  const availablePermissions = [
    'view-reports',
    'manage-users',
    'manage-rooms',
    'manage-bookings',
    'system-config'
  ];

  const fields = [
    { name: 'name', label: 'Full Name', validation: { required: 'Name is required' } },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      validation: {
        required: 'Email is required',
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: 'Invalid email address'
        }
      }
    },
    {
      name: 'phone',
      label: 'Phone Number',
      validation: {
        pattern: {
          value: /^[0-9]{10,15}$/,
          message: 'Invalid phone number'
        }
      }
    },
    {
      name: 'password',
      label: 'Temporary Password',
      type: 'password',
      validation: {
        required: 'Password is required',
        minLength: {
          value: 8,
          message: 'Password must be at least 8 characters'
        }
      }
    }
  ];

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await api.createUser({ 
        ...data, 
        role,
        ...(role === 'admin' && { permissions }) 
      });
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Role</label>
        <div className="mt-1 flex gap-2">
          {['staff', 'manager', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                role === r
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <RoleBadge role={r} />
            </button>
          ))}
        </div>
      </div>

      {role === 'admin' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Permissions</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {availablePermissions.map((perm) => (
              <div key={perm} className="flex items-center">
                <input
                  type="checkbox"
                  id={perm}
                  checked={permissions.includes(perm)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPermissions([...permissions, perm]);
                    } else {
                      setPermissions(permissions.filter(p => p !== perm));
                    }
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor={perm} className="ml-2 block text-sm text-gray-700">
                  {perm.replace('-', ' ')}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <AuthForm
        fields={fields}
        onSubmit={handleSubmit}
        submitText="Create User"
        loading={loading}
      />
    </div>
  );
}