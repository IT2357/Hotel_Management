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
  X as XIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Label  from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center mb-4">
            <Sparkles className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Menu Generator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Generate creative menu items using artificial intelligence
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
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
                      <Label htmlFor="cuisineType">Cuisine Type</Label>
                      <Select
                        value={formData.cuisineType}
                        onValueChange={(value) => setFormData({ ...formData, cuisineType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cuisine" />
                        </SelectTrigger>
                        <SelectContent>
                          {cuisines.map(cuisine => (
                            <SelectItem key={cuisine} value={cuisine}>
                              {cuisine}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                       <Label>Dietary Restrictions</Label>
                       <Select
                         value={formData.dietaryRestrictions}
                         onValueChange={(value) => {
                           // Handle both single and multiple selections
                           const newValue = Array.isArray(value) ? value : [value];
                           setFormData({ ...formData, dietaryRestrictions: newValue });
                         }}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Select restrictions" />
                         </SelectTrigger>
                         <SelectContent>
                           {dietaryOptions.map(option => (
                             <SelectItem key={option.value} value={option.value}>
                               {option.label}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>

                    <div className="space-y-2">
                      <Label htmlFor="numberOfItems">Number of Items</Label>
                      <Input
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
                      <Label htmlFor="cuisineType">Cuisine Type</Label>
                      <Select
                        value={formData.cuisineType}
                        onValueChange={(value) => setFormData({ ...formData, cuisineType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cuisine" />
                        </SelectTrigger>
                        <SelectContent>
                          {cuisines.map(cuisine => (
                            <SelectItem key={cuisine} value={cuisine}>
                              {cuisine}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                       <Label>Dietary Restrictions</Label>
                       <Select
                         value={formData.dietaryRestrictions}
                         onValueChange={(value) => {
                           // Handle both single and multiple selections
                           const newValue = Array.isArray(value) ? value : [value];
                           setFormData({ ...formData, dietaryRestrictions: newValue });
                         }}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Select restrictions" />
                         </SelectTrigger>
                         <SelectContent>
                           {dietaryOptions.map(option => (
                             <SelectItem key={option.value} value={option.value}>
                               {option.label}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                  </div>

                  {/* Image Input Options */}
                  <div className="space-y-4">
                    <Label>Image Input Method</Label>
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
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="flex-1"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="url" className="space-y-4">
                        <Input
                          type="url"
                          placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                          value={formData.imageUrl}
                          onChange={(e) => handleUrlInput(e.target.value)}
                        />
                      </TabsContent>

                      <TabsContent value="path" className="space-y-4">
                        <Input
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
                      <Label>Image Preview</Label>
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
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Generated Items */}
        {generatedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Generated Menu Items</CardTitle>
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
                      className={`p-4 rounded-lg border transition-all ${
                        selectedItems.some(i => i.name === item.name)
                          ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      {editingItem === item.name ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Edit Item</h3>
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
                              <Label>Name *</Label>
                              <Input
                                value={editForm.name || ''}
                                onChange={(e) => updateEditForm('name', e.target.value)}
                                placeholder="Item name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Price *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editForm.price || ''}
                                onChange={(e) => updateEditForm('price', e.target.value)}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Category</Label>
                              <Select
                                value={editForm.category || ''}
                                onValueChange={(value) => updateEditForm('category', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Appetizers">Appetizers</SelectItem>
                                  <SelectItem value="Main Course">Main Course</SelectItem>
                                  <SelectItem value="Desserts">Desserts</SelectItem>
                                  <SelectItem value="Beverages">Beverages</SelectItem>
                                  <SelectItem value="Sides">Sides</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Cooking Time (minutes)</Label>
                              <Input
                                type="number"
                                value={editForm.cookingTime || ''}
                                onChange={(e) => updateEditForm('cookingTime', e.target.value)}
                                placeholder="15"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                              value={editForm.description || ''}
                              onChange={(e) => updateEditForm('description', e.target.value)}
                              placeholder="Item description"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Ingredients (comma-separated)</Label>
                            <Input
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
                              <h3 className="text-lg font-semibold mr-3">{item.name}</h3>
                              <span className="text-green-600 font-medium">${item.price}</span>
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
                              onCheckedChange={(checked) => {
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
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AIMenuGenerator;