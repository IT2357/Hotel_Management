import React, { useState, useEffect } from 'react';
import { Tabs } from 'flowbite-react';
import CheckInForm from '../../components/checkin/CheckInForm';
import CheckOutForm from '../../components/checkout/CheckOutForm';
import { getCurrentGuests } from '../../services/checkInOutService';

const CheckInOutPage = () => {
  const [currentGuests, setCurrentGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);

  useEffect(() => {
    fetchCurrentGuests();
  }, []);

  const fetchCurrentGuests = async () => {
    try {
      const guests = await getCurrentGuests();
      setCurrentGuests(guests);
    } catch (error) {
      console.error('Failed to fetch current guests', error);
    }
  };

  const handleCheckInSuccess = (newCheckIn) => {
    fetchCurrentGuests();
  };

  const handleCheckOutSuccess = (updatedCheckOut) => {
    fetchCurrentGuests();
    setSelectedGuest(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Check-In & Check-Out</h1>
      <Tabs.Group style="default">
        <Tabs.Item title="Check-In">
          <CheckInForm onSuccess={handleCheckInSuccess} />
        </Tabs.Item>
        <Tabs.Item title="Check-Out">
          <div>
            <h2 className="text-xl font-semibold mb-4">Select a Guest to Check Out</h2>
            <ul className="space-y-2">
              {currentGuests.map((guest) => (
                <li key={guest._id}>
                  <button
                    onClick={() => setSelectedGuest(guest)}
                    className="w-full text-left p-2 rounded-md hover:bg-gray-100"
                  >
                    {guest.guest.firstName} {guest.guest.lastName} - Room {guest.room.number}
                  </button>
                </li>
              ))}
            </ul>
            {selectedGuest && (
              <div className="mt-6">
                <CheckOutForm checkInRecord={selectedGuest} onSuccess={handleCheckOutSuccess} />
              </div>
            )}
          </div>
        </Tabs.Item>
      </Tabs.Group>
    </div>
  );
};

export default CheckInOutPage;
