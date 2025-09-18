// 📁 frontend/pages/admin/EditRoomPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import adminService from "../../services/adminService";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";

export default function EditRoomPage() {
  const { id } = useParams(); // Get room ID from URL
  const navigate = useNavigate();

  const [roomData, setRoomData] = useState({
    roomNumber: "",
    type: "",
    floor: "",
    status: "Available",
    basePrice: "",
    occupancy: { adults: 1, children: 0 },
    bedType: "Single",
    size: "",
    view: "None",
    cancellationPolicy: "Moderate",
    amenities: [],
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch existing room details
  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      try {
        const response = await adminService.getRoomById(id);
        const data = response?.data?.data ?? response?.data; // Adjust to your API
        setRoomData({
          roomNumber: data.roomNumber || "",
          type: data.type || "",
          floor: data.floor || "",
          status: data.status || "Available",
          basePrice: data.basePrice || "",
          occupancy: data.occupancy || { adults: 1, children: 0 },
          bedType: data.bedType || "Single",
          size: data.size || "",
          view: data.view || "None",
          cancellationPolicy: data.cancellationPolicy || "Moderate",
          amenities: data.amenities || [],
          description: data.description || "",
        });
      } catch (err) {
        console.error("Error fetching room:", err);
        setError("Failed to load room data");
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "adults" || name === "children") {
      setRoomData({
        ...roomData,
        occupancy: { ...roomData.occupancy, [name]: Number(value) },
      });
    } else if (name === "amenities") {
      const values = Array.from(
        e.target.selectedOptions,
        (option) => option.value
      );
      setRoomData({ ...roomData, amenities: values });
    } else {
      setRoomData({ ...roomData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminService.updateRoom(id, roomData);
      navigate("/admin/rooms");
    } catch (err) {
      console.error("Failed to update room:", err);
      setError(err.response?.data?.message || "Failed to update room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-indigo-600 mb-6">Edit Room</h1>

      {loading ? (
        <div className="flex justify-center py-8">Loading...</div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto space-y-4"
        >
          {error && <p className="text-red-600">{error}</p>}

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
            <option value="Family">Family</option>
            <option value="Presidential">Presidential</option>
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
            label="Bed Type"
            name="bedType"
            value={roomData.bedType}
            onChange={handleChange}
          >
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Queen">Queen</option>
            <option value="King">King</option>
            <option value="Twin">Twin</option>
            <option value="Bunk">Bunk</option>
          </Select>

          <Input
            label="Size (sqm)"
            name="size"
            type="number"
            value={roomData.size}
            onChange={handleChange}
            required
          />

          <Select
            label="View"
            name="view"
            value={roomData.view}
            onChange={handleChange}
          >
            <option value="None">None</option>
            <option value="City">City</option>
            <option value="Garden">Garden</option>
            <option value="Pool">Pool</option>
            <option value="Ocean">Ocean</option>
            <option value="Mountain">Mountain</option>
          </Select>

          <Select
            label="Cancellation Policy"
            name="cancellationPolicy"
            value={roomData.cancellationPolicy}
            onChange={handleChange}
          >
            <option value="Flexible">Flexible</option>
            <option value="Moderate">Moderate</option>
            <option value="Strict">Strict</option>
            <option value="NonRefundable">NonRefundable</option>
          </Select>

          <Input
            label="Description"
            name="description"
            value={roomData.description}
            onChange={handleChange}
            type="text"
          />

          <Select
            label="Amenities"
            name="amenities"
            value={roomData.amenities}
            onChange={handleChange}
            multiple
          >
            {[
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
            ].map((amenity) => (
              <option key={amenity} value={amenity}>
                {amenity}
              </option>
            ))}
          </Select>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/rooms")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Room"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
