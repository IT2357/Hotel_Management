import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Sparkles,
  ChefHat,
  DollarSign,
  Clock,
  Users,
  Star,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import foodService from '@/services/foodService';

// Categories for the menu
const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'appetizers', label: 'Appetizers' },
  { value: 'main-course', label: 'Main Course' },
  { value: 'desserts', label: 'Desserts' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'sides', label: 'Sides' },
  { value: 'specials', label: 'Chef\'s Specials' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' }
];

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

const FoodMenuManagementPage = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [activeTab, setActiveTab] = useState('manage');
  const navigate = useNavigate();

  // Form data for creating/editing items
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    image: '',
    isAvailable: true,
    isVeg: false,
    isSpicy: false,
    isPopular: false,
    ingredients: [],
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
  
  // AI Form Data
  const [aiFormData, setAiFormData] = useState({
    cuisine: '',
    dietaryRestrictions: [],
    mealType: '',
    budget: '',
    image: null,
    preview: null
  });


  // Fetch food items when component mounts or filters change
  useEffect(() => {
    fetchFoodItems();
  }, [selectedCategory, searchQuery]);

  // Fetch menu items from API with proper image handling
  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      // Use the food service to get items with proper image handling
      const response = await foodService.getMenuItems({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined
      });
      setFoodItems(response.data.data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new menu item
  const handleCreateItem = async () => {
    try {
      // Create a clean form data object without undefined values
      const createData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        image: formData.image,
        isAvailable: formData.isAvailable,
        isVeg: formData.isVeg,
        isSpicy: formData.isSpicy,
        isPopular: formData.isPopular,
        ingredients: formData.ingredients,
        dietaryTags: formData.dietaryTags,
        nutritionalInfo: {
          calories: formData.nutritionalInfo.calories ? parseInt(formData.nutritionalInfo.calories) : '',
          protein: formData.nutritionalInfo.protein ? parseInt(formData.nutritionalInfo.protein) : '',
          carbs: formData.nutritionalInfo.carbs ? parseInt(formData.nutritionalInfo.carbs) : '',
          fat: formData.nutritionalInfo.fat ? parseInt(formData.nutritionalInfo.fat) : ''
        },
        cookingTime: parseInt(formData.cookingTime),
        customizations: formData.customizations
      };

      // Remove empty nutritional info values
      Object.keys(createData.nutritionalInfo).forEach(key => {
        if (createData.nutritionalInfo[key] === '' || isNaN(createData.nutritionalInfo[key])) {
          delete createData.nutritionalInfo[key];
        }
      });

      // Remove empty nutritionalInfo object if all values are empty
      if (Object.keys(createData.nutritionalInfo).length === 0) {
        delete createData.nutritionalInfo;
      }

      const response = await api.post('/menu/items', createData);
      setFoodItems([...foodItems, response.data.data]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Menu item created successfully');
    } catch (error) {
      console.error('Error creating menu item:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create menu item';
      toast.error(errorMessage);
    }
  };

  // Handle updating an existing menu item
  const handleUpdateItem = async () => {
    if (!selectedItem) return;

    try {
      // Create a clean form data object without undefined values
      const updateData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        image: formData.image,
        isAvailable: formData.isAvailable,
        isVeg: formData.isVeg,
        isSpicy: formData.isSpicy,
        isPopular: formData.isPopular,
        ingredients: formData.ingredients,
        dietaryTags: formData.dietaryTags,
        nutritionalInfo: {
          calories: formData.nutritionalInfo.calories ? parseInt(formData.nutritionalInfo.calories) : '',
          protein: formData.nutritionalInfo.protein ? parseInt(formData.nutritionalInfo.protein) : '',
          carbs: formData.nutritionalInfo.carbs ? parseInt(formData.nutritionalInfo.carbs) : '',
          fat: formData.nutritionalInfo.fat ? parseInt(formData.nutritionalInfo.fat) : ''
        },
        cookingTime: parseInt(formData.cookingTime),
        customizations: formData.customizations
      };

      // Remove empty nutritional info values
      Object.keys(updateData.nutritionalInfo).forEach(key => {
        if (updateData.nutritionalInfo[key] === '' || isNaN(updateData.nutritionalInfo[key])) {
          delete updateData.nutritionalInfo[key];
        }
      });

      // Remove empty nutritionalInfo object if all values are empty
      if (Object.keys(updateData.nutritionalInfo).length === 0) {
        delete updateData.nutritionalInfo;
      }

      const response = await api.put(`/menu/items/${selectedItem._id}`, updateData);
      setFoodItems(foodItems.map(item =>
        item._id === selectedItem._id ? response.data.data : item
      ));
      setIsEditDialogOpen(false);
      resetForm();
      toast.success('Menu item updated successfully');
    } catch (error) {
      console.error('Error updating menu item:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update menu item';
      toast.error(errorMessage);
    }
  };

  // Handle deleting a menu item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(`/menu/items/${itemId}`);
      setFoodItems(foodItems.filter(item => item._id !== itemId));
      toast.success('Menu item deleted successfully');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      price: '',
      image: '',
      isAvailable: true,
      isVeg: false,
      isSpicy: false,
      isPopular: false,
      ingredients: [],
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
  };

  // Open edit dialog with item data
  const openEditDialog = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      price: item.price,
      image: item.image || '',
      isAvailable: item.isAvailable !== false,
      isVeg: item.isVeg || false,
      isSpicy: item.isSpicy || false,
      isPopular: item.isPopular || false,
      ingredients: item.ingredients || [],
      dietaryTags: item.dietaryTags || [],
      nutritionalInfo: item.nutritionalInfo || {
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      },
      cookingTime: item.cookingTime || 15,
      customizations: item.customizations || []
    });
    setIsEditDialogOpen(true);
  };

  // Filter items based on search and category
  const filteredItems = foodItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle file drop for menu image
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setAiFormData(prev => ({
        ...prev,
        image: file,
        preview: URL.createObjectURL(file)
      }));
      setUploadError('');
    }
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  // Process image with OCR
  const processImageWithOCR = async () => {
    if (!aiFormData.image) {
      setUploadError('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setUploadError('');
    
    try {
      const formData = new FormData();
      formData.append('image', aiFormData.image);
      
      const response = await api.post('/menu/process-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setOcrResult(response.data);
      toast.success('Menu items extracted successfully!');
    } catch (error) {
      console.error('Error processing image:', error);
      setUploadError(error.response?.data?.message || 'Failed to process image');
      toast.error('Failed to process menu image');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save extracted menu items
  const handleSaveExtractedItems = async () => {
    if (!ocrResult?.items?.length) {
      toast.error('No items to save');
      return;
    }

    try {
      const response = await api.post('/menu/batch', { items: ocrResult.items });
      setFoodItems(prev => [...prev, ...response.data]);
      toast.success(`Successfully added ${response.data.length} menu items`);
      setIsAIDialogOpen(false);
      resetAIDialog();
    } catch (error) {
      console.error('Error saving menu items:', error);
      toast.error('Failed to save menu items');
    }
  };

  // Reset AI dialog state
  const resetAIDialog = () => {
    setAiFormData({
      cuisine: '',
      dietaryRestrictions: [],
      mealType: '',
      budget: '',
      image: null,
      preview: null
    });
    setOcrResult(null);
    setUploadError('');
  };

  return (
    <div className="menu-management-page min-h-screen p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Modern Page Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">🍽️ Food Menu Management</h1>
              <p className="text-indigo-100 text-lg">
                Manage your restaurant's menu items, categories, and AI-powered features
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => fetchFoodItems()}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Total Items</p>
                <p className="text-3xl font-bold text-orange-900">{foodItems.length}</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Available</p>
                <p className="text-3xl font-bold text-green-900">{foodItems.filter(item => item.isAvailable).length}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Categories</p>
                <p className="text-3xl font-bold text-blue-900">{new Set(foodItems.map(item => item.category).filter(Boolean)).size}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Popular</p>
                <p className="text-3xl font-bold text-purple-900">{foodItems.filter(item => item.isPopular).length}</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Vegetarian</p>
                <p className="text-3xl font-bold text-red-900">{foodItems.filter(item => item.isVeg).length}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Spicy</p>
                <p className="text-3xl font-bold text-yellow-900">{foodItems.filter(item => item.isSpicy).length}</p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <Card className="bg-white shadow-xl rounded-2xl border-0 p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                activeTab === 'manage'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102 border border-gray-200'
              }`}
            >
              <span className="mr-2">🍽️</span>
              Manage Menu Items
            </button>
            <button
              onClick={() => navigate('/admin/menu-upload')}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                activeTab === 'ai-generate'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102 border border-gray-200'
              }`}
            >
              <span className="mr-2">🤖</span>
              AI Menu Extractor
            </button>
          </div>
        </Card>

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Food Menu Management
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your restaurant's menu items and categories
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Dialog open={isAIDialogOpen} onOpenChange={(open) => {
                if (!open) resetAIDialog();
                setIsAIDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Add Items
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Menu Items with AI</DialogTitle>
                    <p className="text-sm text-gray-500">
                      Upload a menu image to extract items automatically
                    </p>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {!ocrResult ? (
                      <>
                        <div 
                          {...getRootProps()} 
                          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            isDragActive 
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                              : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600'
                          }`}
                        >
                          <input {...getInputProps()} />
                          <div className="space-y-3">
                            <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                              <Upload className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {isDragActive ? 'Drop the menu image here' : 'Drag & drop a menu image here'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                or click to browse files (JPG, PNG, WEBP up to 5MB)
                              </p>
                            </div>
                          </div>
                        </div>

                        {aiFormData.preview && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Image Preview
                            </h4>
                            <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                              <img 
                                src={aiFormData.preview} 
                                alt="Menu preview" 
                                className="w-full h-48 object-contain bg-gray-50 dark:bg-gray-800"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAiFormData(prev => ({ ...prev, image: null, preview: null }));
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-gray-100 text-gray-700 shadow-sm border border-gray-200 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {uploadError && (
                          <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900">
                            <p className="text-sm text-red-700 dark:text-red-300 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                              {uploadError}
                            </p>
                          </div>
                        )}

                        <div className="pt-2">
                          <Button 
                            onClick={processImageWithOCR}
                            disabled={!aiFormData.image || isProcessing}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Extract Menu Items
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                                Successfully extracted {ocrResult.items.length} menu items
                              </h3>
                              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                                <p>Review the extracted items below before saving to your menu.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Item
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Price
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Category
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {ocrResult.items.map((item, index) => (
                                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                                      {item.description && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                      ${parseFloat(item.price).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                                        {item.category || 'Uncategorized'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="flex justify-between pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setOcrResult(null)}
                            disabled={isProcessing}
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Upload
                          </Button>
                          <Button 
                            onClick={handleSaveExtractedItems}
                            disabled={isProcessing || !ocrResult?.items?.length}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save {ocrResult?.items?.length} Items to Menu
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Menu Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Menu Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="name">Item Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Spaghetti Carbonara"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.slice(1).map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="A brief description of the menu item"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cookingTime">Cooking Time (minutes)</Label>
                        <Input
                          id="cookingTime"
                          type="number"
                          value={formData.cookingTime}
                          onChange={(e) => setFormData({ ...formData, cookingTime: e.target.value })}
                          placeholder="e.g., 15"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="image">Image URL</Label>
                      <Input
                        id="image"
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a valid image URL (JPG, PNG, WEBP, GIF)
                      </p>
                    </div>
                    <div>
                      <Label>Ingredients (comma-separated)</Label>
                      <Input
                        value={formData.ingredients.join(', ')}
                        onChange={(e) => setFormData({
                          ...formData,
                          ingredients: e.target.value.split(',').map(i => i.trim()).filter(i => i)
                        })}
                        placeholder="e.g., tomatoes, onions, garlic"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="calories">Calories</Label>
                        <Input
                          id="calories"
                          type="number"
                          value={formData.nutritionalInfo.calories}
                          onChange={(e) => setFormData({
                            ...formData,
                            nutritionalInfo: { ...formData.nutritionalInfo, calories: e.target.value }
                          })}
                          placeholder="e.g., 250"
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="protein">Protein (g)</Label>
                        <Input
                          id="protein"
                          type="number"
                          value={formData.nutritionalInfo.protein}
                          onChange={(e) => setFormData({
                            ...formData,
                            nutritionalInfo: { ...formData.nutritionalInfo, protein: e.target.value }
                          })}
                          placeholder="e.g., 15"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="carbs">Carbs (g)</Label>
                        <Input
                          id="carbs"
                          type="number"
                          value={formData.nutritionalInfo.carbs}
                          onChange={(e) => setFormData({
                            ...formData,
                            nutritionalInfo: { ...formData.nutritionalInfo, carbs: e.target.value }
                          })}
                          placeholder="e.g., 30"
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fat">Fat (g)</Label>
                        <Input
                          id="fat"
                          type="number"
                          value={formData.nutritionalInfo.fat}
                          onChange={(e) => setFormData({
                            ...formData,
                            nutritionalInfo: { ...formData.nutritionalInfo, fat: e.target.value }
                          })}
                          placeholder="e.g., 10"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Dietary Information</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {dietaryOptions.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={option}
                              checked={formData.dietaryTags.includes(option)}
                              onChange={(e) => {
                                const newTags = e.target.checked
                                  ? [...formData.dietaryTags, option]
                                  : formData.dietaryTags.filter((tag) => tag !== option);
                                setFormData({ ...formData, dietaryTags: newTags });
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              readOnly={false}
                            />
                            <label htmlFor={option} className="text-sm text-gray-700 dark:text-gray-300">
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Item Properties</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isVeg"
                              checked={formData.isVeg}
                              onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              readOnly={false}
                            />
                            <Label htmlFor="isVeg">Vegetarian</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isSpicy"
                              checked={formData.isSpicy}
                              onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              readOnly={false}
                            />
                            <Label htmlFor="isSpicy">Spicy</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isPopular"
                              checked={formData.isPopular}
                              onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              readOnly={false}
                            />
                            <Label htmlFor="isPopular">Popular</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isAvailable"
                              checked={formData.isAvailable}
                              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              readOnly={false}
                            />
                            <Label htmlFor="isAvailable">Available</Label>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button onClick={handleCreateItem}>
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Search menu items..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="manage" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manage" className="flex items-center">
                <ChefHat className="h-4 w-4 mr-2" />
                Manage Menu Items
              </TabsTrigger>
              <TabsTrigger value="ai-generate" className="flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Generate Menu
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manage" className="mt-6">
              {/* Menu Items Grid */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : filteredItems.length > 0 ? (
                <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">🍽️ Menu Items</h2>
                      <div className="text-sm text-gray-500">
                        {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredItems.map((item) => (
                        <div
                          key={item._id}
                          className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                        >
                          {/* Food Item Header */}
                          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white mb-4 shadow-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-bold text-lg">{item.name || 'Unnamed Item'}</h3>
                                <p className="text-white/90 text-sm">
                                  {item.category || 'Uncategorized'}
                                </p>
                              </div>
                              <Badge className={`${item.isAvailable ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                                {item.isAvailable ? 'Available' : 'Unavailable'}
                              </Badge>
                            </div>
                          </div>

                          {/* Food Image */}
                          <div className="relative h-48 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-4">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center text-gray-400 ${item.imageUrl || item.image ? 'hidden' : ''}`}>
                              <ChefHat className="h-12 w-12" />
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1">
                              {item.dietaryTags?.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Food Details */}
                          <div className="space-y-3 mb-6">
                            {item.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-gray-900">${item.price ? parseFloat(item.price).toFixed(2) : '0.00'}</span>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{item.cookingTime || 'N/A'} min</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {item.isVeg && <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">🌱 Veg</Badge>}
                              {item.isSpicy && <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">🌶️ Spicy</Badge>}
                              {item.isPopular && <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">⭐ Popular</Badge>}
                            </div>
                            {item.nutritionalInfo?.calories && (
                              <div className="text-sm text-gray-500">
                                <span>🔥 {item.nutritionalInfo.calories} calories</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(item)}
                              className="flex-1 rounded-full border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                            >
                              ✏️ Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteItem(item._id)}
                              className="flex-1 rounded-full border-gray-300 hover:border-red-500 hover:text-red-600"
                            >
                              🗑️ Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <ChefHat className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No menu items found</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery || selectedCategory !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by adding a new menu item.'}
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Item
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai-generate" className="mt-6">
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="h-10 w-10 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Menu Extractor</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Use our advanced AI-powered menu extraction system to automatically extract menu items from images, URLs, or file paths.
                  </p>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-center text-sm text-gray-500">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>Upload menu images (JPG, PNG, WEBP)</span>
                    </div>
                    <div className="flex items-center justify-center text-sm text-gray-500">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>Extract from restaurant URLs</span>
                    </div>
                    <div className="flex items-center justify-center text-sm text-gray-500">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>Process local file paths</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/admin/menu-upload')}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to AI Menu Extractor
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default FoodMenuManagementPage;
