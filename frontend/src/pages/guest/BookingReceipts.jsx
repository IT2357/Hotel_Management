import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { Calendar, MapPin, Users, CreditCard, Eye, Download, Star, Clock, ArrowLeft } from 'lucide-react';
import bookingService from '../../services/bookingService';

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
      
      // Create HTML content for the receipt
      const receiptHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hotel Receipt - ${receiptData.bookingNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              background: #f8f9fa;
              padding: 20px;
              color: #333;
            }
            
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 2px solid #e3f2fd;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            }
            
            .receipt-header {
              background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
              color: white;
              padding: 30px;
              text-align: center;
              position: relative;
            }
            
            .hotel-logo {
              font-size: 2.5em;
              font-weight: bold;
              margin-bottom: 10px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .hotel-tagline {
              font-size: 1.1em;
              opacity: 0.9;
              font-style: italic;
            }
            
            .receipt-body {
              padding: 40px;
            }
            
            .receipt-title {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 3px solid #e3f2fd;
            }
            
            .receipt-title h1 {
              color: #1976d2;
              font-size: 2.2em;
              margin-bottom: 5px;
            }
            
            .receipt-title p {
              color: #666;
              font-size: 1.1em;
            }
            
            .info-section {
              margin-bottom: 30px;
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #1976d2;
            }
            
            .info-section h3 {
              color: #1976d2;
              margin-bottom: 15px;
              font-size: 1.3em;
              border-bottom: 1px solid #e0e0e0;
              padding-bottom: 8px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
            }
            
            .info-item {
              background: white;
              padding: 12px;
              border-radius: 6px;
              border: 1px solid #e0e0e0;
            }
            
            .info-label {
              font-weight: bold;
              color: #555;
              font-size: 0.9em;
              margin-bottom: 4px;
            }
            
            .info-value {
              color: #333;
              font-size: 1.1em;
            }
            
            .pricing-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .pricing-table th,
            .pricing-table td {
              padding: 15px;
              text-align: left;
              border-bottom: 1px solid #e0e0e0;
            }
            
            .pricing-table th {
              background: #1976d2;
              color: white;
              font-weight: bold;
            }
            
            .pricing-table tr:last-child td {
              border-bottom: none;
            }
            
            .pricing-table .total-row {
              background: #e3f2fd;
              font-weight: bold;
              font-size: 1.1em;
            }
            
            .pricing-table .total-row td {
              border-top: 2px solid #1976d2;
            }
            
            .status-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 0.9em;
            }
            
            .status-confirmed {
              background: #e8f5e8;
              color: #2e7d32;
              border: 2px solid #4caf50;
            }
            
            .status-pending {
              background: #fff3e0;
              color: #ef6c00;
              border: 2px solid #ff9800;
            }
            
            .receipt-footer {
              background: #f8f9fa;
              padding: 25px;
              text-align: center;
              border-top: 2px solid #e3f2fd;
            }
            
            .footer-note {
              color: #666;
              font-size: 0.95em;
              line-height: 1.6;
              margin-bottom: 15px;
            }
            
            .contact-info {
              display: flex;
              justify-content: center;
              gap: 30px;
              flex-wrap: wrap;
              margin-top: 15px;
            }
            
            .contact-item {
              color: #1976d2;
              font-weight: bold;
              font-size: 0.9em;
            }
            
            @media print {
              body { background: white; padding: 0; }
              .receipt-container { box-shadow: none; border: 1px solid #ccc; }
            }
            
            @media (max-width: 600px) {
              .info-grid { grid-template-columns: 1fr; }
              .contact-info { flex-direction: column; gap: 10px; }
              .receipt-body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <div class="hotel-logo">${receiptData.hotelName}</div>
              <div class="hotel-tagline">Luxury • Comfort • Excellence</div>
            </div>
            
            <div class="receipt-body">
              <div class="receipt-title">
                <h1>BOOKING RECEIPT</h1>
                <p>Receipt #${receiptData.receiptNumber}</p>
                <p>Issued on ${receiptData.issueDate} at ${receiptData.issueTime}</p>
              </div>
              
              <div class="info-section">
                <h3>📍 Hotel Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Address</div>
                    <div class="info-value">${receiptData.hotelAddress}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value">${receiptData.hotelPhone}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${receiptData.hotelEmail}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Website</div>
                    <div class="info-value">${receiptData.hotelWebsite}</div>
                  </div>
                </div>
              </div>
              
              <div class="info-section">
                <h3>🏨 Booking Details</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Booking Number</div>
                    <div class="info-value">${receiptData.bookingNumber}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Booking Date</div>
                    <div class="info-value">${receiptData.bookingDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value">
                      <span class="status-badge ${receiptData.status.includes('Confirmed') || receiptData.status.includes('Completed') ? 'status-confirmed' : 'status-pending'}">
                        ${receiptData.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="info-section">
                <h3>🛏️ Room & Stay Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Room Type</div>
                    <div class="info-value">${receiptData.roomTitle}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Room Number</div>
                    <div class="info-value">${receiptData.roomNumber}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Check-in Date</div>
                    <div class="info-value">${receiptData.checkInDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Check-out Date</div>
                    <div class="info-value">${receiptData.checkOutDate}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Number of Nights</div>
                    <div class="info-value">${receiptData.nights} night${receiptData.nights > 1 ? 's' : ''}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Number of Guests</div>
                    <div class="info-value">${receiptData.guests} guest${receiptData.guests > 1 ? 's' : ''}</div>
                  </div>
                </div>
              </div>
              
              <div class="info-section">
                <h3>💰 Pricing Breakdown</h3>
                <table class="pricing-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Room Charges:</td>
                      <td>LKR ${receiptData.roomBasePrice.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Food Charges:</td>
                      <td>LKR ${receiptData.foodCharges.toLocaleString()}</td>
                    </tr>
                    ${receiptData.tax > 0 ? `
                    <tr>
                      <td>Tax:</td>
                      <td>LKR ${receiptData.tax.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                    ${receiptData.serviceFee > 0 ? `
                    <tr>
                      <td>Service Fee:</td>
                      <td>LKR ${receiptData.serviceFee.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                      <td><strong>Total Amount:</strong></td>
                      <td><strong>LKR ${receiptData.totalAmount.toLocaleString()}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="info-section">
                <h3>💳 Payment Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Payment Method</div>
                    <div class="info-value">${receiptData.paymentMethod}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Payment Status</div>
                    <div class="info-value">
                      <span class="status-badge ${receiptData.paymentStatus === 'Paid' ? 'status-confirmed' : 'status-pending'}">
                        ${receiptData.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              ${receiptData.specialRequests !== 'None' ? `
                <div class="info-section">
                  <h3>📝 Special Requests</h3>
                  <div class="info-item">
                    <div class="info-value">${receiptData.specialRequests}</div>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <div class="receipt-footer">
              <div class="footer-note">
                <strong>Thank you for choosing ${receiptData.hotelName}!</strong><br>
                We hope you enjoyed your stay with us. For any queries regarding this receipt, 
                please contact our customer service team with your booking reference number.
              </div>
              
              <div class="contact-info">
                <div class="contact-item">📞 ${receiptData.hotelPhone}</div>
                <div class="contact-item">📧 ${receiptData.hotelEmail}</div>
                <div class="contact-item">🌐 ${receiptData.hotelWebsite}</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create and download the receipt
      const blob = new Blob([receiptHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt_${receiptData.bookingNumber}_${receiptData.hotelName.replace(/\s+/g, '_')}.html`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      alert('Receipt downloaded successfully! You can open the HTML file in any web browser to view or print it.');
      
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt. Please try again.');
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
            Download official receipts for your completed and confirmed bookings
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
                          Download Receipt
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