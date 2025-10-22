import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTitle from '../../hooks/useTitle';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import Modal from '../../components/ui/Modal.jsx';
import OverstayPaymentForm from '../../components/checkout/OverstayPaymentForm.jsx';
// Create a local API instance for check-in/out with correct baseURL
const checkInOutApi = axios.create({
  baseURL: '/api', // Use Vite proxy path
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request
checkInOutApi.interceptors.request.use((config) => {
  console.log("CheckInOut API: Making request to:", config.url, "with baseURL:", config.baseURL);
  const token = localStorage.getItem("token");
  if (token && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors globally
checkInOutApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn("🔐 CheckInOut API: Unauthorized - token may be invalid or expired.");
    }
    return Promise.reject(err);
  }
);

const GuestCheckInOutPage = () => {
  useTitle('Self-Service Check-in/Check-out');

  const [checkInStatus, setCheckInStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showOverstayPaymentModal, setShowOverstayPaymentModal] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [overstayPaymentProcessing, setOverstayPaymentProcessing] = useState(false);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [recentlyCheckedOut, setRecentlyCheckedOut] = useState(null);
  const [overstayInfo, setOverstayInfo] = useState(null);  // ⚠️ NEW: Track overstay information

  // Check-in form state
  const [checkInData, setCheckInData] = useState({
    bookingId: '',
    documentType: 'passport',
    preferences: {
      roomService: false,
      housekeeping: 'morning',
      doNotDisturb: false,
      specialRequests: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    frontImage: null,
    backImage: null
  });

  // Check-out form state
  const [checkOutData, setCheckOutData] = useState({
    damageReport: ''
  });

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // ⚠️ SECURITY: Helper function to validate booking dates
  const validateBookingDates = (booking) => {
    if (!booking) return null;
    
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    
    // Reset times for date-only comparison
    now.setHours(0, 0, 0, 0);
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(23, 59, 59, 999);
    
    if (now < checkInDate) {
      const daysUntil = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
      return {
        status: 'early_checkin',
        message: `Check-in is not yet available. Your booking starts on ${checkInDate.toLocaleDateString()} (${daysUntil} day${daysUntil !== 1 ? 's' : ''} away)`,
        daysUntil,
        allowed: false
      };
    }
    
    if (now > checkOutDate) {
      return {
        status: 'booking_expired',
        message: 'Your booking period has ended. Please contact the hotel.',
        allowed: false
      };
    }

    const daysRemaining = Math.ceil((checkOutDate - now) / (1000 * 60 * 60 * 24));
    return {
      status: 'valid',
      message: `Booking valid. ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining until checkout on ${checkOutDate.toLocaleDateString()}`,
      daysRemaining,
      checkOutDate: checkOutDate.toISOString(),
      allowed: true
    };
  };

  // ⚠️ SECURITY: Helper function to calculate days between check-in and checkout
  const getDaysBooked = (booking) => {
    if (!booking) return 0;
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    fetchCheckInStatus();
    fetchEligibleBookings();
  }, []);

  const fetchCheckInStatus = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching guest check-in status...');
      const response = await checkInOutApi.get('/check-in-out/guest/status');
      console.log('✅ Raw check-in status response:', response);
      
      // Handle checked out status
      if (response.data && (response.data.status === 'checked_out' || response.data.status === 'recently_checked_out')) {
        console.log('ℹ️ Guest has checked out:', response.data);
        setRecentlyCheckedOut({
          message: response.data.message || 'Your stay has ended. Thank you for staying with us!',
          checkOutTime: response.data.checkOutTime,
          roomNumber: response.data.roomNumber || response.data.room?.roomNumber
        });
        setCheckInStatus(response.data); // Set the checked_out status
        return;
      }
      
      // Reset recentlyCheckedOut state if we got a different response
      if (recentlyCheckedOut) {
        setRecentlyCheckedOut(null);
      }
      
      console.log('✅ Guest check-in status data:', response.data);
      
      // Debug: Log the status and type of status
      if (response.data) {
        console.log('🔍 Status field exists:', 'status' in response.data);
        console.log('🔍 Status value:', response.data.status);
        console.log('🔍 Status type:', typeof response.data.status);
        console.log('🔍 Full response data:', JSON.stringify(response.data, null, 2));
      }
      
      setCheckInStatus(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch check-in status:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Reset states on error
      setCheckInStatus(null);
      setRecentlyCheckedOut(null);
      
      if (error.response?.status === 404) {
        // No active check-in found, which is fine
        console.log('ℹ️ No active check-in record found');
      } else {
        enqueueSnackbar('Failed to load check-in status', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleBookings = async () => {
    try {
      const response = await checkInOutApi.get('/check-in-out/guest/eligible-bookings');
      setEligibleBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch eligible bookings', error);
      setEligibleBookings([]);
    }
  };

  const handleCheckIn = async () => {
    // If we have a pre_checkin record, validate the form data
    if (checkInStatus?.status === 'pre_checkin') {
      if (!checkInData.frontImage) {
        enqueueSnackbar('Please upload the front of your document', { variant: 'warning' });
        return;
      }
    } else {
      // Original validation for new check-ins
      if (!checkInData.bookingId || !checkInData.frontImage) {
        enqueueSnackbar('Please fill in all required fields and upload documents', { variant: 'warning' });
        return;
      }
    }

    try {
      setProcessing(true);

      if (checkInStatus?.status === 'pre_checkin') {
        // Update existing pre_checkin record to checked_in
        console.log('Completing pre-check-in for record:', checkInStatus._id);

        // Prepare form data for document upload
        const formData = new FormData();
        formData.append('checkInOutId', checkInStatus._id);
        formData.append('documentType', checkInData.documentType);
        formData.append('preferences', JSON.stringify(checkInData.preferences));
        formData.append('emergencyContact', JSON.stringify(checkInData.emergencyContact));

        if (checkInData.frontImage) {
          formData.append('frontImage', checkInData.frontImage);
        }
        if (checkInData.backImage) {
          formData.append('backImage', checkInData.backImage);
        }

        const token = localStorage.getItem('token');
        const response = await axios.put('/api/check-in-out/guest/complete-checkin', formData, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('✅ Pre-check-in completion response:', response.data);
        enqueueSnackbar('Check-in completed successfully! Your key card has been assigned.', { variant: 'success' });

      } else {
        // Original check-in flow for new bookings
        const formData = new FormData();
        formData.append('bookingId', checkInData.bookingId);
        formData.append('documentType', checkInData.documentType);
        formData.append('preferences', JSON.stringify(checkInData.preferences));
        formData.append('emergencyContact', JSON.stringify(checkInData.emergencyContact));

        if (checkInData.frontImage) {
          formData.append('frontImage', checkInData.frontImage);
        }
        if (checkInData.backImage) {
          formData.append('backImage', checkInData.backImage);
        }

        // Use separate axios instance for file uploads
        const token = localStorage.getItem('token');
        const response = await axios.post('/api/check-in-out/guest/check-in', formData, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('✅ Check-in response:', response.data);
        enqueueSnackbar('Check-in successful! Your key card has been assigned.', { variant: 'success' });
        setShowCheckInModal(false);
      }

      // Reset form and refresh status
      setCheckInData({
        bookingId: '',
        documentType: 'passport',
        preferences: {
          roomService: false,
          housekeeping: 'morning',
          doNotDisturb: false,
          specialRequests: ''
        },
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
          email: ''
        },
        frontImage: null,
        backImage: null
      });

      // Refresh status and eligible bookings after check-in
      await fetchCheckInStatus();
      await fetchEligibleBookings();

    } catch (error) {
      console.error('❌ Check-in failed:', error);
      const errorMessage = error.response?.data?.message || 'Check-in failed';
      const errorCode = error.response?.data?.errorCode;
      
      // ⚠️ SECURITY: Display specific error messages for date violations
      if (errorCode === 'EARLY_CHECKIN_ATTEMPT') {
        const daysUntil = error.response?.data?.daysUntilCheckIn;
        enqueueSnackbar(
          `Early check-in not permitted. Check-in available in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
          { variant: 'error' }
        );
      } else if (errorCode === 'BOOKING_PERIOD_EXPIRED') {
        enqueueSnackbar(
          'Your booking period has expired. Please contact the hotel.',
          { variant: 'error' }
        );
      } else {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!safeCheckInStatus._id) {
      console.error('Cannot check out: No check-in record found');
      enqueueSnackbar('Error: No check-in record found', { variant: 'error' });
      return;
    }
    
    try {
      setProcessing(true);
      console.log('🔚 Processing check-out for:', safeCheckInStatus._id);
      
      // ⚠️ SECURITY: Check for overstays - but ONLY if payment not already approved
      if (safeCheckInStatus.booking) {
        const bookingCheckOut = new Date(safeCheckInStatus.booking.checkOut);
        const today = new Date();
        
        // Set to end of checkout day for comparison
        bookingCheckOut.setHours(23, 59, 59, 999);
        
        // Check if there's an overstay AND payment hasn't been approved yet
        const hasOverstay = today > bookingCheckOut;
        const paymentApproved = safeCheckInStatus?.overstay?.paymentStatus === 'approved';
        
        if (hasOverstay && !paymentApproved) {
          // Calculate overstay charges based on actual room price
          const daysOverstay = Math.ceil((today - bookingCheckOut) / (1000 * 60 * 60 * 24));
          
          // Get the room's actual base price - this is critical for accurate billing
          const roomRate = safeCheckInStatus.room?.basePrice;
          if (!roomRate || roomRate <= 0) {
            console.error('❌ Room price not available or invalid:', {
              roomId: safeCheckInStatus.room?._id,
              roomNumber: safeCheckInStatus.room?.roomNumber,
              basePrice: roomRate
            });
            enqueueSnackbar('Error: Unable to calculate overstay charges. Room pricing information is missing.', { variant: 'error' });
            setProcessing(false);
            return;
          }
          
          // Calculate charge: room rate × 1.5 (penalty multiplier) × days overstayed
          const overstayCharge = roomRate * 1.5 * daysOverstay;
          
          console.log('⚠️ Overstay detected (payment not approved):', {
            roomNumber: safeCheckInStatus.room?.roomNumber,
            roomBasePrice: roomRate,
            daysOverstay,
            penaltyMultiplier: 1.5,
            totalCharge: overstayCharge,
            calculation: `${roomRate} × 1.5 × ${daysOverstay} = ${overstayCharge}`,
            scheduledCheckout: bookingCheckOut.toISOString(),
            actualCheckout: today.toISOString(),
            paymentStatus: safeCheckInStatus?.overstay?.paymentStatus
          });
          
          // Show overstay payment modal
          setOverstayInfo({
            daysOverstay,
            roomRate,
            overstayCharge,
            scheduledCheckout: bookingCheckOut,
            checkInOutId: safeCheckInStatus._id
          });
          
          setShowCheckOutModal(false);
          setShowOverstayPaymentModal(true);
          setProcessing(false);
          return;
        } else if (hasOverstay && paymentApproved) {
          console.log('✅ Overstay detected but payment already approved - proceeding with checkout');
        }
      }
      
      const response = await checkInOutApi.post('/check-in-out/guest/check-out', {
        checkInOutId: safeCheckInStatus._id,
        damageReport: checkOutData.damageReport
      });
      console.log('✅ Check-out response:', response.data);
      enqueueSnackbar('Check-out successful!', { variant: 'success' });
      setShowCheckOutModal(false);
      
      // Refresh status and eligible bookings after checkout
      await fetchCheckInStatus();
      await fetchEligibleBookings();

      // Reset form
      setCheckOutData({ damageReport: '' });
    } catch (error) {
      console.error('❌ Check-out failed:', error);
      enqueueSnackbar(error.response?.data?.message || 'Check-out failed', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleGetReceipt = async () => {
    if (!safeCheckInStatus._id) {
      console.error('Cannot get receipt: No check-in record found');
      enqueueSnackbar('Error: No check-in record found', { variant: 'error' });
      return;
    }
    
    try {
      console.log('📄 Fetching receipt for:', safeCheckInStatus._id);
      const response = await checkInOutApi.get(`/check-in-out/guest/${safeCheckInStatus._id}/receipt`);
      console.log('✅ Receipt received:', response.data);
      setReceipt(response.data);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('❌ Failed to generate receipt:', error);
      enqueueSnackbar('Failed to generate receipt', { variant: 'error' });
    }
  };

  // ⚠️ NEW: Handle overstay payment submission
  const handleOverstayPayment = async (paymentInfo) => {
    try {
      setOverstayPaymentProcessing(true);
      
      console.log('💳 Processing overstay payment:', {
        checkInOutId: overstayInfo.checkInOutId,
        paymentMethod: paymentInfo.paymentMethod,
        amount: overstayInfo.overstayCharge
      });

      // Send payment to backend
      const response = await checkInOutApi.post('/check-in-out/guest/overstay-payment', {
        checkInOutId: overstayInfo.checkInOutId,
        paymentMethod: paymentInfo.paymentMethod,
        paymentData: paymentInfo.paymentData,
        amount: overstayInfo.overstayCharge,
        daysOverstay: overstayInfo.daysOverstay
      });

      console.log('✅ Overstay payment response:', response.data);

      // Handle different payment statuses
      if (response.data && response.data.success) {
        const paymentStatus = response.data.data?.paymentStatus;
        
        // For card payments (completed status), immediately proceed to checkout
        if (paymentStatus === 'completed') {
          enqueueSnackbar('Card payment processed successfully! You can now proceed with checkout.', { variant: 'success' });
          setShowOverstayPaymentModal(false);
          setOverstayInfo(null);
          
          // Now proceed with checkout
          try {
            const checkoutResponse = await checkInOutApi.post('/check-in-out/guest/check-out', {
              checkInOutId: overstayInfo.checkInOutId,
              damageReport: checkOutData.damageReport,
              overstayPaid: true
            });
            
            console.log('✅ Checkout after overstay payment successful:', checkoutResponse.data);
            enqueueSnackbar('Check-out successful!', { variant: 'success' });
            
            // Refresh status
            await fetchCheckInStatus();
            await fetchEligibleBookings();
            
            // Reset form
            setCheckOutData({ damageReport: '' });
          } catch (checkoutError) {
            console.error('❌ Checkout failed after overstay payment:', checkoutError);
            enqueueSnackbar('Payment successful, but checkout failed. Please contact reception.', { variant: 'warning' });
          }
        }
        // For cash payments (pending_approval status), wait for admin approval
        else if (paymentStatus === 'pending_approval') {
          enqueueSnackbar(
            'Your overstay charges have been recorded. Please proceed to reception to complete payment. Admin approval is required before you can checkout.',
            { variant: 'info', autoHideDuration: 10000 }
          );
          setShowOverstayPaymentModal(false);
          setOverstayInfo(null);
          
          // Refresh to show pending status
          setTimeout(() => {
            fetchCheckInStatus();
          }, 1000);
        }
        // For bank transfers (pending_verification status)
        else if (paymentStatus === 'pending_verification') {
          enqueueSnackbar(
            'Bank transfer initiated. Your transfer is pending verification. Please contact reception with your transfer details.',
            { variant: 'info', autoHideDuration: 10000 }
          );
          setShowOverstayPaymentModal(false);
          setOverstayInfo(null);
          
          // Refresh status
          setTimeout(() => {
            fetchCheckInStatus();
          }, 1000);
        } else {
          enqueueSnackbar('Payment processing initiated. Please wait for confirmation.', { variant: 'info' });
          setShowOverstayPaymentModal(false);
          setOverstayInfo(null);
        }
      } else {
        enqueueSnackbar(response.data?.message || 'Payment processing failed', { variant: 'error' });
      }
    } catch (error) {
      console.error('❌ Overstay payment error:', error);
      
      // Provide specific feedback for different payment methods
      if (paymentInfo.paymentMethod === 'cash') {
        enqueueSnackbar('Cash payment recorded. Please proceed to reception to complete payment and get approval.', { variant: 'info' });
      } else if (paymentInfo.paymentMethod === 'bank') {
        enqueueSnackbar('Bank transfer initiated. Please confirm the transfer details with reception.', { variant: 'info' });
      } else {
        enqueueSnackbar(error.response?.data?.message || 'Payment processing failed', { variant: 'error' });
      }
    } finally {
      setOverstayPaymentProcessing(false);
    }
  };

  const downloadReceipt = () => {
    // Simple download implementation - in a real app, you'd generate a PDF
    const receiptText = `
HOTEL RECEIPT
=============

Guest: ${receipt.guestName}
Email: ${receipt.guestEmail}
Room: ${receipt.roomNumber} (${receipt.roomType})

Check-in: ${new Date(receipt.checkInDate).toLocaleDateString()}
Check-out: ${new Date(receipt.checkOutDate).toLocaleDateString()}

Charges:
- Base Charge: රු${receipt.charges.baseCharge}
- Services: රු${receipt.charges.servicesCharges}
- Food: රු${receipt.charges.foodCharges}
- Taxes: රු${receipt.charges.taxes}

Total Amount: රු${receipt.charges.totalAmount}

Payment Method: ${receipt.paymentMethod}
Receipt Number: ${receipt.receiptNumber}
Issued: ${new Date(receipt.issuedAt).toLocaleString()}
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Debug logging
  console.log('Rendering GuestCheckInOutPage with state:', {
    loading,
    checkInStatus: checkInStatus ? {
      status: checkInStatus.status,
      room: checkInStatus.room,
      keyCardNumber: checkInStatus.keyCardNumber,
      checkInTime: checkInStatus.checkInTime,
      // Add more fields for debugging
      _id: checkInStatus._id,
      booking: checkInStatus.booking,
      guest: checkInStatus.guest
    } : null,
    showCheckOutModal,
    showReceiptModal
  });
  
  // Ensure checkInStatus has the expected structure
  const safeCheckInStatus = checkInStatus || {};

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Self-Service Check-in/Check-out</h1>
          <p className="text-gray-600">Manage your hotel stay conveniently</p>
        </div>

        {recentlyCheckedOut ? (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="bg-green-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
              <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check-out Complete</h2>
            <p className="text-gray-600 mb-4">{recentlyCheckedOut.message}</p>
            {recentlyCheckedOut.roomNumber && (
              <p className="text-gray-700 mb-4">
                Room: {recentlyCheckedOut.roomNumber}
              </p>
            )}
            {recentlyCheckedOut.checkOutTime && (
              <p className="text-gray-700 mb-6">
                Check-out Time: {new Date(recentlyCheckedOut.checkOutTime).toLocaleString()}
              </p>
            )}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">
                Thank you for staying with us! We hope you enjoyed your stay and look forward to welcoming you back soon.
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={handleGetReceipt}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Download Receipt
              </button>
            </div>
          </div>
        ) : safeCheckInStatus && safeCheckInStatus.status === 'pre_checkin' && safeCheckInStatus.booking?.status === 'Confirmed' && safeCheckInStatus.room ? (
          // Pre-check-in: Show check-in completion form
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="text-center mb-6">
                <div className="mx-auto h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">✓</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Check-in</h2>
                <p className="text-gray-600">
                  Your booking is confirmed! Please complete the check-in process below.
                </p>
              </div>

              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Booking Details</h3>
                  <p className="text-blue-800">
                    <strong>Booking Number:</strong> {checkInStatus.booking?.bookingNumber || 'Not available'}
                  </p>
                  <p className="text-blue-800">
                    <strong>Status:</strong> {checkInStatus.booking?.status || 'Not available'}
                  </p>
                  <p className="text-blue-800">
                    <strong>Room:</strong> {checkInStatus.room?.roomNumber} ({checkInStatus.room?.type})
                  </p>
                  <p className="text-blue-800">
                    <strong>Check-in Date:</strong> {checkInStatus.booking?.checkIn ? new Date(checkInStatus.booking.checkIn).toLocaleDateString() : 'Not available'}
                  </p>
                  <p className="text-blue-800">
                    <strong>Check-out Date:</strong> {checkInStatus.booking?.checkOut ? new Date(checkInStatus.booking.checkOut).toLocaleDateString() : 'Not available'}
                  </p>
                </div>

                {checkInStatus.booking?.status !== 'Confirmed' && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
                    Your booking status is <strong>{checkInStatus.booking?.status || 'Unknown'}</strong>. Self check-in will be available once your payment is verified and the booking is <strong>Confirmed</strong>.
                  </div>
                )}
                {checkInStatus.booking?.status !== 'Confirmed' && eligibleBookings.length > 0 && (
                  <div className="text-left bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Other Confirmed Bookings</h3>
                    <ul className="space-y-3">
                      {eligibleBookings.map(b => (
                        <li key={b.id} className="bg-white rounded border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="text-sm">
                            <div className="font-medium">{b.bookingNumber}</div>
                            <div className="text-gray-600">Room: {b.room?.number || 'N/A'} ({b.room?.type || 'N/A'})</div>
                            <div className="text-gray-600">{new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</div>
                            <div className="text-green-700">Status: {b.status}</div>
                          </div>
                          <div>
                            <button
                              onClick={() => { setCheckInData({ ...checkInData, bookingId: b.id }); setShowCheckInModal(true); }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                            >
                              Select & Continue
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className={checkInStatus.booking?.status === 'Confirmed' ? '' : 'pointer-events-none opacity-50'}>
                  <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                  <select
                    id="documentType"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mt-1"
                    value={checkInData.documentType}
                    onChange={(e) => setCheckInData({ ...checkInData, documentType: e.target.value })}
                  >
                    <option value="passport">Passport</option>
                    <option value="id">ID Card</option>
                    <option value="driver_license">Driver's License</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="frontImage" className="block text-sm font-medium text-gray-700 mb-2">Front of Document *</label>
                    <input
                      type="file"
                      id="frontImage"
                      accept="image/*"
                      onChange={(e) => setCheckInData({ ...checkInData, frontImage: e.target.files[0] })}
                      required
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="backImage" className="block text-sm font-medium text-gray-700 mb-2">Back of Document (Optional)</label>
                    <input
                      type="file"
                      id="backImage"
                      accept="image/*"
                      onChange={(e) => setCheckInData({ ...checkInData, backImage: e.target.files[0] })}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room Preferences</label>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="roomService"
                        checked={checkInData.preferences.roomService}
                        onChange={(e) => setCheckInData({
                          ...checkInData,
                          preferences: { ...checkInData.preferences, roomService: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <label htmlFor="roomService" className="text-sm text-gray-700">Room Service</label>
                    </div>

                    <div>
                      <label htmlFor="housekeeping" className="block text-sm font-medium text-gray-700 mb-2">Housekeeping Schedule</label>
                      <select
                        id="housekeeping"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mt-1"
                        value={checkInData.preferences.housekeeping}
                        onChange={(e) => setCheckInData({
                          ...checkInData,
                          preferences: { ...checkInData.preferences, housekeeping: e.target.value }
                        })}
                      >
                        <option value="morning">Morning</option>
                        <option value="evening">Evening</option>
                        <option value="both">Both</option>
                        <option value="none">None</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="doNotDisturb"
                        checked={checkInData.preferences.doNotDisturb}
                        onChange={(e) => setCheckInData({
                          ...checkInData,
                          preferences: { ...checkInData.preferences, doNotDisturb: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      <label htmlFor="doNotDisturb" className="text-sm text-gray-700">Do Not Disturb Sign</label>
                    </div>

                    <div>
                      <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                      <textarea
                        id="specialRequests"
                        placeholder="Any special requests or requirements..."
                        value={checkInData.preferences.specialRequests}
                        onChange={(e) => setCheckInData({
                          ...checkInData,
                          preferences: { ...checkInData.preferences, specialRequests: e.target.value }
                        })}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={checkInData.emergencyContact.name}
                      onChange={(e) => setCheckInData({
                        ...checkInData,
                        emergencyContact: { ...checkInData.emergencyContact, name: e.target.value }
                      })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Relationship"
                      value={checkInData.emergencyContact.relationship}
                      onChange={(e) => setCheckInData({
                        ...checkInData,
                        emergencyContact: { ...checkInData.emergencyContact, relationship: e.target.value }
                      })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={checkInData.emergencyContact.phone}
                      onChange={(e) => setCheckInData({
                        ...checkInData,
                        emergencyContact: { ...checkInData.emergencyContact, phone: e.target.value }
                      })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={checkInData.emergencyContact.email}
                      onChange={(e) => setCheckInData({
                        ...checkInData,
                        emergencyContact: { ...checkInData.emergencyContact, email: e.target.value }
                      })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex justify-center">
                    <button
                      onClick={handleCheckIn}
                      disabled={processing || checkInStatus.booking?.status !== 'Confirmed' || eligibleBookings.length === 0}
                      className="px-8 py-3 text-lg font-semibold bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                    >
                      {processing ? 'Processing...' : (checkInStatus.booking?.status === 'Confirmed' ? 'Complete Check-in' : 'Awaiting Confirmation')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : safeCheckInStatus.status === 'checked_in' ? (
            // Checked-in: Show current stay details and service access
            <div className="space-y-6">
              {/* ⚠️ SECURITY: Show checkout date warning */}
              {safeCheckInStatus.booking && (() => {
                const validation = validateBookingDates(safeCheckInStatus.booking);
                if (!validation) return null;
                
                const checkOutDate = new Date(safeCheckInStatus.booking.checkOut);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                checkOutDate.setHours(0, 0, 0, 0);
                
                const daysRemaining = Math.ceil((checkOutDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysRemaining <= 1) {
                  return (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-red-800">Checkout Approaching</p>
                          <p className="text-sm text-red-700 mt-1">
                            You must check out by {checkOutDate.toLocaleDateString()} ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining)
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                } else if (daysRemaining <= 3) {
                  return (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-yellow-800">Checkout Soon</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Checkout date: {checkOutDate.toLocaleDateString()} ({daysRemaining} days remaining)
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-semibold text-green-600 mb-1">Currently Checked In</h2>
                    <p className="text-gray-600">
                      Room {safeCheckInStatus.room?.roomNumber || 'N/A'} ({safeCheckInStatus.room?.type || 'N/A'}) • Checked in {new Date(safeCheckInStatus.checkInTime).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Key Card: {safeCheckInStatus.keyCardNumber || 'Not assigned'}
                    </p>
                    {safeCheckInStatus.booking && (
                      <p className="text-sm text-gray-500 mt-1">
                        <strong>Booking:</strong> {safeCheckInStatus.booking.bookingNumber || 'N/A'} | 
                        <strong> Checkout:</strong> {new Date(safeCheckInStatus.booking.checkOut).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
                  <button
                    onClick={() => setShowCheckOutModal(true)}
                    className="w-full sm:w-auto bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    <span className="mr-2">→</span>
                    Check Out
                  </button>
                  <button
                    onClick={handleGetReceipt}
                    className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    <span className="mr-2">📄</span>
                    Get Receipt
                  </button>
                </div>
              </div>

              {/* Service Request Access */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3">💬</div>
                  <h3 className="text-lg font-semibold mb-2">Guest Services</h3>
                  <p className="text-gray-600 mb-4">
                    While you're staying with us, you can request various services and amenities.
                  </p>
                  <button 
                    onClick={() => navigate('/guest/services')} 
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    Request Services
                  </button>
                </div>
              </div>
            </div>
          ) : safeCheckInStatus.status === 'checked_out' ? (
            // Checked-out: Show receipt only
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-gray-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">✓</div>
                <h2 className="text-xl font-semibold mb-2">Stay Completed</h2>
                <p className="text-gray-600 mb-6">
                  Your stay has been completed. Thank you for choosing our hotel!
                </p>
                <button onClick={handleGetReceipt} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                  <span className="mr-2">↓</span>
                  View Final Receipt
                </button>
              </div>
            </div>
          ) : (
            // No check-in record found - show booking lookup
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">→</div>
              <h2 className="text-xl font-semibold mb-2">Find Your Booking</h2>
              <p className="text-gray-600 mb-6">
                Enter your booking ID to start the check-in process or view your stay status.
              </p>

              {eligibleBookings.length > 0 && (
                <div className="text-left bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Your Confirmed Bookings</h3>
                  <ul className="space-y-3">
                    {eligibleBookings.map(b => (
                      <li key={b.id} className="bg-white rounded border p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="text-sm">
                          <div className="font-medium">{b.bookingNumber}</div>
                          <div className="text-gray-600">Room: {b.room?.number || 'N/A'} ({b.room?.type || 'N/A'})</div>
                          <div className="text-gray-600">{new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</div>
                          <div className="text-green-700">Status: {b.status}</div>
                        </div>
                        <div>
                          <button
                            onClick={() => { setCheckInData({ ...checkInData, bookingId: b.id }); setShowCheckInModal(true); }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                          >
                            Select & Continue
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Enter your booking ID"
                  value={checkInData.bookingId}
                  onChange={(e) => setCheckInData({ ...checkInData, bookingId: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4"
                />
                <button 
                  onClick={() => setShowCheckInModal(true)} 
                  disabled={!checkInData.bookingId.trim() || eligibleBookings.length === 0}
                  className="w-full px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Start Check-in Process
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Check-in Modal */}
        <Modal isOpen={showCheckInModal} onClose={() => setShowCheckInModal(false)} title="Self-Service Check-in" size="2xl">
              <div className="">
                <div className="space-y-6">
                <div>
                  <label htmlFor="bookingId" className="block text-sm font-medium text-gray-700 mb-2">Booking Reference/ID</label>
                  <input
                    type="text"
                    id="bookingId"
                    placeholder="Enter your booking ID"
                    value={checkInData.bookingId}
                    onChange={(e) => setCheckInData({ ...checkInData, bookingId: e.target.value })}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                  <select
                    id="documentType"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={checkInData.documentType}
                    onChange={(e) => setCheckInData({ ...checkInData, documentType: e.target.value })}
                  >
                    <option value="passport">Passport</option>
                    <option value="id">ID Card</option>
                    <option value="driver_license">Driver's License</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="frontImage" className="block text-sm font-medium text-gray-700 mb-2">Front of Document *</label>
                    <input
                      type="file"
                      id="frontImage"
                      accept="image/*"
                      onChange={(e) => setCheckInData({ ...checkInData, frontImage: e.target.files[0] })}
                      required
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="backImage" className="block text-sm font-medium text-gray-700 mb-2">Back of Document (Optional)</label>
                    <input
                      type="file"
                      id="backImage"
                      accept="image/*"
                      onChange={(e) => setCheckInData({ ...checkInData, backImage: e.target.files[0] })}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Preferences</label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="roomService"
                      checked={checkInData.preferences.roomService}
                      onChange={(e) => setCheckInData({
                        ...checkInData,
                        preferences: { ...checkInData.preferences, roomService: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="roomService" className="text-sm text-gray-700">Room Service</label>
                  </div>

                  <div>
                    <label htmlFor="housekeeping" className="block text-sm font-medium text-gray-700 mb-2">Housekeeping Schedule</label>
                    <select
                      id="housekeeping"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 mt-1"
                      value={checkInData.preferences.housekeeping}
                      onChange={(e) => setCheckInData({
                        ...checkInData,
                        preferences: { ...checkInData.preferences, housekeeping: e.target.value }
                      })}
                    >
                      <option value="morning">Morning</option>
                      <option value="evening">Evening</option>
                      <option value="both">Both</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="doNotDisturb"
                      checked={checkInData.preferences.doNotDisturb}
                      onChange={(e) => setCheckInData({
                        ...checkInData,
                        preferences: { ...checkInData.preferences, doNotDisturb: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="doNotDisturb" className="text-sm text-gray-700">Do Not Disturb Sign</label>
                  </div>

                  <div>
                    <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                    <textarea
                      id="specialRequests"
                      placeholder="Any special requests or requirements..."
                      value={checkInData.preferences.specialRequests}
                      onChange={(e) => setCheckInData({
                        ...checkInData,
                        preferences: { ...checkInData.preferences, specialRequests: e.target.value }
                      })}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={checkInData.emergencyContact.name}
                    onChange={(e) => setCheckInData({
                      ...checkInData,
                      emergencyContact: { ...checkInData.emergencyContact, name: e.target.value }
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={checkInData.emergencyContact.relationship}
                    onChange={(e) => setCheckInData({
                      ...checkInData,
                      emergencyContact: { ...checkInData.emergencyContact, relationship: e.target.value }
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={checkInData.emergencyContact.phone}
                    onChange={(e) => setCheckInData({
                      ...checkInData,
                      emergencyContact: { ...checkInData.emergencyContact, phone: e.target.value }
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={checkInData.emergencyContact.email}
                    onChange={(e) => setCheckInData({
                      ...checkInData,
                      emergencyContact: { ...checkInData.emergencyContact, email: e.target.value }
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  </div>
                </div>
              <div className="pt-4 border-t flex justify-end gap-3">
            <button 
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              onClick={() => setShowCheckInModal(false)}
            >
              Cancel
            </button>
            <button 
              onClick={handleCheckIn} 
              disabled={processing || eligibleBookings.length === 0}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {processing ? 'Processing...' : 'Complete Check-in'}
            </button>
          </div>
          </div>
        </div>
        </Modal>

        {/* Check-out Modal */}
        <Modal isOpen={showCheckOutModal} onClose={() => setShowCheckOutModal(false)} title="Confirm Check-out" size="md">
                <div className="space-y-4">
              {/* ⚠️ SECURITY: Show pending approval message for overstay cash payments */}
              {safeCheckInStatus?.overstay?.paymentStatus === 'pending_approval' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded">
                  <p className="text-amber-800 font-semibold text-sm mb-2">⏳ Payment Pending Admin Approval</p>
                  <p className="text-amber-700 text-sm">
                    Your overstay payment is awaiting admin approval. You cannot checkout until it's approved. 
                    Please wait for confirmation from the reception desk.
                  </p>
                </div>
              )}
              
              {/* ⚠️ SECURITY: Warn about overstays - but ONLY if payment not approved */}
              {safeCheckInStatus && safeCheckInStatus.booking && (() => {
                const checkOutDate = new Date(safeCheckInStatus.booking.checkOut);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                checkOutDate.setHours(23, 59, 59, 999);
                
                // Check if there's an overstay
                const hasOverstay = today > checkOutDate;
                
                // Check if payment is approved (only show alert if NOT approved)
                const paymentApproved = safeCheckInStatus?.overstay?.paymentStatus === 'approved';
                
                if (hasOverstay && !paymentApproved) {
                  const hoursOverstay = Math.ceil((today - checkOutDate) / (1000 * 60 * 60));
                  const daysOverstay = Math.ceil(hoursOverstay / 24);
                  
                  return (
                    <div className="bg-red-50 border border-red-200 p-4 rounded">
                      <p className="text-red-800 font-semibold text-sm mb-2">⚠️ Overstay Alert</p>
                      <p className="text-red-700 text-sm">
                        Your booking ended on {checkOutDate.toLocaleDateString()}. You are currently {daysOverstay} day{daysOverstay !== 1 ? 's' : ''} overdue.
                      </p>
                      <p className="text-red-700 text-sm mt-2">
                        Overstay charges may apply. Please proceed with immediate checkout.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800">
                  Please ensure you have returned your key card and settled all bills before checking out.
                </p>
              </div>

              <div>
                <label htmlFor="damageReport" className="block text-sm font-medium text-gray-700 mb-2">Damage Report (Optional)</label>
                <textarea
                  id="damageReport"
                  placeholder="Please report any damages to the room..."
                  value={checkOutData.damageReport}
                  onChange={(e) => setCheckOutData({ ...checkOutData, damageReport: e.target.value })}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
                <div className="pt-4 border-t flex justify-end gap-3">
                <button 
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  onClick={() => setShowCheckOutModal(false)}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCheckOut} 
                  disabled={processing || (safeCheckInStatus?.overstay?.paymentStatus === 'pending_approval')}
                  title={safeCheckInStatus?.overstay?.paymentStatus === 'pending_approval' ? 'Cannot checkout: Awaiting admin approval for overstay payment' : ''}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {processing ? 'Processing...' : 'Confirm Check-out'}
                </button>
              </div>
            </div>
        </Modal>

        {/* Receipt Modal */}
        <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Check-out Receipt" size="2xl">
                {receipt && (
              <div className="space-y-4">
                <div className="text-center border-b pb-4">
                  <h3 className="text-2xl font-bold">HOTEL RECEIPT</h3>
                  <p className="text-gray-600">Receipt #{receipt.receiptNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Guest Information</h4>
                    <p><strong>Name:</strong> {receipt.guestName}</p>
                    <p><strong>Email:</strong> {receipt.guestEmail}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Stay Details</h4>
                    <p><strong>Room:</strong> {receipt.roomNumber} ({receipt.roomType})</p>
                    <p><strong>Check-in:</strong> {new Date(receipt.checkInDate).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> {new Date(receipt.checkOutDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Charges Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Room Charges:</span>
                      <span>රු{receipt.charges.baseCharge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Services:</span>
                      <span>රු{receipt.charges.servicesCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Food & Beverages:</span>
                      <span>රු{receipt.charges.foodCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes:</span>
                      <span>රු{receipt.charges.taxes}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total Amount:</span>
                      <span>රු{receipt.charges.totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-gray-600 text-sm">
                  <p>Payment Method: {receipt.paymentMethod}</p>
                  <p>Issued: {new Date(receipt.issuedAt).toLocaleString()}</p>
                </div>
                </div>
              )}
            <div className="pt-4 border-t flex justify-end gap-3">
              <button 
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                onClick={() => setShowReceiptModal(false)}
              >
                Close
              </button>
              <button 
                onClick={downloadReceipt} 
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <span className="mr-2">↓</span>
                Download Receipt
              </button>
            </div>
        </Modal>

        {/* ⚠️ NEW: Overstay Payment Modal */}
        {overstayInfo && (
          <OverstayPaymentForm
            isOpen={showOverstayPaymentModal}
            onClose={() => {
              setShowOverstayPaymentModal(false);
              setOverstayInfo(null);
            }}
            overstayCharges={overstayInfo.overstayCharge}
            roomBasePrice={overstayInfo.roomRate}
            daysOverstay={overstayInfo.daysOverstay}
            onPaymentComplete={handleOverstayPayment}
            isProcessing={overstayPaymentProcessing}
          />
        )}

      </div>
    </div>
  );
};

export default GuestCheckInOutPage;
