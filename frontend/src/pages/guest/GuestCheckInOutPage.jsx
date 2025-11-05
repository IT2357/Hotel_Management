import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, X, FileText, Calendar, Key, CreditCard, AlertCircle, Clock, MapPin, User, Upload, Settings, LogOut, Home } from 'lucide-react';
import useTitle from '../../hooks/useTitle';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import Modal from '../../components/ui/Modal.jsx';
import OverstayPaymentForm from '../../components/checkout/OverstayPaymentForm.jsx';
import html2pdf from 'html2pdf.js';
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
  const [hotelSettings, setHotelSettings] = useState(null); // Hotel admin settings

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
    fetchHotelSettings();
  }, []);

  const fetchHotelSettings = async () => {
    try {
      // Try to get admin settings first (might require auth)
      const response = await checkInOutApi.get('/admin/settings');
      console.log('✅ Hotel admin settings received:', response.data);
      const settings = response.data?.data || response.data;
      setHotelSettings({
        name: settings.hotelName || settings.name || "Valdore HMS",
        address: settings.hotelAddress || settings.address || "Punnalakadduvan, Jaffna 03, Sri Lanka",
        phone: settings.hotelPhone || settings.phone || "+94 77 234 5678",
        email: settings.hotelEmail || settings.email || "reservations@valdorehotel.lk",
        website: settings.hotelWebsite || settings.website || "www.valdorehotel.lk"
      });
    } catch (error) {
      console.warn('⚠️ Failed to fetch hotel settings from admin, trying alternative:', error.response?.status);
      
      try {
        // Try public social settings endpoint to see if we can get any hotel info
        const publicResponse = await checkInOutApi.get('/public/social-auth-settings');
        console.log('✅ Public settings response:', publicResponse.data);
        // This endpoint only has social settings, so use defaults
        setHotelSettings({
          name: "Valdore HMS",
          address: "Punnalakadduvan, Jaffna 03, Sri Lanka", 
          phone: "+94 77 234 5678",
          email: "reservations@valdorehotel.lk",
          website: "www.valdorehotel.lk"
        });
      } catch (publicError) {
        console.error('❌ All settings endpoints failed, using defaults:', publicError);
        // Use default settings as final fallback
        setHotelSettings({
          name: "Valdore HMS",
          address: "Punnalakadduvan, Jaffna 03, Sri Lanka",
          phone: "+94 77 234 5678", 
          email: "reservations@valdorehotel.lk",
          website: "www.valdorehotel.lk"
        });
      }
    }
  };

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
      console.log('📄 Current check-in status with booking:', safeCheckInStatus);
      
      // Get the basic receipt data from check-in/out
      const receiptResponse = await checkInOutApi.get(`/check-in-out/guest/${safeCheckInStatus._id}/receipt`);
      console.log('✅ Receipt received - Full response:', receiptResponse);
      
      const receiptData = receiptResponse.data?.data || receiptResponse.data;
      console.log('✅ Basic receipt data:', receiptData);
      
      // Get detailed booking information for pricing
      let bookingData = null;
      const bookingId = safeCheckInStatus.booking?._id || safeCheckInStatus.booking?.id || safeCheckInStatus.bookingId;
      
      if (bookingId) {
        try {
          console.log('📄 Fetching booking details for pricing:', bookingId);
          const bookingResponse = await checkInOutApi.get(`/bookings/${bookingId}`);
          bookingData = bookingResponse.data?.data || bookingResponse.data;
          console.log('✅ Booking data with pricing:', bookingData);
        } catch (bookingError) {
          console.warn('⚠️ Could not fetch booking details:', bookingError);
          // Use booking data from check-in status if available
          bookingData = safeCheckInStatus.booking;
        }
      } else {
        console.warn('⚠️ No booking ID found, using booking data from check-in status');
        bookingData = safeCheckInStatus.booking;
      }
      
      // Combine receipt data with booking pricing information
      const combinedReceiptData = {
        ...receiptData,
        booking: bookingData,
        // Ensure we have access to all booking pricing details
        totalPrice: bookingData?.totalPrice,
        costBreakdown: bookingData?.costBreakdown,
        roomBasePrice: bookingData?.roomBasePrice,
        paymentMethod: bookingData?.paymentMethod || receiptData.paymentMethod
      };
      
      console.log('✅ Combined receipt data with booking pricing:', combinedReceiptData);
      
      setReceipt(combinedReceiptData);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('❌ Failed to generate receipt:', error);
      console.error('❌ Error details:', error.response?.data);
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

  const generateReceiptData = (receiptData) => {
    console.log('🔍 Processing receipt data for PDF:', receiptData);
    
    // Handle different possible data structures
    const guest = receiptData.guest || receiptData.guestInfo || {};
    const room = receiptData.room || receiptData.roomInfo || {};
    const charges = receiptData.charges || receiptData.billing || receiptData.costBreakdown || {};
    const booking = receiptData.booking || receiptData.bookingInfo || {};
    
    // Try to get guest name from multiple possible sources
    const guestName = guest.firstName && guest.lastName 
      ? `${guest.firstName} ${guest.lastName}`.trim()
      : guest.fullName || guest.name || receiptData.guestName || 'N/A';
    
    // Try to get guest email from multiple sources
    const guestEmail = guest.email || receiptData.guestEmail || 'N/A';
    
    // Try to get room information
    const roomNumber = room.roomNumber || room.number || receiptData.roomNumber || 'N/A';
    const roomType = room.type || room.roomType || receiptData.roomType || 'N/A';
    
    // Try to get dates from multiple sources
    const checkInDate = receiptData.checkInDate || receiptData.checkIn || booking.checkIn;
    const checkOutDate = receiptData.checkOutDate || receiptData.checkOut || booking.checkOut || new Date().toISOString();
    
    // Get pricing from booking data since check-in/out doesn't contain pricing
    const bookingInfo = receiptData.booking || {};
    const costBreakdown = bookingInfo.costBreakdown || receiptData.costBreakdown || {};
    
    // Handle charges from booking cost breakdown or other sources
    const baseCharge = costBreakdown.roomCost || 
                      bookingInfo.roomBasePrice || 
                      charges.baseCharge || 
                      charges.roomCost || 
                      charges.roomCharges || 
                      charges.subtotal || 0;
                      
    const servicesCharges = costBreakdown.serviceFee || 
                           costBreakdown.serviceCharges || 
                           charges.servicesCharges || 
                           charges.serviceCharges || 
                           charges.services || 0;
                           
    const foodCharges = costBreakdown.foodCharges || 
                       costBreakdown.food || 
                       charges.foodCharges || 
                       charges.food || 
                       charges.foodAndBeverage || 0;
                       
    const taxes = costBreakdown.tax || 
                  costBreakdown.taxes || 
                  charges.taxes || 
                  charges.tax || 
                  charges.vat || 0;
                  
    const totalAmount = costBreakdown.total || 
                        bookingInfo.totalPrice || 
                        receiptData.totalPrice ||
                        charges.totalAmount || 
                        charges.total || 
                        charges.grandTotal || 
                        (baseCharge + servicesCharges + foodCharges + taxes);
    
    const processedData = {
      // Hotel Information - From admin settings with fallbacks
      hotelName: hotelSettings?.name || hotelSettings?.hotelName || "Valdore HMS",
      hotelAddress: hotelSettings?.address || hotelSettings?.hotelAddress || "Punnalakadduvan, Jaffna 03, Sri Lanka",
      hotelPhone: hotelSettings?.phone || hotelSettings?.hotelPhone || "+94 77 234 5678",
      hotelEmail: hotelSettings?.email || hotelSettings?.hotelEmail || "reservations@valdorehotel.lk",
      hotelWebsite: hotelSettings?.website || hotelSettings?.hotelWebsite || "www.valdorehotel.lk",

      // Receipt Details
      receiptNumber: receiptData.receiptNumber || receiptData._id || `RC-${Date.now()}`,
      issueDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      issueTime: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      
      // Guest Information
      guestName: guestName,
      guestEmail: guestEmail,
      
      // Room & Stay Details
      roomNumber: roomNumber,
      roomType: roomType,
      checkInDate: checkInDate ? new Date(checkInDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'N/A',
      checkOutDate: checkOutDate ? new Date(checkOutDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'N/A',
      
      // Charges Details
      baseCharge: Number(baseCharge) || 0,
      servicesCharges: Number(servicesCharges) || 0,
      foodCharges: Number(foodCharges) || 0,
      taxes: Number(taxes) || 0,
      totalAmount: Number(totalAmount) || 0,
      
      // Payment Information
      paymentMethod: receiptData.paymentMethod || bookingInfo.paymentMethod || booking.paymentMethod || 'Credit Card',
      paymentStatus: 'Paid'
    };
    
    console.log('✅ Processed receipt data:', processedData);
    return processedData;
  };

  const downloadReceipt = async () => {
    if (!receipt) {
      console.error('No receipt data available for PDF generation');
      enqueueSnackbar('No receipt data available', { variant: 'error' });
      return;
    }

    try {
      console.log('🔄 Starting PDF generation with raw receipt data:', receipt);
      const receiptData = generateReceiptData(receipt);
      console.log('📊 Processed receipt data for PDF:', receiptData); // Debug log
      
      // Create a comprehensive HTML structure for the PDF receipt
      const receiptHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white; color: #333;">
          
          <!-- Header -->
          <div style="background: #1976d2; color: white; padding: 30px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">${receiptData.hotelName}</h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Luxury • Comfort • Excellence</p>
          </div>
          
          <!-- Title -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #e3f2fd;">
            <h1 style="color: #1976d2; font-size: 24px; margin: 0 0 10px 0;">CHECK-OUT RECEIPT</h1>
            <p style="color: #666; margin: 5px 0;">Receipt #${receiptData.receiptNumber}</p>
            <p style="color: #666; margin: 5px 0;">Issued on ${receiptData.issueDate} at ${receiptData.issueTime}</p>
          </div>
          
          <!-- Hotel Information -->
          <div style="margin-bottom: 25px; background: #f8f9fa; padding: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Hotel Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; vertical-align: top; width: 25%;"><strong>Address:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.hotelAddress}</td>
                <td style="padding: 8px; vertical-align: top; width: 25%;"><strong>Phone:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.hotelPhone}</td>
              </tr>
              <tr>
                <td style="padding: 8px; vertical-align: top;"><strong>Email:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.hotelEmail}</td>
                <td style="padding: 8px; vertical-align: top;"><strong>Website:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.hotelWebsite}</td>
              </tr>
            </table>
          </div>
          
          <!-- Guest Information -->
          <div style="margin-bottom: 25px; background: #f8f9fa; padding: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Guest Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; vertical-align: top; width: 25%;"><strong>Guest Name:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.guestName}</td>
                <td style="padding: 8px; vertical-align: top; width: 25%;"><strong>Email:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.guestEmail}</td>
              </tr>
            </table>
          </div>
          
          <!-- Stay Details -->
          <div style="margin-bottom: 25px; background: #f8f9fa; padding: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Stay Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; vertical-align: top; width: 25%;"><strong>Room Number:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.roomNumber}</td>
                <td style="padding: 8px; vertical-align: top; width: 25%;"><strong>Room Type:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.roomType}</td>
              </tr>
              <tr>
                <td style="padding: 8px; vertical-align: top;"><strong>Check-in Date:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.checkInDate}</td>
                <td style="padding: 8px; vertical-align: top;"><strong>Check-out Date:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.checkOutDate}</td>
              </tr>
            </table>
          </div>
          
          <!-- Charges Summary -->
          <div style="margin-bottom: 25px; background: #f8f9fa; padding: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Charges Summary</h3>
            <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #ddd;">
              <thead>
                <tr style="background: #1976d2; color: white;">
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">Amount (LKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #ddd;">Room Charges:</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">LKR ${receiptData.baseCharge.toLocaleString()}</td>
                </tr>
                ${receiptData.servicesCharges > 0 ? `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #ddd;">Services:</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">LKR ${receiptData.servicesCharges.toLocaleString()}</td>
                </tr>
                ` : ''}
                ${receiptData.foodCharges > 0 ? `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #ddd;">Food & Beverages:</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">LKR ${receiptData.foodCharges.toLocaleString()}</td>
                </tr>
                ` : ''}
                ${receiptData.taxes > 0 ? `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #ddd;">Taxes:</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">LKR ${receiptData.taxes.toLocaleString()}</td>
                </tr>
                ` : ''}
                <tr style="background: #e3f2fd; font-weight: bold; font-size: 16px;">
                  <td style="padding: 12px; border-top: 2px solid #1976d2;"><strong>Total Amount:</strong></td>
                  <td style="padding: 12px; text-align: right; border-top: 2px solid #1976d2;"><strong>LKR ${receiptData.totalAmount.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Payment Information -->
          <div style="margin-bottom: 25px; background: #f8f9fa; padding: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Payment Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; vertical-align: top; width: 25%;"><strong>Payment Method:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.paymentMethod}</td>
                <td style="padding: 8px; vertical-align: top; width: 25%;"><strong>Payment Status:</strong></td>
                <td style="padding: 8px; vertical-align: top;">
                  <span style="background: #e8f5e8; color: #2e7d32; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: bold;">
                    ${receiptData.paymentStatus}
                  </span>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 25px; text-align: center; border-top: 2px solid #e3f2fd; margin-top: 30px;">
            <p style="color: #666; margin: 0 0 15px 0; line-height: 1.6;">
              <strong>Thank you for choosing ${receiptData.hotelName}!</strong><br>
              We hope you enjoyed your stay with us. For any queries regarding this receipt, 
              please contact our customer service team with your receipt number.
            </p>
            <div style="margin-top: 15px;">
              <span style="color: #1976d2; font-weight: bold; margin-right: 20px;">Phone: ${receiptData.hotelPhone}</span>
              <span style="color: #1976d2; font-weight: bold; margin-right: 20px;">Email: ${receiptData.hotelEmail}</span>
              <span style="color: #1976d2; font-weight: bold;">Website: ${receiptData.hotelWebsite}</span>
            </div>
          </div>
          
        </div>
      `;

      // Configure PDF options for better compatibility
      const opt = {
        margin: 0.5,
        filename: `CheckOut_Receipt_${receiptData.receiptNumber}_${receiptData.hotelName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          logging: true,
          useCORS: true,
          allowTaint: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait'
        }
      };

      // Generate and download PDF directly from HTML string
      html2pdf().set(opt).from(receiptHTML).save();

      // Show success message
      enqueueSnackbar('Receipt downloaded successfully as PDF!', { variant: 'success' });
      
    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      enqueueSnackbar('Failed to generate PDF receipt. Please try again.', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your check-in status...</p>
        </motion.div>
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Key className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Self-Service Check-in/Check-out
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your hotel stay conveniently and securely
          </p>
        </motion.div>

        {recentlyCheckedOut ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl p-8 text-center"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6 shadow-lg">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Check-out Complete!</h2>
            <p className="text-lg text-gray-600 mb-4">{recentlyCheckedOut.message}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {recentlyCheckedOut.roomNumber && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl">
                  <div className="flex items-center justify-center gap-2 text-indigo-700">
                    <MapPin className="w-5 h-5" />
                    <span className="font-semibold">Room {recentlyCheckedOut.roomNumber}</span>
                  </div>
                </div>
              )}
              {recentlyCheckedOut.checkOutTime && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl">
                  <div className="flex items-center justify-center gap-2 text-indigo-700">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">{new Date(recentlyCheckedOut.checkOutTime).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-6 rounded-xl mb-6">
              <p className="text-indigo-800 text-lg">
                Thank you for staying with us! We hope you enjoyed your stay and look forward to welcoming you back soon.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetReceipt}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <FileText className="w-5 h-5" />
                Download Receipt
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-300"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </button>
            </div>
          </motion.div>
        ) : safeCheckInStatus && safeCheckInStatus.status === 'pre_checkin' && safeCheckInStatus.booking?.status === 'Confirmed' && safeCheckInStatus.room ? (
          // Pre-check-in: Show check-in completion form
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl shadow-2xl p-8 mb-6"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Complete Your Check-in</h2>
                <p className="text-lg text-gray-600">
                  Your booking is confirmed! Please complete the check-in process below.
                </p>
              </div>

              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Booking Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-indigo-800">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Booking Number:</span>
                      <span className="font-semibold">{checkInStatus.booking?.bookingNumber || 'Not available'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">{checkInStatus.booking?.status || 'Not available'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">Room:</span>
                      <span className="font-semibold">{checkInStatus.room?.roomNumber} ({checkInStatus.room?.type})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Check-in:</span>
                      <span className="font-semibold">{checkInStatus.booking?.checkIn ? new Date(checkInStatus.booking.checkIn).toLocaleDateString() : 'Not available'}</span>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Check-out:</span>
                      <span className="font-semibold">{checkInStatus.booking?.checkOut ? new Date(checkInStatus.booking.checkOut).toLocaleDateString() : 'Not available'}</span>
                    </div>
                  </div>
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
                      disabled={processing || checkInStatus.booking?.status !== 'Confirmed'}
                      className="inline-flex items-center justify-center gap-2 px-10 py-4 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : checkInStatus.booking?.status === 'Confirmed' ? (
                        <>
                          <CheckCircle className="w-6 h-6" />
                          Complete Check-in
                        </>
                      ) : (
                        <>
                          <Clock className="w-6 h-6" />
                          Awaiting Confirmation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : safeCheckInStatus.status === 'checked_in' ? (
            // Checked-in: Show current stay details and service access
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
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
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-5 rounded-xl shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-red-800 mb-1">Checkout Approaching</p>
                          <p className="text-sm text-red-700">
                            You must check out by {checkOutDate.toLocaleDateString()} ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining)
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                } else if (daysRemaining <= 3) {
                  return (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-5 rounded-xl shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-yellow-800 mb-1">Checkout Soon</p>
                          <p className="text-sm text-yellow-700">
                            Checkout date: {checkOutDate.toLocaleDateString()} ({daysRemaining} days remaining)
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full mb-4 shadow-md">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Currently Checked In</span>
                    </div>
                    
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Room</p>
                          <p className="font-bold text-lg">{safeCheckInStatus.room?.roomNumber || 'N/A'} ({safeCheckInStatus.room?.type || 'N/A'})</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <Key className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Key Card</p>
                          <p className="font-semibold">{safeCheckInStatus.keyCardNumber || 'Not assigned'}</p>
                        </div>
                      </div>
                      
                      {safeCheckInStatus.checkInTime && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Checked in</p>
                            <p className="font-semibold">{new Date(safeCheckInStatus.checkInTime).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                      
                      {safeCheckInStatus.booking && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Booking</p>
                            <p className="font-semibold">{safeCheckInStatus.booking.bookingNumber || 'N/A'}</p>
                            <p className="text-sm text-gray-500">Checkout: {new Date(safeCheckInStatus.booking.checkOut).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowCheckOutModal(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <LogOut className="w-5 h-5" />
                    Check Out
                  </button>
                  <button
                    onClick={handleGetReceipt}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <FileText className="w-5 h-5" />
                    Get Receipt
                  </button>
                </div>
              </div>

              {/* Service Request Access */}
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Guest Services</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    While you're staying with us, you can request various services and amenities for your convenience.
                  </p>
                  <button 
                    onClick={() => navigate('/guest/services')} 
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Settings className="w-5 h-5" />
                    Request Services
                  </button>
                </div>
              </div>
            </motion.div>
          ) : safeCheckInStatus.status === 'checked_out' ? (
            // Checked-out: Show receipt only
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl p-8"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl shadow-lg mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Stay Completed</h2>
                <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                  Your stay has been completed. Thank you for choosing our hotel!
                </p>
                <button 
                  onClick={handleGetReceipt} 
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <FileText className="w-5 h-5" />
                  View Final Receipt
                </button>
              </div>
            </motion.div>
          ) : (
            // No check-in record found - show booking lookup
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-2xl p-8"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
                <Key className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Find Your Booking</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Enter your booking ID to start the check-in process or view your stay status.
              </p>

              {eligibleBookings.length > 0 && (
                <div className="text-left bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
                  <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    Your Confirmed Bookings
                  </h3>
                  <div className="space-y-3">
                    {eligibleBookings.map(b => (
                      <div key={b.id} className="bg-white rounded-xl border-2 border-indigo-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex-1">
                          <div className="font-bold text-lg text-gray-900 mb-1">{b.bookingNumber}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <MapPin className="w-4 h-4 text-indigo-600" />
                            <span>Room: {b.room?.number || 'N/A'} ({b.room?.type || 'N/A'})</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span>{new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</span>
                          </div>
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold mt-2">
                            <CheckCircle className="w-4 h-4" />
                            {b.status}
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={() => { setCheckInData({ ...checkInData, bookingId: b.id }); setShowCheckInModal(true); }}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                          >
                            <Key className="w-5 h-5" />
                            Select & Continue
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-w-lg mx-auto">
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="Enter your booking ID"
                    value={checkInData.bookingId}
                    onChange={(e) => setCheckInData({ ...checkInData, bookingId: e.target.value })}
                    className="block w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  />
                  <FileText className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                </div>
                <button 
                  onClick={() => setShowCheckInModal(true)} 
                  disabled={!checkInData.bookingId.trim() || eligibleBookings.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                >
                  <Key className="w-6 h-6" />
                  Start Check-in Process
                </button>
              </div>
            </div>
          </motion.div>
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
              <div className="pt-6 border-t flex flex-col sm:flex-row justify-end gap-3">
            <button 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-300"
              onClick={() => setShowCheckInModal(false)}
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
            <button 
              onClick={handleCheckIn} 
              disabled={processing || eligibleBookings.length === 0}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Check-in
                </>
              )}
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
                <div className="pt-6 border-t flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-300"
                  onClick={() => setShowCheckOutModal(false)}
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
                <button 
                  onClick={handleCheckOut} 
                  disabled={processing || (safeCheckInStatus?.overstay?.paymentStatus === 'pending_approval')}
                  title={safeCheckInStatus?.overstay?.paymentStatus === 'pending_approval' ? 'Cannot checkout: Awaiting admin approval for overstay payment' : ''}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5" />
                      Confirm Check-out
                    </>
                  )}
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
                    <p><strong>Name:</strong> {(() => {
                      const guest = receipt.guest || receipt.guestInfo || {};
                      const guestName = guest.firstName && guest.lastName 
                        ? `${guest.firstName} ${guest.lastName}`.trim()
                        : guest.fullName || guest.name || receipt.guestName || 'N/A';
                      return guestName;
                    })()}</p>
                    <p><strong>Email:</strong> {(() => {
                      const guest = receipt.guest || receipt.guestInfo || {};
                      return guest.email || receipt.guestEmail || 'N/A';
                    })()}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Stay Details</h4>
                    <p><strong>Room:</strong> {(() => {
                      const room = receipt.room || receipt.roomInfo || {};
                      const roomNumber = room.roomNumber || room.number || receipt.roomNumber || 'N/A';
                      const roomType = room.type || room.roomType || receipt.roomType || 'N/A';
                      return `${roomNumber} (${roomType})`;
                    })()}</p>
                    <p><strong>Check-in:</strong> {(() => {
                      const checkInDate = receipt.checkInDate || receipt.checkIn || receipt.booking?.checkIn;
                      return checkInDate ? new Date(checkInDate).toLocaleDateString() : 'N/A';
                    })()}</p>
                    <p><strong>Check-out:</strong> {(() => {
                      const checkOutDate = receipt.checkOutDate || receipt.checkOut || receipt.booking?.checkOut;
                      return checkOutDate ? new Date(checkOutDate).toLocaleDateString() : new Date().toLocaleDateString();
                    })()}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Charges Summary</h4>
                  <div className="space-y-2">
                    {(() => {
                      // Get pricing from booking data since check-in/out doesn't contain pricing
                      const bookingData = receipt.booking || {};
                      const costBreakdown = bookingData.costBreakdown || receipt.costBreakdown || {};
                      const charges = receipt.charges || receipt.billing || {};
                      
                      const baseCharge = costBreakdown.roomCost || 
                                        bookingData.roomBasePrice || 
                                        charges.baseCharge || 
                                        charges.roomCost || 
                                        charges.roomCharges || 
                                        charges.subtotal || 0;
                                        
                      const servicesCharges = costBreakdown.serviceFee || 
                                             costBreakdown.serviceCharges || 
                                             charges.servicesCharges || 
                                             charges.serviceCharges || 
                                             charges.services || 0;
                                             
                      const foodCharges = costBreakdown.foodCharges || 
                                         costBreakdown.food || 
                                         charges.foodCharges || 
                                         charges.food || 
                                         charges.foodAndBeverage || 0;
                                         
                      const taxes = costBreakdown.tax || 
                                    costBreakdown.taxes || 
                                    charges.taxes || 
                                    charges.tax || 
                                    charges.vat || 0;
                                    
                      const totalAmount = costBreakdown.total || 
                                          bookingData.totalPrice || 
                                          receipt.totalPrice ||
                                          charges.totalAmount || 
                                          charges.total || 
                                          charges.grandTotal || 
                                          (baseCharge + servicesCharges + foodCharges + taxes);

                      console.log('💰 Modal charges calculation:', {
                        bookingData,
                        costBreakdown,
                        baseCharge,
                        servicesCharges,
                        foodCharges,
                        taxes,
                        totalAmount
                      });

                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Room Charges:</span>
                            <span>LKR {Number(baseCharge).toLocaleString()}</span>
                          </div>
                          {servicesCharges > 0 && (
                            <div className="flex justify-between">
                              <span>Services:</span>
                              <span>LKR {Number(servicesCharges).toLocaleString()}</span>
                            </div>
                          )}
                          {foodCharges > 0 && (
                            <div className="flex justify-between">
                              <span>Food & Beverages:</span>
                              <span>LKR {Number(foodCharges).toLocaleString()}</span>
                            </div>
                          )}
                          {taxes > 0 && (
                            <div className="flex justify-between">
                              <span>Taxes:</span>
                              <span>LKR {Number(taxes).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total Amount:</span>
                            <span>LKR {Number(totalAmount).toLocaleString()}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="text-center text-gray-600 text-sm">
                  <p>Payment Method: {receipt.paymentMethod || receipt.booking?.paymentMethod || 'Credit Card'}</p>
                  <p>Issued: {receipt.issuedAt ? new Date(receipt.issuedAt).toLocaleString() : new Date().toLocaleString()}</p>
                </div>
                </div>
              )}
            <div className="pt-6 border-t flex flex-col sm:flex-row justify-end gap-3">
              <button 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-300"
                onClick={() => setShowReceiptModal(false)}
              >
                <X className="w-5 h-5" />
                Close
              </button>
              <button 
                onClick={downloadReceipt} 
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <FileText className="w-5 h-5" />
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
