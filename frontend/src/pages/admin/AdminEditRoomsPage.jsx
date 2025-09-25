// 📁 frontend/pages/admin/EditRoomPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import adminService from "../../services/adminService";
import roomService from "../../services/roomService";
import { Wifi, Tv, Snowflake, Coffee, Bath, BedDouble, User, Users, Eye, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";

const amenityOptions = [
  { id: "WiFi", label: "WiFi", icon: Wifi },
  { id: "TV", label: "TV", icon: Tv },
  { id: "AC", label: "AC", icon: Snowflake },
  { id: "Minibar", label: "Minibar", icon: ImageIcon },
  { id: "Safe", label: "Safe", icon: CheckCircle },
  { id: "Hairdryer", label: "Hairdryer", icon: XCircle },
  { id: "CoffeeMaker", label: "CoffeeMaker", icon: Coffee },
  { id: "Iron", label: "Iron", icon: XCircle },
  { id: "Desk", label: "Desk", icon: XCircle },
  { id: "Balcony", label: "Balcony", icon: XCircle },
  { id: "PoolView", label: "PoolView", icon: Eye },
  { id: "OceanView", label: "OceanView", icon: Eye },
  { id: "RoomService", label: "RoomService", icon: Users },
  { id: "DailyCleaning", label: "DailyCleaning", icon: Users },
  { id: "Bathrobes", label: "Bathrobes", icon: Bath },
  { id: "Slippers", label: "Slippers", icon: Bath },
  { id: "Jacuzzi", label: "Jacuzzi", icon: Bath },
];

const bedTypes = ["Single", "Double", "Queen", "King", "Twin", "Bunk"];
const views = ["City", "Garden", "Pool", "Ocean", "Mountain", "None"];
const cancellationPolicies = ["Flexible", "Moderate", "Strict", "NonRefundable"];
const statusOptions = ["Available", "Booked", "Maintenance", "Cleaning", "OutOfService"];

export default function EditRoomPage() {
  // Collapsible state for each section
  const [openSections, setOpenSections] = useState({
    details: true,
    occupancy: false,
    amenities: false,
    images: false,
  });
  const toggleSection = (section) => setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
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
  const [fieldErrors, setFieldErrors] = useState({});

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

  // Live validation
  const validateField = (name, value) => {
    let error = "";
    if (name === "roomNumber") {
      if (!value) error = "Room number is required.";
      else if (!/^[0-9]+$/.test(value)) error = "Room number must be numeric.";
    } else if (name === "floor") {
      if (!value) error = "Floor is required.";
      else if (!Number.isInteger(Number(value)) || Number(value) <= 0) error = "Floor must be a positive integer.";
    } else if (name === "basePrice") {
      if (!value) error = "Base price is required.";
      else if (isNaN(value) || Number(value) <= 0) error = "Base price must be a positive number.";
    } else if (name === "size") {
      if (!value) error = "Size is required.";
      else if (isNaN(value) || Number(value) <= 0) error = "Size must be a positive number.";
    } else if (name === "description") {
      if (!value) error = "Description is required.";
      else if (value.length < 10) error = "Description must be at least 10 characters.";
    } else if (name === "adults") {
      if (!value || Number(value) < 1) error = "At least 1 adult required.";
    } else if (name === "children") {
      if (value === undefined || Number(value) < 0) error = "Children cannot be negative.";
    }
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;
    if (type === "number") newValue = value === "" ? "" : Number(value);
    if (name === "adults" || name === "children") {
      setRoomData({ ...roomData, occupancy: { ...roomData.occupancy, [name]: newValue } });
      validateField(name, newValue);
    } else if (amenityOptions.map(a => a.id).includes(name)) {
      let updatedAmenities = checked
        ? [...roomData.amenities, name]
        : roomData.amenities.filter((a) => a !== name);
      setRoomData({ ...roomData, amenities: updatedAmenities });
    } else {
      setRoomData({ ...roomData, [name]: newValue });
      validateField(name, newValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all fields before submit
    let errors = {};
    errors.roomNumber = validateField("roomNumber", roomData.roomNumber);
    errors.basePrice = validateField("basePrice", roomData.basePrice);
    errors.size = validateField("size", roomData.size);
    errors.description = validateField("description", roomData.description);
    errors.adults = validateField("adults", roomData.occupancy.adults);
    errors.children = validateField("children", roomData.occupancy.children);
    // Images validation
    if (!roomData.images || roomData.images.length === 0 || !roomData.images.some(img => img.url && /^https?:\/\//.test(img.url))) {
      errors.images = "At least one valid image URL is required.";
    } else {
      errors.images = "";
    }
    // Only one primary image
    if (roomData.images && roomData.images.filter(img => img.isPrimary).length > 1) {
      errors.images = "Only one primary image can be selected.";
    }
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    setLoading(true);
    setError("");
    try {
      // Transform status and amenities to match backend enums
      const statusEnum = ["Available", "Booked", "Maintenance", "Cleaning", "OutOfService"];
      const amenityEnum = [
        "WiFi", "TV", "AC", "Minibar", "Safe", "Hairdryer", "CoffeeMaker", "Iron", "Desk", "Balcony", "PoolView", "OceanView", "RoomService", "DailyCleaning", "Bathrobes", "Slippers", "Jacuzzi"
      ];
      // Fix status casing and map common synonyms to backend enum
      let fixedStatus = roomData.status;
      if (typeof fixedStatus === "string") {
        // Map common synonyms to backend enum
        const statusMap = {
          "vacant": "Available",
          "available": "Available",
          "booked": "Booked",
          "maintenance": "Maintenance",
          "cleaning": "Cleaning",
          "outofservice": "OutOfService",
          "out_of_service": "OutOfService",
          "out of service": "OutOfService"
        };
        const normalized = fixedStatus.toLowerCase().replace(/[_\s]/g, "");
        fixedStatus = statusMap[normalized] || statusEnum.find(s => s.toLowerCase() === fixedStatus.toLowerCase()) || fixedStatus;
      }
      // Fix amenities to match backend enum exactly
      const fixedAmenities = (roomData.amenities || []).map(a => {
        // Try to match ignoring case and spaces
        return amenityEnum.find(e => e.toLowerCase().replace(/\s/g,"") === a.toLowerCase().replace(/\s/g,"")) || a;
      });
      const payload = { ...roomData, status: fixedStatus, amenities: fixedAmenities };
      console.log("Submitting room update payload (fixed):", JSON.stringify(payload, null, 2));
  await adminService.updateRoom(id, payload);
  navigate("/admin/rooms");
    } catch (err) {
      // Log backend error details for easier debugging
      if (err.response && err.response.data) {
        console.error("Backend error:", err.response.data);
      }
      console.error("Failed to update room:", err);
      setError(err.response?.data?.message || "Failed to update room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-0 md:p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg px-6 py-4">Edit Room</h1>

        {loading ? (
          <div className="flex justify-center py-8">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-2 mb-2">{error}</p>}

            {/* Room Details */}
            <AccordionCard title="Room Details" open={openSections.details} onClick={() => toggleSection('details')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Room Number</label>
                  <Input label="" name="roomNumber" value={roomData.roomNumber} onChange={handleChange} required className="focus:border-indigo-500 focus:ring-indigo-500" />
                  {fieldErrors.roomNumber && <p className="bg-red-50 border border-red-200 text-red-800 rounded px-2 py-1 mt-1 text-xs">{fieldErrors.roomNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Room Type</label>
                  <Select label="" name="type" value={roomData.type} onChange={handleChange} required className="focus:border-indigo-500 focus:ring-indigo-500">
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
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <Select label="" name="status" value={roomData.status} onChange={handleChange} required className="focus:border-indigo-500 focus:ring-indigo-500">
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Floor</label>
                  <Input label="" name="floor" type="number" value={roomData.floor} onChange={handleChange} required className="focus:border-indigo-500 focus:ring-indigo-500" />
                  {fieldErrors.floor && <p className="bg-red-50 border border-red-200 text-red-800 rounded px-2 py-1 mt-1 text-xs">{fieldErrors.floor}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Base Price</label>
                  <Input label="" name="basePrice" type="number" value={roomData.basePrice} onChange={handleChange} required className="focus:border-indigo-500 focus:ring-indigo-500" />
                  {fieldErrors.basePrice && <p className="bg-red-50 border border-red-200 text-red-800 rounded px-2 py-1 mt-1 text-xs">{fieldErrors.basePrice}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Size (sqm)</label>
                  <Input label="" name="size" type="number" value={roomData.size} onChange={handleChange} required className="focus:border-indigo-500 focus:ring-indigo-500" />
                  {fieldErrors.size && <p className="bg-red-50 border border-red-200 text-red-800 rounded px-2 py-1 mt-1 text-xs">{fieldErrors.size}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <Input label="" name="description" value={roomData.description} onChange={handleChange} type="text" required className="focus:border-indigo-500 focus:ring-indigo-500" />
                  {fieldErrors.description && <p className="bg-red-50 border border-red-200 text-red-800 rounded px-2 py-1 mt-1 text-xs">{fieldErrors.description}</p>}
                </div>
              </div>
            </AccordionCard>

            {/* Occupancy */}
            <AccordionCard title="Occupancy" open={openSections.occupancy} onClick={() => toggleSection('occupancy')}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Adults</label>
                  <Input label="" name="adults" type="number" value={roomData.occupancy.adults} onChange={handleChange} min={1} required className="focus:border-indigo-500 focus:ring-indigo-500" />
                  {fieldErrors.adults && <p className="bg-red-50 border border-red-200 text-red-800 rounded px-2 py-1 mt-1 text-xs">{fieldErrors.adults}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Children</label>
                  <Input label="" name="children" type="number" value={roomData.occupancy.children} onChange={handleChange} min={0} className="focus:border-indigo-500 focus:ring-indigo-500" />
                  {fieldErrors.children && <p className="bg-red-50 border border-red-200 text-red-800 rounded px-2 py-1 mt-1 text-xs">{fieldErrors.children}</p>}
                </div>
              </div>
            </AccordionCard>

            {/* Amenities */}
            <AccordionCard title="Amenities" open={openSections.amenities} onClick={() => toggleSection('amenities')}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-white/60 p-5 rounded-xl shadow-inner">
                {amenityOptions.map(({ id, label, icon: Icon }) => (
                  <label key={id} className="flex items-center gap-2 text-sm cursor-pointer rounded-lg p-2 transition-all focus-within:ring-2 focus-within:ring-indigo-400 hover:bg-indigo-50">
                    <input
                      type="checkbox"
                      name={id}
                      checked={roomData.amenities.includes(id)}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600 transition-all"
                    />
                    <Icon className="w-4 h-4 text-indigo-500" />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </AccordionCard>

            {/* Images Section */}
            <AccordionCard title="Images" open={openSections.images} onClick={() => toggleSection('images')}>
              <div className="space-y-3">
                {roomData.images?.map((img, index) => (
                  <div key={index} className={`p-4 border rounded-xl bg-white/70 shadow flex flex-col md:flex-row md:items-center gap-4 ${fieldErrors.images ? 'border-red-200' : 'border-gray-100'}`}>
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                      {img.url && /^https?:\/\//.test(img.url) ? (
                        <img src={img.url} alt="Preview" className="object-cover w-full h-full" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
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
                        className="focus:border-indigo-500 focus:ring-indigo-500"
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
                        className="focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <label className="flex items-center gap-2">
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
                        <span className="text-sm text-gray-700 font-medium">Primary Image</span>
                      </label>
                    </div>
                    <div className="flex flex-col gap-2 md:ml-4">
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
                  </div>
                ))}
                {fieldErrors.images && <p className="bg-red-50 border border-red-200 text-red-800 rounded px-2 py-1 mt-1 text-xs">{fieldErrors.images}</p>}
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
            </AccordionCard>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/rooms")}
                className="border border-indigo-200 text-indigo-700 hover:border-indigo-500 hover:text-indigo-600 transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg px-6 py-2 rounded-lg transition-all duration-200"
              >
                {loading ? "Updating..." : "Update Room"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// AccordionCard component for collapsible sections
function AccordionCard({ title, open, onClick, children }) {
  return (
    <div className="rounded-2xl shadow-xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-purple-50 mb-2 transition-all duration-300">
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-6 py-4 text-lg font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-2xl bg-white/60 hover:bg-indigo-100/60 transition-all duration-200"
        aria-expanded={open}
      >
        <span>{title}</span>
        <svg className={`w-5 h-5 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
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
}

