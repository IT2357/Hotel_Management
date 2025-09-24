import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTitle from '../../hooks/useTitle';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import Modal from '../../components/ui/Modal.jsx';
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
  const [receipt, setReceipt] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [eligibleBookings, setEligibleBookings] = useState([]);

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
      // If no current check-in, status will be null - this is expected
      if (error.response?.status !== 404) {
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

      fetchCheckInStatus();

    } catch (error) {
      console.error('❌ Check-in failed:', error);
      enqueueSnackbar(error.response?.data?.message || 'Check-in failed', { variant: 'error' });
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
      const response = await checkInOutApi.post('/check-in-out/guest/check-out', {
        checkInOutId: safeCheckInStatus._id,
        damageReport: checkOutData.damageReport
      });
      console.log('✅ Check-out response:', response.data);
      enqueueSnackbar('Check-out successful!', { variant: 'success' });
      setShowCheckOutModal(false);
      fetchCheckInStatus();

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
- Base Charge: ₹${receipt.charges.baseCharge}
- Services: ₹${receipt.charges.servicesCharges}
- Food: ₹${receipt.charges.foodCharges}
- Taxes: ₹${receipt.charges.taxes}

Total Amount: ₹${receipt.charges.totalAmount}

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

        {safeCheckInStatus && safeCheckInStatus.status ? (
          // Handle different check-in statuses
          safeCheckInStatus.status === 'pre_checkin' ? (
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
                    <strong>Room:</strong> {checkInStatus.room?.number} ({checkInStatus.room?.type})
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
                      disabled={processing || checkInStatus.booking?.status !== 'Confirmed'}
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
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-semibold text-green-600 mb-1">Currently Checked In</h2>
                    <p className="text-gray-600">
                      Room {safeCheckInStatus.room.id || 'N/A'} ({safeCheckInStatus.room.type || 'N/A'}) • Checked in {new Date(safeCheckInStatus.checkInTime).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Key Card: {safeCheckInStatus.keyCardNumber || 'Not assigned'}
                    </p>
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
            // Fallback for other statuses
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <p className="text-gray-600">Status: {checkInStatus?.status || 'Unknown'}</p>
              </div>
            </div>
          )
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
                  disabled={!checkInData.bookingId.trim()}
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
              disabled={processing}
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
                  disabled={processing}
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
                      <span>₹{receipt.charges.baseCharge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Services:</span>
                      <span>₹{receipt.charges.servicesCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Food & Beverages:</span>
                      <span>₹{receipt.charges.foodCharges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes:</span>
                      <span>₹{receipt.charges.taxes}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total Amount:</span>
                      <span>₹{receipt.charges.totalAmount}</span>
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

      </div>
    </div>
  );
};

export default GuestCheckInOutPage;
