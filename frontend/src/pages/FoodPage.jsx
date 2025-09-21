import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import {
  Plus,
  Upload,
  X,
  Save,
  Trash2,
  Edit,
  Image as ImageIcon,
  ChefHat,
  Sparkles,
  FileImage,
  AlertCircle
} from 'lucide-react';
import FoodMenu from '../components/food/FoodMenu';
import foodService from '../services/foodService';

const FoodPage = () => {
  const [activeTab, setActiveTab] = useState('menu');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isAvailable: true,
    isVeg: false,
    isSpicy: false,
    isPopular: false,
    ingredients: [],
    cookingTime: 15,
    nutritionalInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    },
    customizations: []
  });

  // Categories for dropdown
  const categories = [
    'Appetizers',
    'Main Course',
    'Desserts',
    'Beverages',
    'Sides',
    'Soups',
    'Salads',
    'Pasta',
    'Pizza',
    'Burgers',
    'Sandwiches',
    'Seafood',
    'Grilled',
    'Fried',
    'Vegetarian',
    'Vegan'
  ];

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        description: editingItem.description || '',
        price: editingItem.price || '',
        category: editingItem.category || '',
        isAvailable: editingItem.isAvailable !== false,
        isVeg: editingItem.isVeg || false,
        isSpicy: editingItem.isSpicy || false,
        isPopular: editingItem.isPopular || false,
        ingredients: editingItem.ingredients || [],
        cookingTime: editingItem.cookingTime || 15,
        nutritionalInfo: {
          calories: editingItem.nutritionalInfo?.calories || '',
          protein: editingItem.nutritionalInfo?.protein || '',
          carbs: editingItem.nutritionalInfo?.carbs || '',
          fat: editingItem.nutritionalInfo?.fat || ''
        },
        customizations: editingItem.customizations || []
      });
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      isAvailable: true,
      isVeg: false,
      isSpicy: false,
      isPopular: false,
      ingredients: [],
      cookingTime: 15,
      nutritionalInfo: {
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      },
      customizations: []
    });
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = { ...formData };

      // Add image if selected
      if (selectedImage) {
        submitData.image = selectedImage;
      }

      if (editingItem) {
        await foodService.updateMenuItem(editingItem._id, submitData);
      } else {
        await foodService.createMenuItem(submitData);
      }

      setShowAddDialog(false);
      setEditingItem(null);
      resetForm();

      // Refresh the menu (this would typically trigger a parent component refresh)
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowAddDialog(true);
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await foodService.deleteMenuItem(item._id);
        window.location.reload();
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Failed to delete menu item. Please try again.');
      }
    }
  };

  const handleOrderItem = (item) => {
    // This would typically integrate with an ordering system
    alert(`Ordering: ${item.name} - $${item.price}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Food & Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant's menu items and images</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="menu">Menu View</TabsTrigger>
          <TabsTrigger value="manage">Manage Items</TabsTrigger>
          <TabsTrigger value="ai">AI Tools</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-6">
          <FoodMenu
            showManagementActions={false}
            onOrderItem={handleOrderItem}
          />
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Manage Menu Items</h2>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingItem(null); resetForm(); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-red-700 text-sm">{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cookingTime">Cooking Time (minutes)</Label>
                      <Input
                        id="cookingTime"
                        type="number"
                        min="1"
                        value={formData.cookingTime}
                        onChange={(e) => handleInputChange('cookingTime', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label>Image</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          {imagePreview ? (
                            <div className="space-y-4">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="max-w-full h-48 object-cover mx-auto rounded"
                              />
                              <Button type="button" variant="outline" onClick={removeImage}>
                                <X className="w-4 h-4 mr-2" />
                                Remove Image
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600">Click to upload image</p>
                              <p className="text-sm text-gray-500 mt-2">PNG, JPG, WEBP up to 15MB</p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Nutritional Information */}
                  <div>
                    <Label>Nutritional Information</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label htmlFor="calories" className="text-sm">Calories</Label>
                        <Input
                          id="calories"
                          type="number"
                          min="0"
                          value={formData.nutritionalInfo.calories}
                          onChange={(e) => handleInputChange('nutritionalInfo.calories', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="protein" className="text-sm">Protein (g)</Label>
                        <Input
                          id="protein"
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.nutritionalInfo.protein}
                          onChange={(e) => handleInputChange('nutritionalInfo.protein', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="carbs" className="text-sm">Carbs (g)</Label>
                        <Input
                          id="carbs"
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.nutritionalInfo.carbs}
                          onChange={(e) => handleInputChange('nutritionalInfo.carbs', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fat" className="text-sm">Fat (g)</Label>
                        <Input
                          id="fat"
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.nutritionalInfo.fat}
                          onChange={(e) => handleInputChange('nutritionalInfo.fat', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Item Properties */}
                  <div className="space-y-4">
                    <Label>Properties</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isAvailable"
                          checked={formData.isAvailable}
                          onCheckedChange={(checked) => handleInputChange('isAvailable', checked)}
                        />
                        <Label htmlFor="isAvailable">Available</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isVeg"
                          checked={formData.isVeg}
                          onCheckedChange={(checked) => handleInputChange('isVeg', checked)}
                        />
                        <Label htmlFor="isVeg">Vegetarian</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isSpicy"
                          checked={formData.isSpicy}
                          onCheckedChange={(checked) => handleInputChange('isSpicy', checked)}
                        />
                        <Label htmlFor="isSpicy">Spicy</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isPopular"
                          checked={formData.isPopular}
                          onCheckedChange={(checked) => handleInputChange('isPopular', checked)}
                        />
                        <Label htmlFor="isPopular">Popular</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddDialog(false);
                        setEditingItem(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingItem ? 'Update' : 'Create'} Item
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <FoodMenu
            showManagementActions={true}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onOrderItem={handleOrderItem}
          />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChefHat className="w-5 h-5 mr-2" />
                  Generate Menu Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Generate menu items using AI based on cuisine type and dietary preferences.
                </p>
                <Button className="w-full" variant="outline">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Open AI Generator
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileImage className="w-5 h-5 mr-2" />
                  Process Menu Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Upload a menu image and let AI extract menu items automatically.
                </p>
                <Button className="w-full" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Menu Image
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import Menu Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Import multiple menu items at once using CSV or JSON format.
              </p>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Choose File to Import
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FoodPage;