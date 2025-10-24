import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Search, Filter, Plus, Grid, List, RefreshCw, ShoppingCart } from 'lucide-react';
import foodService from '../../services/foodService';
import PropTypes from 'prop-types';
import { FoodItemCard } from './FoodCard';
import { useCart } from '../../context/CartContext';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const FoodMenu = ({
  onEditItem,
  onAddItem,
  onOrderItem,
  onAddToCart,
  showManagementActions = false
}) => {
  FoodMenu.propTypes = {
    onEditItem: PropTypes.func,
    onAddItem: PropTypes.func,
    onOrderItem: PropTypes.func,
    onAddToCart: PropTypes.func,
    showManagementActions: PropTypes.bool
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { getItemCount, addToCart } = useCart();

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // React Query for menu items with debounced search
  const { data: menuItems = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['menu', debouncedSearchTerm, selectedCategory, showAvailableOnly],
    queryFn: async () => {
      const filters = {
        search: debouncedSearchTerm,
        category: selectedCategory,
        isAvailable: showAvailableOnly
      };
      const response = await foodService.getMenuItems(filters);
      return response.data.data || [];
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  });

  // Get unique categories from menu items
  const categories = useMemo(() => {
    const uniqueCategories = ['all', ...new Set(menuItems.map(item => item.category).filter(Boolean))];
    return uniqueCategories;
  }, [menuItems]);

  const handleDeleteItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await foodService.deleteMenuItem(item._id);
        // Invalidate the query to refetch the data
        queryClient.invalidateQueries(['menu']);
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Failed to delete menu item. Please try again.');
      }
    }
  };

  // Filter menu items based on search term, category, and availability
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = !debouncedSearchTerm ||
        item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesAvailability = !showAvailableOnly || item.isAvailable;

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [menuItems, debouncedSearchTerm, selectedCategory, showAvailableOnly]);

  // Group items by category for better organization
  const groupedItems = useMemo(() => {
    return filteredItems.reduce((groups, item) => {
      const category = item.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {});
  }, [filteredItems]);

  // Handle add to cart
  const handleAddToCart = (item) => {
    // Add item to cart context
    addToCart(item);
    // Also call the onAddToCart prop if provided (for backward compatibility)
    onAddToCart?.(item);
  };

  // Handle order item
  const handleOrderItem = (item) => {
    onOrderItem?.(item);
  };

  // Handle view item details
  const handleViewItemDetails = (item) => {
    // In a real app, this would navigate to a detail page
    console.log('View item details:', item);
  };

  // Navigate to cart
  const handleViewCart = () => {
    navigate('/food/cart');
  };

  // Loading skeletons
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg mb-6"></div>
          <div className="flex gap-4 mb-6">
            <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-48"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
          </div>
        </div>
        
        {/* Grid skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load menu items: {error?.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>Menu Items</span>
              <Badge variant="secondary">{filteredItems.length}</Badge>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              {showManagementActions && (
                <Button onClick={onAddItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              )}
              <Button onClick={handleViewCart} size="sm" className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart
                {getItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Availability Filter */}
            <Button
              variant={showAvailableOnly ? "default" : "outline"}
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              size="sm"
            >
              Available Only
            </Button>
            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Menu Items Display */}
      {filteredItems.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              {menuItems.length === 0
                ? 'No menu items found. Add some items to get started!'
                : 'No items match your current filters.'}
            </p>
            {showManagementActions && menuItems.length === 0 && (
              <Button onClick={onAddItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {category}
                <Badge variant="outline">{items.length}</Badge>
              </h3>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map(item => (
                    <FoodItemCard
                      key={item._id}
                      item={item}
                      onAddToCart={handleAddToCart}
                      onOrder={handleOrderItem}
                      onViewDetails={handleViewItemDetails}
                      showActions={!showManagementActions}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => (
                    <Card key={item._id} className="p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={item.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAzM3M0LjE2NiA0LjE2NiA0LjE2NiAxMC44MzQgMCAxNS00LjE2NiAxMC44MzQtNC4xNjYgNC4xNjYtMTA4MzQgMC0xMC44MzQtNC4xNjYtMTAuODM0LTEwLjgzNC4wLTE1eiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4='}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-lg">{item.name}</h4>
                            <span className="font-bold text-lg text-primary">
                              LKR {item.price}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              {item.isVeg && <Badge variant="secondary" className="text-xs">Veg</Badge>}
                              {item.isSpicy && <Badge variant="secondary" className="text-xs">Spicy</Badge>}
                              {item.isPopular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                            </div>
                            <div className="flex gap-2">
                              {onOrderItem && (
                                <Button
                                  onClick={() => onOrderItem(item)}
                                  size="sm"
                                  disabled={!item.isAvailable}
                                >
                                  Order
                                </Button>
                              )}
                              {onAddToCart && (
                                <Button
                                  onClick={() => onAddToCart(item)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
                                  disabled={!item.isAvailable}
                                >
                                  🛒 Add to Cart
                                </Button>
                              )}
                              {showManagementActions && (
                                <>
                                  <Button
                                    onClick={() => onEditItem(item)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteItem(item)}
                                    variant="destructive"
                                    size="sm"
                                  >
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodMenu;