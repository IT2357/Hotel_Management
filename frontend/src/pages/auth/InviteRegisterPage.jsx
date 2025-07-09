//src/pages/auth/InviteRegisterPage.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthForm from '../../components/auth/AuthForm';
import RoleBadge from '../../components/auth/RoleBadge';
import useAuth from '../../hooks/useAuth';
import api from '../../services/authService';

export default function InviteRegisterPage() {
  const { token } = useParams();
  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkInvite = async () => {
      try {
        const response = await api.get(`/auth/check-invitation?token=${token}`);
        setInviteData(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid invitation');
      } finally {
        setLoading(false);
      }
    };
    checkInvite();
  }, [token]);

  const fields = [
    { name: 'name', label: 'Full Name', validation: { required: 'Name is required' } },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      readOnly: true
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

  const handleSubmit = async (data) => {
    try {
      await api.post('/auth/register-with-invite', { ...data, token });
      await login({ email: data.email, password: data.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Complete Your Registration
          </h2>
          <div className="mt-2">
            <RoleBadge role={inviteData.role} />
          </div>
        </div>
        <AuthForm
          fields={fields.map(field => 
            field.name === 'email' ? { ...field, defaultValue: inviteData.email } : field
          )}
          onSubmit={handleSubmit}
          submitText="Complete Registration"
        />
      </div>
    </div>
  );
}