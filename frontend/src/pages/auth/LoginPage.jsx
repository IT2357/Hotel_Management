//src/pages/auth/


import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import useAuth from '../../hooks/useAuth';
import getDashboardPath from '../../utils/GetDashboardPath';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const fields = [
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
      name: 'password',
      label: 'Password',
      type: 'password',
      validation: { required: 'Password is required' }
    }
  ];

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data); // login returns user object
      if (user?.role) {
        navigate(getDashboardPath(user.role));
      } else {
        console.warn("Login succeeded but user role not found.");
      }
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <AuthForm 
          fields={fields} 
          onSubmit={handleSubmit} 
          submitText="Sign in" 
          loading={loading}
        />
        <div className="text-center text-sm">
          <Link 
            to="/forgot-password" 
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Forgot your password?
          </Link>
        </div>
        <div className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
