import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import FoodButton from '../FoodButton';
import FoodInput from '../FoodInput';
import FoodLabel from '../FoodLabel';
import FoodTextarea from '../FoodTextarea';
import FoodSelect from '../FoodSelect';
import FoodBadge from '../FoodBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../FoodDialog';
import { validateField, menuItemValidation, getCharacterCount } from '../../../utils/validation';

const MenuItemForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  categories = [], 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    ingredients: [],
    dietaryTags: [],
    spiceLevel: 'mild',
    cookingTime: '',
    isAvailable: true,
    isPopular: false,
    isVeg: false,
    isSpicy: false,
    isBreakfast: true,
    isLunch: true,
    isDinner: true,
    isSnacks: true,
    image: null
  });

  const [imagePreview, setImagePreview] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [dietaryTagInput, setDietaryTagInput] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState(new Set());


  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price || '',
        category: initialData.category?._id || initialData.category || '',
        ingredients: initialData.ingredients || [],
        dietaryTags: initialData.dietaryTags || [],
        spiceLevel: initialData.spiceLevel || 'mild',
        cookingTime: initialData.cookingTime || '',
        isAvailable: initialData.isAvailable !== undefined ? initialData.isAvailable : true,
        isPopular: initialData.isPopular || false,
        isVeg: initialData.isVeg || false,
        isSpicy: initialData.isSpicy || false,
        isBreakfast: initialData.isBreakfast !== undefined ? initialData.isBreakfast : true,
        isLunch: initialData.isLunch !== undefined ? initialData.isLunch : true,
        isDinner: initialData.isDinner !== undefined ? initialData.isDinner : true,
        isSnacks: initialData.isSnacks !== undefined ? initialData.isSnacks : true,
        image: null
      });
      
      // Use image field directly like guest page
      setImagePreview(initialData.imageUrl || initialData.image || '');
    } else {
      // Reset form for new item
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        ingredients: [],
        dietaryTags: [],
        spiceLevel: 'mild',
        cookingTime: '',
        isAvailable: true,
        isPopular: false,
        isVeg: false,
        isSpicy: false,
        isBreakfast: true,
        isLunch: true,
        isDinner: true,
        isSnacks: true,
        image: null
      });
      setImagePreview('');
    }
  }, [initialData, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Real-time validation
    const error = validateField(field, value, menuItemValidation);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleFieldBlur = (field) => {
    setTouchedFields(prev => new Set([...prev, field]));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredientInput.trim()]
      }));
      setIngredientInput('');
    }
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addDietaryTag = () => {
    if (dietaryTagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        dietaryTags: [...prev.dietaryTags, dietaryTagInput.trim()]
      }));
      setDietaryTagInput('');
    }
  };

  const removeDietaryTag = (index) => {
    setFormData(prev => ({
      ...prev,
      dietaryTags: prev.dietaryTags.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all fields as touched to show validation errors
    const allFields = ['name', 'description', 'price', 'category', 'cookingTime'];
    setTouchedFields(new Set(allFields));
    
    // Check if there are any validation errors
    const hasErrors = Object.values(validationErrors).some(error => error !== null);
    if (hasErrors) {
      return; // Don't submit if there are errors
    }
    
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {initialData ? 'Edit Menu Item' : 'Add New Menu Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <FoodLabel htmlFor="name">Item Name *</FoodLabel>
                <FoodInput
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => handleFieldBlur('name')}
                  placeholder="Enter item name"
                  className={validationErrors.name && touchedFields.has('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                  required
                />
                {validationErrors.name && touchedFields.has('name') && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationErrors.name}</span>
                  </div>
                )}
                {!validationErrors.name && touchedFields.has('name') && formData.name && (
                  <div className="flex items-center gap-1 mt-1 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Looks good!</span>
                  </div>
                )}
              </div>

              <div>
                <FoodLabel htmlFor="description">Description</FoodLabel>
                <FoodTextarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  placeholder="Enter item description"
                  rows={3}
                  className={validationErrors.description && touchedFields.has('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                />
                {validationErrors.description && touchedFields.has('description') && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationErrors.description}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getCharacterCount(formData.description, 500).current}/500 characters
                  </div>
                  {!validationErrors.description && touchedFields.has('description') && formData.description && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Good!</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <FoodLabel htmlFor="price">Price (LKR) *</FoodLabel>
                <FoodInput
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  onBlur={() => handleFieldBlur('price')}
                  placeholder="0.00"
                  formatPrice={true}
                  className={validationErrors.price && touchedFields.has('price') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                  required
                />
                {validationErrors.price && touchedFields.has('price') && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationErrors.price}</span>
                  </div>
                )}
                {!validationErrors.price && touchedFields.has('price') && formData.price && (
                  <div className="flex items-center gap-1 mt-1 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Valid price!</span>
                  </div>
                )}
              </div>

              <div>
                <FoodLabel htmlFor="category">Category *</FoodLabel>
                <FoodSelect
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  onBlur={() => handleFieldBlur('category')}
                  className={validationErrors.category && touchedFields.has('category') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </FoodSelect>
                {validationErrors.category && touchedFields.has('category') && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationErrors.category}</span>
                  </div>
                )}
                {!validationErrors.category && touchedFields.has('category') && formData.category && (
                  <div className="flex items-center gap-1 mt-1 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Category selected!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <div>
                <FoodLabel>Item Image</FoodLabel>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400 dark:text-gray-500" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload image</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <FoodLabel htmlFor="cookingTime">Cooking Time (minutes)</FoodLabel>
                <FoodInput
                  id="cookingTime"
                  type="number"
                  value={formData.cookingTime}
                  onChange={(e) => handleInputChange('cookingTime', e.target.value)}
                  onBlur={() => handleFieldBlur('cookingTime')}
                  placeholder="15"
                  className={validationErrors.cookingTime && touchedFields.has('cookingTime') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                />
                {validationErrors.cookingTime && touchedFields.has('cookingTime') && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationErrors.cookingTime}</span>
                  </div>
                )}
                {!validationErrors.cookingTime && touchedFields.has('cookingTime') && formData.cookingTime && (
                  <div className="flex items-center gap-1 mt-1 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Valid time!</span>
                  </div>
                )}
              </div>

              <div>
                <FoodLabel htmlFor="spiceLevel">Spice Level</FoodLabel>
                <FoodSelect
                  id="spiceLevel"
                  value={formData.spiceLevel}
                  onChange={(e) => handleInputChange('spiceLevel', e.target.value)}
                >
                  <option value="mild">Mild</option>
                  <option value="medium">Medium</option>
                  <option value="hot">Hot</option>
                  <option value="extra-hot">Extra Hot</option>
                </FoodSelect>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <FoodLabel>Ingredients</FoodLabel>
            <div className="flex gap-2 mt-2">
              <FoodInput
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                placeholder="Add ingredient"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
              />
              <FoodButton type="button" onClick={addIngredient}>
                Add
              </FoodButton>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.ingredients.map((ingredient, index) => (
                <FoodBadge key={index} variant="default" className="flex items-center gap-1">
                  {ingredient}
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </FoodBadge>
              ))}
            </div>
          </div>

          {/* Dietary Tags */}
          <div>
            <FoodLabel>Dietary Tags</FoodLabel>
            <div className="flex gap-2 mt-2">
              <FoodInput
                value={dietaryTagInput}
                onChange={(e) => setDietaryTagInput(e.target.value)}
                placeholder="Add dietary tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDietaryTag())}
              />
              <FoodButton type="button" onClick={addDietaryTag}>
                Add
              </FoodButton>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.dietaryTags.map((tag, index) => (
                <FoodBadge key={index} variant="success" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeDietaryTag(index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </FoodBadge>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div>
              <FoodLabel>Item Properties</FoodLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm">Available</span>
                </label>
                <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm">Popular</span>
                </label>
                <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={(e) => handleInputChange('isVeg', e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm">Vegetarian</span>
                </label>
                <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.isSpicy}
                    onChange={(e) => handleInputChange('isSpicy', e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm">Spicy</span>
                </label>
              </div>
            </div>

            <div>
              <FoodLabel>Available During (Meal Times)</FoodLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.isBreakfast}
                    onChange={(e) => handleInputChange('isBreakfast', e.target.checked)}
                    className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm">🌅 Breakfast</span>
                </label>
                <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.isLunch}
                    onChange={(e) => handleInputChange('isLunch', e.target.checked)}
                    className="rounded text-yellow-500 focus:ring-yellow-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm">☀️ Lunch</span>
                </label>
                <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.isDinner}
                    onChange={(e) => handleInputChange('isDinner', e.target.checked)}
                    className="rounded text-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm">🌙 Dinner</span>
                </label>
                <label className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.isSnacks}
                    onChange={(e) => handleInputChange('isSnacks', e.target.checked)}
                    className="rounded text-green-500 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm">🍿 Snacks</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <FoodButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </FoodButton>
            <FoodButton type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initialData ? 'Update Item' : 'Create Item'}
            </FoodButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemForm;
