// 📁 frontend/pages/admin/EditRoomPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import adminService from "../../services/adminService";
import roomService from "../../services/roomService";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Button } from "../../components/ui/button";

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
    images: [], // <-- initialized
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch existing room details
  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      try {
        const response = await roomService.getRoomById(id);
        const data = response?.data?.data ?? response?.data; // Adjust according to API
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
          images: data.images || [],
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
    const { name, value, type, checked } = e.target;

    let newValue = value;
    if (type === "number") {
      newValue = value === "" ? "" : Number(value);
    }

    if (name === "adults" || name === "children") {
      setRoomData({
        ...roomData,
        occupancy: { ...roomData.occupancy, [name]: newValue },
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
      setRoomData({ ...roomData, [name]: newValue });
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
          className="bg-white p-6 rounded-lg shadow max-w-3xl mx-auto space-y-4"
        >
          {error && <p className="text-red-600">{error}</p>}

          {/* Room Details */}
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
          <Input
            label="Size (sqm)"
            name="size"
            type="number"
            value={roomData.size}
            onChange={handleChange}
            required
          />
          <Input
            label="Description"
            name="description"
            value={roomData.description}
            onChange={handleChange}
            type="text"
          />

          {/* Occupancy */}
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

          {/* Status, Bed, View, Policy */}
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

          {/* Amenities */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-gray-50 p-5 rounded-lg">
              {amenityOptions.map((amenity) => (
                <label key={amenity} className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name={amenity}
                    checked={roomData.amenities.includes(amenity)}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600 transition-all"
                  />
                  <span className="text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Images</h2>
            <div className="space-y-3">
              {roomData.images?.map((img, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-2">
                  <Input
                    label="Image URL"
                    type="url"
                    value={img.url}
                    onChange={(e) => {
                      const updated = [...roomData.images];
                      updated[index].url = e.target.value;
                      setRoomData({ ...roomData, images: updated });
                    }}
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                  <Input
                    label="Caption"
                    type="text"
                    value={img.caption || ""}
                    onChange={(e) => {
                      const updated = [...roomData.images];
                      updated[index].caption = e.target.value;
                      setRoomData({ ...roomData, images: updated });
                    }}
                    placeholder="Optional caption"
                  />
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={img.isPrimary || false}
                      onChange={(e) => {
                        const updated = roomData.images.map((image, i) => ({
                          ...image,
                          isPrimary: i === index ? e.target.checked : false,
                        }));
                        setRoomData({ ...roomData, images: updated });
                      }}
                    />
                    <span className="text-sm text-gray-700">Primary Image</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const updated = roomData.images.filter((_, i) => i !== index);
                      setRoomData({ ...roomData, images: updated });
                    }}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setRoomData({
                  ...roomData,
                  images: [...(roomData.images || []), { url: "", caption: "", isPrimary: false }],
                })
              }
              className="mt-2"
            >
              + Add Image
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
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
