import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { Calendar, MapPin, Users, CreditCard, Eye, Download, Star, Clock, ArrowLeft } from 'lucide-react';
import bookingService from '../../services/bookingService';
import html2pdf from 'html2pdf.js';

export default function BookingReceipts() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('completed');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingService.getUserBookings({
        page: 1,
        limit: 50
      });

      if (response.success && response.data) {
        const bookingsData = response.data.bookings || response.data;
        // Filter only completed and confirmed bookings for receipts
        const receiptEligibleBookings = Array.isArray(bookingsData) 
          ? bookingsData.filter(booking => 
              booking.status === 'Completed' || 
              booking.status === 'Confirmed' ||
              booking.status === 'Approved - Payment Processing'
            )
          : [];
        setBookings(receiptEligibleBookings);
      } else {
        setBookings(getMockReceiptBookings());
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (error.response?.status === 401) {
        setError('Please log in to view your receipts. Using sample data for demonstration.');
      } else {
        setError('Failed to load receipts. Please try again.');
      }
      setBookings(getMockReceiptBookings());
    } finally {
      setLoading(false);
    }
  };

  // const getMockReceiptBookings = () => {
  //   return [
  //     {
  //       id: 1,
  //       bookingNumber: "BK2025001",
  //       roomTitle: "Deluxe Ocean View Suite",
  //       roomNumber: "501",
  //       checkIn: "2025-02-15",
  //       checkOut: "2025-02-18",
  //       guests: 2,
  //       totalPrice: 45000,
  //       status: "Completed",
  //       paymentStatus: "completed",
  //       paymentMethod: "card",
  //       specialRequests: "Late check-out if possible",
  //       createdAt: "2025-02-10T10:30:00Z",
  //       costBreakdown: {
  //         nights: 3,
  //         roomCost: 36900,
  //         taxes: 5400,
  //         serviceCharge: 2700,
  //         total: 45000
  //       }
  //     },
  //     {
  //       id: 3,
  //       bookingNumber: "BK2024008",
  //       roomTitle: "Garden Villa",
  //       roomNumber: "GV1",
  //       checkIn: "2024-12-20",
  //       checkOut: "2024-12-25",
  //       guests: 4,
  //       totalPrice: 110000,
  //       status: "Completed",
  //       paymentStatus: "completed",
  //       paymentMethod: "card",
  //       specialRequests: "Anniversary celebration setup",
  //       createdAt: "2024-12-15T14:20:00Z",
  //       costBreakdown: {
  //         nights: 5,
  //         roomCost: 90200,
  //         taxes: 13200,
  //         serviceCharge: 6600,
  //         total: 110000
  //       }
  //     },
  //     {
  //       id: 5,
  //       bookingNumber: "BK2024012",
  //       roomTitle: "Executive Business Room",
  //       roomNumber: "301",
  //       checkIn: "2024-11-10",
  //       checkOut: "2024-11-12",
  //       guests: 1,
  //       totalPrice: 17000,
  //       status: "Confirmed",
  //       paymentStatus: "completed",
  //       paymentMethod: "card",
  //       specialRequests: "High floor preferred",
  //       createdAt: "2024-11-05T09:15:00Z",
  //       costBreakdown: {
  //         nights: 2,
  //         roomCost: 13940,
  //         taxes: 2040,
  //         serviceCharge: 1020,
  //         total: 17000
  //       }
  //     }
  //   ];
  // };

  const generateReceipt = (booking) => {
    const receiptData = {
      // Hotel Information
      hotelName: "  Valdore HMS",
      hotelAddress: "Punnalakadduvan, Jaffna 03, Sri Lanka",
      hotelPhone: "+94 77 234 5678",
      hotelEmail: "reservations@valdorehotel.lk",
      hotelWebsite: "www.valdorehotel.lk",

      // Receipt Details
      receiptNumber: `RCP-${booking.bookingNumber}`,
      issueDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      issueTime: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      
      // Booking Information
      bookingNumber: booking.bookingNumber,
      bookingDate: new Date(booking.createdAt || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      
      // Room & Stay Details
      roomTitle: booking.roomTitle,
      roomNumber: booking.roomNumber,
      checkInDate: new Date(booking.checkIn).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      checkOutDate: new Date(booking.checkOut).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      nights: booking.costBreakdown?.nights || getNights(booking.checkIn, booking.checkOut),
      guests: booking.guests || booking.guestCount?.adults || 1,
      
      // Pricing Details - Using AdminBookingsPage structure
      roomBasePrice: booking.roomBasePrice || booking.costBreakdown?.roomCost || (booking.totalPrice * 0.75),
      foodCharges: booking.costBreakdown?.subtotal || 0,
      tax: booking.costBreakdown?.tax || (booking.totalPrice * 0.12),
      serviceFee: booking.costBreakdown?.serviceFee || (booking.totalPrice * 0.08),
      totalAmount: booking.costBreakdown?.total || booking.totalPrice,
      
      // Payment Information
      paymentMethod: booking.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash Payment',
      paymentStatus: booking.status === 'Completed' ? 'Paid' : 
                    booking.status === 'Confirmed' ? 'Paid' : 'Processing',
      
      // Additional Details
      specialRequests: booking.specialRequests || 'None',
      status: getStatusDisplayText(booking.status)
    };

    return receiptData;
  };

  const downloadReceipt = async (booking) => {
    try {
      const receiptData = generateReceipt(booking);
      console.log('Receipt Data:', receiptData); // Debug log
      
      // Create a simpler HTML structure that's more PDF-friendly
      const receiptHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white; color: #333;">
          
          <!-- Header -->
          <div style="background: #1976d2; color: white; padding: 30px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">${receiptData.hotelName}</h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Luxury • Comfort • Excellence</p>
          </div>
          
          <!-- Title -->
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #e3f2fd;">
            <h1 style="color: #1976d2; font-size: 24px; margin: 0 0 10px 0;">BOOKING RECEIPT</h1>
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
          
          <!-- Booking Details -->
          <div style="margin-bottom: 25px; background: #f8f9fa; padding: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; vertical-align: top; width: 25%;"><strong>Booking Number:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.bookingNumber}</td>
                <td style="padding: 8px; vertical-align: top; width: 25%;"><strong>Booking Date:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.bookingDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px; vertical-align: top;"><strong>Status:</strong></td>
                <td style="padding: 8px; vertical-align: top;">
                  <span style="background: ${receiptData.status.includes('Confirmed') || receiptData.status.includes('Completed') ? '#e8f5e8' : '#fff3e0'}; 
                               color: ${receiptData.status.includes('Confirmed') || receiptData.status.includes('Completed') ? '#2e7d32' : '#ef6c00'}; 
                               padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: bold;">
                    ${receiptData.status}
                  </span>
                </td>
                <td style="padding: 8px; vertical-align: top;"></td>
                <td style="padding: 8px; vertical-align: top;"></td>
              </tr>
            </table>
          </div>
          
          <!-- Room & Stay Information -->
          <div style="margin-bottom: 25px; background: #f8f9fa; padding: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Room & Stay Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; vertical-align: top; width: 25%;"><strong>Room Type:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.roomTitle}</td>
                <td style="padding: 8px; vertical-align: top; width: 25%;"><strong>Room Number:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.roomNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px; vertical-align: top;"><strong>Check-in Date:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.checkInDate}</td>
                <td style="padding: 8px; vertical-align: top;"><strong>Check-out Date:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.checkOutDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px; vertical-align: top;"><strong>Number of Nights:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.nights} night${receiptData.nights > 1 ? 's' : ''}</td>
                <td style="padding: 8px; vertical-align: top;"><strong>Number of Guests:</strong></td>
                <td style="padding: 8px; vertical-align: top;">${receiptData.guests} guest${receiptData.guests > 1 ? 's' : ''}</td>
              </tr>
            </table>
          </div>
          
          <!-- Pricing Breakdown -->
          <div style="margin-bottom: 25px; background: #f8f9fa; padding: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Pricing Breakdown</h3>
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
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">LKR ${receiptData.roomBasePrice.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #ddd;">Food Charges:</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">LKR ${receiptData.foodCharges.toLocaleString()}</td>
                </tr>
                ${receiptData.tax > 0 ? `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #ddd;">Tax:</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">LKR ${receiptData.tax.toLocaleString()}</td>
                </tr>
                ` : ''}
                ${receiptData.serviceFee > 0 ? `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #ddd;">Service Fee:</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #ddd;">LKR ${receiptData.serviceFee.toLocaleString()}</td>
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
                  <span style="background: ${receiptData.paymentStatus === 'Paid' ? '#e8f5e8' : '#fff3e0'}; 
                               color: ${receiptData.paymentStatus === 'Paid' ? '#2e7d32' : '#ef6c00'}; 
                               padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: bold;">
                    ${receiptData.paymentStatus}
                  </span>
                </td>
              </tr>
            </table>
          </div>
          
          ${receiptData.specialRequests !== 'None' ? `
          <!-- Special Requests -->
          <div style="margin-bottom: 25px; background: #f8f9fa; padding: 20px;">
            <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Special Requests</h3>
            <p style="margin: 0; padding: 10px; background: white; border: 1px solid #ddd; border-radius: 4px;">${receiptData.specialRequests}</p>
          </div>
          ` : ''}
          
          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 25px; text-align: center; border-top: 2px solid #e3f2fd; margin-top: 30px;">
            <p style="color: #666; margin: 0 0 15px 0; line-height: 1.6;">
              <strong>Thank you for choosing ${receiptData.hotelName}!</strong><br>
              We hope you enjoyed your stay with us. For any queries regarding this receipt, 
              please contact our customer service team with your booking reference number.
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
        filename: `Receipt_${receiptData.bookingNumber}_${receiptData.hotelName.replace(/\s+/g, '_')}.pdf`,
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
      alert('Receipt downloaded successfully as PDF!');
      
    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      alert('Failed to generate PDF receipt. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Completed') return 'bg-blue-100 text-blue-800';
    if (status === 'Confirmed') return 'bg-green-100 text-green-800';
    if (status === 'Approved - Payment Processing') return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplayText = (status) => {
    if (status === 'Completed') return 'Completed';
    if (status === 'Confirmed') return 'Confirmed';
    if (status === 'Approved - Payment Processing') return 'Payment Processing';
    return status;
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'LKR 0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    try {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'completed') return booking.status === 'Completed';
    if (filter === 'confirmed') return booking.status === 'Confirmed';
    if (filter === 'processing') return booking.status === 'Approved - Payment Processing';
    return false;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-indigo-800 mb-2">
            📄 Booking Receipts
          </h1>
          <p className="text-gray-600">
            Download official receipts as PDF for your completed and confirmed bookings
          </p>
          <div className="mt-4">
            <Button
              onClick={fetchBookings}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh Receipts'}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <p className="text-blue-800">{error}</p>
                {error.includes('log in') && (
                  <div className="mt-3">
                    <Button onClick={() => window.location.href = '/login'}>
                      Sign In to View Your Receipts
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: 'all', label: 'All Receipts' },
            { key: 'completed', label: 'Completed Stays' },
            { key: 'confirmed', label: 'Confirmed Bookings' },
            { key: 'processing', label: 'Payment Processing' }
          ].map((status) => (
            <Button
              key={status.key}
              variant={filter === status.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status.key)}
            >
              {status.label}
            </Button>
          ))}
        </div>

        {/* Empty State */}
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Receipts Available
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You don't have any completed or confirmed bookings yet."
                : `No ${filter} bookings found for receipt generation.`
              }
            </p>
            <Button onClick={() => window.location.href = '/guest/bookings'}>
              View All Bookings
            </Button>
          </Card>
        ) : (
          /* Receipts List */
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <Card key={booking._id || booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="md:flex">
                  {/* Receipt Icon */}
                  <div className="md:w-1/6 bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center p-8">
                    <div className="text-center">
                      <Download className="h-12 w-12 text-indigo-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-indigo-700">Receipt Ready</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 md:w-5/6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-1">
                          {booking.roomTitle}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Booking #{booking.bookingNumber} • Room {booking.roomNumber}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusDisplayText(booking.status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Check-in</p>
                          <p className="text-sm text-gray-600">{formatDate(booking.checkIn)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Check-out</p>
                          <p className="text-sm text-gray-600">{formatDate(booking.checkOut)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Guests</p>
                          <p className="text-sm text-gray-600">{booking.guests || 1}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Total Paid</p>
                          <p className="text-sm text-gray-600">{formatPrice(booking.totalPrice)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>
                          {booking.costBreakdown?.nights || getNights(booking.checkIn, booking.checkOut)} nights • 
                          Payment via {booking.paymentMethod === 'card' ? 'Card' : 'Cash'} • 
                          Booked on {formatDate(booking.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Button
                          onClick={() => downloadReceipt(booking)}
                          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF Receipt
                        </Button>
                      </div>
                    </div>

                    {booking.specialRequests && (
                      <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-800 mb-1">
                          Special Requests:
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.specialRequests}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredBookings.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {filteredBookings.length}
              </div>
              <div className="text-gray-600">Available Receipts</div>
            </Card>
            
            <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {filteredBookings.filter(b => b.status === 'Completed').length}
              </div>
              <div className="text-gray-600">Completed Stays</div>
            </Card>
            
            <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {filteredBookings.reduce((sum, b) => sum + (b.costBreakdown?.nights || getNights(b.checkIn, b.checkOut)), 0)}
              </div>
              <div className="text-gray-600">Total Nights</div>
            </Card>
            
            <Card className="p-6 text-center bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {formatPrice(filteredBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0))}
              </div>
              <div className="text-gray-600">Total Amount</div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}