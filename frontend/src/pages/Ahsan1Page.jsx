import React from 'react';
import { Link } from 'react-router-dom';

const Ahsan1Page = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-8">Ahsan1 - Room Related Pages</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/admin/rooms" className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Admin Rooms</h2>
            <p className="text-gray-600">Manage all hotel rooms, view, edit, and delete rooms.</p>
          </Link>
          <Link to="/admin/add-room" className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Add Room</h2>
            <p className="text-gray-600">Add new rooms to the hotel system.</p>
          </Link>
          <Link to="/rooms" className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Rooms Page</h2>
            <p className="text-gray-600">Browse and book available rooms.</p>
          </Link>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Edit Room</h2>
            <p className="text-gray-600">Edit existing rooms (requires room ID).</p>
            <p className="text-sm text-gray-500 mt-2">Navigate from Admin Rooms page</p>
          </div>
          <Link to="/components/rooms/BookRoomPage" className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Book Room</h2>
            <p className="text-gray-600">Book a specific room.</p>
          </Link>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Other Room Components</h2>
            <p className="text-gray-600">CompareModal, FilterSidebar, FloorSelector, HotelHero, RoomCard, RoomModal, ViewToggle</p>
            <p className="text-sm text-gray-500 mt-2">Located in components/rooms/</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ahsan1Page;