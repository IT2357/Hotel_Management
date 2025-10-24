import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, ChefHat, Loader2, RefreshCw, Search, Filter, Grid3x3, List, Eye, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import FoodButton from '../../components/food/FoodButton';
import FoodInput from '../../components/food/FoodInput';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/food/FoodCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/food/FoodTabs';
import FoodBadge from '../../components/food/FoodBadge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import foodService from '../../services/foodService';

// Import the components
import MenuItemForm from '../../components/food/admin/MenuItemForm';
import AIMenuExtractor from '../../components/food/admin/AIMenuExtractor';

// API Base URL for image paths
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EnhancedFoodMenuManagementPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Form states
  const [showItemForm, setShowItemForm] = useState(false);
  const [showAIExtractor, setShowAIExtractor] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [itemsResponse, categoriesResponse] = await Promise.all([
        foodService.getMenuItems(),
        foodService.getCategories()
      ]);

      setMenuItems(itemsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load menu data');
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (formData) => {
    try {
      setIsSubmitting(true);
      
      const response = await foodService.createMenuItem(formData);
      
      if (response.success) {
        toast.success('Menu item created successfully');
        setShowItemForm(false);
        loadData();
      } else {
        throw new Error(response.message || 'Failed to create menu item');
      }
    } catch (error) {
      console.error('Error creating menu item:', error);
      toast.error(error.message || 'Failed to create menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = async (formData) => {
    try {
      setIsSubmitting(true);
      
      const response = await foodService.updateMenuItem(editingItem._id, formData);
      
      if (response.success) {
        toast.success('Menu item updated successfully');
        setShowItemForm(false);
        setEditingItem(null);
        loadData();
      } else {
        throw new Error(response.message || 'Failed to update menu item');
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error(error.message || 'Failed to update menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const response = await foodService.deleteMenuItem(item._id);
      
      if (response.success) {
        toast.success('Menu item deleted successfully');
        loadData();
      } else {
        throw new Error(response.message || 'Failed to delete menu item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error(error.message || 'Failed to delete menu item');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const updatedData = {
        ...item,
        isAvailable: !item.isAvailable
      };
      
      const response = await foodService.updateMenuItem(item._id, updatedData);
      
      if (response.success) {
        toast.success(`Item ${updatedData.isAvailable ? 'enabled' : 'disabled'} successfully`);
        loadData();
      } else {
        throw new Error(response.message || 'Failed to update item availability');
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error(error.message || 'Failed to update item availability');
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setShowItemForm(true);
  };

  const handleFormClose = () => {
    setShowItemForm(false);
    setEditingItem(null);
  };

  const handleFormSubmit = (formData) => {
    if (editingItem) {
      handleEditItem(formData);
    } else {
      handleCreateItem(formData);
    }
  };

  const handleAIItemsExtracted = async (extractedItems) => {
    try {
      setIsSubmitting(true);
      
      const promises = extractedItems.map(item => 
        foodService.createMenuItem(item)
      );
      
      await Promise.all(promises);
      
      toast.success(`${extractedItems.length} menu items created successfully`);
      setShowAIExtractor(false);
      loadData();
    } catch (error) {
      console.error('Error creating extracted items:', error);
      toast.error('Failed to create some menu items');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter items by category and search
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || 
      (item.category && typeof item.category === 'object' && item.category !== null 
        ? item.category._id === selectedCategory 
        : item.category === selectedCategory);
    
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Group items by category
  const itemsByCategory = categories.map(category => ({
    category,
    items: filteredItems.filter(item => {
      if (!item.category) return false; // Skip items without category
      return typeof item.category === 'object' && item.category !== null
        ? item.category._id === category._id 
        : item.category === category._id;
    })
  })).filter(group => group.items.length > 0);

  // Enhanced Menu Item Card
  const MenuItemCard = ({ item }) => {
    const categoryName = (item.category && typeof item.category === 'object') 
      ? item.category.name 
      : 'Uncategorized';
    const categoryIcon = (item.category && typeof item.category === 'object') 
      ? item.category.icon 
      : '🍽️';

    // Build proper image URL
    const getImageUrl = () => {
      if (item.imageUrl) {
        // If imageUrl starts with http, use as-is
        if (item.imageUrl.startsWith('http')) {
          return item.imageUrl;
        }
        // If it's a relative path, prepend API base
        if (item.imageUrl.startsWith('/')) {
          // Convert old /api/menu/image/ paths to new /api/images/ format
          const normalizedPath = item.imageUrl.replace('/api/menu/image/', '/api/images/');
          return `${API_BASE_URL}${normalizedPath}`;
        }
        return item.imageUrl;
      }
      
      if (item.image) {
        // If image starts with http, use as-is
        if (item.image.startsWith('http')) {
          return item.image;
        }
        // If it's a relative path starting with /api/, prepend base URL
        if (item.image.startsWith('/api/')) {
          // Convert old /api/menu/image/ paths to new /api/images/ format
          const normalizedPath = item.image.replace('/api/menu/image/', '/api/images/');
          return `${API_BASE_URL}${normalizedPath}`;
        }
        // If it's just an ID or relative path, assume it needs /api/images/ prefix
        if (!item.image.startsWith('/')) {
          return `${API_BASE_URL}/api/images/${item.image}`;
        }
        return `${API_BASE_URL}${item.image}`;
      }
      
      return null;
    };

    const imageSrc = getImageUrl();

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4 }}
        className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
      >
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-orange-100 to-amber-100">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image load error:', imageSrc);
                e.target.style.display = 'none';
                e.target.parentElement.querySelector('.placeholder-icon')?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`placeholder-icon w-full h-full flex items-center justify-center absolute inset-0 ${imageSrc ? 'hidden' : ''}`}>
            <ChefHat className="w-16 h-16 text-orange-300" />
          </div>
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
              <span>{categoryIcon}</span>
              <span>{categoryName}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            {item.isAvailable ? (
              <FoodBadge variant="success" className="bg-green-500 text-white">
                Available
              </FoodBadge>
            ) : (
              <FoodBadge variant="destructive" className="bg-red-500 text-white">
                Unavailable
              </FoodBadge>
            )}
          </div>

          {/* Popular Badge */}
          {item.isPopular && (
            <div className="absolute bottom-3 left-3">
              <FoodBadge className="bg-orange-500 text-white">
                ⭐ Popular
              </FoodBadge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
            {item.name}
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {item.description || 'No description available'}
          </p>

          {/* Meta Info */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div className="text-2xl font-bold text-orange-600">
              LKR {parseFloat(item.price || 0).toFixed(2)}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {item.preparationTime && (
                <span>⏱️ {item.preparationTime}m</span>
              )}
              {item.isVeg && <span>🌱 Veg</span>}
              {item.isSpicy && <span>🌶️ Spicy</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <FoodButton
              size="sm"
              variant="outline"
              onClick={() => handleEditClick(item)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </FoodButton>
            <FoodButton
              size="sm"
              variant="outline"
              onClick={() => handleToggleAvailability(item)}
              className={item.isAvailable ? 'text-orange-600 border-orange-600' : 'text-green-600 border-green-600'}
            >
              {item.isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            </FoodButton>
            <FoodButton
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteItem(item)}
            >
              <Trash2 className="w-4 h-4" />
            </FoodButton>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading menu management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Menu Management
              </h1>
              <p className="text-gray-600 mt-2">
                Organize and manage your restaurant menu by categories
              </p>
            </div>
            <div className="flex items-center gap-3">
              <FoodButton
                variant="outline"
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </FoodButton>
              <FoodButton
                onClick={() => setShowAIExtractor(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Extractor
              </FoodButton>
              <FoodButton 
                onClick={handleAddClick}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </FoodButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Total Items</p>
                  <p className="text-3xl font-bold">{menuItems.length}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <ChefHat className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Available</p>
                  <p className="text-3xl font-bold">
                    {menuItems.filter(item => item.isAvailable).length}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <ToggleRight className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500 to-amber-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Popular Items</p>
                  <p className="text-3xl font-bold">
                    {menuItems.filter(item => item.isPopular).length}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <span className="text-3xl">⭐</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Categories</p>
                  <p className="text-3xl font-bold">{categories.length}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Grid3x3 className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <FoodInput
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <FoodButton
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-white shadow-sm' : ''}
              >
                <Grid3x3 className="w-4 h-4" />
              </FoodButton>
              <FoodButton
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
              >
                <List className="w-4 h-4" />
              </FoodButton>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            <FoodButton
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : ''}
            >
              All Items ({menuItems.length})
            </FoodButton>
            {categories.map((category) => (
              <FoodButton
                key={category._id}
                size="sm"
                variant={selectedCategory === category._id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category._id)}
                className={selectedCategory === category._id ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : ''}
              >
                <span className="mr-1">{category.icon}</span>
                {category.name} ({menuItems.filter(item => {
                  if (!item.category) return false;
                  return (typeof item.category === 'object' && item.category !== null 
                    ? item.category._id 
                    : item.category) === category._id;
                }).length})
              </FoodButton>
            ))}
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-red-600 mb-4">{error}</p>
            <FoodButton onClick={loadData}>Try Again</FoodButton>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <ChefHat className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {searchQuery ? 'No items found' : 'No menu items yet'}
            </h3>
            <p className="text-gray-600 mb-8">
              {searchQuery 
                ? 'Try adjusting your search or filter criteria'
                : 'Start by adding your first menu item'
              }
            </p>
            {!searchQuery && (
              <FoodButton 
                onClick={handleAddClick}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </FoodButton>
            )}
          </div>
        ) : selectedCategory === 'all' ? (
          // Show all items grouped by category
          <div className="space-y-12">
            {itemsByCategory.map(({ category, items }) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">{category.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                    <p className="text-gray-600">{items.length} items</p>
                  </div>
                </div>

                {/* Items Grid */}
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <MenuItemCard key={item._id} item={item} />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // Show filtered items
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <MenuItemCard key={item._id} item={item} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <MenuItemForm
        isOpen={showItemForm}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        categories={categories}
        isLoading={isSubmitting}
      />

      <AIMenuExtractor
        isOpen={showAIExtractor}
        onClose={() => setShowAIExtractor(false)}
        categories={categories}
        onItemsExtracted={handleAIItemsExtracted}
      />
    </div>
  );
};

export default EnhancedFoodMenuManagementPage;

