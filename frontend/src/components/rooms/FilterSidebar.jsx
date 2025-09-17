import { Button } from "@/components/rooms/ui/button";
import { Input } from "@/components/rooms/ui/input";
import { Label } from "@/components/rooms/ui/label";
import { Checkbox } from "@/components/rooms/ui/checkbox";
import { Slider } from "@/components/rooms/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/rooms/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/rooms/ui/card";
import { Badge } from "@/components/rooms/ui/badge";
import { X, Filter } from "lucide-react";
import { useState } from "react";

const FilterSidebar = ({ 
  isOpen, 
  onToggle, 
  filters, 
  onFiltersChange, 
  onClearFilters 
}) => {
  const bedTypes = ["Any", "Single", "Queen", "King", "Family"];
  const viewTypes = ["City", "Ocean", "Garden", "Mountain"];
  const amenityTypes = ["WiFi", "Parking", "Coffee", "Bathtub", "Balcony", "AC", "TV", "Minibar"];

  const updateFilters = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleView = (view) => {
    const updatedViews = filters.view.includes(view)
      ? filters.view.filter(v => v !== view)
      : [...filters.view, view];
    updateFilters('view', updatedViews);
  };

  const toggleAmenity = (amenity) => {
    const updatedAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    updateFilters('amenities', updatedAmenities);
  };

  const activeFilterCount = 
    (filters.bedType !== "Any" ? 1 : 0) +
    (filters.adults > 1 ? 1 : 0) +
    (filters.children > 0 ? 1 : 0) +
    filters.view.length +
    filters.amenities.length;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 bg-background shadow-card"
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeFilterCount > 0 && (
          <Badge variant="default" className="ml-2 h-5 w-5 p-0 text-xs">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-full lg:h-auto w-80 lg:w-full
        bg-background border-r lg:border-r-0 border-border
        transform transition-transform duration-300 z-50 lg:z-auto
        overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-display font-semibold">Filters</h2>
              {activeFilterCount > 0 && (
                <Badge variant="default" className="h-6 w-6 p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="lg:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Price Range */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Price Range</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="px-2">
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilters('priceRange', value)}
                  max={500}
                  min={50}
                  step={10}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}</span>
              </div>
            </CardContent>
          </Card>

          {/* Bed Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bed Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={filters.bedType} 
                onValueChange={(value) => updateFilters('bedType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bed type" />
                </SelectTrigger>
                <SelectContent>
                  {bedTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Number of Guests */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Number of Guests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="adults" className="text-sm font-medium mb-2 block">
                  Adults
                </Label>
                <Select 
                  value={filters.adults.toString()} 
                  onValueChange={(value) => updateFilters('adults', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="1" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="children" className="text-sm font-medium mb-2 block">
                  Children
                </Label>
                <Select 
                  value={filters.children.toString()} 
                  onValueChange={(value) => updateFilters('children', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="0" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* View */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {viewTypes.map((view) => (
                <div key={view} className="flex items-center space-x-2">
                  <Checkbox
                    id={`view-${view}`}
                    checked={filters.view.includes(view)}
                    onCheckedChange={() => toggleView(view)}
                  />
                  <Label 
                    htmlFor={`view-${view}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {view} View
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {amenityTypes.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={filters.amenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <Label 
                    htmlFor={`amenity-${amenity}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {amenity}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;
