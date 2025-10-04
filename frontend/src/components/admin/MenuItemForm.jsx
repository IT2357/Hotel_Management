import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, AlertCircle, ChefHat, DollarSign, Clock, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Label  from '@/components/ui/label';
import { Textarea } from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { toast } from 'sonner';

const MenuItemForm = ({
  isOpen,
  onClose,
  onSubmit,
  editingItem,
  categories = [],
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    image: '',
    imageFile: null,
    imagePreview: null,
    isAvailable: true,
    isVeg: false,
    isSpicy: false,
    isPopular: false,
    ingredients: [],
    ingredientsText: '',
    dietaryTags: [],
    nutritionalInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    },
    cookingTime: 15,
    customizations: []
  });

  const [formErrors, setFormErrors] = useState({});

  // Initialize form data when editing item changes
  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        category: editingItem.category?._id || editingItem.category || '',
        description: editingItem.description || '',
        price: editingItem.price ? editingItem.price.toString() : '',
        image: editingItem.image || editingItem.imageUrl || '',
        isAvailable: editingItem.isAvailable !== false,
        isVeg: editingItem.isVeg || false,
        isSpicy: editingItem.isSpicy || false,
        isPopular: editingItem.isPopular || false,
        ingredients: Array.isArray(editingItem.ingredients) ? editingItem.ingredients : [],
        ingredientsText: Array.isArray(editingItem.ingredients) ? editingItem.ingredients.join(', ') : '',
        dietaryTags: Array.isArray(editingItem.dietaryTags) ? editingItem.dietaryTags : [],
        nutritionalInfo: editingItem.nutritionalInfo && typeof editingItem.nutritionalInfo === 'object' ? {
          calories: editingItem.nutritionalInfo.calories ? editingItem.nutritionalInfo.calories.toString() : '',
          protein: editingItem.nutritionalInfo.protein ? editingItem.nutritionalInfo.protein.toString() : '',
          carbs: editingItem.nutritionalInfo.carbs ? editingItem.nutritionalInfo.carbs.toString() : '',
          fat: editingItem.nutritionalInfo.fat ? editingItem.nutritionalInfo.fat.toString() : ''
        } : {
          calories: '',
          protein: '',
          carbs: '',
          fat: ''
        },
        cookingTime: editingItem.cookingTime ? editingItem.cookingTime.toString() : '15',
        customizations: Array.isArray(editingItem.customizations) ? editingItem.customizations : []
      });
    } else {
      // Reset form for new item
      setFormData({
        name: '',
        category: '',
        description: '',
        price: '',
        image: '',
        imageFile: null,
        imagePreview: null,
        isAvailable: true,
        isVeg: false,
        isSpicy: false,
        isPopular: false,
        ingredients: [],
        ingredientsText: '',
        dietaryTags: [],
        nutritionalInfo: {
          calories: '',
          protein: '',
          carbs: '',
          fat: ''
        },
        cookingTime: 15,
        customizations: []
      });
    }
    setFormErrors({});
  }, [editingItem, isOpen]);

  // Dietary options for filtering
  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Nut-Free',
    'Keto',
    'Low-Carb',
    'Halal',
    'Kosher'
  ];

  // Handle file drop for form image
  const onFormImageDrop = React.useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
        image: '' // Clear URL if file is selected
      }));
      setFormErrors(prev => ({ ...prev, image: '' }));
    }
  }, []);

  // Configure dropzone for form image
  const { getRootProps: getFormImageRootProps, getInputProps: getFormImageInputProps, isDragActive: isFormImageDragActive } = useDropzone({
    onDrop: onFormImageDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  // Handle dietary tag toggle
  const toggleDietaryTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(tag)
        ? prev.dietaryTags.filter(t => t !== tag)
        : [...prev.dietaryTags, tag]
    }));
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Item name is required';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = 'Valid price is required';
    }

    if (!formData.image && !formData.imageFile) {
      errors.image = 'Image is required (upload file or provide URL)';
    }

    if (formData.image && !/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(formData.image)) {
      errors.image = 'Please provide a valid image URL';
    }

    if (!formData.ingredients || formData.ingredients.length === 0) {
      errors.ingredients = 'At least one ingredient is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    // Process ingredients from text input
    const ingredients = formData.ingredientsText
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const submitData = {
      ...formData,
      ingredients,
      price: parseFloat(formData.price),
      cookingTime: parseInt(formData.cookingTime),
      nutritionalInfo: {
        calories: formData.nutritionalInfo.calories ? parseInt(formData.nutritionalInfo.calories) : undefined,
        protein: formData.nutritionalInfo.protein ? parseInt(formData.nutritionalInfo.protein) : undefined,
        carbs: formData.nutritionalInfo.carbs ? parseInt(formData.nutritionalInfo.carbs) : undefined,
        fat: formData.nutritionalInfo.fat ? parseInt(formData.nutritionalInfo.fat) : undefined
      }
    };

    // Remove empty nutritional values
    Object.keys(submitData.nutritionalInfo).forEach(key => {
      if (!submitData.nutritionalInfo[key]) {
        delete submitData.nutritionalInfo[key];
      }
    });

    if (Object.keys(submitData.nutritionalInfo).length === 0) {
      delete submitData.nutritionalInfo;
    }

    await onSubmit(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg p-6 -m-6 mb-6">
          <DialogTitle className="text-2xl font-bold flex items-center">
            <ChefHat className="h-6 w-6 mr-3" />
            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </DialogTitle>
          <p className="text-indigo-100 mt-2">
            {editingItem ? 'Update the menu item details' : 'Create a delicious new item for your menu'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Basic Information Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <ChefHat className="h-5 w-5 mr-2 text-blue-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Spaghetti Carbonara"
                  className={`transition-all duration-200 ${formErrors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'}`}
                />
                {formErrors.name && <p className="text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
                <Select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                  required
                  className={`transition-all duration-200 ${formErrors.category ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'}`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id || category.value} value={category._id || category.value}>
                      {category.name || category.label}
                    </option>
                  ))}
                </Select>
                {formErrors.category && <p className="text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{formErrors.category}</p>}
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A brief description of the menu item"
                rows={3}
                className={`transition-all duration-200 ${formErrors.description ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'}`}
              />
              {formErrors.description && <p className="text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{formErrors.description}</p>}
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-purple-600" />
              Image Upload *
            </h3>

            {/* Drag & Drop Area */}
            <div
              {...getFormImageRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isFormImageDragActive
                  ? 'border-purple-500 bg-purple-50 scale-105'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
              } ${formErrors.image ? 'border-red-500 bg-red-50' : ''}`}
            >
              <input {...getFormImageInputProps()} />
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {isFormImageDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    or click to browse files (JPG, PNG, WEBP up to 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Image Preview */}
            {formData.imagePreview && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Image Preview</h4>
                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageFile: null, imagePreview: null, image: '' }))}
                    className="absolute top-3 right-3 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Alternative: URL Input */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Or enter an image URL:</p>
              <Input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value, imageFile: null, imagePreview: null })}
                placeholder="https://example.com/image.jpg"
                className="transition-all duration-200 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valid formats: JPG, PNG, WEBP, GIF
              </p>
            </div>
            {formErrors.image && <p className="text-sm text-red-600 flex items-center mt-2"><AlertCircle className="h-4 w-4 mr-1" />{formErrors.image}</p>}
          </div>

          {/* Pricing & Timing Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Pricing & Timing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`transition-all duration-200 ${formErrors.price ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500'}`}
                />
                {formErrors.price && <p className="text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{formErrors.price}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cookingTime" className="text-sm font-medium text-gray-700">Cooking Time (minutes)</Label>
                <Input
                  id="cookingTime"
                  type="number"
                  value={formData.cookingTime}
                  onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                  placeholder="e.g., 15"
                  min="0"
                  className="transition-all duration-200 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Ingredients Section */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <ChefHat className="h-5 w-5 mr-2 text-orange-600" />
              Ingredients *
            </h3>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Ingredients (comma-separated)</Label>
              <Input
                value={formData.ingredientsText}
                onChange={(e) => setFormData({ ...formData, ingredientsText: e.target.value })}
                placeholder="e.g., tomatoes, onions, garlic, olive oil"
                className={`transition-all duration-200 ${formErrors.ingredients ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
              />
              {formErrors.ingredients && <p className="text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1" />{formErrors.ingredients}</p>}
            </div>
          </div>

          {/* Nutritional Information Section */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-cyan-600" />
              Nutritional Information (Optional)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories" className="text-sm font-medium text-gray-700">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.nutritionalInfo.calories}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutritionalInfo: { ...formData.nutritionalInfo, calories: e.target.value }
                  })}
                  placeholder="250"
                  min="0"
                  className="transition-all duration-200 focus:ring-cyan-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein" className="text-sm font-medium text-gray-700">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={formData.nutritionalInfo.protein}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutritionalInfo: { ...formData.nutritionalInfo, protein: e.target.value }
                  })}
                  placeholder="15"
                  min="0"
                  className="transition-all duration-200 focus:ring-cyan-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs" className="text-sm font-medium text-gray-700">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={formData.nutritionalInfo.carbs}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutritionalInfo: { ...formData.nutritionalInfo, carbs: e.target.value }
                  })}
                  placeholder="30"
                  min="0"
                  className="transition-all duration-200 focus:ring-cyan-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat" className="text-sm font-medium text-gray-700">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={formData.nutritionalInfo.fat}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutritionalInfo: { ...formData.nutritionalInfo, fat: e.target.value }
                  })}
                  placeholder="10"
                  min="0"
                  className="transition-all duration-200 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Dietary & Properties Section */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-pink-600" />
              Dietary Information & Properties
            </h3>

            {/* Dietary Tags */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Dietary Tags</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dietaryOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-pink-300 transition-colors">
                    <input
                      type="checkbox"
                      id={`dietary-${option}`}
                      checked={formData.dietaryTags.includes(option)}
                      onChange={() => toggleDietaryTag(option)}
                      className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <label htmlFor={`dietary-${option}`} className="text-sm text-gray-700 cursor-pointer">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Item Properties */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Item Properties</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-pink-300 transition-colors">
                  <Switch
                    id="isVeg"
                    checked={formData.isVeg}
                    onCheckedChange={(checked) => setFormData({ ...formData, isVeg: checked })}
                  />
                  <div>
                    <Label htmlFor="isVeg" className="text-sm font-medium text-gray-700 cursor-pointer">Vegetarian</Label>
                    <p className="text-xs text-gray-500">Contains no meat</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-pink-300 transition-colors">
                  <Switch
                    id="isSpicy"
                    checked={formData.isSpicy}
                    onCheckedChange={(checked) => setFormData({ ...formData, isSpicy: checked })}
                  />
                  <div>
                    <Label htmlFor="isSpicy" className="text-sm font-medium text-gray-700 cursor-pointer">Spicy</Label>
                    <p className="text-xs text-gray-500">Contains spicy ingredients</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-pink-300 transition-colors">
                  <Switch
                    id="isPopular"
                    checked={formData.isPopular}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                  />
                  <div>
                    <Label htmlFor="isPopular" className="text-sm font-medium text-gray-700 cursor-pointer">Popular</Label>
                    <p className="text-xs text-gray-500">Featured item</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-pink-300 transition-colors">
                  <Switch
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                  />
                  <div>
                    <Label htmlFor="isAvailable" className="text-sm font-medium text-gray-700 cursor-pointer">Available</Label>
                    <p className="text-xs text-gray-500">Currently in stock</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 py-2 rounded-lg border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  {editingItem ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {editingItem ? 'Update Item' : 'Create Item'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { MenuItemForm };