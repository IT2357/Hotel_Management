//src/pages/auth/ResetPasswordPage.jsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import authService from '../../services/authService';
import getDashboardPath from '../../utils/GetDashboardPath';
import Alert from '../../components/common/Alert';

export default function ResetPasswordPage() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const token = searchParams.get('token');
  
  // Check if this is an admin-forced password change (user is logged in with passwordResetPending)
  const isAdminReset = user && user.passwordResetPending && !token;

  const handleReset = async ({ currentPassword, newPassword }) => {
    try {
      setLoading(true);
      setServerError(null);
      setSuccessMessage(null);
      setAlert(null);
      
      if (isAdminReset) {
        // Admin reset case - use change password functionality
        await authService.changePassword(currentPassword, newPassword);
        setAlert({ type: 'success', message: 'Password changed successfully! Redirecting to dashboard...' });
        setTimeout(() => {
          getDashboardPath(user.role);
        }, 2000);
      } else {
        // Manual reset case - use token-based reset
        await authService.resetPassword({ token, newPassword: newPassword });
        setAlert({ type: 'success', message: 'Password reset successful! Redirecting to login...' });
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Password reset failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl space-y-8 border border-gray-200">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {isAdminReset ? 'Change Your Password' : 'Reset Your Password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isAdminReset
              ? 'Your password has been reset by an administrator. Please set a new password to continue.'
              : 'Enter your new password below.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit(handleReset)} className="space-y-6">
          {isAdminReset && (
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                {...register('currentPassword', {
                  required: false // Optional for admin resets since admin may have set random password
                })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your current password (if you know it)"
              />
              {errors.currentPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.currentPassword.message}</p>
              )}
            </div>
          )}
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              id="newPassword"
              type="password"
              {...register('newPassword', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your new password"
            />
            {errors.newPassword && (
              <p className="mt-2 text-sm text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword', {
                validate: value =>
                  value === watch('newPassword') || 'Passwords do not match',
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Confirm your new password"
            />
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            {loading ? (isAdminReset ? 'Changing...' : 'Resetting...') : (isAdminReset ? 'Change Password' : 'Reset Password')}
          </button>
        </form>
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
