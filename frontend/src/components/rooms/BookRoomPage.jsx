// 📁 frontend/pages/rooms/BookRoom.jsx
import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/rooms/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/rooms/ui/popover";
import { Calendar } from "@/components/rooms/ui/calendar";

const BookRoomPage = ({ room }) => {
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [addFood, setAddFood] = useState(false);

  const totalNights = checkInDate && checkOutDate ? differenceInDays(checkOutDate, checkInDate) : 0;
  const totalPrice = totalNights * room.price * rooms;

  if (!room) return <div className="p-6 text-center">Room data not available</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* 1. Page Header */}
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{room.name}</h1>
          <p className="text-xl text-primary mt-1">${room.price}/night</p>
        </div>
        {room.images?.[0] && (
          <img src={room.images[0]} alt={room.name} className="w-32 h-24 rounded-lg object-cover" />
        )}
      </header>

      {/* 2. Room Details */}
      <section className="space-y-6">
        {/* Image gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {room.images?.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${room.name} ${idx + 1}`}
              className="w-full h-48 object-cover rounded-lg"
            />
          ))}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Room Details</h2>
          <p className="text-muted-foreground">{room.description}</p>
          <ul className="flex flex-wrap gap-4 mt-2">
            {room.amenities?.map((amenity, idx) => (
              <li key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                {amenity}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            Policies: Check-in: {room.checkIn || "14:00"} | Check-out: {room.checkOut || "11:00"} | Cancellation: {room.cancellation || "Flexible"}
          </p>
        </div>
      </section>

      {/* 3. Booking Form */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Booking Details</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Check-in */}
          <div>
            <label className="block mb-1 font-medium">Check-in</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkInDate ? format(checkInDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={checkInDate}
                  onSelect={setCheckInDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check-out */}
          <div>
            <label className="block mb-1 font-medium">Check-out</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkOutDate ? format(checkOutDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={checkOutDate}
                  onSelect={setCheckOutDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests & Rooms */}
          <div className="space-y-2">
            <label className="block font-medium">Guests</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-1/3 px-2 py-1 border rounded"
                placeholder="Adults"
              />
              <input
                type="number"
                min="0"
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="w-1/3 px-2 py-1 border rounded"
                placeholder="Children"
              />
              <input
                type="number"
                min="1"
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="w-1/3 px-2 py-1 border rounded"
                placeholder="Rooms"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Total Nights: {totalNights}</p>
            <p className="text-sm font-semibold mt-1">Total Price: ${totalPrice}</p>
          </div>
        </div>
      </section>

      {/* 4. Personal Details */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Personal Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          <textarea
            placeholder="Special Requests (Optional)"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </section>

      {/* 5. Future Food Option */}
      <section className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={addFood}
          onChange={() => setAddFood(!addFood)}
          id="add-food"
          className="w-4 h-4"
        />
        <label htmlFor="add-food" className="text-sm font-medium">
          Add Food (Coming Soon)
        </label>
      </section>

      {/* Book Button */}
      <div className="mt-6">
        <Button
          variant="luxury"
          size="lg"
          className="w-full"
          disabled={!checkInDate || !checkOutDate || !fullName || !email || !phone}
          onClick={() => alert("Booking confirmed! (Integration pending)")}
        >
          Confirm Booking
        </Button>
      </div>
    </div>
  );
};

export default BookRoomPage;
