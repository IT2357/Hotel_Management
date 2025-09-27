// 📁 frontend/src/components/menu/MenuFilters.jsx
import { X } from 'lucide-react';

const MenuFilters = ({ filters, onFilterChange, onClearFilters, onClose }) => {
  const handleTypeChange = (type) => {
    onFilterChange({ ...filters, type });
  };

  const handleSpiceLevelChange = (spiceLevel) => {
    onFilterChange({ ...filters, spiceLevel });
  };

  const handleDietaryTagToggle = (tag) => {
    const newTags = filters.dietaryTags.includes(tag)
      ? filters.dietaryTags.filter(t => t !== tag)
      : [...filters.dietaryTags, tag];
    onFilterChange({ ...filters, dietaryTags: newTags });
  };

  const foodTypes = ['Veg', 'Non-Veg', 'Seafood'];
  const spiceLevels = ['Mild', 'Medium', 'Hot'];
  const dietaryTags = ['Halal', 'Vegan', 'Gluten-Free', 'Dairy-Free'];

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Food Type */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Food Type</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="foodType"
                  value="all"
                  checked={filters.type === 'all'}
                  onChange={() => handleTypeChange('all')}
                  className="mr-2"
                />
                All Types
              </label>
              {foodTypes.map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="foodType"
                    value={type}
                    checked={filters.type === type}
                    onChange={() => handleTypeChange(type)}
                    className="mr-2"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Spice Level */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Spice Level</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="spiceLevel"
                  value="all"
                  checked={filters.spiceLevel === 'all'}
                  onChange={() => handleSpiceLevelChange('all')}
                  className="mr-2"
                />
                All Levels
              </label>
              {spiceLevels.map((level) => (
                <label key={level} className="flex items-center">
                  <input
                    type="radio"
                    name="spiceLevel"
                    value={level}
                    checked={filters.spiceLevel === level}
                    onChange={() => handleSpiceLevelChange(level)}
                    className="mr-2"
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>

          {/* Dietary Tags */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Dietary Preferences</h4>
            <div className="space-y-2">
              {dietaryTags.map((tag) => (
                <label key={tag} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.dietaryTags.includes(tag)}
                    onChange={() => handleDietaryTagToggle(tag)}
                    className="mr-2"
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuFilters;
