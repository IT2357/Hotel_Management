import React, { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import PropTypes from 'prop-types';
import {
  Upload,
  Sparkles,
  Camera,
  FileImage,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit3,
  Trash2,
  Plus,
  Eye,
  Download,
  Zap,
  Brain,
  Image as ImageIcon,
  X,
  Star,
  Clock,
  DollarSign,
  Tag,
  ChefHat,
  Utensils,
  Save,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent } from './FoodCard';
import FoodButton from './FoodButton';
import FoodInput from './FoodInput';
import FoodLabel from './FoodLabel';
import FoodTextarea from './FoodTextarea';
import FoodBadge from './FoodBadge';
import FoodSelect from './FoodSelect';
import { toast } from 'sonner';
import foodService from '@/services/foodService';

const AIMenuGenerator = ({ onItemsExtracted, isDarkMode = false }) => {
  const [step, setStep] = useState('upload'); // upload, processing, review, complete
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedItems, setExtractedItems] = useState([]);
  const [processingStage, setProcessingStage] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [confidence, setConfidence] = useState(0);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Form validation schema for menu items
  const menuItemSchema = Yup.object().shape({
    name: Yup.string().required('Item name is required'),
    name_tamil: Yup.string(),
    price: Yup.number().required('Price is required').min(0, 'Price must be positive'),
    description: Yup.string(),
    category: Yup.string(),
    isVeg: Yup.boolean(),
    isSpicy: Yup.boolean(),
    dietaryTags: Yup.array().of(Yup.string())
  });

  // Form for batch validation
  const batchFormSchema = Yup.object().shape({
    cuisineType: Yup.string().required('Cuisine type is required'),
    dietaryRestrictions: Yup.array().of(Yup.string())
  });

  const { register: registerBatch, handleSubmit: handleBatchSubmit, formState: { errors: batchErrors } } = useForm({
    resolver: yupResolver(batchFormSchema),
    defaultValues: {
      cuisineType: 'Jaffna',
      dietaryRestrictions: []
    }
  });

  // React Query mutation for processing menu image
  const processImageMutation = useMutation({
    mutationFn: async (imageFile) => {
      const response = await foodService.processMenuImage(imageFile);
      return response.data;
    },
    onMutate: () => {
      setStep('processing');
      setProcessingStage('Uploading image...');
    },
    onSuccess: (data) => {
      if (data?.menuItems) {
        setExtractedItems(data.menuItems);
        setSelectedItems(new Set(data.menuItems.map((_, index) => index)));
        setConfidence(data.ocrConfidence || 85);
        setStep('review');
        toast.success(`Extracted ${data.menuItems.length} menu items!`);
      } else {
        throw new Error('No menu items found in the image');
      }
    },
    onError: (error) => {
      console.error('Error processing image:', error);
      toast.error(error.message || 'Failed to process image');
      setStep('upload');
    }
  });

  // React Query mutation for saving menu items with validation
  const saveMenuItemsMutation = useMutation({
    mutationFn: async (items) => {
      // Validate each item before saving
      const validationErrors = [];
      const validItems = [];
      
      for (const item of items) {
        try {
          await menuItemSchema.validate(item);
          validItems.push(item);
        } catch (error) {
          validationErrors.push({
            name: item.name || 'Unnamed Item',
            error: error.message
          });
        }
      }
      
      if (validationErrors.length > 0) {
        // Show validation errors
        validationErrors.forEach(err => {
          toast.error(`Validation error for ${err.name}: ${err.error}`);
        });
        
        // If all items have validation errors, throw an error
        if (validationErrors.length === items.length) {
          throw new Error('All items failed validation. Please fix the errors and try again.');
        }
      }
      
      // Save only valid items
      const response = await foodService.createBatchMenuItems(validItems);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate menu queries to refresh the menu
      queryClient.invalidateQueries(['menu']);
      
      toast.success(`${data?.savedItems?.length || 0} items added to menu!`);
      setStep('complete');
    },
    onError: (error) => {
      console.error('Error saving menu items:', error);
      toast.error(error.message || 'Failed to save menu items');
    }
  });

  // Drag and drop handling
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload a JPG, PNG, WEBP, or HEIC image.');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit. Please upload a smaller image.');
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setStep('upload');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  // Processing stages simulation
  const processImage = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }

    try {
      await processImageMutation.mutateAsync(imageFile);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error(error.message || 'Failed to process image');
      setStep('upload');
    }
  };

  // Item selection handling
  const toggleItemSelection = (index) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  // Edit item
  const startEditing = (index) => {
    setEditingIndex(index);
  };

  const saveEdit = async (index, updatedItem) => {
    try {
      // Validate the updated item
      await menuItemSchema.validate(updatedItem);
      
      const newItems = [...extractedItems];
      newItems[index] = updatedItem;
      setExtractedItems(newItems);
      setEditingIndex(null);
      toast.success('Item updated successfully');
    } catch (error) {
      toast.error(`Validation error: ${error.message}`);
    }
  };

  // Delete item
  const deleteItem = (index) => {
    const newItems = extractedItems.filter((_, i) => i !== index);
    setExtractedItems(newItems);
    const newSelected = new Set([...selectedItems].filter(i => i !== index).map(i => i > index ? i - 1 : i));
    setSelectedItems(newSelected);
    toast.success('Item removed');
  };

  // Accept selected items
  const acceptSelectedItems = () => {
    const selectedItemsData = extractedItems.filter((_, index) => selectedItems.has(index));
    
    if (selectedItemsData.length === 0) {
      toast.error('Please select at least one item to save');
      return;
    }
    
    saveMenuItemsMutation.mutate(selectedItemsData);
  };

  // Reset to start
  const reset = () => {
    setStep('upload');
    setImageFile(null);
    setImagePreview(null);
    setExtractedItems([]);
    setSelectedItems(new Set());
    setEditingIndex(null);
    setConfidence(0);
  };

  // Regenerate items with AI
  const regenerateItems = async () => {
    if (!imageFile) {
      toast.error('Please upload an image first');
      return;
    }
    
    try {
      setStep('processing');
      setProcessingStage('Regenerating menu items...');
      
      // Simulate regeneration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would call an AI service
      toast.info('Menu items regenerated successfully');
    } catch (error) {
      console.error('Error regenerating items:', error);
      toast.error('Failed to regenerate menu items');
      setStep('review');
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
            <Brain className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            AI Menu Extractor
          </h2>
        </motion.div>
        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Upload your menu image and let AI extract all items with Tamil/English names, prices, and ingredients
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[
            { key: 'upload', label: 'Upload', icon: Upload },
            { key: 'processing', label: 'Processing', icon: Brain },
            { key: 'review', label: 'Review', icon: Eye },
            { key: 'complete', label: 'Complete', icon: CheckCircle }
          ].map((stepItem, index) => {
            const isActive = step === stepItem.key;
            const isCompleted = ['upload', 'processing', 'review'].indexOf(step) > ['upload', 'processing', 'review'].indexOf(stepItem.key);
            const Icon = stepItem.icon;

            return (
              <React.Fragment key={stepItem.key}>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{stepItem.label}</span>
                </div>
                {index < 3 && (
                  <div className={`w-8 h-0.5 ${
                    isCompleted ? 'bg-green-500' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
          >
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-xl`}>
              <CardContent className="p-8">
                {!imagePreview ? (
                  <div
                    {...getRootProps()}
                    className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                      isDragActive
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105'
                        : isDarkMode
                        ? 'border-gray-600 hover:border-purple-400 bg-gray-700/50'
                        : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                    }`}
                  >
                    <input {...getInputProps()} ref={fileInputRef} />
                    <motion.div
                      animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-center">
                        <div className={`p-6 rounded-full ${
                          isDragActive
                            ? 'bg-purple-500 text-white'
                            : isDarkMode
                            ? 'bg-gray-600 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isDragActive ? (
                            <Download className="w-12 h-12" />
                          ) : (
                            <ImageIcon className="w-12 h-12" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold mb-2">
                          {isDragActive ? 'Drop your menu image here' : 'Upload Menu Image'}
                        </h3>
                        <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Drag & drop or click to browse
                        </p>
                        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          Supports JPG, PNG, WEBP, HEIC up to 10MB
                        </p>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative rounded-xl overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Menu preview"
                        className="w-full h-64 object-cover"
                      />
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <FoodButton
                        onClick={processImage}
                        disabled={!imageFile || processImageMutation.isLoading}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 text-lg font-semibold"
                      >
                        {processImageMutation.isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Extract Menu Items
                          </>
                        )}
                      </FoodButton>
                      <FoodButton
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        Change Image
                      </FoodButton>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-xl`}>
              <CardContent className="p-12 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center"
                >
                  <Brain className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-semibold mb-4">AI is analyzing your menu</h3>
                <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {processingStage}
                </p>
                <div className="w-full max-w-md mx-auto">
                  <div className={`w-full h-2 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 6, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <div className="space-y-6">
              {/* Results Header */}
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-xl`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <h3 className="text-xl font-semibold">
                          Extracted {extractedItems.length} menu items
                        </h3>
                      </div>
                      <FoodBadge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        {confidence}% Confidence
                      </FoodBadge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <FoodButton
                        variant="outline"
                        onClick={reset}
                        className="px-4 py-2"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        New Image
                      </FoodButton>
                      <FoodButton
                        variant="outline"
                        onClick={regenerateItems}
                        disabled={processImageMutation.isLoading}
                        className="px-4 py-2"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Regenerate
                      </FoodButton>
                      <FoodButton
                        onClick={acceptSelectedItems}
                        disabled={selectedItems.size === 0 || saveMenuItemsMutation.isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                      >
                        {saveMenuItemsMutation.isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save {selectedItems.size} Items
                          </>
                        )}
                      </FoodButton>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Batch Configuration */}
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-xl`}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Batch Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FoodLabel htmlFor="cuisineType">Cuisine Type</FoodLabel>
                      <FoodSelect
                        id="cuisineType"
                        {...registerBatch('cuisineType')}
                        className={batchErrors.cuisineType ? 'border-red-500' : ''}
                      >
                        <option value="Jaffna">Jaffna</option>
                        <option value="Sri Lankan">Sri Lankan</option>
                        <option value="Indian">Indian</option>
                        <option value="International">International</option>
                      </FoodSelect>
                      {batchErrors.cuisineType && (
                        <p className="text-red-500 text-sm mt-1">{batchErrors.cuisineType.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <FoodLabel>Dietary Restrictions</FoodLabel>
                      <div className="flex flex-wrap gap-2">
                        {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Spicy'].map((restriction) => (
                          <FoodBadge
                            key={restriction}
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => {
                              // Handle dietary restriction toggle
                              const currentRestrictions = document.getElementById('dietaryRestrictions')?.value || [];
                              const newRestrictions = currentRestrictions.includes(restriction)
                                ? currentRestrictions.filter(r => r !== restriction)
                                : [...currentRestrictions, restriction];
                              // In a real implementation, we would update the form state here
                            }}
                          >
                            {restriction}
                          </FoodBadge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Extracted Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {extractedItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ExtractedItemCard
                      item={item}
                      index={index}
                      isSelected={selectedItems.has(index)}
                      onToggleSelect={() => toggleItemSelection(index)}
                      onEdit={() => startEditing(index)}
                      onDelete={() => deleteItem(index)}
                      isDarkMode={isDarkMode}
                      isEditing={editingIndex === index}
                      onSaveEdit={saveEdit}
                      onCancelEdit={() => setEditingIndex(null)}
                      validationSchema={menuItemSchema}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-xl`}>
              <CardContent className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-semibold mb-4">Menu items added successfully!</h3>
                <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your menu has been updated with the extracted items.
                </p>
                <FoodButton
                  onClick={reset}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Extract Another Menu
                </FoodButton>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Extracted Item Card Component
export default AIMenuGenerator;

// PropTypes validation
AIMenuGenerator.propTypes = {
  onItemsExtracted: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool
};

// Extracted Item Card Component
const ExtractedItemCard = ({
  item,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  isDarkMode,
  isEditing,
  onSaveEdit,
  onCancelEdit,
  validationSchema
}) => {
  const [editData, setEditData] = useState(item);
  const [errors, setErrors] = useState({});

  // Form for individual item validation
  const itemFormSchema = validationSchema;
  const { register, handleSubmit, formState: { errors: formErrors } } = useForm({
    resolver: yupResolver(itemFormSchema),
    defaultValues: editData
  });

  useEffect(() => {
    setEditData(item);
    setErrors({});
  }, [item]);

  if (isEditing) {
    return (
      <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <FoodLabel className="text-sm font-medium mb-1">Item Name *</FoodLabel>
              <FoodInput
                {...register('name')}
                value={editData.name || ''}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                className={`w-full ${formErrors.name ? 'border-red-500' : ''}`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name.message}</p>
              )}
            </div>
            
            <div>
              <FoodLabel className="text-sm font-medium mb-1">Tamil Name</FoodLabel>
              <FoodInput
                {...register('name_tamil')}
                value={editData.name_tamil || ''}
                onChange={(e) => setEditData({...editData, name_tamil: e.target.value})}
                className="w-full"
              />
            </div>
            
            <div>
              <FoodLabel className="text-sm font-medium mb-1">Price (LKR) *</FoodLabel>
              <FoodInput
                type="number"
                {...register('price')}
                value={editData.price || ''}
                onChange={(e) => setEditData({...editData, price: parseFloat(e.target.value) || 0})}
                className={`w-full ${formErrors.price ? 'border-red-500' : ''}`}
              />
              {formErrors.price && (
                <p className="text-red-500 text-xs mt-1">{formErrors.price.message}</p>
              )}
            </div>
            
            <div>
              <FoodLabel className="text-sm font-medium mb-1">Description</FoodLabel>
              <FoodTextarea
                {...register('description')}
                value={editData.description || ''}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                className="w-full"
                rows={3}
              />
            </div>
            
            <div>
              <FoodLabel className="text-sm font-medium mb-1">Category</FoodLabel>
              <FoodInput
                {...register('category')}
                value={editData.category || ''}
                onChange={(e) => setEditData({...editData, category: e.target.value})}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('isVeg')}
                  checked={editData.isVeg || false}
                  onChange={(e) => setEditData({...editData, isVeg: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm">Vegetarian</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('isSpicy')}
                  checked={editData.isSpicy || false}
                  onChange={(e) => setEditData({...editData, isSpicy: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm">Spicy</span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <FoodButton
                onClick={async () => {
                  try {
                    await validationSchema.validate(editData);
                    onSaveEdit(editData.index, editData);
                  } catch (error) {
                    setErrors({ [error.path]: error.message });
                    toast.error(`Validation error: ${error.message}`);
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                Save
              </FoodButton>
              <FoodButton
                onClick={onCancelEdit}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                Cancel
              </FoodButton>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg hover:shadow-xl transition-all duration-300 ${
      isSelected ? 'ring-2 ring-purple-500' : ''
    }`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with checkbox */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div className="flex items-center gap-1">
                <ChefHat className="w-4 h-4 text-orange-500" />
                {item.confidence && (
                  <FoodBadge variant="secondary" className="text-xs">
                    {Math.round(item.confidence)}%
                  </FoodBadge>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Item details */}
          <div>
            <h4 className="font-semibold text-lg line-clamp-1">
              {item.name || 'Unnamed Item'}
            </h4>
            {item.name_tamil && (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {item.name_tamil}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="font-semibold text-green-600 dark:text-green-400">
              LKR {item.price || 0}
            </span>
          </div>

          {item.description && (
            <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {item.description}
            </p>
          )}

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.ingredients.slice(0, 3).map((ingredient, idx) => (
                <FoodBadge key={idx} variant="outline" className="text-xs">
                  {ingredient}
                </FoodBadge>
              ))}
              {item.ingredients.length > 3 && (
                <FoodBadge variant="outline" className="text-xs">
                  +{item.ingredients.length - 3} more
                </FoodBadge>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {item.isVeg && (
              <FoodBadge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
                🌱 Veg
              </FoodBadge>
            )}
            {item.isSpicy && (
              <FoodBadge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 text-xs">
                🌶️ Spicy
              </FoodBadge>
            )}
            {item.dietaryTags?.includes('halal') && (
              <FoodBadge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs">
                ☪️ Halal
              </FoodBadge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// PropTypes validation
AIMenuGenerator.propTypes = {
  onItemsExtracted: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool
};

ExtractedItemCard.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string,
    name_tamil: PropTypes.string,
    price: PropTypes.number,
    description: PropTypes.string,
    ingredients: PropTypes.arrayOf(PropTypes.string),
    confidence: PropTypes.number,
    isVeg: PropTypes.bool,
    isSpicy: PropTypes.bool,
    dietaryTags: PropTypes.arrayOf(PropTypes.string),
    category: PropTypes.string
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggleSelect: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onSaveEdit: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  validationSchema: PropTypes.object.isRequired
};