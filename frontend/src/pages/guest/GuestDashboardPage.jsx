import { useState } from "react";
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

// Import room images
import roomKingLuxury from "@/assets/images/guest/room-king-luxury.jpg";
import roomQueenOcean from "@/assets/images/guest/room-queen-ocean.jpg";
import roomFamilyGarden from "@/assets/images/guest/room-family-garden.jpg";

const Index = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [comparisonRooms, setComparisonRooms] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [filters, setFilters] = useState({
    priceRange: [50, 500],
    bedType: "Any",
    adults: 1,
    children: 0,
    view: [],
    amenities: []
  });

  // Floor and room data organized by floors
  const floors = [
    {
      id: "floor-3",
      number: 3,
      name: "Garden Level",
      description: "Family-friendly rooms with garden views and ground access",
      roomCount: 2,
      occupancy: 3,
      maxOccupancy: 8,
      features: ["Garden Access", "Family Friendly", "Ground Level"]
    },
    {
      id: "floor-8", 
      number: 8,
      name: "Ocean View Level",
      description: "Mid-level rooms with stunning ocean vistas",
      roomCount: 3,
      occupancy: 4,
      maxOccupancy: 6,
      features: ["Ocean Views", "Balconies", "Romantic"]
    },
    {
      id: "floor-15",
      number: 15,
      name: "Premium Sky Level", 
      description: "Luxury suites with panoramic city and sky views",
      roomCount: 2,
      occupancy: 2,
      maxOccupancy: 6,
      features: ["City Views", "Premium", "Sky Access", "Luxury"]
    }
  ];

  const allRooms = [
    // Floor 3 - Garden Level
    {
      id: "3-001",
      floorId: "floor-3",
      name: "Family Garden Retreat",
      images: [roomFamilyGarden, roomFamilyGarden, roomFamilyGarden],
      price: 149,
      maxGuests: 4,
      bedType: "Twin Beds",
      view: "Garden",
      size: 40,
      floor: "3rd Floor",
      roomNumber: "301",
      amenities: ["WiFi", "Coffee", "AC", "TV", "Minibar"],
      description: "Ideal for families - spacious room with twin beds and beautiful garden views. Child-friendly amenities and plenty of space for everyone to relax and unwind.",
      reviews: {
        rating: 4.7,
        count: 156,
        recent: [
          { name: "Jennifer K.", comment: "Perfect for our family vacation - kids loved the garden view!", date: "January 2025" },
          { name: "Robert T.", comment: "Great space and very family-friendly amenities.", date: "December 2024" }
        ]
      }
    },
    {
      id: "3-002",
      floorId: "floor-3",
      name: "Garden Suite Deluxe",
      images: [roomFamilyGarden, roomFamilyGarden, roomFamilyGarden],
      price: 179,
      maxGuests: 4,
      bedType: "King Bed + Sofa",
      view: "Garden",
      size: 50,
      floor: "3rd Floor",
      roomNumber: "302",
      amenities: ["WiFi", "Coffee", "AC", "TV", "Minibar", "Sofa Bed"],
      description: "Upgraded garden suite with separate living area and sofa bed. Perfect for families who want extra space and comfort.",
      reviews: {
        rating: 4.8,
        count: 89,
        recent: [
          { name: "Lisa P.", comment: "Loved the extra space for the kids!", date: "January 2025" },
          { name: "Tom H.", comment: "Garden view was peaceful and relaxing.", date: "December 2024" }
        ]
      }
    },
    // Floor 8 - Ocean Level  
    {
      id: "8-001",
      floorId: "floor-8",
      name: "Ocean View Queen Room",
      images: [roomQueenOcean, roomQueenOcean, roomQueenOcean],
      price: 199,
      maxGuests: 2,
      bedType: "Queen Bed",
      view: "Ocean",
      size: 35,
      floor: "8th Floor",
      roomNumber: "801",
      amenities: ["WiFi", "Coffee", "Bathtub", "Balcony", "AC", "TV"],
      description: "Wake up to breathtaking ocean views in this serene queen room. Modern coastal design meets comfort with a private balcony perfect for morning coffee and sunset watching.",
      reviews: {
        rating: 4.8,
        count: 89,
        recent: [
          { name: "Emily R.", comment: "The ocean view was absolutely magical at sunrise!", date: "January 2025" },
          { name: "Mark S.", comment: "Clean, comfortable, and great value for money.", date: "December 2024" }
        ]
      }
    },
    {
      id: "8-002",
      floorId: "floor-8",
      name: "Ocean View Romantic Suite",
      images: [roomQueenOcean, roomQueenOcean],
      price: 259,
      maxGuests: 2,
      bedType: "King Bed",
      view: "Ocean",
      size: 42,
      floor: "8th Floor",
      roomNumber: "802",
      amenities: ["WiFi", "Coffee", "Bathtub", "Balcony", "AC", "TV", "Jacuzzi", "Champagne"],
      description: "Romantic ocean view suite with king bed and private jacuzzi. Perfect for honeymoons and special occasions with complimentary champagne service.",
      reviews: {
        rating: 4.9,
        count: 67,
        recent: [
          { name: "Anna K.", comment: "Perfect for our anniversary - the jacuzzi was amazing!", date: "January 2025" },
          { name: "James L.", comment: "Most romantic room we've ever stayed in.", date: "December 2024" }
        ]
      }
    },
    {
      id: "8-003",
      floorId: "floor-8",
      name: "Ocean Breeze Studio",
      images: [roomQueenOcean, roomQueenOcean],
      price: 229,
      maxGuests: 2,
      bedType: "Queen Bed",
      view: "Ocean",
      size: 38,
      floor: "8th Floor", 
      roomNumber: "803",
      amenities: ["WiFi", "Coffee", "Bathtub", "Balcony", "AC", "TV", "Kitchenette"],
      description: "Stylish studio with kitchenette and extended balcony. Ideal for longer stays with the convenience of light meal preparation.",
      reviews: {
        rating: 4.6,
        count: 124,
        recent: [
          { name: "Sophie M.", comment: "The kitchenette was so convenient for breakfast!", date: "January 2025" },
          { name: "Alex R.", comment: "Great for a week-long stay.", date: "December 2024" }
        ]
      }
    },
    // Floor 15 - Premium Level
    {
      id: "15-001",
      floorId: "floor-15",
      name: "King Suite with City View",
      images: [roomKingLuxury, roomKingLuxury, roomKingLuxury],
      price: 299,
      maxGuests: 3,
      bedType: "King Bed",
      view: "City",
      size: 45,
      floor: "15th Floor",
      roomNumber: "1501",
      amenities: ["WiFi", "Parking", "Coffee", "Bathtub", "Balcony", "AC", "TV", "Minibar"],
      description: "Perfect for couples seeking luxury - featuring elegant city views, premium amenities, and sophisticated design. Enjoy the spacious layout with a private balcony overlooking the bustling downtown district.",
      reviews: {
        rating: 4.9,
        count: 127,
        recent: [
          { name: "Sarah M.", comment: "Absolutely stunning room with incredible city views!", date: "January 2025" },
          { name: "David L.", comment: "The luxury amenities exceeded our expectations.", date: "December 2024" }
        ]
      }
    },
    {
      id: "15-002",
      floorId: "floor-15",
      name: "Presidential Sky Suite",
      images: [roomKingLuxury, roomKingLuxury, roomKingLuxury],
      price: 459,
      maxGuests: 3,
      bedType: "King Bed",
      view: "City & Sky",
      size: 65,
      floor: "15th Floor",
      roomNumber: "1502",
      amenities: ["WiFi", "Parking", "Coffee", "Bathtub", "Balcony", "AC", "TV", "Minibar", "Butler Service", "Premium Bar"],
      description: "The ultimate luxury experience with panoramic city views, butler service, and premium amenities. Features a separate living area and premium bar service.",
      reviews: {
        rating: 5.0,
        count: 45,
        recent: [
          { name: "Michael B.", comment: "Absolutely incredible! Best hotel experience ever.", date: "January 2025" },
          { name: "Victoria S.", comment: "Butler service was exceptional, views are breathtaking.", date: "December 2024" }
        ]
      }
    }
  ];

  const handleWishlist = (roomId) => {
    toast({
      title: "Added to Wishlist",
      description: "Room has been saved to your favorites.",
    });
  };

  const handleViewDetails = (roomId) => {
    const room = allRooms.find(r => r.id === roomId);
    setSelectedRoom(room);
  };

  const handleBookNow = (roomId) => {
    toast({
      title: "Booking Started",
      description: "Redirecting to booking form...",
    });
  };

  const handleBooking = (roomId, checkIn, checkOut, guests) => {
    toast({
      title: "Booking Confirmed!",
      description: `Room booked from ${checkIn.toLocaleDateString()} to ${checkOut.toLocaleDateString()} for ${guests} guest${guests > 1 ? 's' : ''}.`,
    });
    setSelectedRoom(null);
  };

  const handleCompare = (roomId) => {
    setComparisonRooms(prev => {
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  const handleOpenCompare = () => {
    setIsCompareModalOpen(true);
  };

  const getComparisonRoomsData = () => {
    return allRooms.filter(room => comparisonRooms.includes(room.id));
  };

  const handleFloorSelect = (floorId) => {
    setSelectedFloor(floorId);
    setSearchQuery(""); // Clear search when changing floors
  };

  const clearFilters = () => {
    setFilters({
      priceRange: [50, 500],
      bedType: "Any",
      adults: 1,
      children: 0,
      view: [],
      amenities: []
    });
  };

  // Get rooms for selected floor
  const roomsToShow = selectedFloor 
    ? allRooms.filter(room => room.floorId === selectedFloor)
    : [];

  // Filter rooms based on current filters
  const filteredRooms = roomsToShow.filter(room => {
    const matchesPrice = room.price >= filters.priceRange[0] && room.price <= filters.priceRange[1];
    const matchesBed = filters.bedType === "Any" || room.bedType.includes(filters.bedType);
    const matchesGuests = room.maxGuests >= (filters.adults + filters.children);
    const matchesView = filters.view.length === 0 || filters.view.includes(room.view);
    const matchesAmenities = filters.amenities.length === 0 || 
      filters.amenities.every(amenity => room.amenities.includes(amenity));
    const matchesSearch = searchQuery === "" || 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.view.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPrice && matchesBed && matchesGuests && matchesView && matchesAmenities && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <HotelHero />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-section">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FilterSidebar
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen(!isFilterOpen)}
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Mobile Filter Sidebar */}
          <div className="lg:hidden">
            <FilterSidebar
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen(!isFilterOpen)}
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Room Listings */}
          <div className="flex-1">
            {/* Floor Selection */}
            <FloorSelector 
              floors={floors}
              selectedFloor={selectedFloor}
              onFloorSelect={handleFloorSelect}
            />

            {selectedFloor && (
              <>
                {/* Search and Sort Header */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                        {floors.find(f => f.id === selectedFloor)?.name} Rooms
                      </h2>
                      <p className="text-muted-foreground">
                        {filteredRooms.length > 0 
                          ? `Discover ${filteredRooms.length} beautifully designed room${filteredRooms.length !== 1 ? 's' : ''}` 
                          : 'No rooms available'
                        }
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

                  {/* Search Bar */}
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

                {/* Room Grid/List */}
                {filteredRooms.length > 0 ? (
                  <div className={`animate-fade-in ${
                    viewMode === 'grid' 
                      ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-8' 
                      : 'flex flex-col gap-6'
                  }`}>
                    {filteredRooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        id={room.id}
                        name={room.name}
                        image={room.images[0]}
                        price={room.price}
                        maxGuests={room.maxGuests}
                        bedType={room.bedType}
                        view={room.view}
                        amenities={room.amenities.slice(0, 4)}
                        viewMode={viewMode}
                        isInComparison={comparisonRooms.includes(room.id)}
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
                    <h3 className="text-xl font-display font-semibold mb-2">No rooms found</h3>
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
      </div>

      {/* Compare Rooms Button */}
      {comparisonRooms.length >= 2 && (
        <div className="fixed bottom-8 right-8 z-40">
          <Button
            variant="luxury"
            size="lg"
            onClick={handleOpenCompare}
            className="rounded-full shadow-luxury hover:shadow-xl transition-all duration-300"
          >
            Compare Rooms ({comparisonRooms.length})
          </Button>
        </div>
      )}

      {/* Room Details Modal */}
      <RoomModal
        isOpen={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        room={selectedRoom}
        onBook={handleBooking}
      />

      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        rooms={getComparisonRoomsData()}
      />
    </div>
  );
};

export default Index;
