import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function RoomReservationPage() {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => setIsVisible(true), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-600">Room Reservations</h1>
          <p className="mt-3 text-gray-700 text-lg">Plan your stay with VALDOR. This page is a guest entry point; operational workflows are handled by the room management team.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800">Make a Reservation</h2>
            <p className="mt-2 text-gray-600">Choose your dates, room type, and preferences. This is a placeholder; booking actions are integrated via the hotel workflow.</p>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <input className="border rounded-lg px-4 py-3" type="date" placeholder="Check-in"/>
              <input className="border rounded-lg px-4 py-3" type="date" placeholder="Check-out"/>
              <select className="border rounded-lg px-4 py-3">
                <option>Room type</option>
                <option>Deluxe</option>
                <option>Suite</option>
                <option>Standard</option>
              </select>
              <button className="mt-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:from-amber-700 hover:to-orange-700 transition-all">Check Availability</button>
            </div>

            <p className="mt-3 text-sm text-gray-500">Note: Final reservation flow is managed separately. This page links guests to the correct process.</p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img className="w-full h-72 object-cover" src="https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1200&auto=format&fit=crop" alt="Room" />
          </div>
        </div>

        <div className="mt-10 flex gap-3">
          <Link to="/dashboard" className="px-6 py-3 rounded-full bg-white border text-gray-800 hover:bg-gray-100">Back to Dashboard</Link>
          <Link to="/menu" className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-white">Explore Menu</Link>
        </div>
      </div>
    </div>
  );
}
