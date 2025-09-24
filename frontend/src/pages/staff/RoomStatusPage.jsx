import React, { useState, useEffect } from 'react';
import useTitle from '../../hooks/useTitle';
import { FiHome, FiUsers, FiClock, FiCheckCircle, FiXCircle, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export default function RoomStatusPage() {
  useTitle('Room Status');

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      // For now, we'll create mock data since the backend doesn't have this endpoint
      // In a real implementation, this would call an API endpoint
      const mockRooms = [
        {
          id: '1',
          roomNumber: '101',
          type: 'Deluxe Suite',
          status: 'Occupied',
          guest: 'John Doe',
          checkOut: '2025-09-25',
          floor: 1
        },
        {
          id: '2',
          roomNumber: '102',
          type: 'Standard Room',
          status: 'Available',
          guest: null,
          checkOut: null,
          floor: 1
        },
        {
          id: '3',
          roomNumber: '201',
          type: 'Executive Suite',
          status: 'Maintenance',
          guest: null,
          checkOut: null,
          floor: 2
        },
        {
          id: '4',
          roomNumber: '202',
          type: 'Standard Room',
          status: 'Cleaning',
          guest: null,
          checkOut: null,
          floor: 2
        }
      ];

      setRooms(mockRooms);
      setError(null);
    } catch (err) {
      setError('Failed to load room status');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'available':
        return <FiCheckCircle className="text-green-500" />;
      case 'occupied':
        return <FiUsers className="text-red-500" />;
      case 'maintenance':
        return <FiAlertTriangle className="text-yellow-500" />;
      case 'cleaning':
        return <FiClock className="text-blue-500" />;
      default:
        return <FiXCircle className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'cleaning':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === 'Available').length,
    occupied: rooms.filter(r => r.status === 'Occupied').length,
    maintenance: rooms.filter(r => r.status === 'Maintenance').length,
    cleaning: rooms.filter(r => r.status === 'Cleaning').length,
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <FiRefreshCw className="animate-spin text-2xl text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Room Status Overview</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <FiHome className="text-2xl text-gray-600 mr-3" />
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Rooms</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <FiCheckCircle className="text-2xl text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <FiUsers className="text-2xl text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
              <div className="text-sm text-gray-600">Occupied</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <FiAlertTriangle className="text-2xl text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
              <div className="text-sm text-gray-600">Maintenance</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <FiClock className="text-2xl text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.cleaning}</div>
              <div className="text-sm text-gray-600">Cleaning</div>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">Room {room.roomNumber}</h3>
                  <p className="text-sm text-gray-600">{room.type}</p>
                  <p className="text-xs text-gray-500">Floor {room.floor}</p>
                </div>
                {getStatusIcon(room.status)}
              </div>

              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                {room.status}
              </div>

              {room.guest && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm"><strong>Guest:</strong> {room.guest}</p>
                  {room.checkOut && (
                    <p className="text-sm"><strong>Check-out:</strong> {room.checkOut}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
