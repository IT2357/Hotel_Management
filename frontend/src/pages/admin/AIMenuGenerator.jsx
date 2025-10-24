import React, { useState, useRef } from 'react';
import {
  Sparkles,
  ChefHat,
  Plus,
  Loader2,
  Check,
  X,
  Upload,
  Link,
  Camera,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Save,
  X as XIcon
} from 'lucide-react';
import FoodButton from '@/components/food/FoodButton';
import FoodInput from '@/components/food/FoodInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/food/FoodCard';
import FoodBadge from '@/components/food/FoodBadge';
import Select from '@/components/ui/Select';
import FoodSelect from '@/components/food/FoodSelect';
import FoodLabel from '@/components/food/FoodLabel';
import { Checkbox } from '@/components/food/FoodCheckbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/food/FoodTabs';

// Aliases for consistent naming
const Button = FoodButton;
const Input = FoodInput;
const Badge = FoodBadge;
const Label = FoodLabel;
import { toast } from 'sonner';
import api from '@/services/api';

const AIMenuGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [generatedItems, setGeneratedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [activeTab, setActiveTab] = useState('text');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Form data state
  const [formData, setFormData] = useState({
    cuisineType: 'Indian',
    dietaryRestrictions: '', // Changed from array to string for single select
    numberOfItems: 5,
    imageUrl: '',
    imagePath: ''
  });

  const fileInputRef = useRef(null);

  const cuisines = [
    'Indian', 'Italian', 'Chinese', 'Mexican',
    'Japanese', 'Thai', 'Mediterranean', 'American'
  ];

  const dietaryOptions = [
    { label: 'Vegetarian', value: 'vegetarian' },
    { label: 'Vegan', value: 'vegan' },
    { label: 'Gluten-Free', value: 'gluten-free' },
    { label: 'Dairy-Free', value: 'dairy-free' },
    { label: 'Nut-Free', value: 'nut-free' }
  ];

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, or WEBP)');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setImageFile(file);
      setFormData({ ...formData, imageUrl: '', imagePath: '' });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL input
  const handleUrlInput = (url) => {
    setFormData({ ...formData, imageUrl: url, imagePath: '' });
    setImageFile(null);

    if (url) {
      // Validate URL format
      try {
        new URL(url);
        setImagePreview(url);
      } catch {
        toast.error('Please enter a valid URL');
        setImagePreview(null);
      }
    } else {
      setImagePreview(null);
    }
  };

  // Handle image path input
  const handlePathInput = (path) => {
    setFormData({ ...formData, imagePath: path, imageUrl: '' });
    setImageFile(null);
    setImagePreview(null);
  };

  // Clear image
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: '', imagePath: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onGenerate = async () => {
    try {
      setLoading(true);

      let response;

      if (activeTab === 'image' && imageFile) {
        // Image-based extraction using AI Menu Extractor - requires actual file
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);

        // Don't set Content-Type - let browser/axios set it automatically with boundary
        response = await api.post('/food-complete/ai/extract', imageFormData);
      } else if (activeTab === 'image' && !imageFile) {
        // No image file selected for image tab
        toast.error('Please select an image file first');
        return;
      } else {
        // Text-based generation
        response = await api.post('/food/items/ai/generate', {
          cuisine: formData.cuisineType,
          dietaryRestrictions: formData.dietaryRestrictions ? [formData.dietaryRestrictions] : [],
          mealType: 'Main Course', // Default meal type
          budget: null // Optional budget
        });
      }

      // Handle different response formats:
      // AI Extractor: { success: true, data: { menuItems: [...] } }
      // AI Generator: { success: true, data: [...items...] }
      const menuItems = activeTab === 'image' 
        ? (response.data.data?.menuItems || [])
        : (response.data.data || []);
      
      setGeneratedItems(menuItems);
      
      if (activeTab === 'image') {
        toast.success(`Extracted ${menuItems.length} items from menu image!`);
      } else {
        toast.success('Menu generated successfully!');
      }
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate menu';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSaveToMenu = async () => {
    if (selectedItems.length === 0) {
      toast.warning('Please select at least one item to add');
      return;
    }

    try {
      setSaving(true);
      await api.post('/menu/batch', {
        items: selectedItems
      });
      toast.success(`${selectedItems.length} items added to menu!`);
      setSelectedItems([]);
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save items to menu';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const exists = prev.some(i => i.name === item.name);
      if (exists) {
        return prev.filter(i => i.name !== item.name);
      } else {
        return [...prev, item];
      }
    });
  };

  const startEditing = (item) => {
    setEditingItem(item.name);
    setEditForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      ingredients: item.ingredients.join(', '),
      isVeg: item.isVeg,
      isSpicy: item.isSpicy,
      cookingTime: item.cookingTime
    });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editForm.name || !editForm.price) {
      toast.error('Name and price are required');
      return;
    }

    setGeneratedItems(prev => prev.map(item => {
      if (item.name === editingItem) {
        return {
          ...item,
          name: editForm.name,
          description: editForm.description,
          price: parseFloat(editForm.price),
          category: editForm.category,
          ingredients: editForm.ingredients.split(',').map(i => i.trim()).filter(i => i),
          isVeg: editForm.isVeg,
          isSpicy: editForm.isSpicy,
          cookingTime: parseInt(editForm.cookingTime) || 15
        };
      }
      return item;
    }));

    // Update selected items if this item is selected
    setSelectedItems(prev => prev.map(item => {
      if (item.name === editingItem) {
        return {
          ...item,
          name: editForm.name,
          description: editForm.description,
          price: parseFloat(editForm.price),
          category: editForm.category,
          ingredients: editForm.ingredients.split(',').map(i => i.trim()).filter(i => i),
          isVeg: editForm.isVeg,
          isSpicy: editForm.isSpicy,
          cookingTime: parseInt(editForm.cookingTime) || 15
        };
      }
      return item;
    }));

    setEditingItem(null);
    setEditForm({});
    toast.success('Item updated successfully');
  };

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Sparkles className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Menu Generator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Generate creative menu items using artificial intelligence
          </p>
        </div>

        {/* Form Card */}
        <div>
          <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <ChefHat className="h-5 w-5 mr-2" />
                Generate Menu Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Text-based
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Image-based
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <FoodLabel htmlFor="cuisineType">Cuisine Type</FoodLabel>
                      <FoodSelect
                        value={formData.cuisineType}
                        onValueChange={(value) => setFormData({ ...formData, cuisineType: value })}
                      >
                        <option value="">Select cuisine</option>
                        {cuisines.map(cuisine => (
                          <option key={cuisine} value={cuisine}>
                            {cuisine}
                          </option>
                        ))}
                      </FoodSelect>
                    </div>

                    <div className="space-y-2">
                       <FoodLabel>Dietary Restrictions</FoodLabel>
                       <FoodSelect
                         value={formData.dietaryRestrictions}
                         onValueChange={(value) => setFormData({ ...formData, dietaryRestrictions: value })}
                       >
                         <option value="">Select restrictions</option>
                         {dietaryOptions.map(option => (
                           <option key={option.value} value={option.value}>
                             {option.label}
                           </option>
                         ))}
                       </FoodSelect>
                     </div>

                    <div className="space-y-2">
                      <FoodLabel htmlFor="numberOfItems">Number of Items</FoodLabel>
                      <FoodInput
                        id="numberOfItems"
                        type="number"
                        min="1"
                        max="20"
                        value={formData.numberOfItems}
                        onChange={(e) => setFormData({ ...formData, numberOfItems: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FoodLabel htmlFor="cuisineType">Cuisine Type</FoodLabel>
                      <FoodSelect
                        value={formData.cuisineType}
                        onValueChange={(value) => setFormData({ ...formData, cuisineType: value })}
                      >
                        <option value="">Select cuisine</option>
                        {cuisines.map(cuisine => (
                          <option key={cuisine} value={cuisine}>
                            {cuisine}
                          </option>
                        ))}
                      </FoodSelect>
                    </div>

                    <div className="space-y-2">
                       <FoodLabel>Dietary Restrictions</FoodLabel>
                       <FoodSelect
                         value={formData.dietaryRestrictions}
                         onValueChange={(value) => setFormData({ ...formData, dietaryRestrictions: value })}
                       >
                         <option value="">Select restrictions</option>
                         {dietaryOptions.map(option => (
                           <option key={option.value} value={option.value}>
                             {option.label}
                           </option>
                         ))}
                       </FoodSelect>
                     </div>
                  </div>

                  {/* Image Input Options */}
                  <div className="space-y-4">
                    <FoodLabel>Image Input Method</FoodLabel>
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Upload
                        </TabsTrigger>
                        <TabsTrigger value="url" className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          URL
                        </TabsTrigger>
                        <TabsTrigger value="path" className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Path
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="upload" className="space-y-4">
                        <div className="flex items-center gap-4">
                          <FoodInput
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="flex-1"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="url" className="space-y-4">
                        <FoodInput
                          type="url"
                          placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                          value={formData.imageUrl}
                          onChange={(e) => handleUrlInput(e.target.value)}
                        />
                      </TabsContent>

                      <TabsContent value="path" className="space-y-4">
                        <FoodInput
                          type="text"
                          placeholder="Enter file path (e.g., /path/to/image.jpg)"
                          value={formData.imagePath}
                          onChange={(e) => handlePathInput(e.target.value)}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative">
                      <FoodLabel>Image Preview</FoodLabel>
                      <div className="relative mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full max-h-64 mx-auto rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={clearImage}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Button
                onClick={onGenerate}
                disabled={loading || (activeTab === 'image' && !imageFile)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {activeTab === 'image' ? 'Extracting from Image...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {activeTab === 'image' ? 'Extract from Image' : 'Generate Menu'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generated Items */}
        {generatedItems.length > 0 && (
          <div>
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-gray-900 dark:text-white">Generated Menu Items</CardTitle>
                  {selectedItems.length > 0 && (
                    <Button
                      onClick={onSaveToMenu}
                      disabled={saving}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Add {selectedItems.length} to Menu
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generatedItems.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border border-gray-200 dark:border-gray-600 transition-all ${
                        selectedItems.some(i => i.name === item.name)
                          ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                          : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {editingItem === item.name ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Item</h3>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={saveEdit}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                              >
                                <XIcon className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <FoodLabel>Name *</FoodLabel>
                              <FoodInput
                                value={editForm.name || ''}
                                onChange={(e) => updateEditForm('name', e.target.value)}
                                placeholder="Item name"
                              />
                            </div>
                            <div className="space-y-2">
                              <FoodLabel>Price *</FoodLabel>
                              <FoodInput
                                type="number"
                                step="0.01"
                                value={editForm.price || ''}
                                onChange={(e) => updateEditForm('price', e.target.value)}
                                placeholder="0.00"
                                formatPrice={true}
                              />
                            </div>
                            <div className="space-y-2">
                              <FoodLabel>Category</FoodLabel>
                              <FoodSelect
                                value={editForm.category || ''}
                                onValueChange={(value) => updateEditForm('category', value)}
                              >
                                <option value="">Select category</option>
                                <option value="Appetizers">Appetizers</option>
                                <option value="Main Course">Main Course</option>
                                <option value="Desserts">Desserts</option>
                                <option value="Beverages">Beverages</option>
                                <option value="Sides">Sides</option>
                              </FoodSelect>
                            </div>
                            <div className="space-y-2">
                              <FoodLabel>Cooking Time (minutes)</FoodLabel>
                              <FoodInput
                                type="number"
                                value={editForm.cookingTime || ''}
                                onChange={(e) => updateEditForm('cookingTime', e.target.value)}
                                placeholder="15"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <FoodLabel>Description</FoodLabel>
                            <FoodInput
                              value={editForm.description || ''}
                              onChange={(e) => updateEditForm('description', e.target.value)}
                              placeholder="Item description"
                            />
                          </div>

                          <div className="space-y-2">
                            <FoodLabel>Ingredients (comma-separated)</FoodLabel>
                            <FoodInput
                              value={editForm.ingredients || ''}
                              onChange={(e) => updateEditForm('ingredients', e.target.value)}
                              placeholder="ingredient1, ingredient2, ingredient3"
                            />
                          </div>

                          <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="isVeg"
                                checked={editForm.isVeg || false}
                                onCheckedChange={(checked) => updateEditForm('isVeg', checked)}
                                readOnly={false}
                              />
                              <Label htmlFor="isVeg">Vegetarian</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="isSpicy"
                                checked={editForm.isSpicy || false}
                                onCheckedChange={(checked) => updateEditForm('isSpicy', checked)}
                                readOnly={false}
                              />
                              <Label htmlFor="isSpicy">Spicy</Label>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 cursor-pointer" onClick={() => toggleItemSelection(item)}>
                            <div className="flex items-center mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold mr-3 text-gray-900 dark:text-white">{item.name}</h3>
                              <span className="text-green-600 dark:text-green-400 font-medium">${item.price}</span>
                            </div>
                            {item.description && (
                              <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">{item.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                              {item.dietaryRestrictions?.map((diet, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs text-green-700 border-green-300">
                                  {diet}
                                </Badge>
                              ))}
                            </div>
                            {item.ingredients && item.ingredients.length > 0 && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium">Ingredients: </span>
                                <span className="break-words">{item.ingredients.join(', ')}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(item);
                              }}
                              className="p-2"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Checkbox
                              checked={selectedItems.some(i => i.name === item.name)}
                              onCheckedChange={() => {
                                toggleItemSelection(item);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMenuGenerator;