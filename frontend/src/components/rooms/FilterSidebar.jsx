import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Users, Bed, MapPin, Wifi, Car, Coffee, Bath, Star } from 'lucide-react';
import { Button } from '@/components/rooms/ui/button';
import { Label } from '@/components/rooms/ui/label';
import { Slider } from '@/components/rooms/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/rooms/ui/select';
import { Checkbox } from '@/components/rooms/ui/checkbox';

const bedTypes = ['King', 'Queen', 'Twin', 'Double'];
const viewTypes = ['Ocean', 'Garden', 'City', 'Mountain'];
const amenityOptions = [
  { id: 'WiFi', label: 'WiFi', icon: Wifi },
  { id: 'Parking', label: 'Parking', icon: Car },
  { id: 'Coffee', label: 'Coffee Machine', icon: Coffee },
  { id: 'Bathtub', label: 'Bathtub', icon: Bath },
];
const ratingOptions = ['Any', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];

const FilterSidebar = ({ isOpen, onToggle, filters, onFiltersChange }) => {
  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleAmenity = (amenityId) => {
    const newAmenities = filters.amenities.includes(amenityId)
      ? filters.amenities.filter(id => id !== amenityId)
      : [...filters.amenities, amenityId];
    updateFilter('amenities', newAmenities);
  };

  const clearFilters = () => {
    onFiltersChange({
      priceRange: [200, 800],
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
        
        /* Enhanced Slider Styles - Improved targeting for actual structure */
        .slider-enhanced [data-orientation="horizontal"] {
          height: 8px !important;
          background: rgba(99,102,241,0.25) !important;
          border-radius: 4px !important;
          position: relative !important;
          width: 100% !important;
        }
        
        .slider-enhanced [data-orientation="horizontal"] > span[data-orientation="horizontal"] {
          background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%) !important;
          height: 8px !important;
          border-radius: 4px !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        
        .slider-enhanced button[role="slider"] {
          width: 20px !important;
          height: 20px !important;
          border-radius: 50% !important;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important;
          border: 3px solid white !important;
          box-shadow: 0 4px 12px 0 rgba(99, 102, 241, 0.4) !important;
          transition: all 0.2s ease !important;
          position: relative !important;
          z-index: 10 !important;
          cursor: pointer !important;
          outline: none !important;
        }
        
        .slider-enhanced button[role="slider"]:hover {
          transform: scale(1.2) !important;
          box-shadow: 0 6px 20px 0 rgba(99, 102, 241, 0.6) !important;
          border: 4px solid white !important;
        }
        
        .slider-enhanced button[role="slider"]:focus {
          transform: scale(1.1) !important;
          box-shadow: 0 8px 24px 0 rgba(99, 102, 241, 0.7) !important;
          border: 4px solid white !important;
        }
        
        /* Yellow-themed Rating Slider - Improved targeting */
        .slider-rating [data-orientation="horizontal"] {
          height: 8px !important;
          background: rgba(245,158,11,0.25) !important;
          border-radius: 4px !important;
          position: relative !important;
          width: 100% !important;
        }
        
        .slider-rating [data-orientation="horizontal"] > span[data-orientation="horizontal"] {
          background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%) !important;
          height: 8px !important;
          border-radius: 4px !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        
        .slider-rating button[role="slider"] {
          width: 20px !important;
          height: 20px !important;
          border-radius: 50% !important;
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%) !important;
          border: 3px solid white !important;
          box-shadow: 0 4px 12px 0 rgba(245, 158, 11, 0.4) !important;
          transition: all 0.2s ease !important;
          position: relative !important;
          z-index: 10 !important;
          cursor: pointer !important;
          outline: none !important;
        }
        
        .slider-rating button[role="slider"]:hover {
          transform: scale(1.2) !important;
          box-shadow: 0 6px 20px 0 rgba(245, 158, 11, 0.6) !important;
          border: 4px solid white !important;
        }
        
        .slider-rating button[role="slider"]:focus {
          transform: scale(1.1) !important;
          box-shadow: 0 8px 24px 0 rgba(245, 158, 11, 0.7) !important;
          border: 4px solid white !important;
        }
        
        /* Radix UI Slider specific targeting - Enhanced */
        .slider-enhanced [data-radix-slider-track] {
          background: rgba(99,102,241,0.25) !important;
          height: 8px !important;
          border-radius: 4px !important;
          width: 100% !important;
          position: relative !important;
        }
        
        .slider-enhanced [data-radix-slider-range] {
          background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%) !important;
          height: 8px !important;
          border-radius: 4px !important;
          position: absolute !important;
        }
        
        .slider-rating [data-radix-slider-track] {
          background: rgba(245,158,11,0.25) !important;
          height: 8px !important;
          border-radius: 4px !important;
          width: 100% !important;
          position: relative !important;
        }
        
        .slider-rating [data-radix-slider-range] {
          background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%) !important;
          height: 8px !important;
          border-radius: 4px !important;
          position: absolute !important;
        }
        
        /* Direct child targeting fallback - Enhanced */
        .slider-enhanced > div[role="slider"] {
          height: 8px !important;
          background: rgba(99,102,241,0.25) !important;
          border-radius: 4px !important;
          width: 100% !important;
        }
        
        .slider-enhanced > div > div:first-child {
          background: rgba(99,102,241,0.25) !important;
          height: 8px !important;
          border-radius: 4px !important;
          width: 100% !important;
        }
        
        .slider-enhanced > div > div:nth-child(2) {
          background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%) !important;
          height: 8px !important;
          border-radius: 4px !important;
          position: absolute !important;
        }
        
        .slider-rating > div[role="slider"] {
          height: 8px !important;
          background: rgba(245,158,11,0.25) !important;
          border-radius: 4px !important;
          width: 100% !important;
        }
        
        .slider-rating > div > div:first-child {
          background: rgba(245,158,11,0.25) !important;
          height: 8px !important;
          border-radius: 4px !important;
          width: 100% !important;
        }
        
        .slider-rating > div > div:nth-child(2) {
          background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%) !important;
          height: 8px !important;
          border-radius: 4px !important;
          position: absolute !important;
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
            value={filters.priceRange}
            onValueChange={(value) => updateFilter('priceRange', value)}
            min={100}
            max={1000}
            step={50}
            className="w-full slider-enhanced"
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground px-1">
          <span className="bg-indigo-100/80 px-2 py-1 rounded-md font-medium text-indigo-700">${filters.priceRange[0]}</span>
          <span className="bg-indigo-100/80 px-2 py-1 rounded-md font-medium text-indigo-700">${filters.priceRange[1]}</span>
        </div>
      </motion.div>

      {/* Bed Type */}
      <motion.div className="space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Label className="text-sm font-medium flex items-center gap-2">
          <Bed className="w-4 h-4" /> Bed Type
        </Label>
        <div className="flex gap-2">
          <Select value={filters.bedType} onValueChange={(value) => updateFilter('bedType', value)}>
            <SelectTrigger className="glass flex-1">
              <SelectValue placeholder="Any bed type" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-lg z-50 glassmorphic-dropdown">
              {bedTypes.map(type => <SelectItem key={type} value={type} className="hover:bg-indigo-500/10 transition-colors">{type}</SelectItem>)}
            </SelectContent>
          </Select>
          {filters.bedType && (
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
              <Button variant="outline" size="sm" onClick={() => updateFilter('adults', Math.max(1, filters.adults - 1))} className="glass h-8 w-8 p-0">-</Button>
              <span className="w-8 text-center">{filters.adults}</span>
              <Button variant="outline" size="sm" onClick={() => updateFilter('adults', filters.adults + 1)} className="glass h-8 w-8 p-0">+</Button>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Children</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button variant="outline" size="sm" onClick={() => updateFilter('children', Math.max(0, filters.children - 1))} className="glass h-8 w-8 p-0">-</Button>
              <span className="w-8 text-center">{filters.children}</span>
              <Button variant="outline" size="sm" onClick={() => updateFilter('children', filters.children + 1)} className="glass h-8 w-8 p-0">+</Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* View Type */}
      <motion.div className="space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> View Type</Label>
        <div className="flex gap-2">
          <Select value={filters.view} onValueChange={(value) => updateFilter('view', value)}>
            <SelectTrigger className="glass flex-1">
              <SelectValue placeholder="Any view" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-lg z-50 glassmorphic-dropdown">
              {viewTypes.map(type => <SelectItem key={type} value={type} className="hover:bg-indigo-500/10 transition-colors">{type} View</SelectItem>)}
            </SelectContent>
          </Select>
          {filters.view && <Button variant="outline" size="sm" onClick={() => updateFilter('view', '')} className="glass hover:bg-destructive/10"><X className="w-3 h-3" /></Button>}
        </div>
      </motion.div>

      {/* Amenities */}
      <motion.div className="space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Label className="text-sm font-medium">Amenities</Label>
        <div className="space-y-3">
          {amenityOptions.map(({ id, label, icon: Icon }) => (
            <motion.div key={id} className="flex items-center space-x-3 p-2 rounded-lg glass hover:bg-primary/5 transition-colors cursor-pointer" whileHover={{ scale: 1.02 }} onClick={() => toggleAmenity(id)}>
              <Checkbox id={id} checked={filters.amenities.includes(id)} onCheckedChange={() => toggleAmenity(id)} />
              <Icon className="w-4 h-4 text-primary" />
              <Label htmlFor={id} className="cursor-pointer">{label}</Label>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Rating */}
      <motion.div className="space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Label className="text-sm font-medium flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Rating</Label>
        <Select value={filters.ratingLabel} onValueChange={(value) => updateFilter('ratingLabel', value)}>
          <SelectTrigger className="glass flex-1"><SelectValue placeholder="Any rating" /></SelectTrigger>
          <SelectContent className="bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-lg z-50 glassmorphic-dropdown">
            {ratingOptions.map(r => <SelectItem key={r} value={r} className="hover:bg-indigo-500/10 transition-colors">{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Label className="text-xs mt-1">Minimum Stars</Label>
        <div className="px-3 py-2">
          <Slider value={[filters.minReviewRating]} min={0} max={5} step={1} onValueChange={(value) => updateFilter('minReviewRating', value[0])} className="w-full slider-rating" />
        </div>
        <div className="text-sm text-muted-foreground px-1">
          <span className="bg-yellow-100/80 px-2 py-1 rounded-md font-medium text-yellow-700">{filters.minReviewRating} ★ & up</span>
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