// 📁 frontend/pages/rooms/Index.jsx
import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/rooms/ui/button";
import { Input } from "@/components/rooms/ui/input";
import { useToast } from "@/hooks/use-toast";
import HotelHero from "@/components/rooms/HotelHero.jsx";
import RoomCard from "@/components/rooms/RoomCard.jsx";
import FilterSidebar from "@/components/rooms/FilterSidebar.jsx";
import RoomModal from "@/components/rooms/RoomModal.jsx";
import ViewToggle from "@/components/rooms/ViewToggle.jsx";
import CompareModal from "@/components/rooms/CompareModal.jsx";
import FloorSelector from "@/components/rooms/FloorSelector.jsx";
import { Link } from "react-router-dom";
import roomService from "@/services/roomService";

const Index = () => {
  const { toast } = useToast();

  // State
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [comparisonRooms, setComparisonRooms] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);

  const [filters, setFilters] = useState({
    priceRange: [50, 500],
    bedType: "",
    adults: 1,
    children: 0,
    view: [],
    amenities: [],
    type: "",
  });

  // Fetch rooms from backend
  useEffect(() => {
    fetchRooms();
  }, [filters]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await roomService.getAllRooms({ params: filters });
      const data = response?.data;
      setRooms(data?.data ?? []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Floor selector data (optional: you can fetch from backend later)
  const floors = [...new Set(rooms.map((r) => r.floor))].map((floorNum) => ({
    id: `floor-${floorNum}`,
    number: floorNum,
    name: `Floor ${floorNum}`,
  }));

  const handleWishlist = (roomId) =>
    toast({ title: "Added to Wishlist", description: "Room saved to favorites" });

  const handleViewDetails = (roomId) =>
    setSelectedRoom(rooms.find((r) => r._id === roomId));

  const handleBookNow = (roomId) =>
    toast({ title: "Booking Started", description: "Redirecting to booking form..." });

  const handleBooking = (roomId, checkIn, checkOut, guests) => {
    toast({
      title: "Booking Confirmed!",
      description: `Room booked from ${checkIn.toLocaleDateString()} to ${checkOut.toLocaleDateString()} for ${guests} guest${guests > 1 ? "s" : ""}.`,
    });
    setSelectedRoom(null);
  };

  const handleCompare = (roomId) =>
    setComparisonRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );

  const handleOpenCompare = () => setIsCompareModalOpen(true);

  const getComparisonRoomsData = () =>
    rooms.filter((room) => comparisonRooms.includes(room._id));

  const handleFloorSelect = (floorNum) => {
    setSelectedFloor(floorNum);
    setSearchQuery("");
  };

  const clearFilters = () =>
    setFilters({
      priceRange: [50, 500],
      bedType: "",
      adults: 1,
      children: 0,
      view: [],
      amenities: [],
      type: "",
    });

  // Filtering logic
  const roomsToShow = selectedFloor
    ? rooms.filter((room) => room.floor === selectedFloor)
    : rooms;

  const filteredRooms = roomsToShow.filter((room) => {
    const matchesPrice =
      room.basePrice >= filters.priceRange[0] &&
      room.basePrice <= filters.priceRange[1];
    const matchesBed = !filters.bedType || room.bedType === filters.bedType;
    const matchesGuests =
      room.occupancy.adults + room.occupancy.children >=
      filters.adults + filters.children;
    const matchesView = !filters.view.length || filters.view.includes(room.view);
    const matchesAmenities =
      !filters.amenities.length ||
      filters.amenities.every((a) => room.amenities.includes(a));
    const matchesType = !filters.type || room.type === filters.type;
    const matchesSearch =
      !searchQuery ||
      room.title.toLowerCase().includes(searchQuery.toLowerCase());
    return (
      matchesPrice &&
      matchesBed &&
      matchesGuests &&
      matchesView &&
      matchesAmenities &&
      matchesType &&
      matchesSearch
    );
  });

  return (
    <div className="relative min-h-screen bg-gradient-hero">
      {/* Logout */}
      <div className="absolute top-6 right-6 z-50">
        <Link to="/logout">
          <Button
            variant="outline"
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Logout
          </Button>
        </Link>
      </div>

      <HotelHero />

      <div className="container mx-auto px-4 py-section flex gap-8">
        {/* Filters Sidebar */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <FilterSidebar
            isOpen={isFilterOpen}
            onToggle={() => setIsFilterOpen(!isFilterOpen)}
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />
        </div>
        <div className="lg:hidden">
          <FilterSidebar
            isOpen={isFilterOpen}
            onToggle={() => setIsFilterOpen(!isFilterOpen)}
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />
        </div>

        <div className="flex-1">
          <FloorSelector
            floors={floors}
            selectedFloor={selectedFloor}
            onFloorSelect={handleFloorSelect}
          />

          {selectedFloor && (
            <>
              {/* Search & Header */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                      {floors.find((f) => f.number === selectedFloor)?.name} Rooms
                    </h2>
                    <p className="text-muted-foreground">
                      {filteredRooms.length > 0
                        ? `Discover ${filteredRooms.length} beautifully designed room${
                            filteredRooms.length !== 1 ? "s" : ""
                          }`
                        : "No rooms available"}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <ViewToggle view={viewMode} onViewChange={setViewMode} />
                    <Button
                      variant="outline"
                      onClick={() => setIsFilterOpen(true)}
                      className="lg:hidden"
                    >
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </div>
                </div>

                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">Loading...</div>
              ) : filteredRooms.length > 0 ? (
                <div
                  className={`animate-fade-in ${
                    viewMode === "grid"
                      ? "grid md:grid-cols-2 xl:grid-cols-3 gap-8"
                      : "flex flex-col gap-6"
                  }`}
                >
                  {filteredRooms.map((room) => (
                    <RoomCard
                      key={room._id}
                      id={room._id}
                      name={room.title}
                      image={room.images[0]?.url}
                      price={room.basePrice}
                      maxGuests={room.occupancy.adults + room.occupancy.children}
                      bedType={room.bedType}
                      view={room.view}
                      amenities={room.amenities.slice(0, 4)}
                      viewMode={viewMode}
                      isInComparison={comparisonRooms.includes(room._id)}
                      onWishlist={handleWishlist}
                      onCompare={handleCompare}
                      onViewDetails={handleViewDetails}
                      onBookNow={handleBookNow}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🏨</div>
                  <h3 className="text-xl font-display font-semibold mb-2">
                    No rooms found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Compare Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          variant="luxury"
          size="lg"
          onClick={handleOpenCompare}
          className="rounded-full shadow-luxury hover:shadow-xl transition-all duration-300 bg-primary text-white"
        >
          Compare ({comparisonRooms.length})
        </Button>
      </div>

      {/* Modals */}
      {selectedRoom && (
  <RoomModal
    isOpen={!!selectedRoom}
    room={{
      ...selectedRoom,
      name: selectedRoom.title, // map backend "title" → modal "name"
      price: selectedRoom.basePrice, // map backend "basePrice" → modal "price"
      id: selectedRoom._id, // map backend "_id" → modal "id"
      maxGuests:
        (selectedRoom.occupancy?.adults || 0) +
        (selectedRoom.occupancy?.children || 0), // calculate max guests
      reviews: selectedRoom.reviews || {
        rating: 0,
        count: 0,
        recent: [],
      }, // fallback in case reviews missing
      images: selectedRoom.images?.map((img) => img.url) || [], // flatten images
    }}
    onClose={() => setSelectedRoom(null)}
    onBook={handleBooking}
  />
)}

      {isCompareModalOpen && (
        <CompareModal
          rooms={getComparisonRoomsData()}
          onClose={() => setIsCompareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Index;
