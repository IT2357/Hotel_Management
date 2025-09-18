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
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-indigo-600 mb-6">Add New Room</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow max-w-3xl mx-auto space-y-4"
      >
        {error && <p className="text-red-600">{error}</p>}

        <Input
          label="Title"
          name="title"
          value={roomData.title}
          onChange={handleChange}
          required
        />
        <Input
          label="Description"
          name="description"
          value={roomData.description}
          onChange={handleChange}
          textarea
        />
        <Input
          label="Room Number"
          name="roomNumber"
          value={roomData.roomNumber}
          onChange={handleChange}
          required
        />
        <Select
          label="Type"
          name="type"
          value={roomData.type}
          onChange={handleChange}
          required
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
        />
        <Input
          label="Base Price"
          name="basePrice"
          type="number"
          value={roomData.basePrice}
          onChange={handleChange}
          required
        />
        <Input
          label="Size (sqm)"
          name="size"
          type="number"
          value={roomData.size}
          onChange={handleChange}
          required
        />
        <Select
          label="Bed Type"
          name="bedType"
          value={roomData.bedType}
          onChange={handleChange}
          required
        >
          <option value="">Select bed type</option>
          {bedTypes.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
        <Select
          label="View"
          name="view"
          value={roomData.view}
          onChange={handleChange}
        >
          {views.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Adults"
            name="adults"
            type="number"
            value={roomData.occupancy.adults}
            onChange={handleChange}
            min={1}
            required
          />
          <Input
            label="Children"
            name="children"
            type="number"
            value={roomData.occupancy.children}
            onChange={handleChange}
            min={0}
          />
        </div>
        <Select
          label="Status"
          name="status"
          value={roomData.status}
          onChange={handleChange}
        >
          <option value="Available">Available</option>
          <option value="Booked">Booked</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Cleaning">Cleaning</option>
          <option value="OutOfService">OutOfService</option>
        </Select>
        <Select
          label="Cancellation Policy"
          name="cancellationPolicy"
          value={roomData.cancellationPolicy}
          onChange={handleChange}
        >
          {cancellationPolicies.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <div>
          <label className="block font-medium mb-2">Amenities</label>
          <div className="grid grid-cols-3 gap-2">
            {amenityOptions.map((amenity) => (
              <label key={amenity} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name={amenity}
                  checked={roomData.amenities.includes(amenity)}
                  onChange={handleChange}
                />
                <span>{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/rooms")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "+ Add Room"}
          </Button>
        </div>
      </form>
    </div>
  );
}
