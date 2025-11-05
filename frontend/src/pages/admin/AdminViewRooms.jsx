 import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import roomService from "../../services/roomService";
import { Wifi, Tv, Snowflake, Coffee, Bath, BedDouble, User, Users, Eye, Image as ImageIcon, CheckCircle } from "lucide-react";

const amenityIcons = {
  WiFi: Wifi, TV: Tv, AC: Snowflake, CoffeeMaker: Coffee, Bath: Bath, Bed: BedDouble, User, Minibar: ImageIcon,
  Safe: CheckCircle, Hairdryer: Bath, Iron: Bath, Desk: Bath, Balcony: Bath, PoolView: Eye, OceanView: Eye,
  RoomService: Users, DailyCleaning: Users, Bathrobes: Bath, Slippers: Bath, Jacuzzi: Bath,
};

const statusChips = {
  Available: "bg-gradient-to-r from-green-400 to-emerald-500 text-white",
  Occupied: "bg-gradient-to-r from-red-400 to-pink-500 text-white",
  Maintenance: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
};

function GradientUnderline({ children }) {
  return (
    <span className="inline-block relative">
      {children}
      <span className="block h-1 w-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mt-1" />
    </span>
  );
}

export default function AdminViewRooms() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoom() {
      setLoading(true);
      try {
        const res = await roomService.getRoomById(id);
        setRoom(res.data?.data || res.data);
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [id]);

  if (loading) return <div className="flex justify-center py-16">Loading...</div>;
  if (!room) return <div className="flex justify-center py-16 text-red-600">Room not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-0 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg px-6 py-4">
            Room {room.roomNumber}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/admin/edit-room/${room._id}`)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg px-5 py-2 rounded-lg transition-all duration-200"
            >
              Edit Room
            </button>
            <button
              onClick={() => navigate("/admin/rooms")}
              className="border border-indigo-200 text-indigo-700 hover:border-indigo-500 hover:text-indigo-600 font-semibold px-5 py-2 rounded-lg transition-all duration-200 bg-white"
            >
              Back to Rooms
            </button>
          </div>
        </div>

        {/* Room Details */}
        <AccordionCard title={<GradientUnderline>Room Details</GradientUnderline>} open>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
            <div>
              <div className="font-semibold text-gray-700">Room Number</div>
              <div>{room.roomNumber}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Type</div>
              <div>{room.type}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Floor</div>
              <div>{room.floor}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Base Price</div>
              <div>{room.basePrice}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Size (sqm)</div>
              <div>{room.size}</div>
            </div>
            <div className="md:col-span-2">
              <div className="font-semibold text-gray-700">Description</div>
              <div>{room.description}</div>
            </div>
          </div>
        </AccordionCard>

        {/* Occupancy */}
        <AccordionCard title={<GradientUnderline>Occupancy</GradientUnderline>} open>
          <div className="grid grid-cols-2 gap-4 text-gray-800">
            <div>
              <div className="font-semibold text-gray-700">Adults</div>
              <div>{room.occupancy?.adults}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Children</div>
              <div>{room.occupancy?.children}</div>
            </div>
          </div>
        </AccordionCard>

        {/* Amenities */}
        <AccordionCard title={<GradientUnderline>Amenities</GradientUnderline>} open>
          <div className="flex flex-wrap gap-3">
            {room.amenities?.map((a) => {
              const Icon = amenityIcons[a] || CheckCircle;
              return (
                <span
                  key={a}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 shadow hover:scale-105 transition-all"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{a}</span>
                </span>
              );
            })}
          </div>
        </AccordionCard>

        {/* Images */}
        <AccordionCard title={<GradientUnderline>Images</GradientUnderline>} open>
          <div className="flex flex-wrap gap-4">
            {room.images?.map((img, idx) => (
              <div
                key={idx}
                className={`relative w-28 h-28 rounded-xl overflow-hidden shadow-lg border-4 ${
                  img.isPrimary
                    ? "border-indigo-400 animate-pulse"
                    : "border-gray-200"
                } hover:scale-105 transition-all`}
              >
                <img
                  src={img.url}
                  alt={img.caption || `Room image ${idx + 1}`}
                  className="object-cover w-full h-full"
                />
                {img.isPrimary && (
                  <span className="absolute top-2 left-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-2 py-1 rounded shadow">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        </AccordionCard>

        {/* View & Policy */}
        <AccordionCard title={<GradientUnderline>View & Policy</GradientUnderline>} open>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
            <div>
              <div className="font-semibold text-gray-700">View</div>
              <div>{room.view}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Cancellation Policy</div>
              <div>{room.cancellationPolicy}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Status</div>
              <span className={`inline-block px-3 py-1 rounded-full font-semibold text-xs shadow ${statusChips[room.status] || "bg-gray-200 text-gray-700"}`}>
                {room.status}
              </span>
            </div>
          </div>
        </AccordionCard>
      </div>
    </div>
  );
}

// Simple AccordionCard for read-only display
function AccordionCard({ title, open = true, children }) {
  return (
    <div className="rounded-2xl shadow-xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-purple-50 mb-4 transition-all duration-300">
      <div className="w-full flex items-center justify-between px-6 py-4 text-lg font-semibold text-gray-800 rounded-2xl bg-white/60">
        {title}
      </div>
      <div className="py-4 px-6">{children}</div>
    </div>
  );
}