// 📁 src/components/auth/OTPVerification.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function OTPVerification({ onSubmit, onResend, loading = false, email, userId }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');

  const handleFormSubmit = async (data) => {
    try {
      setServerError('');
      if (!userId) {
        throw new Error('User ID is missing');
      }
      await onSubmit({ ...data, userId });
    } catch (error) {
      console.error('OTP submission error:', error);
      setServerError(error.response?.data?.message || 'Verification failed');
    }
  };

  const handleResendOTP = async () => {
    try {
      setServerError('');
      setResendSuccess('');
      console.log('Resending OTP for userId:', userId);
      if (!userId) {
        throw new Error('User ID is missing');
      }
      await onResend({ userId });
      setResendSuccess('OTP has been resent successfully.');
    } catch (error) {
      console.error('Resend OTP frontend error:', error);
      setServerError(error.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
        <input
          type="text"
          {...register('otp', {
            required: 'OTP is required',
            pattern: {
              value: /^[0-9]{6}$/,
              message: 'OTP must be 6 digits',
            },
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.otp && (
          <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      {resendSuccess && <p className="text-sm text-green-600">{resendSuccess}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-md"
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>

      <div className="text-center mt-2">
        <button
          type="button"
          onClick={handleResendOTP}
          className="text-sm text-indigo-600 hover:underline"
        >
          Resend OTP
        </button>
      </div>
    </form>
  );
}