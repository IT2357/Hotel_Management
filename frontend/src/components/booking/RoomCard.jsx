// src/components/booking/RoomCard.jsx
import React from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Users, Star } from 'lucide-react';

export default function RoomCard({
  room,
  isSelected,
  onSelect,
  calculateNights
}) {
  const handleClick = () => {
    onSelect(room);
  };

  return (
    <div
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-blue-500 bg-blue-50'
          : 'hover:shadow-lg hover:ring-1 hover:ring-gray-300'
      }`}
      onClick={handleClick}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{room.title}</CardTitle>
              <p className="text-gray-600">Room {room.roomNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'LKR'
                }).format(room.pricing.total)}
              </p>
              <p className="text-sm text-gray-500">per night</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>Up to {room.capacity} guests</span>
              </div>
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500" />
                <span>Room Type: {room.type}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {room.pricing.breakdown.roomCost > 0 && (
                <Badge variant="secondary">
                  Room Cost: {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'LKR'
                  }).format(room.pricing.breakdown.roomCost)}
                </Badge>
              )}
              {room.pricing.breakdown.taxes > 0 && (
                <Badge variant="secondary">
                  Tax: {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'LKR'
                  }).format(room.pricing.breakdown.taxes)}
                </Badge>
              )}
              {room.pricing.breakdown.serviceFees > 0 && (
                <Badge variant="secondary">
                  Service Fee: {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'LKR'
                  }).format(room.pricing.breakdown.serviceFees)}
                </Badge>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium">Total for {room.pricing.nights} nights:</p>
              <p className="text-lg font-bold text-green-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'LKR'
                }).format(room.pricing.total)}
              </p>
              <p className="text-xs text-gray-500">
                Includes all taxes and fees
              </p>
            </div>

            {isSelected && (
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Selected ✓
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
