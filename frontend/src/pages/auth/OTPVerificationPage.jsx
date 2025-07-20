//src/pages/auth/OTPVerificationPage.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import OTPVerification from './components/OTPVerification';
import useAuth from '../../hooks/useAuth';

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
  const parsedUser = getParsedUser();

  // Prioritize localStorage, then user state, then location.state
  const email = parsedUser?.email || user?.email || location.state?.email || '';
  const userId = parsedUser?._id || user?._id || location.state?.userId || null;

  console.log('userId from user:', user?._id);
  console.log('userId from location.state:', location.state?.userId);
  console.log('userId from localStorage:', parsedUser?._id);
  console.log('Selected userId:', userId, 'Selected email:', email);

  const handleVerify = async ({ otp }) => {
    if (!userId || !email) {
      console.error('User ID or email is missing. Cannot verify OTP.');
      navigate('/register', { state: { error: 'User ID or email not found. Please register again.' } });
      return;
    }

    try {
      await verifyEmail({ userId, otp });
      // Navigation is handled in useAuth.verifyEmail
    } catch (err) {
      console.error('OTP verification failed:', err.response?.data?.message || err.message);
    }
  };

  const handleResend = async () => {
    if (!userId) {
      console.warn('User ID is missing. Cannot resend OTP.');
      navigate('/register', { state: { error: 'User ID not found. Please register again.' } });
      return;
    }

    try {
      await resendOTP({ userId });
    } catch (err) {
      console.error('Resend OTP failed:', err.response?.data?.message || err.message);
    }
  };

  if (!email || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900">Verification Error</h2>
          <div className="text-red-500 text-center py-6">
            User information not found. Please go back and restart registration.
          </div>
          <button
            onClick={() => navigate('/register')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Return to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-900">Verify Your Email</h2>
        <p className="text-sm text-center text-gray-600">
          Enter the OTP sent to <span className="font-medium">{email}</span>
        </p>
        <OTPVerification
          onSubmit={handleVerify}
          onResend={handleResend}
          email={email}
          userId={userId} // Pass userId to OTPVerification
        />
      </div>
    </div>
  );
}