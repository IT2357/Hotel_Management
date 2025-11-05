import React, { useState } from 'react';
import { Search, Edit, Trash2, Eye, EyeOff, Star, Clock, DollarSign } from 'lucide-react';
import FoodButton from '../FoodButton';
import FoodInput from '../FoodInput';
import FoodBadge from '../FoodBadge';
import { Card, CardContent } from '../FoodCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../FoodDialog';

const MenuItemsList = ({ 
  items = [], 
  categories = [], 
  onEdit, 
  onDelete, 
  onToggleAvailability,
  isLoading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      item.category?._id === selectedCategory ||
      item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  const getCategoryName = (categoryId) => {
    if (typeof categoryId === 'object') return categoryId.name;
    const category = categories.find(cat => cat._id === categoryId);
    return category?.name || 'Unknown';
  };

  const formatPrice = (price) => {
    return `LKR ${parseFloat(price || 0).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <FoodInput
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <DollarSign className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {searchTerm || selectedCategory ? 'No items found' : 'No menu items'}
          </h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filter criteria'
              : 'Start by adding your first menu item'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                {/* Item Image */}
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <DollarSign className="w-12 h-12" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <FoodBadge 
                      variant={item.isAvailable ? "success" : "default"}
                      size="sm"
                    >
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </FoodBadge>
                  </div>

                  {/* Popular Badge */}
                  {item.isPopular && (
                    <div className="absolute top-2 right-2">
                      <FoodBadge variant="popular" size="sm">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </FoodBadge>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-orange-600">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      {item.cookingTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{item.cookingTime} min</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {item.isVeg && (
                        <FoodBadge variant="success" size="sm">Veg</FoodBadge>
                      )}
                      {item.isSpicy && (
                        <FoodBadge variant="spicy" size="sm">Spicy</FoodBadge>
                      )}
                      {item.spiceLevel && item.spiceLevel !== 'mild' && (
                        <FoodBadge variant="default" size="sm">
                          {item.spiceLevel}
                        </FoodBadge>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Category: {getCategoryName(item.category)}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <FoodButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(item)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </FoodButton>
                      <FoodButton
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(item)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </FoodButton>
                      <FoodButton
                        size="sm"
                        variant="outline"
                        onClick={() => onToggleAvailability(item)}
                        className={item.isAvailable ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {item.isAvailable ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </FoodButton>
                      <FoodButton
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(item)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </FoodButton>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Item Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {selectedItem.imageUrl && (
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
                    <p className="text-gray-600">{selectedItem.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-orange-600">
                      {formatPrice(selectedItem.price)}
                    </span>
                    {selectedItem.cookingTime && (
                      <span className="text-sm text-gray-500">
                        • {selectedItem.cookingTime} min
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-sm text-gray-600">
                      {getCategoryName(selectedItem.category)}
                    </span>
                  </div>

                  {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Ingredients:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedItem.ingredients.map((ingredient, index) => (
                          <FoodBadge key={index} variant="default" size="sm">
                            {ingredient}
                          </FoodBadge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.dietaryTags && selectedItem.dietaryTags.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Dietary Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedItem.dietaryTags.map((tag, index) => (
                          <FoodBadge key={index} variant="success" size="sm">
                            {tag}
                          </FoodBadge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <FoodBadge variant={selectedItem.isAvailable ? "success" : "default"}>
                      {selectedItem.isAvailable ? 'Available' : 'Unavailable'}
                    </FoodBadge>
                    {selectedItem.isPopular && (
                      <FoodBadge variant="popular">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </FoodBadge>
                    )}
                    {selectedItem.isVeg && (
                      <FoodBadge variant="success">Vegetarian</FoodBadge>
                    )}
                    {selectedItem.isSpicy && (
                      <FoodBadge variant="spicy">Spicy</FoodBadge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuItemsList;
