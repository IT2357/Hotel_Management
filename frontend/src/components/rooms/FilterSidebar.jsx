import { Button } from "@/components/rooms/ui/button";
import { Input } from "@/components/rooms/ui/input";
import { Label } from "@/components/rooms/ui/label";
import { Checkbox } from "@/components/rooms/ui/checkbox";
import { Slider } from "@/components/rooms/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/rooms/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/rooms/ui/card";
import { Badge } from "@/components/rooms/ui/badge";
import { X, Filter } from "lucide-react";

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
  const statuses = ["Any", "Available", "Booked", "Maintenance"];
  const cancellationPolicies = ["Any", "Flexible", "Moderate", "Strict"];
  const ratingLabels = ["Excellent", "Good", "Average", "Poor"];
  const cleaningStatuses = ["Any", "Scheduled", "In Progress", "Completed"];

  // ✅ Destructure filters safely with defaults
  const {
    priceRange = [50, 500],
    bedType = "Any",
    adults = 1,
    children = 0,
    view = [],
    amenities = [],
    floor = "Any",
    status = "Any",
    sizeRange = [10, 200],
    cancellationPolicy = "Any",
    ratingLabel = "",
    minReviewRating = 0,
    discountAvailable = false,
    packagesIncluded = false,
    cleaningStatus = "Any",
  } = filters || {};

  const updateFilters = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleView = (view) => {
    const updatedViews = view.includes(view)
      ? view.filter(v => v !== view)
      : [...view, view];
    updateFilters("view", updatedViews);
  };

  const toggleAmenity = (amenity) => {
    const updatedAmenities = amenities.includes(amenity)
      ? amenities.filter(a => a !== amenity)
      : [...amenities, amenity];
    updateFilters("amenities", updatedAmenities);
  };

  const activeFilterCount =
    (bedType !== "Any" ? 1 : 0) +
    (adults > 1 ? 1 : 0) +
    (children > 0 ? 1 : 0) +
    view.length +
    amenities.length +
    (status !== "Any" ? 1 : 0) +
    (cancellationPolicy !== "Any" ? 1 : 0) +
    (ratingLabel ? 1 : 0) +
    (discountAvailable ? 1 : 0) +
    (packagesIncluded ? 1 : 0) +
    (cleaningStatus !== "Any" ? 1 : 0);

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
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
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
                  value={priceRange}
                  onValueChange={(value) => updateFilters("priceRange", value)}
                  max={500}
                  min={50}
                  step={10}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>${priceRange?.[0] ?? 50}</span>
                <span>${priceRange?.[1] ?? 500}</span>
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
                value={bedType}
                onValueChange={(value) => updateFilters("bedType", value)}
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
                  value={adults.toString()}
                  onValueChange={(value) => updateFilters("adults", parseInt(value))}
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
                  value={children.toString()}
                  onValueChange={(value) => updateFilters("children", parseInt(value))}
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
              {viewTypes.map((v) => (
                <div key={v} className="flex items-center space-x-2">
                  <Checkbox
                    id={`view-${v}`}
                    checked={view.includes(v)}
                    onCheckedChange={() => toggleView(v)}
                  />
                  <Label
                    htmlFor={`view-${v}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {v} View
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
                    checked={amenities.includes(amenity)}
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

          {/* Floor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Floor</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={floor?.toString() || "Any"}
                onValueChange={(value) => updateFilters("floor", value === "Any" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {["Any", 1, 2, 3, 4, 5].map((f) => (
                    <SelectItem key={f} value={f.toString()}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={status}
                onValueChange={(value) => updateFilters("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Room Size */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Room Size (sqm)</CardTitle>
            </CardHeader>
            <CardContent>
              <Slider
                value={sizeRange}
                onValueChange={(value) => updateFilters("sizeRange", value)}
                max={200}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{sizeRange?.[0] ?? 10} sqm</span>
                <span>{sizeRange?.[1] ?? 200} sqm</span>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Policy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cancellation Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={cancellationPolicy}
                onValueChange={(value) => updateFilters("cancellationPolicy", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {cancellationPolicies.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Rating */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={ratingLabel}
                onValueChange={(value) => updateFilters("ratingLabel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {ratingLabels.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label className="text-sm font-medium">Min Stars</Label>
              <Slider
                value={[minReviewRating ?? 0]}
                onValueChange={(value) => updateFilters("minReviewRating", value[0])}
                max={5}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground">
                {minReviewRating ?? 0} ★ & up
              </div>
            </CardContent>
          </Card>

          {/* Extra Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Extra Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="discountAvailable"
                  checked={discountAvailable}
                  onCheckedChange={(checked) => updateFilters("discountAvailable", checked)}
                />
                <Label htmlFor="discountAvailable" className="text-sm font-normal cursor-pointer">
                  Discount Available
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="packagesIncluded"
                  checked={packagesIncluded}
                  onCheckedChange={(checked) => updateFilters("packagesIncluded", checked)}
                />
                <Label htmlFor="packagesIncluded" className="text-sm font-normal cursor-pointer">
                  Packages Included
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Cleaning Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cleaning Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={cleaningStatus}
                onValueChange={(value) => updateFilters("cleaningStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {cleaningStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;
