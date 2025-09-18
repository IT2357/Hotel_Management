// 📁 frontend/pages/admin/AddRoomPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";

const amenityOptions = [
  "WiFi",
  "TV",
  "AC",
  "Minibar",
  "Safe",
  "Hairdryer",
  "CoffeeMaker",
  "Iron",
  "Desk",
  "Balcony",
  "PoolView",
  "OceanView",
  "RoomService",
  "DailyCleaning",
  "Bathrobes",
  "Slippers",
  "Jacuzzi",
];

const bedTypes = ["Single", "Double", "Queen", "King", "Twin", "Bunk"];
const views = ["City", "Garden", "Pool", "Ocean", "Mountain", "None"];
const cancellationPolicies = ["Flexible", "Moderate", "Strict", "NonRefundable"];

export default function AddRoomPage() {
  const navigate = useNavigate();

  const [roomData, setRoomData] = useState({
    title: "",
    description: "",
    roomNumber: "",
    type: "",
    floor: "",
    status: "Available",
    basePrice: "",
    size: "",
    bedType: "",
    view: "None",
    occupancy: { adults: 1, children: 0 },
    amenities: [],
    cancellationPolicy: "Moderate",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "adults" || name === "children") {
      setRoomData({
        ...roomData,
        occupancy: { ...roomData.occupancy, [name]: Number(value) },
      });
    } else if (amenityOptions.includes(name)) {
      if (checked) {
        setRoomData({ ...roomData, amenities: [...roomData.amenities, name] });
      } else {
        setRoomData({
          ...roomData,
          amenities: roomData.amenities.filter((a) => a !== name),
        });
      }
    } else {
      setRoomData({ ...roomData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      console.log("Sending token:", localStorage.getItem("token"));
      await adminService.createRoom(roomData);
      navigate("/admin/rooms");
    } catch (err) {
      console.error("Failed to create room:", err);
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6">Add New Room</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Room Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Room Title"
              name="title"
              value={roomData.title}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., Deluxe Oceanfront Suite"
            />
            <Input
              label="Room Number"
              name="roomNumber"
              value={roomData.roomNumber}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., 101"
            />
          </div>
          <Input
            label="Description"
            name="description"
            value={roomData.description}
            onChange={handleChange}
            textarea
            className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Describe the room features..."
            rows={4}
          />

          {/* Room Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Room Type"
              name="type"
              value={roomData.type}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select type</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Suite">Suite</option>
              <option value="Executive">Executive</option>
              <option value="Presidential">Presidential</option>
              <option value="Family">Family</option>
              <option value="Accessible">Accessible</option>
              <option value="Connecting">Connecting</option>
            </Select>
            <Input
              label="Floor"
              name="floor"
              type="number"
              value={roomData.floor}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., 5"
            />
            <Input
              label="Base Price ($)"
              name="basePrice"
              type="number"
              value={roomData.basePrice}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., 150"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Size (sqm)"
              name="size"
              type="number"
              value={roomData.size}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., 30"
            />
            <Select
              label="Bed Type"
              name="bedType"
              value={roomData.bedType}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select bed type</option>
              {bedTypes.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </div>

          {/* View and Occupancy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="View"
              name="view"
              value={roomData.view}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            >
              {views.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
            <Select
              label="Cancellation Policy"
              name="cancellationPolicy"
              value={roomData.cancellationPolicy}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            >
              {cancellationPolicies.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Adults"
              name="adults"
              type="number"
              value={roomData.occupancy.adults}
              onChange={handleChange}
              min={1}
              required
              className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., 2"
            />
            <Input
              label="Children"
              name="children"
              type="number"
              value={roomData.occupancy.children}
              onChange={handleChange}
              min={0}
              className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., 0"
            />
          </div>

          {/* Status */}
          <Select
            label="Status"
            name="status"
            value={roomData.status}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="Available">Available</option>
            <option value="Booked">Booked</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Cleaning">Cleaning</option>
            <option value="OutOfService">Out of Service</option>
          </Select>

          {/* Amenities Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-md">
              {amenityOptions.map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center space-x-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name={amenity}
                    checked={roomData.amenities.includes(amenity)}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/rooms")}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Adding..." : "+ Add Room"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}