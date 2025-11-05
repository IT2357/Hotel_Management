import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Users, Bed, MapPin, Wifi, Car, Coffee, Bath, Star, Snowflake, Utensils, Flower, Waves, Bell, Map, Fish, Landmark, Building } from 'lucide-react';
import { Button } from '@/components/rooms/ui/button';
import { Label } from '@/components/rooms/ui/label';
import { Slider } from '@/components/rooms/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/rooms/ui/select';
import { Checkbox } from '@/components/rooms/ui/checkbox';
import { formatLKR, getDefaultPriceRange } from '../../utils/sriLankanCurrency';
import { SRI_LANKAN_AMENITIES, BED_TYPES, VIEW_TYPES } from '../../constants/sriLankanHotel';

// Sri Lankan hotel specific options
const bedTypes = Object.values(BED_TYPES).map(bed => bed.name);
const viewTypes = Object.values(VIEW_TYPES).map(view => view.name);

// Enhanced amenities with Sri Lankan context
const amenityIcons = {
  AC: Snowflake,
  WiFi: Wifi,
  Parking: Car,
  Restaurant: Utensils,
  Spa: Flower,
  Pool: Waves,
  Balcony: Building,
  MiniBar: Coffee,
  RoomService: Bell,
  CulturalTours: Map,
  FishingTrips: Fish,
  TempleVisits: Landmark,
};

const amenityOptions = SRI_LANKAN_AMENITIES.map(amenity => ({
  id: amenity.id,
  label: amenity.label,
  icon: amenityIcons[amenity.id] || Star,
  featured: amenity.featured,
  premium: amenity.premium,
  unique: amenity.unique
}));

const ratingOptions = [
  { value: 'Any', label: 'Any Rating' },
  { value: '5 Stars', label: '5 Stars' },
  { value: '4 Stars', label: '4 Stars' },
  { value: '3 Stars', label: '3 Stars' },
  { value: '2 Stars', label: '2 Stars' },
  { value: '1 Star', label: '1 Star' }
];

const FilterSidebar = ({ isOpen, onToggle, filters, onFiltersChange }) => {
  // Ensure filters is always defined with defaults
  const safeFilters = {
    priceRange: getDefaultPriceRange(),
    bedType: '',
    adults: 2,
    children: 0,
    view: '',
    amenities: [],
    ratingLabel: 'Any',
    minReviewRating: 0,
    ...filters
  };

  const updateFilter = (key, value) => {
    console.log('Updating filter:', key, 'to:', value);
    onFiltersChange({ ...safeFilters, [key]: value });
  };

  const toggleAmenity = (amenityId) => {
    const newAmenities = safeFilters.amenities.includes(amenityId)
      ? safeFilters.amenities.filter(id => id !== amenityId)
      : [...safeFilters.amenities, amenityId];
    updateFilter('amenities', newAmenities);
  };

  const clearFilters = () => {
    const defaultRange = getDefaultPriceRange();
    onFiltersChange({
      priceRange: defaultRange, // [5000, 100000] for Sri Lankan context
      bedType: '',
      adults: 2,
      children: 0,
      view: '',
      amenities: [],
      ratingLabel: 'Any',
      minReviewRating: 0,
    });
  };

  return (
    <>
      <style jsx global>{`
        .glassmorphic-dropdown {
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%);
          backdrop-filter: blur(20px) saturate(180%);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        
        /* Enhanced Price Range Slider Styles */
        .slider-enhanced .relative {
          cursor: pointer;
        }
        
        .slider-enhanced [data-radix-slider-track] {
          background-color: rgba(99,102,241,0.25);
          height: 8px;
          border-radius: 4px;
        }
        
        .slider-enhanced [data-radix-slider-range] {
          background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
          height: 8px;
          border-radius: 4px;
        }
        
        .slider-enhanced [data-radix-slider-thumb] {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          border: 3px solid white;
          box-shadow: 0 4px 12px 0 rgba(99, 102, 241, 0.4);
          transition: all 0.2s ease;
          cursor: grab;
        }
        
        .slider-enhanced [data-radix-slider-thumb]:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px 0 rgba(99, 102, 241, 0.6);
        }
        
        .slider-enhanced [data-radix-slider-thumb]:active {
          cursor: grabbing;
          transform: scale(1.05);
        }
        
        /* Rating Slider Styles */
        .slider-rating .relative {
          cursor: pointer;
        }
        
        .slider-rating [data-radix-slider-track] {
          background-color: rgba(245,158,11,0.25);
          height: 8px;
          border-radius: 4px;
        }
        
        .slider-rating [data-radix-slider-range] {
          background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
          height: 8px;
          border-radius: 4px;
        }
        
        .slider-rating [data-radix-slider-thumb] {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          border: 3px solid white;
          box-shadow: 0 4px 12px 0 rgba(245, 158, 11, 0.4);
          transition: all 0.2s ease;
          cursor: grab;
        }
        
        .slider-rating [data-radix-slider-thumb]:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px 0 rgba(245, 158, 11, 0.6);
        }
        
        .slider-rating [data-radix-slider-thumb]:active {
          cursor: grabbing;
          transform: scale(1.05);
        }
      `}</style>
      <div
        className="space-y-6 glassmorphic-sidebar rounded-2xl shadow-2xl border-0 p-6"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
          border: '1.5px solid rgba(255, 255, 255, 0.18)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.13) 0%, rgba(168,85,247,0.10) 100%)',
          backdropFilter: 'blur(14px) saturate(180%)',
        }}
      >
      {/* Price Range */}
      <motion.div className="space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Label className="text-sm font-medium">Price Range</Label>
        <div className="px-3 py-2">
          <Slider
            value={safeFilters.priceRange}
            onValueChange={(value) => {
              console.log('Price range changed:', value);
              updateFilter('priceRange', value);
            }}
            min={5000}
            max={200000}
            step={5000}
            className="w-full slider-enhanced"
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground px-1">
          <span className="bg-indigo-100/80 px-2 py-1 rounded-md font-medium text-indigo-700">{formatLKR(safeFilters.priceRange[0])}</span>
          <span className="bg-indigo-100/80 px-2 py-1 rounded-md font-medium text-indigo-700">{formatLKR(safeFilters.priceRange[1])}</span>
        </div>
        <div className="text-xs text-gray-500 text-center">
          Per night
        </div>
      </motion.div>

      {/* Bed Type */}
      <motion.div className="space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Label className="text-sm font-medium flex items-center gap-2">
          <Bed className="w-4 h-4" /> Bed Type
        </Label>
        <div className="flex gap-2">
          <Select value={safeFilters.bedType} onValueChange={(value) => updateFilter('bedType', value)}>
            <SelectTrigger className="glass flex-1">
              <SelectValue placeholder="Any bed type" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-lg z-50 glassmorphic-dropdown">
              {bedTypes.map(type => <SelectItem key={type} value={type} className="hover:bg-indigo-500/10 transition-colors">{type}</SelectItem>)}
            </SelectContent>
          </Select>
          {safeFilters.bedType && (
            <Button variant="outline" size="sm" onClick={() => updateFilter('bedType', '')} className="glass hover:bg-destructive/10">
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Guests */}
      <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Label className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4" /> Guests
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Adults</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button variant="outline" size="sm" onClick={() => updateFilter('adults', Math.max(1, safeFilters.adults - 1))} className="glass h-8 w-8 p-0">-</Button>
              <span className="w-8 text-center">{safeFilters.adults}</span>
              <Button variant="outline" size="sm" onClick={() => updateFilter('adults', safeFilters.adults + 1)} className="glass h-8 w-8 p-0">+</Button>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Children</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button variant="outline" size="sm" onClick={() => updateFilter('children', Math.max(0, safeFilters.children - 1))} className="glass h-8 w-8 p-0">-</Button>
              <span className="w-8 text-center">{safeFilters.children}</span>
              <Button variant="outline" size="sm" onClick={() => updateFilter('children', safeFilters.children + 1)} className="glass h-8 w-8 p-0">+</Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* View Type */}
      <motion.div className="space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> View Type</Label>
        <div className="flex gap-2">
          <Select value={safeFilters.view} onValueChange={(value) => updateFilter('view', value)}>
            <SelectTrigger className="glass flex-1">
              <SelectValue placeholder="Any view" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-lg z-50 glassmorphic-dropdown">
              {viewTypes.map(type => <SelectItem key={type} value={type} className="hover:bg-indigo-500/10 transition-colors">{type}</SelectItem>)}
            </SelectContent>
          </Select>
          {safeFilters.view && <Button variant="outline" size="sm" onClick={() => updateFilter('view', '')} className="glass hover:bg-destructive/10"><X className="w-3 h-3" /></Button>}
        </div>
      </motion.div>

      {/* Amenities */}
      <motion.div className="space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Label className="text-sm font-medium">Amenities</Label>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {amenityOptions.map(({ id, label, icon: Icon, featured, premium, unique }) => (
            <motion.div 
              key={id} 
              className={`flex items-center space-x-3 p-2 rounded-lg glass hover:bg-primary/5 transition-colors cursor-pointer relative ${
                featured ? 'ring-1 ring-orange-300' : 
                premium ? 'ring-1 ring-purple-300' : 
                unique ? 'ring-1 ring-green-300' : ''
              }`} 
              whileHover={{ scale: 1.02 }} 
              onClick={() => toggleAmenity(id)}
            >
              <Checkbox id={id} checked={safeFilters.amenities.includes(id)} onCheckedChange={() => toggleAmenity(id)} />
              <Icon className={`w-4 h-4 ${
                featured ? 'text-orange-500' : 
                premium ? 'text-purple-500' : 
                unique ? 'text-green-500' : 'text-primary'
              }`} />
              <div className="flex flex-col flex-1">
                <Label htmlFor={id} className="cursor-pointer text-xs font-medium">{label}</Label>
              </div>
              {featured && <span className="text-xs bg-orange-100 text-orange-600 px-1 rounded">Featured</span>}
              {premium && <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">Premium</span>}
              {unique && <span className="text-xs bg-green-100 text-green-600 px-1 rounded">Unique</span>}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Rating */}
      <motion.div className="space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Label className="text-sm font-medium flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Rating</Label>
        <Select value={safeFilters.ratingLabel} onValueChange={(value) => updateFilter('ratingLabel', value)}>
          <SelectTrigger className="glass flex-1"><SelectValue placeholder="Any rating" /></SelectTrigger>
          <SelectContent className="bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-lg z-50 glassmorphic-dropdown">
            {ratingOptions.map(option => (
              <SelectItem key={option.value} value={option.value} className="hover:bg-indigo-500/10 transition-colors">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Label className="text-xs mt-1">Minimum Stars</Label>
        <div className="px-3 py-2">
          <Slider 
            value={[safeFilters.minReviewRating]} 
            min={0} 
            max={5} 
            step={1} 
            onValueChange={(value) => {
              console.log('Rating changed:', value);
              updateFilter('minReviewRating', value[0]);
            }} 
            className="w-full slider-rating" 
          />
        </div>
        <div className="text-sm text-muted-foreground px-1">
          <span className="bg-yellow-100/80 px-2 py-1 rounded-md font-medium text-yellow-700">{safeFilters.minReviewRating} ★ & up</span>
        </div>
      </motion.div>

      {/* Clear Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Button variant="outline" onClick={clearFilters} className="w-full glass hover:bg-destructive/10 hover:text-destructive">
          Clear All Filters
        </Button>
      </motion.div>
    </div>
    </>
  );
};

export default FilterSidebar;