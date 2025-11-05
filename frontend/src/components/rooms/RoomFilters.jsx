import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { X, Filter } from 'lucide-react';

export default function RoomFilters({
  filters,
  onFilterChange,
  onClearFilters,
  className = ""
}) {
  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== '' && value !== 0 && value !== 1 && !(Array.isArray(value) && value.length === 0)
  );

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-800">Filter Rooms</h2>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Room Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Room Type
          </label>
          <Select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Standard">Standard</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Suite">Suite</option>
            <option value="Executive">Executive Suite</option>
            <option value="Presidential">Presidential Suite</option>
            <option value="Family">Family Room</option>
            <option value="Connecting">Connecting Rooms</option>
          </Select>
        </div>

        {/* Capacity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Minimum Capacity
          </label>
          <Select
            value={filters.minCapacity || 1}
            onChange={(e) => handleFilterChange('minCapacity', parseInt(e.target.value))}
          >
            <option value={1}>1 Person</option>
            <option value={2}>2 People</option>
            <option value={3}>3 People</option>
            <option value={4}>4 People</option>
            <option value={5}>5+ People</option>
          </Select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Max Price per Night
          </label>
          <Input
            type="number"
            placeholder="Enter max price"
            value={filters.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            min="0"
            step="1000"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty for no price limit</p>
        </div>

        {/* Amenities Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Amenities
          </label>
          <div className="space-y-2">
            {[
              'WiFi',
              'Ocean View',
              'Balcony',
              'Mini Bar',
              'Air Conditioning',
              'Room Service',
              'Safe',
              'TV',
              'Kitchen',
              'Washing Machine'
            ].map((amenity) => (
              <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.amenities?.includes(amenity) || false}
                  onChange={(e) => {
                    const currentAmenities = filters.amenities || [];
                    if (e.target.checked) {
                      handleFilterChange('amenities', [...currentAmenities, amenity]);
                    } else {
                      handleFilterChange('amenities', currentAmenities.filter(a => a !== amenity));
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bed Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Bed Type
          </label>
          <Select
            value={filters.bedType || ''}
            onChange={(e) => handleFilterChange('bedType', e.target.value)}
          >
            <option value="">Any Bed Type</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Queen">Queen</option>
            <option value="King">King</option>
            <option value="Twin">Twin</option>
          </Select>
        </div>

        {/* Floor Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Floor Preference
          </label>
          <Select
            value={filters.floor || ''}
            onChange={(e) => handleFilterChange('floor', e.target.value)}
          >
            <option value="">Any Floor</option>
            <option value="Ground">Ground Floor</option>
            <option value="Low">Low Floor (1-3)</option>
            <option value="Mid">Mid Floor (4-7)</option>
            <option value="High">High Floor (8+)</option>
          </Select>
        </div>

        {/* View Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Room View
          </label>
          <Select
            value={filters.view || ''}
            onChange={(e) => handleFilterChange('view', e.target.value)}
          >
            <option value="">Any View</option>
            <option value="Ocean">Ocean View</option>
            <option value="Garden">Garden View</option>
            <option value="City">City View</option>
            <option value="Pool">Pool View</option>
            <option value="Mountain">Mountain View</option>
          </Select>
        </div>

        {/* Accessibility Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Accessibility
          </label>
          <Select
            value={filters.accessibility || ''}
            onChange={(e) => handleFilterChange('accessibility', e.target.value)}
          >
            <option value="">All Rooms</option>
            <option value="Wheelchair">Wheelchair Accessible</option>
            <option value="Hearing">Hearing Impaired</option>
            <option value="Visual">Visual Impaired</option>
          </Select>
        </div>

        {/* Apply Filters Button */}
        <div className="pt-4">
          <Button
            className="w-full"
            onClick={() => onFilterChange(filters)}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </Card>
  );
}