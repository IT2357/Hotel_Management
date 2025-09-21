//src/pages/auth/RegisterPage.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import useAuth from '../../hooks/useAuth';
import Alert from '../../components/common/Alert';
import SocialAuthButtons from './components/SocialAuthButtons';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);

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
        required: 'Phone is required',
        pattern: {
          value: /^[0-9]{10,15}$/,
          message: 'Invalid phone number'
        }
      }
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
      await registerUser({ ...data, role: 'guest' });
      setAlert({ type: 'success', message: 'Registration successful! Please verify your email.' });
      setTimeout(() => navigate('/verify-email', { state: { email: data.email } }), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setAlert({ type: 'error', message: errorMessage });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl space-y-8 border border-gray-200">
        <div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900 tracking-tight">
            Join Us!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your account to get started
          </p>
        </div>
        
        {/* Social Authentication */}
        <SocialAuthButtons />
        
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        
        <AuthForm fields={fields} onSubmit={handleSubmit} submitText="Register" />
        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150 ease-in-out">
            Sign in
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