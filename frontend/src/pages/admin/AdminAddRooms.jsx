import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Accordion state for each section
  const [openSections, setOpenSections] = useState({
    details: true,
    specs: false,
    view: false,
    occupancy: false,
    amenities: false,
    images: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Validation function
  const validateField = (name, value) => {
    let error = "";
    if (name === "title") {
      if (!value) {
        error = "Room title is required";
      } else if (/^\d+$/.test(value)) {
        error = "Room title cannot be a number";
      }
    } else if (name === "roomNumber") {
      if (!value) {
        error = "Room number is required";
      } else if (!/^\d{1,3}$/.test(value) || parseInt(value) < 1) {
        error = "Room number must be an integer between 1 and 999";
      }
    } else if (name === "floor") {
      if (!value) {
        error = "Floor is required";
      } else {
        const floorNum = parseInt(value);
        if (isNaN(floorNum) || floorNum < 1 || floorNum > 3) {
          error = "Floor must be between 1 and 3";
        }
      }
    } else if (name === "basePrice" && value && value < 0) {
      error = "Base price cannot be negative";
    } else if (name === "size" && value && value < 0) {
      error = "Size cannot be negative";
    } else if (name === "type" && !value) {
      error = "Room type is required";
    } else if (name === "bedType" && !value) {
      error = "Bed type is required";
    } else if (name === "adults" && value < 1) {
      error = "At least 1 adult is required";
    } else if (name === "children" && value < 0) {
      error = "Children cannot be negative";
    }
    return error;
  };

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
      setErrors({ ...errors, [name]: validateField(name, newValue) });
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
      setErrors({ ...errors, [name]: validateField(name, newValue) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.keys(roomData).forEach((key) => {
      if (key !== "amenities" && key !== "occupancy" && key !== "description" && key !== "view" && key !== "status" && key !== "cancellationPolicy") {
        newErrors[key] = validateField(key, roomData[key]);
      }
    });
    newErrors.adults = validateField("adults", roomData.occupancy.adults);
    newErrors.children = validateField("children", roomData.occupancy.children);

    if (Object.values(newErrors).some((err) => err)) {
      setErrors(newErrors);
      return (
        <div className="container mx-auto py-8 px-2 md:px-0">
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg px-6 py-4">Add New Room</h2>

          <div className="space-y-6">
            {/* Room Details Section */}
            <AccordionCard
              title="Room Details"
              open={openSections.details}
              onClick={() => toggleSection('details')}
            >
              {/* Room Details form fields go here */}
            </AccordionCard>

            {/* Specifications Section */}
            <AccordionCard
              title="Specifications"
              open={openSections.specs}
              onClick={() => toggleSection('specs')}
            >
              {/* Specifications form fields go here */}
            </AccordionCard>

            {/* View & Policy Section */}
            <AccordionCard
              title="View & Policy"
              open={openSections.view}
              onClick={() => toggleSection('view')}
            >
              {/* View & Policy form fields go here */}
            </AccordionCard>

            {/* Occupancy Section */}
            <AccordionCard
              title="Occupancy"
              open={openSections.occupancy}
              onClick={() => toggleSection('occupancy')}
            >
              {/* Occupancy form fields go here */}
            </AccordionCard>

            {/* Amenities Section */}
            <AccordionCard
              title="Amenities"
              open={openSections.amenities}
              onClick={() => toggleSection('amenities')}
            >
              {/* Amenities form fields go here */}
            </AccordionCard>

            {/* Images Section */}
            <AccordionCard
              title="Images"
              open={openSections.images}
              onClick={() => toggleSection('images')}
            >
              {/* Images form fields go here */}
            </AccordionCard>
          </div>
        </div>
      );
// AccordionCard component for collapsible sections
function AccordionCard({ title, open, onClick, children }) {
  return (
    <div
      className="rounded-2xl shadow-xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-purple-50 mb-2 transition-all duration-300"
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-6 py-4 text-lg font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-2xl bg-white/60 hover:bg-indigo-100/60 transition-all duration-200"
        aria-expanded={open}
      >
        <span>{title}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-indigo-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-indigo-400" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[1000px] opacity-100 py-4 px-6' : 'max-h-0 opacity-0 py-0 px-6'}`}
        style={{
          background: open ? 'rgba(255,255,255,0.7)' : 'transparent',
          borderRadius: '0 0 1rem 1rem',
        }}
      >
        {open && children}
      </div>
    </div>
  );
}}
try {
      console.log("Sending token:", localStorage.getItem("token"));
      await adminService.createRoom(roomData);
      navigate("/admin/rooms");
    } catch (err) {
      console.error("Failed to create room:", err);
      setSubmitError(err.response?.data?.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-indigo-800">Add New Room</h1>
          <div className="text-sm text-gray-500">* Required fields</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          {submitError && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{submitError}</p>
            </div>
          )}

          {/* Room Details Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Room Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Room Title "
                  name="title"
                  value={roomData.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 transition-all"
                  placeholder="e.g., Deluxe Oceanfront Suite"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>
              <div>
                <Input
                  label="Room Number "
                  name="roomNumber"
                  value={roomData.roomNumber}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 transition-all"
                  placeholder="e.g., 101"
                />
                {errors.roomNumber && <p className="mt-1 text-sm text-red-600">{errors.roomNumber}</p>}
              </div>
            </div>
            <div>
              <Input
                label="Description"
                name="description"
                value={roomData.description}
                onChange={handleChange}
                textarea
                className="w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 transition-all"
                placeholder="Describe the room features..."
                rows={4}
              />
            </div>
          </div>

          {/* Room Specifications */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Specifications</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Select
                  label="Room Type "
                  name="type"
                  value={roomData.type}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 transition-all"
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
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
              </div>
              <div>
                <Input
                  label="Floor "
                  name="floor"
                  type="number"
                  value={roomData.floor}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 transition-all"
                  placeholder="e.g., 2"
                />
                {errors.floor && <p className="mt-1 text-sm text-red-600">{errors.floor}</p>}
              </div>
              <div>
                <Input
                  label="Base Price ($) "
                  name="basePrice"
                  type="number"
                  value={roomData.basePrice}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 transition-all"
                  placeholder="e.g., 150"
                />
                {errors.basePrice && <p className="mt-1 text-sm text-red-600">{errors.basePrice}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Size (sqm) "
                  name="size"
                  type="number"
                  value={roomData.size}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 transition-all"
                  placeholder="e.g., 30"
                />
                {errors.size && <p className="mt-1 text-sm text-red-600">{errors.size}</p>}
              </div>
              <div>
                <Select
                  label="Bed Type "
                  name="bedType"
                  value={roomData.bedType}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 transition-all"
                >
                  <option value="">Select bed type</option>
                  {bedTypes.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
                {errors.bedType && <p className="mt-1 text-sm text-red-600">{errors.bedType}</p>}
              </div>
            </div>
          </div>

          {/* View and Policy */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">View & Policy</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="View"
                name="view"
                value={roomData.view}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 transition-all"
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
                className="w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 transition-all"
              >
                {cancellationPolicies.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Occupancy */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Occupancy</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Adults "
                  name="adults"
                  type="number"
                  value={roomData.occupancy.adults}
                  onChange={handleChange}
                  min={1}
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 transition-all"
                  placeholder="e.g., 2"
                />
                {errors.adults && <p className="mt-1 text-sm text-red-600">{errors.adults}</p>}
              </div>
              <div>
                <Input
                  label="Children"
                  name="children"
                  type="number"
                  value={roomData.occupancy.children}
                  onChange={handleChange}
                  min={0}
                  className="w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-indigo-600 transition-all"
                  placeholder="e.g., 0"
                />
                {errors.children && <p className="mt-1 text-sm text-red-600">{errors.children}</p>}
              </div>
            </div>
          </div>

         

          {/* Amenities Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-gray-50 p-5 rounded-lg">
              {amenityOptions.map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center space-x-2 text-sm cursor-pointer"
                >
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
      <div
        key={index}
        className="p-4 border rounded-lg bg-gray-50 space-y-2"
      >
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
          placeholder="Optional caption for this image"
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={img.isPrimary || false}
            onChange={(e) => {
              const updated = roomData.images.map((image, i) => ({
                ...image,
                isPrimary: i === index ? e.target.checked : false, // only one primary
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
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/rooms")}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || Object.values(errors).some((err) => err)}
              className={`px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all flex items-center ${
                loading || Object.values(errors).some((err) => err)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                    />
                  </svg>
                  Adding...
                </>
              ) : (
                "+ Add Room"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}