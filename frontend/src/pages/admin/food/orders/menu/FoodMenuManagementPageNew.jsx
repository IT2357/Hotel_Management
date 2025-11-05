import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Sparkles, ChefHat, Loader2, RefreshCw } from 'lucide-react';
import FoodButton from '@/components/food/FoodButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/food/FoodCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/food/FoodTabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import foodService from '@/services/foodService';

// Import the new components
import MenuItemForm from '@/components/food/admin/MenuItemForm';
import AIMenuExtractor from '@/components/food/admin/AIMenuExtractor';
import MenuItemsList from '@/components/food/admin/MenuItemsList';

const FoodMenuManagementPageNew = () => {
  const navigate = useNavigate();
  
  // State management
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        loadData(); // Reload the list
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
        loadData(); // Reload the list
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
        loadData(); // Reload the list
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
        loadData(); // Reload the list
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
      
      // Create all extracted items
      const promises = extractedItems.map(item => 
        foodService.createMenuItem(item)
      );
      
      await Promise.all(promises);
      
      toast.success(`${extractedItems.length} menu items created successfully`);
      setShowAIExtractor(false);
      loadData(); // Reload the list
    } catch (error) {
      console.error('Error creating extracted items:', error);
      toast.error('Failed to create some menu items');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading menu management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
              <p className="text-gray-600 mt-2">
                Manage your restaurant menu items, categories, and pricing
              </p>
            </div>
            <div className="flex gap-3">
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
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Extractor
              </FoodButton>
              <FoodButton onClick={handleAddClick}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </FoodButton>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ChefHat className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{menuItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ChefHat className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {menuItems.filter(item => item.isAvailable).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ChefHat className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Popular</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {menuItems.filter(item => item.isPopular).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ChefHat className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="items" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="items">Menu Items</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
              </TabsList>
              
              <TabsContent value="items" className="mt-6">
                {error ? (
                  <div className="text-center py-12">
                    <p className="text-red-600 mb-4">{error}</p>
                    <FoodButton onClick={loadData}>Try Again</FoodButton>
                  </div>
                ) : (
                  <MenuItemsList
                    items={menuItems}
                    categories={categories}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteItem}
                    onToggleAvailability={handleToggleAvailability}
                    isLoading={loading}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="categories" className="mt-6">
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">Category management coming soon...</p>
                  <FoodButton variant="outline" onClick={() => navigate('/admin/food/categories')}>
                    Manage Categories
                  </FoodButton>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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
    </div>
  );
};

export default FoodMenuManagementPageNew;
