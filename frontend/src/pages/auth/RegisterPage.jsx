//src/pages/auth/RegisterPage.jsx

import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../../components/auth/AuthForm';
import useAuth from '../../hooks/useAuth';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

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
    await registerUser({ ...data, role: 'guest' });
    navigate('/verify-email', { state: { email: data.email } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a guest account
          </h2>
        </div>
        <AuthForm fields={fields} onSubmit={handleSubmit} submitText="Register" />
        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}