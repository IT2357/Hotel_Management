import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, Filter, Plus, Grid, List, RefreshCw } from 'lucide-react';
import foodService from '../../services/foodService';
import PropTypes from 'prop-types';

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
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  // Get unique categories from menu items
  const categories = ['all', ...new Set(menuItems.map(item => item.category).filter(Boolean))];

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await foodService.getMenuItems();
      setMenuItems(response.data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load menu items');
      console.error('Error loading menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMenuItems();
    setRefreshing(false);
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await foodService.deleteMenuItem(item._id);
        setMenuItems(prev => prev.filter(menuItem => menuItem._id !== item._id));
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Failed to delete menu item. Please try again.');
      }
    }
  };

  // Filter menu items based on search term, category, and availability
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesAvailability = !showAvailableOnly || item.isAvailable;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Group items by category for better organization
  const groupedItems = filteredItems.reduce((groups, item) => {
    const category = item.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  // ...existing code...
  // (No changes needed, as the file already matches the accurate version from nofood-with-food-manual)
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
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {showManagementActions && (
                <Button onClick={onAddItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              )}
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
                    <FoodCard
                      key={item._id}
                      item={item}
                      onEdit={showManagementActions ? onEditItem : null}
                      onDelete={showManagementActions ? handleDeleteItem : null}
                      onOrder={onOrderItem}
                      onAddToCart={onAddToCart}
                      showActions={showManagementActions}
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
                            src={item.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAzM0M0NC4xNjYgMzMgNDcuNSAzNS4zNDQgNDcuNSAzOEM0Ny41IDQwLjY1NiA0NC4xNjYgNDMgNDAgNDNDMzUuODM0IDQzIDMyLjUgNDAuNjU2IDMyLjUgMzhDMzIuNSAzNS4zNDQgMzUuODM0IDMzIDQwIDMzWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4='}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-lg">{item.name}</h4>
                            <span className="font-bold text-lg text-primary">
                              ${item.price}
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