//src/pages/auth/InviteRegisterPage.jsx

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import RoleBadge from './components/RoleBadge';
import useAuth from '../../hooks/useAuth';
import authService from '../../services/authService';
import getDashboardPath from '../../utils/GetDashboardPath';

export default function InviteRegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token.");
      setLoading(false);
      return;
    }

    const checkInvite = async () => {
      try {
        const response = await authService.checkInvitation(token);
        // Backend responds with { success, message, data }
        setInviteData(response.data?.data || null);
        if (!response.data?.data) {
          setError('Invalid or expired invitation token.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invitation token.');
      } finally {
        setLoading(false);
      }
    };

    checkInvite();
  }, [token]);

  const handleSubmit = async (data) => {
    try {
      await authService.registerWithInvite({
        name: data.name,
        password: data.password,
        token,
      });

      const user = await login({ email: inviteData?.email, password: data.password });
      navigate(getDashboardPath(user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <p>Validating your invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-center px-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Oops!</h2>
          <p>{error}</p>
          <p className="mt-4 text-sm text-gray-500">Please contact your administrator for a new invitation.</p>
        </div>
      </div>
    );
  }

  const fields = [
    {
      name: 'name',
      label: 'Full Name',
      validation: { required: 'Name is required' }
    },
    {
      name: 'email',
      label: 'Email (assigned by admin)',
      type: 'email',
      readOnly: true,
      defaultValue: inviteData?.email || '',
      validation: { required: true }
    },
    {
      name: 'password',
      label: 'Password',
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Complete Your Registration
          </h2>
          <div className="mt-2">
            {inviteData?.role && <RoleBadge role={inviteData.role} />}
          </div>
        </div>
        <AuthForm
          fields={fields}
          onSubmit={handleSubmit}
          submitText="Complete Registration"
        />
      </div>
    </div>
  );
}
