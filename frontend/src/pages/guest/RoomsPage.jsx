import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

// Components
import HotelHero from "@/components/rooms/HotelHero";
import RoomCard from "@/components/rooms/RoomCard";
import FilterSidebar from "@/components/rooms/FilterSidebar";
import { FloorSelection } from "@/components/rooms/FloorSelector";
import ViewToggle from "@/components/rooms/ViewToggle";
import RoomModal from "@/components/rooms/ViewDetails";
import { CompareFeature } from "@/components/rooms/CompareModal";
import { Button } from "@/components/rooms/ui/button";
import { Input } from "@/components/rooms/ui/input";
import roomService from "@/services/roomService";
import { useToast } from "@/hooks/use-toast";

const GuestDashboardPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [floors, setFloors] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [comparisonRooms, setComparisonRooms] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [filters, setFilters] = useState({
    priceRange: [0, 5000],
    bedType: "",
    adults: 2,
    children: 0,
    view: "",
    amenities: [],
    ratingLabel: "Any",
    minReviewRating: 0,
    floor: null,
  });

  // Fetch rooms from backend
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms();
    }, 300); // Debounce the filter changes
    
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getAllRooms();
      
      // Handle backend response structure
      const roomsData = response.data?.data || response.data || [];
      
      // Validate and filter valid rooms with debugging
      console.log("Total rooms from API:", roomsData.length);
      console.log("Raw room data:", roomsData);
      
      const validRooms = roomsData.filter(room => {
        if (!room) {
          console.log("Filtered out: Room is null/undefined");
          return false;
        }
        if (!room._id) {
          console.log("Filtered out: Missing _id", room);
          return false;
        }
        if (!room.title && !room.name) {
          console.log("Filtered out: Missing title and name", room);
          return false;
        }
        if (room.basePrice === undefined || room.basePrice === null || isNaN(room.basePrice)) {
          console.log("Filtered out: Invalid basePrice", room);
          return false;
        }
        return true;
      });
      
      console.log("Valid rooms after filtering:", validRooms.length);
      
      setRooms(validRooms);
      
      // Extract unique floors and create floor objects for the new FloorSelection component
      const floorNumbers = [...new Set(validRooms.map(room => room.floor))]
        .filter(floor => floor !== undefined && floor !== null)
        .sort((a, b) => a - b);
      
      const floorObjects = floorNumbers.map(floorNumber => {
        const roomsOnFloor = validRooms.filter(room => room.floor === floorNumber);
        return {
          number: floorNumber,
          name: `Floor ${floorNumber}`,
          availableRooms: roomsOnFloor.filter(room => 
            room.status?.toLowerCase() === 'available' || 
            !room.status || 
            room.status?.toLowerCase() === 'vacant'
          ).length,
          totalRooms: roomsOnFloor.length
        };
      });
      
      setFloors(floorObjects);
      
      if (validRooms.length === 0 && roomsData.length > 0) {
        toast({
          title: "Warning",
          description: "Some rooms have invalid data and were filtered out.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
      setFloors([]);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Failed to load rooms. Please try again later.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtering logic
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = !searchQuery || 
      room.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.amenities?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesPrice = room.basePrice >= filters.priceRange[0] && 
                       room.basePrice <= filters.priceRange[1];
    
    // Debug price filtering
    if (!matchesPrice) {
      console.log(`Room "${room.title}" filtered out by price: ${room.basePrice} not in range [${filters.priceRange[0]}, ${filters.priceRange[1]}]`);
    }
    
    const matchesBed = !filters.bedType || room.bedType === filters.bedType;
    const matchesGuests = (room.occupancy?.adults || 0) >= filters.adults && 
                         (room.occupancy?.children || 0) >= filters.children;
    const matchesView = !filters.view || 
                       (room.view && room.view.toLowerCase() === filters.view.toLowerCase());
    const matchesAmenities = filters.amenities.length === 0 || 
                           (room.amenities && filters.amenities.every(a => room.amenities.includes(a)));
    const matchesFloor = !filters.floor || room.floor === filters.floor;
    
    return matchesSearch && matchesPrice && matchesBed && matchesGuests && 
           matchesView && matchesAmenities && matchesFloor;
  });
  
  console.log(`Filtered rooms: ${filteredRooms.length} out of ${rooms.length}`);

  // Calculate active filter count
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'priceRange' && (value[0] > 0 || value[1] < 5000)) return count + 1;
    if (key === 'bedType' && value) return count + 1;
    if (key === 'adults' && value > 2) return count + 1;
    if (key === 'children' && value > 0) return count + 1;
    if (key === 'view' && value) return count + 1;
    if (key === 'amenities' && value.length > 0) return count + 1;
    if (key === 'floor' && value !== null) return count + 1;
    if (key === 'minReviewRating' && value > 0) return count + 1;
    if (key === 'ratingLabel' && value !== "Any") return count + 1;
    return count;
  }, 0);

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Handle room comparison
  const handleCompare = (roomId) => {
    setComparisonRooms(prev => {
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId);
      } else {
        if (prev.length >= 3) {
          toast({
            title: "Maximum rooms reached",
            description: "You can compare up to 3 rooms at a time.",
            variant: "default",
          });
          return prev;
        }
        return [...prev, roomId];
      }
    });
  };

  // Remove room from comparison
  const handleRemoveFromComparison = (roomId) => {
    setComparisonRooms(prev => prev.filter(id => id !== roomId));
  };

  // Clear all comparisons
  const handleClearComparisons = () => {
    setComparisonRooms([]);
  };

  // Get comparison rooms data
  const getComparisonRoomsData = () => {
    return rooms.filter(room => comparisonRooms.includes(room._id));
  };

  // Handle book now
  const handleBookNow = (roomId) => {
    if (!roomId) {
      toast({
        title: "Error",
        description: "Invalid room selected. Please try again.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/book-room/${roomId}`);
  };

  // Handle view details
  const handleViewDetails = (room) => {
    if (!room || !room._id) {
      toast({
        title: "Error",
        description: "Room details not available. Please try again.",
        variant: "destructive",
      });
      return;
    }
    setSelectedRoom(room);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      priceRange: [0, 5000],
      bedType: "",
      adults: 2,
      children: 0,
      view: "",
      amenities: [],
      ratingLabel: "Any",
      minReviewRating: 0,
      floor: null,
    });
    setSearchQuery("");
  };

  // Handle floor selection
  const handleFloorSelect = (floorNumber) => {
    setSelectedFloor(floorNumber);
    setFilters(prev => ({
      ...prev,
      floor: floorNumber === null ? null : floorNumber
    }));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Profile Button */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        {/* <Link to="/guest/profile" className="group">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-colors duration-200">
            <User className="w-5 h-5 text-white" />
            <span className="text-white font-medium">Profile</span>
          </div>
        </Link> */}
        <Link to="/logout" className="group">
          <div className="flex items-center justify-center w-10 h-10 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors duration-200">
            <LogOut className="w-5 h-5 text-white" />
          </div>
        </Link>
      </div>

      {/* Hotel Hero Section */}
      <HotelHero />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 sticky top-4 z-30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search rooms by name, type or amenities..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
            
            {/* Desktop Filter Icon */}
<div className="hidden lg:flex relative">
  <motion.button
    onClick={() => setShowFilters(!showFilters)}
    className={cn(
      "p-3 rounded-full shadow-md text-white",
      "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
      "flex items-center justify-center"
    )}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Filter className="h-5 w-5" />
    {activeFilterCount > 0 && (
      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-indigo-600 text-xs font-bold">
        {activeFilterCount}
      </span>
    )}
  </motion.button>
</div>

            
          </div>
        </div>
        
        {/* Filter Sidebar and Room Grid */}
        <div className="relative">
          <AnimatePresence>
            {showFilters && (
              <>
                {/* Backdrop */}
                <motion.div 
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFilters(false)}
                />
                
                {/* Filter Sidebar */}
                <motion.div 
                  className="fixed top-0 left-0 h-full w-80 bg-white/90 backdrop-blur-lg shadow-2xl border-r border-white/20 z-50 overflow-y-auto"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-gray-800">Filters</h2>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={clearFilters}
                          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          Clear all
                        </button>
                        <button 
                          onClick={() => setShowFilters(false)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100/50"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <FilterSidebar
                      isOpen={showFilters}
                      onToggle={() => setShowFilters(!showFilters)}
                      filters={filters}
                      onFiltersChange={setFilters}
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          
          {/* Room Grid */}
          <div className={cn(
            "transition-all duration-300",
            showFilters ? 'lg:ml-80' : 'lg:ml-0'
          )}>
            {/* Floor Selector */}
            {floors.length > 0 && (
              <div className="mb-6">
                <FloorSelection
                  floors={floors}
                  selectedFloor={selectedFloor}
                  onFloorSelect={handleFloorSelect}
                />
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : filteredRooms.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}>
                {filteredRooms.map((room) => (
                  <RoomCard
                    key={room._id}
                    id={room._id}
                    name={room.title || room.name}
                    image={room.images?.[0]?.url || 'https://source.unsplash.com/random/600x400?hotel,room'}
                    price={room.basePrice || room.price}
                    maxGuests={(room.occupancy?.adults || 0) + (room.occupancy?.children || 0)}
                    bedType={room.bedType}
                    view={room.view}
                    amenities={room.amenities || []}
                    size={room.size}
                    status={room.status?.toLowerCase() || 'available'}
                    rating={room.reviewSummary?.averageRating || room.rating}
                    isInComparison={comparisonRooms.includes(room._id)}
                    onWishlist={handleCompare}
                    onCompare={handleCompare}
                    onViewDetails={() => handleViewDetails(room)}
                    onBookNow={() => handleBookNow(room._id)}
                  />
                ))}
              </div>
            ) : (
              <motion.div 
                className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No rooms found</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  We couldn't find any rooms matching your criteria. Try adjusting your filters or search query.
                </p>
                <div className="mt-6">
                  <Button 
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    Clear all filters
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Floating action button for mobile */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-4 rounded-full shadow-xl text-white",
              "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
              "flex items-center justify-center"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter className="h-6 w-6" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-indigo-600 text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </motion.button>
        </div>
        
        {/* Modals and Compare Feature */}
        <AnimatePresence>
          {selectedRoom && (
            <RoomModal
              room={{
                ...selectedRoom,
                name: selectedRoom.title || selectedRoom.name,
                price: selectedRoom.basePrice || selectedRoom.price,
                id: selectedRoom._id,
                maxGuests: (selectedRoom.occupancy?.adults || 0) + (selectedRoom.occupancy?.children || 0),
                reviews: {
                  rating: selectedRoom.reviewSummary?.averageRating || 0,
                  count: selectedRoom.reviewSummary?.totalReviews || 0,
                  recent: []
                },
                images: selectedRoom.images?.map(img => img.url) || [],
              }}
              onClose={() => setSelectedRoom(null)}
              onBookNow={() => handleBookNow(selectedRoom._id)}
            />
          )}
        </AnimatePresence>

        {/* Compare Feature */}
        <CompareFeature
          rooms={getComparisonRoomsData().map(room => ({
            id: room._id,
            name: room.title || room.name,
            image: room.images?.[0]?.url || 'https://source.unsplash.com/random/600x400?hotel,room',
            price: room.basePrice || room.price,
            view: room.view || 'City',
            bedType: room.bedType,
            maxGuests: (room.occupancy?.adults || 0) + (room.occupancy?.children || 0),
            amenities: room.amenities || [],
            rating: room.reviewSummary?.averageRating || 0,
            size: room.size
          }))}
          onRemove={handleRemoveFromComparison}
          onClear={handleClearComparisons}
        />
      </div>
    </div>
  );
};

export default GuestDashboardPage;