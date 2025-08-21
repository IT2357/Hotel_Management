//src/pages/auth/


import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import useAuth from '../../hooks/useAuth';
import getDashboardPath from '../../utils/GetDashboardPath';
import Alert from '../../components/common/Alert';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

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
    setAlert(null);
    console.log('🔐 LoginPage handleSubmit called with:', data);
    try {
      const result = await login(data); // login now returns an object
      console.log('🔐 Login result:', result);

      if (result.requiresVerification) {
        navigate('/verify-email', { state: { email: result.user.email, userId: result.user._id, error: result.error } });
      } else if (result.success && result.user?.role) {
        navigate(getDashboardPath(result.user.role));
      } else {
        console.warn("Login succeeded but user role not found or unexpected result:", result);
        setAlert({ type: 'error', message: 'Login failed. Please try again.' });
      }
    } catch (err) {
      console.log('🔐 LoginPage error caught:', err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      console.log('🔐 Setting alert with message:', errorMessage);
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl space-y-8 border border-gray-200">
        <div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900 tracking-tight">
            Welcome Back!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to continue to your account
          </p>
        </div>
        <AuthForm
          fields={fields}
          onSubmit={handleSubmit}
          submitText="Sign In"
          loading={loading}
        />
        <div className="flex items-center justify-between text-sm">
          <Link
            to="/forgot-password"
            className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out"
          >
            Forgot your password?
          </Link>
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out"
          >
            Don't have an account? Register
          </Link>
        </div>
      </div>
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
    </div>
  );
}
