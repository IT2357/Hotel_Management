import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OTPVerification from './components/OTPVerification';
import useAuth from '../../hooks/useAuth';
import Alert from '../../components/common/Alert';

const getParsedUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw && raw !== 'undefined' && raw !== 'null' ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to parse user from localStorage:', e);
    return null;
  }
};

export default function OTPVerificationPage() {
  const { verifyEmail, resendOTP, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  // Prioritize useAuth user over location.state
  const email = user?.email || location.state?.email || '';
  const userId = user?._id || location.state?.userId || '';

  useEffect(() => {
    if (location.state?.error) {
      setServerError(location.state.error);
    }
  }, [location.state]);

  // Redirect to /register if user data is missing
  useEffect(() => {
    if (!email || !userId) {
      const timer = setTimeout(() => {
        navigate('/register', { replace: true });
      }, 3000); // Redirect after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [email, userId, navigate]);

  const handleVerify = async ({ otp }) => {
    if (!userId || !email) {
      setAlert({ type: 'error', message: 'User ID or email is missing. Please register again.' });
      return;
    }
    setLoading(true);
    setServerError(null);
    setAlert(null);
    try {
      await verifyEmail({ userId, otp });
      setAlert({ type: 'success', message: 'Email verified successfully! Redirecting...' });
      // Clear success message after 2 seconds
      setTimeout(() => setAlert(null), 2000);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'OTP verification failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId) {
      setAlert({ type: 'error', message: 'User ID is missing. Please register again.' });
      return;
    }
    setLoading(true);
    setServerError(null);
    setAlert(null);
    try {
      await resendOTP({ userId });
      setAlert({ type: 'success', message: 'New OTP sent! Please check your email.' });
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to resend OTP. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!email || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl space-y-6 border border-gray-200">
          <h2 className="text-3xl font-bold text-center text-gray-900">Verification Error</h2>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">User information not found. Redirecting to registration...</span>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out text-base font-medium"
          >
            Return to Registration
          </button>
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="relative max-w-md w-full bg-white p-8 rounded-xl shadow-2xl space-y-6 border border-gray-200">
        {loading && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        )}
        <h2 className="text-3xl font-bold text-center text-gray-900">Verify Your Email</h2>
        <p className="text-sm text-center text-gray-600">
          Enter the 6-digit code sent to <span className="font-medium text-indigo-600">{email}</span>
        </p>
        <OTPVerification
          onSubmit={handleVerify}
          onResend={handleResend}
          email={email}
          userId={userId}
          loading={loading}
        />
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