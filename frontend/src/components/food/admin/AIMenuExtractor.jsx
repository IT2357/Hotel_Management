import React, { useState } from 'react';
import { Upload, Sparkles, Loader2, CheckCircle2, AlertCircle, X, Plus, Save } from 'lucide-react';
import FoodButton from '../FoodButton';
import FoodInput from '../FoodInput';
import FoodLabel from '../FoodLabel';
import FoodTextarea from '../FoodTextarea';
import FoodSelect from '../FoodSelect';
import FoodBadge from '../FoodBadge';
import { Card, CardContent } from '../FoodCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../FoodDialog';
import foodService from '../../../services/foodService';

const AIMenuExtractor = ({ isOpen, onClose, categories = [], onItemsExtracted }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractedItems, setExtractedItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setExtractError('');
    }
  };

  const handleExtract = async () => {
    if (!imageFile) {
      setExtractError('Please upload an image file');
      return;
    }

    setIsExtracting(true);
    setExtractError('');
    setExtractedItems([]);

    try {
      const result = await foodService.extractMenuFromImage(imageFile);
      
      if (result.success && result.data) {
        // Handle single item or array of items
        const items = Array.isArray(result.data) ? result.data : [result.data];
        setExtractedItems(items);
      } else {
        setExtractError(result.message || 'Failed to extract menu items');
      }
    } catch (error) {
      console.error('AI extraction error:', error);
      setExtractError(error.message || 'Failed to extract menu items');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleEditItem = (index) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index, updatedItem) => {
    setExtractedItems(prev => 
      prev.map((item, i) => i === index ? updatedItem : item)
    );
    setEditingIndex(null);
  };

  const handleRemoveItem = (index) => {
    setExtractedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = () => {
    if (onItemsExtracted) {
      onItemsExtracted(extractedItems);
    }
    onClose();
  };

  const resetForm = () => {
    setImageFile(null);
    setImageUrl('');
    setExtractError('');
    setExtractedItems([]);
    setEditingIndex(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Menu Extractor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Upload Section */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <FoodLabel>Upload Menu Image</FoodLabel>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="ai-image-upload"
                    />
                    <label
                      htmlFor="ai-image-upload"
                      className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <Upload className="w-8 h-8 mb-2 text-gray-400 dark:text-gray-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {imageFile ? imageFile.name : 'Click to upload menu image'}
                      </p>
                    </label>
                  </div>
                </div>

                {extractError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                    <span className="text-red-700 dark:text-red-300">{extractError}</span>
                  </div>
                )}

                <FoodButton 
                  onClick={handleExtract} 
                  disabled={!imageFile || isExtracting}
                  className="w-full"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extracting Menu Items...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Extract Menu Items
                    </>
                  )}
                </FoodButton>
              </div>
            </CardContent>
          </Card>

          {/* Extracted Items */}
          {extractedItems.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Extracted Items ({extractedItems.length})
                  </h3>
                  <FoodButton onClick={handleSaveAll} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save All Items
                  </FoodButton>
                </div>

                <div className="space-y-4">
                  {extractedItems.map((item, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                      {editingIndex === index ? (
                        <EditItemForm
                          item={item}
                          categories={categories}
                          onSave={(updatedItem) => handleSaveEdit(index, updatedItem)}
                          onCancel={() => setEditingIndex(null)}
                        />
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{item.name || 'Unnamed Item'}</h4>
                              <FoodBadge variant="default">
                                LKR {item.priceLKR || item.price || '0.00'}
                              </FoodBadge>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">
                              {item.desc || item.description || 'No description'}
                            </p>
                            {item.ingredients && item.ingredients.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {item.ingredients.map((ingredient, idx) => (
                                  <FoodBadge key={idx} variant="default" size="sm">
                                    {ingredient}
                                  </FoodBadge>
                                ))}
                              </div>
                            )}
                            {item.dietaryTags && item.dietaryTags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.dietaryTags.map((tag, idx) => (
                                  <FoodBadge key={idx} variant="success" size="sm">
                                    {tag}
                                  </FoodBadge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <FoodButton
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditItem(index)}
                            >
                              Edit
                            </FoodButton>
                            <FoodButton
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </FoodButton>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Edit Item Form Component
const EditItemForm = ({ item, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: item.name || '',
    description: item.desc || item.description || '',
    price: item.priceLKR || item.price || '',
    category: item.category || '',
    ingredients: item.ingredients || [],
    dietaryTags: item.dietaryTags || [],
    spiceLevel: item.spiceLevel || 'mild',
    cookingTime: item.cookingTime || '',
    isAvailable: true,
    isPopular: false,
    isVeg: false,
    isSpicy: false
  });

  const [ingredientInput, setIngredientInput] = useState('');
  const [dietaryTagInput, setDietaryTagInput] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FoodLabel>Item Name</FoodLabel>
          <FoodInput
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter item name"
          />
        </div>
        <div>
          <FoodLabel>Price (LKR)</FoodLabel>
          <FoodInput
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            placeholder="0.00"
            formatPrice={true}
          />
        </div>
      </div>

      <div>
        <FoodLabel>Description</FoodLabel>
        <FoodTextarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter description"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FoodLabel>Category</FoodLabel>
          <FoodSelect
            value={formData.category}
            onValueChange={(value) => handleInputChange('category', value)}
          >
            <option value="">Select category</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </FoodSelect>
        </div>
        <div>
          <FoodLabel>Spice Level</FoodLabel>
          <FoodSelect
            value={formData.spiceLevel}
            onValueChange={(value) => handleInputChange('spiceLevel', value)}
          >
            <option value="mild">Mild</option>
            <option value="medium">Medium</option>
            <option value="hot">Hot</option>
            <option value="extra-hot">Extra Hot</option>
          </FoodSelect>
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <FoodLabel>Ingredients</FoodLabel>
        <div className="flex gap-2 mt-1">
          <FoodInput
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            placeholder="Add ingredient"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
          />
          <FoodButton type="button" onClick={addIngredient} size="sm">
            <Plus className="w-4 h-4" />
          </FoodButton>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {formData.ingredients.map((ingredient, index) => (
            <FoodBadge key={index} variant="default" size="sm" className="flex items-center gap-1">
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
        <div className="flex gap-2 mt-1">
          <FoodInput
            value={dietaryTagInput}
            onChange={(e) => setDietaryTagInput(e.target.value)}
            placeholder="Add dietary tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDietaryTag())}
          />
          <FoodButton type="button" onClick={addDietaryTag} size="sm">
            <Plus className="w-4 h-4" />
          </FoodButton>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {formData.dietaryTags.map((tag, index) => (
            <FoodBadge key={index} variant="success" size="sm" className="flex items-center gap-1">
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

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <FoodButton variant="outline" onClick={onCancel} size="sm">
          Cancel
        </FoodButton>
        <FoodButton onClick={handleSave} size="sm">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Save
        </FoodButton>
      </div>
    </div>
  );
};

export default AIMenuExtractor;
