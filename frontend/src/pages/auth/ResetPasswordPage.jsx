import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import authService from '../../services/authService';
import Alert from '../../components/common/Alert';

export default function ResetPasswordPage() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [searchParams] = useSearchParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const token = searchParams.get('token');
  const { userId, email } = location.state || {};

  // Admin reset: No token, userId present; User-initiated reset: token present
  const isAdminReset = !token && !!userId;

  console.log('ResetPasswordPage state:', {
    user: user ? { _id: user._id, email: user.email, passwordResetPending: user.passwordResetPending } : null,
    userId,
    email,
    token,
    isAdminReset,
  });

  const handleReset = async (data) => {
    try {
      setLoading(true);
      setAlert(null);
      console.log('ResetPasswordPage form data:', {
        formData: data,
        isAdminReset,
        userId,
        email,
        token: !!token,
      });
      if (isAdminReset) {
        if (!userId) {
          console.error('userId required for admin reset', { userId, email });
          throw new Error('User ID is required for password change');
        }
        console.log('Calling updateUserPassword with:', {
          userId,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });
        await authService.updateUserPassword({
          userId,
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });
        setAlert({ type: 'success', message: 'Password changed successfully! Redirecting to login...' });
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      } else {
        if (!token) {
          console.error('Reset token required for user-initiated reset', { userId, email });
          throw new Error('Reset token is required');
        }
        console.log('Calling resetPassword with:', { token, newPassword: data.newPassword });
        await authService.resetPassword({ token, newPassword: data.newPassword });
        setAlert({ type: 'success', message: 'Password reset successfully! Redirecting to login...' });
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    } catch (error) {
      console.error('Reset password error:', {
        message: error.message,
        response: error.response?.data,
      });
      const errorMessage =
        error.response?.data?.message === 'Access token required'
          ? 'Unable to change password. Please log in with your temporary password or contact support.'
          : error.response?.data?.message || error.message || 'Password reset failed. Please try again.';
      setAlert({
        type: 'error',
        message: errorMessage,
      });
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
              ? 'Your password has been reset by an administrator. Please enter the temporary password and set a new password.'
              : 'Enter your new password below.'}
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
                  required: isAdminReset ? 'Current password is required' : false,
                })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your current password"
                disabled={loading}
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
              disabled={loading}
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
                validate: value => value === watch('newPassword') || 'Passwords do not match',
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Confirm your new password"
              disabled={loading}
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
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}
      </div>
    </div>
  );
}