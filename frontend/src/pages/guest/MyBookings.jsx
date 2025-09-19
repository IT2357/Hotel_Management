import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading bookings
    setTimeout(() => {
      setBookings([
        {
          id: 1,
          roomType: 'Deluxe Suite',
          checkIn: '2024-01-15',
          checkOut: '2024-01-18',
          status: 'confirmed',
          total: 450,
          guests: 2
        },
        {
          id: 2,
          roomType: 'Executive Room',
          checkIn: '2024-02-01',
          checkOut: '2024-02-03',
          status: 'pending',
          total: 280,
          guests: 1
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">My Bookings</h1>
              <p className="text-xl opacity-90">Manage your reservations and upcoming stays</p>
            </div>
            <Link
              to="/guest/dashboard"
              className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-300 font-semibold"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Bookings Found</h2>
            <p className="text-gray-600 mb-8">You haven't made any bookings yet.</p>
            <Link
              to="/rooms"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span>Book Your Stay</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 p-8 border border-gray-100"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <div className="text-3xl mr-4">🏨</div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{booking.roomType}</h3>
                        <p className="text-gray-600">Booking #{booking.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Check-in</div>
                        <div className="font-semibold text-gray-800">{booking.checkIn}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Check-out</div>
                        <div className="font-semibold text-gray-800">{booking.checkOut}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Guests</div>
                        <div className="font-semibold text-gray-800">{booking.guests} guest{booking.guests > 1 ? 's' : ''}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-800">
                        ${booking.total}
                        <span className="text-sm text-gray-600 font-normal"> total</span>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 md:mt-0 md:ml-8 flex flex-col gap-3">
                    <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                      View Details
                    </button>
                    <button className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                      Modify Booking
                    </button>
                    {booking.status === 'confirmed' && (
                      <button className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}