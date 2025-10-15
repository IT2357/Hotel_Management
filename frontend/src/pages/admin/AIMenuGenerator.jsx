import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
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
  X as XIcon,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FoodButton } from '../../components/ui/food/FoodButton';
import { FoodInput } from '../../components/ui/food/FoodInput';
import { FoodCard, FoodCardContent, FoodCardHeader, FoodCardTitle } from '../../components/ui/food/FoodCard';
import { FoodBadge } from '../../components/ui/food/FoodBadge';
import { FoodSelect, FoodSelectContent, FoodSelectItem, FoodSelectTrigger, FoodSelectValue } from '../../components/ui/food/FoodSelect';
import { FoodLabel } from '../../components/ui/food/FoodLabel';
import { FoodTabs, FoodTabsContent, FoodTabsList, FoodTabsTrigger } from '../../components/ui/food/FoodTabs';
import { FoodTextarea } from '../../components/ui/food/FoodTextarea';
import { toast } from 'sonner';
import api from '../../services/api';

const AIMenuGenerator = () => {
  const navigate = useNavigate();
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
    dietaryRestrictions: [],
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

      if (activeTab === 'image' && (imageFile || formData.imageUrl || formData.imagePath)) {
        // Image-based generation
        const imageFormData = new FormData();

        if (imageFile) {
          imageFormData.append('image', imageFile);
        }

        imageFormData.append('cuisineType', formData.cuisineType);
        // Send dietaryRestrictions as array (FormData handles arrays properly)
        formData.dietaryRestrictions.forEach(restriction => {
          imageFormData.append('dietaryRestrictions[]', restriction);
        });

        if (formData.imageUrl) {
          imageFormData.append('imageUrl', formData.imageUrl);
        }

        if (formData.imagePath) {
          imageFormData.append('imagePath', formData.imagePath);
        }

        response = await api.post('/menu/generate-from-image', imageFormData);
      } else {
        // Text-based generation
        response = await api.post('/menu/generate', {
          cuisineType: formData.cuisineType,
          dietaryRestrictions: formData.dietaryRestrictions,
          numberOfItems: formData.numberOfItems
        });
      }

      setGeneratedItems(response.data.data?.items || response.data.items || []);
      toast.success('Menu generated successfully!');
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-700 text-white py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <FoodButton
              onClick={() => navigate('/admin/food')}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Food Management
            </FoodButton>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center"
          >
            <Sparkles className="h-8 w-8 text-purple-200 mr-3" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">AI Menu Generator</h1>
              <p className="text-orange-100 text-lg">Generate creative menu items using artificial intelligence</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 lg:p-8">
        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <FoodCard variant="elevated" className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <FoodCardHeader>
              <FoodCardTitle className="flex items-center text-gray-800">
                <ChefHat className="h-5 w-5 mr-2" />
                Generate Menu Items
              </FoodCardTitle>
            </FoodCardHeader>
            <FoodCardContent className="p-6">
              <FoodTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <FoodTabsList className="grid w-full grid-cols-2">
                  <FoodTabsTrigger value="text" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Text-based
                  </FoodTabsTrigger>
                  <FoodTabsTrigger value="image" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Image-based
                  </FoodTabsTrigger>
                </FoodTabsList>

                <FoodTabsContent value="text" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <FoodLabel htmlFor="cuisineType">Cuisine Type</FoodLabel>
                      <FoodSelect
                        value={formData.cuisineType}
                        onValueChange={(value) => setFormData({ ...formData, cuisineType: value })}
                      >
                        <FoodSelectTrigger>
                          <FoodSelectValue placeholder="Select cuisine" />
                        </FoodSelectTrigger>
                        <FoodSelectContent>
                          {cuisines.map(cuisine => (
                            <FoodSelectItem key={cuisine} value={cuisine}>
                              {cuisine}
                            </FoodSelectItem>
                          ))}
                        </FoodSelectContent>
                      </FoodSelect>
                    </div>

                    <div className="space-y-2">
                      <FoodLabel>Dietary Restrictions</FoodLabel>
                      <FoodSelect
                        value={formData.dietaryRestrictions[0] || ''}
                        onValueChange={(value) => {
                          setFormData({ ...formData, dietaryRestrictions: value ? [value] : [] });
                        }}
                      >
                        <FoodSelectTrigger>
                          <FoodSelectValue placeholder="Select restrictions" />
                        </FoodSelectTrigger>
                        <FoodSelectContent>
                          {dietaryOptions.map(option => (
                            <FoodSelectItem key={option.value} value={option.value}>
                              {option.label}
                            </FoodSelectItem>
                          ))}
                        </FoodSelectContent>
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
                </FoodTabsContent>

                <FoodTabsContent value="image" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FoodLabel htmlFor="cuisineType">Cuisine Type</FoodLabel>
                      <FoodSelect
                        value={formData.cuisineType}
                        onValueChange={(value) => setFormData({ ...formData, cuisineType: value })}
                      >
                        <FoodSelectTrigger>
                          <FoodSelectValue placeholder="Select cuisine" />
                        </FoodSelectTrigger>
                        <FoodSelectContent>
                          {cuisines.map(cuisine => (
                            <FoodSelectItem key={cuisine} value={cuisine}>
                              {cuisine}
                            </FoodSelectItem>
                          ))}
                        </FoodSelectContent>
                      </FoodSelect>
                    </div>

                    <div className="space-y-2">
                      <FoodLabel>Dietary Restrictions</FoodLabel>
                      <FoodSelect
                        value={formData.dietaryRestrictions[0] || ''}
                        onValueChange={(value) => {
                          setFormData({ ...formData, dietaryRestrictions: value ? [value] : [] });
                        }}
                      >
                        <FoodSelectTrigger>
                          <FoodSelectValue placeholder="Select restrictions" />
                        </FoodSelectTrigger>
                        <FoodSelectContent>
                          {dietaryOptions.map(option => (
                            <FoodSelectItem key={option.value} value={option.value}>
                              {option.label}
                            </FoodSelectItem>
                          ))}
                        </FoodSelectContent>
                      </FoodSelect>
                    </div>
                  </div>

                  {/* Image Input Options */}
                  <div className="space-y-4">
                    <FoodLabel>Image Input Method</FoodLabel>
                    <FoodTabs defaultValue="upload" className="w-full">
                      <FoodTabsList className="grid w-full grid-cols-3">
                        <FoodTabsTrigger value="upload" className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Upload
                        </FoodTabsTrigger>
                        <FoodTabsTrigger value="url" className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          URL
                        </FoodTabsTrigger>
                        <FoodTabsTrigger value="path" className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Path
                        </FoodTabsTrigger>
                      </FoodTabsList>

                      <FoodTabsContent value="upload" className="space-y-4 mt-4">
                        <div className="flex items-center gap-4">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                      </FoodTabsContent>

                      <FoodTabsContent value="url" className="space-y-4 mt-4">
                        <FoodInput
                          type="url"
                          placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                          value={formData.imageUrl}
                          onChange={(e) => handleUrlInput(e.target.value)}
                        />
                      </FoodTabsContent>

                      <FoodTabsContent value="path" className="space-y-4 mt-4">
                        <FoodInput
                          type="text"
                          placeholder="Enter file path (e.g., /path/to/image.jpg)"
                          value={formData.imagePath}
                          onChange={(e) => handlePathInput(e.target.value)}
                        />
                      </FoodTabsContent>
                    </FoodTabs>
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
                        <FoodButton
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={clearImage}
                        >
                          <Trash2 className="h-4 w-4" />
                        </FoodButton>
                      </div>
                    </div>
                  )}
                </FoodTabsContent>
              </FoodTabs>

              <FoodButton
                onClick={onGenerate}
                disabled={loading || (activeTab === 'image' && !imageFile && !formData.imageUrl && !formData.imagePath)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Menu
                  </>
                )}
              </FoodButton>
            </FoodCardContent>
          </FoodCard>
        </motion.div>

        {/* Generated Items */}
        {generatedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <FoodCard variant="elevated" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <FoodCardHeader>
                <div className="flex justify-between items-center">
                  <FoodCardTitle className="text-gray-800">Generated Menu Items</FoodCardTitle>
                  {selectedItems.length > 0 && (
                    <FoodButton
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
                    </FoodButton>
                  )}
                </div>
              </FoodCardHeader>
              <FoodCardContent className="p-6">
                <div className="space-y-4">
                  {generatedItems.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedItems.some(i => i.name === item.name)
                          ? 'bg-purple-50 border-purple-200'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      {editingItem === item.name ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">Edit Item</h3>
                            <div className="flex gap-2">
                              <FoodButton
                                size="sm"
                                onClick={saveEdit}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </FoodButton>
                              <FoodButton
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                              >
                                <XIcon className="h-4 w-4 mr-1" />
                                Cancel
                              </FoodButton>
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
                              />
                            </div>
                            <div className="space-y-2">
                              <FoodLabel>Category</FoodLabel>
                              <FoodSelect
                                value={editForm.category || ''}
                                onValueChange={(value) => updateEditForm('category', value)}
                              >
                                <FoodSelectTrigger>
                                  <FoodSelectValue placeholder="Select category" />
                                </FoodSelectTrigger>
                                <FoodSelectContent>
                                  <FoodSelectItem value="Appetizers">Appetizers</FoodSelectItem>
                                  <FoodSelectItem value="Main Course">Main Course</FoodSelectItem>
                                  <FoodSelectItem value="Desserts">Desserts</FoodSelectItem>
                                  <FoodSelectItem value="Beverages">Beverages</FoodSelectItem>
                                  <FoodSelectItem value="Sides">Sides</FoodSelectItem>
                                </FoodSelectContent>
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
                            <FoodTextarea
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
                              <input
                                type="checkbox"
                                id="isVeg"
                                checked={editForm.isVeg || false}
                                onChange={(e) => updateEditForm('isVeg', e.target.checked)}
                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              />
                              <FoodLabel htmlFor="isVeg">Vegetarian</FoodLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="isSpicy"
                                checked={editForm.isSpicy || false}
                                onChange={(e) => updateEditForm('isSpicy', e.target.checked)}
                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              />
                              <FoodLabel htmlFor="isSpicy">Spicy</FoodLabel>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 cursor-pointer" onClick={() => toggleItemSelection(item)}>
                            <div className="flex items-center mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold mr-3 text-gray-800">{item.name}</h3>
                              <span className="text-green-600 font-medium">LKR {item.price}</span>
                            </div>
                            {item.description && (
                              <p className="text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mb-2">
                              <FoodBadge variant="secondary" size="sm">{item.category}</FoodBadge>
                              {item.dietaryRestrictions?.map((diet, idx) => (
                                <FoodBadge key={idx} variant="outline" size="sm" className="text-green-700 border-green-300">
                                  {diet}
                                </FoodBadge>
                              ))}
                            </div>
                            {item.ingredients && item.ingredients.length > 0 && (
                              <div className="text-sm text-gray-500">
                                <span className="font-medium">Ingredients: </span>
                                <span className="break-words">{item.ingredients.join(', ')}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <FoodButton
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(item);
                              }}
                              className="p-2"
                            >
                              <Edit3 className="h-4 w-4" />
                            </FoodButton>
                            <input
                              type="checkbox"
                              checked={selectedItems.some(i => i.name === item.name)}
                              onChange={() => toggleItemSelection(item)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </FoodCardContent>
            </FoodCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AIMenuGenerator;