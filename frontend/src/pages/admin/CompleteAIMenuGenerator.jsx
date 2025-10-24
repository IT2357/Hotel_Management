import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Upload,
  Camera,
  Loader2,
  Check,
  X,
  Edit3,
  Save,
  Trash2,
  Eye,
  Zap,
  Brain,
  Globe,
  ArrowRight,
  ArrowLeft,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import FoodButton from '../../components/food/FoodButton';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/food/FoodCard';
import FoodBadge from '../../components/food/FoodBadge';
import FoodInput from '../../components/food/FoodInput';
import FoodLabel from '../../components/food/FoodLabel';
import FoodSelect from '../../components/food/FoodSelect';
import FoodTextarea from '../../components/food/FoodTextarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/food/FoodTabs';
import { toast } from 'sonner';
import api from '../../services/api';
import foodService from '../../services/foodService';

const CompleteAIMenuGenerator = () => {
  console.log('🚀 [AI Menu] Component mounting/rendering');
  const navigate = useNavigate();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Review, 3: Success
  
  // Extraction states
  const [extractionMethod, setExtractionMethod] = useState('image'); // 'image' or 'url'
  const [loading, setLoading] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Image upload states
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  // URL extraction states
  const [urlInput, setUrlInput] = useState('');
  
  // Edit states
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Categories
  const [categories, setCategories] = useState([]);
  
  const fileInputRef = useRef(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Debug: Monitor state changes
  useEffect(() => {
    console.log('🔍 [AI Menu] State changed - imageFile:', imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'null');
    console.log('🔍 [AI Menu] State changed - imagePreview:', imagePreview ? `${imagePreview.substring(0, 50)}...` : 'null');
    console.log('🔍 [AI Menu] State changed - extractionMethod:', extractionMethod);
  }, [imageFile, imagePreview, extractionMethod]);

  const loadCategories = async () => {
    try {
      const response = await foodService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    console.log('🔍 [AI Menu] handleFileSelect called');
    console.log('🔍 [AI Menu] Event:', event);
    console.log('🔍 [AI Menu] Files:', event.target.files);
    
    const file = event.target.files[0];
    console.log('🔍 [AI Menu] Selected file:', file);
    
    if (file) {
      console.log('🔍 [AI Menu] File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        console.error('❌ [AI Menu] Invalid file type:', file.type);
        toast.error('❌ Invalid file type\n\n✅ Accepted: JPEG, PNG, WEBP', {
          duration: 4000
        });
        return;
      }
      console.log('✅ [AI Menu] File type valid');

      // Show quality warning for small files (but don't block - let AI try)
      const sizeKB = file.size / 1024;
      console.log(`📊 [AI Menu] File size: ${sizeKB.toFixed(1)} KB`);
      
      if (sizeKB < 100) {
        console.warn(`⚠️ [AI Menu] Low quality image: ${sizeKB.toFixed(1)} KB`);
        toast.warning(`⚠️ WARNING: Low quality image (${sizeKB.toFixed(1)} KB)\n\n🎯 For BEST results:\n  • Use images >500 KB\n  • High resolution photos\n  • Clear lighting & focus\n\n💡 We'll try anyway, but results may be poor.\n✨ TIP: Use URL extraction for 100% accuracy!`, {
          duration: 8000,
          id: 'quality-warning'
        });
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('❌ File too large\n\n📊 Max size: 10 MB\n📊 Your file: ' + (file.size / (1024 * 1024)).toFixed(1) + ' MB\n\n✅ Compress the image and try again', {
          duration: 5000
        });
        return;
      }

      console.log('🔍 [AI Menu] Setting imageFile state...');
      setImageFile(file);
      console.log('✅ [AI Menu] imageFile state set');

      // Create preview with quality feedback
      console.log('🔍 [AI Menu] Creating FileReader...');
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('🔍 [AI Menu] FileReader onload triggered');
        console.log('🔍 [AI Menu] Result length:', e.target.result?.length);
        setImagePreview(e.target.result);
        console.log('✅ [AI Menu] imagePreview state set');
        
        // Show quality feedback
        const sizeKB = file.size / 1024;
        if (sizeKB >= 500) {
          toast.success('✅ High-quality image loaded (' + sizeKB.toFixed(0) + ' KB)\n🌟 Optimal for accurate extraction!', {
            duration: 3000
          });
        } else if (sizeKB >= 100) {
          toast('ℹ️ Medium-quality image (' + sizeKB.toFixed(0) + ' KB)\n💡 Higher resolution recommended for best results', {
            duration: 4000
          });
        } else {
          toast.warning('⚠️ Low-quality image (' + sizeKB.toFixed(0) + ' KB)\n💡 Results may be less accurate. Consider:\n  • Using a higher resolution image\n  • Trying URL extraction instead', {
            duration: 5000
          });
        }
      };
      console.log('🔍 [AI Menu] Starting FileReader.readAsDataURL...');
      reader.readAsDataURL(file);
      console.log('✅ [AI Menu] FileReader.readAsDataURL called');
    } else {
      console.warn('⚠️ [AI Menu] No file selected from input');
    }
  };

  // Clear image
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Extract menu from image
  const extractFromImage = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }

    try {
      setLoading(true);
      
      // Step 1: Uploading
      toast.loading('📤 Uploading image...', { id: 'extract' });
      
      const formData = new FormData();
      formData.append('image', imageFile);

      console.log('🔍 [AI Menu] FormData created with image:', imageFile.name, imageFile.size, 'bytes');
      console.log('🔍 [AI Menu] FormData entries:', Array.from(formData.entries()).map(([k, v]) => [k, v.name || v]));
      
      // Step 2: Processing OCR
      setTimeout(() => {
        if (loading) {
          toast.loading('🔍 Reading text with OCR...', { id: 'extract' });
        }
      }, 1000);
      
      // Step 3: AI Analysis
      setTimeout(() => {
        if (loading) {
          toast.loading('🧠 AI analyzing menu structure...', { id: 'extract' });
        }
      }, 2500);
      
      // Send request - the api interceptor will handle Content-Type for FormData
      console.log('📤 [AI Menu] Sending extraction request...');
      const response = await api.post('/food-complete/ai/extract', formData);
      console.log('📥 [AI Menu] Received response:', response);
      console.log('📥 [AI Menu] Response data:', response.data);
      
      const menuItems = response.data.data?.menuItems || response.data.menuItems || [];
      const extractedText = response.data.data?.ocrText || '';
      const confidence = response.data.data?.confidence || 0;
      
      console.log('📊 [AI Menu] Extracted items count:', menuItems.length);
      console.log('📊 [AI Menu] Confidence:', confidence);
      
      // Check extraction quality
      if (menuItems.length === 0) {
        // Provide detailed diagnostics
        let errorMessage = '❌ No menu items found. ';
        
        if (extractedText.length < 10) {
          errorMessage += '\n\n📊 Issue: Image text is unreadable\n';
          errorMessage += '✅ Solutions:\n';
          errorMessage += '  • Use high-resolution image (>500KB recommended)\n';
          errorMessage += '  • Ensure good lighting and focus\n';
          errorMessage += '  • Avoid blurry or low-contrast photos\n';
          errorMessage += '  • Try URL extraction instead for best results';
        } else if (confidence < 50) {
          errorMessage += '\n\n📊 Issue: Low confidence extraction\n';
          errorMessage += '✅ Solutions:\n';
          errorMessage += '  • Capture straight-on photos (avoid angles)\n';
          errorMessage += '  • Ensure menu text is clearly visible\n';
          errorMessage += '  • Remove shadows or glare\n';
          errorMessage += '  • Try the URL scraping method';
        } else {
          errorMessage += '\n\n📊 Text detected but no menu structure found\n';
          errorMessage += '✅ Solutions:\n';
          errorMessage += '  • Verify image contains menu items with prices\n';
          errorMessage += '  • Try URL extraction for structured data\n';
          errorMessage += '  • Manually create items if needed';
        }
        
        toast.error(errorMessage, { 
          id: 'extract',
          duration: 8000 
        });
        return;
      }
      
      // Success with quality feedback
      let successMessage = `✅ Extracted ${menuItems.length} items successfully!`;
      if (confidence >= 90) {
        successMessage += '\n🌟 High confidence extraction';
      } else if (confidence >= 75) {
        successMessage += '\n✓ Good quality extraction';
      } else {
        successMessage += '\n⚠️ Please review items carefully';
      }
      
      processExtractedItems(menuItems);
      toast.success(successMessage, { id: 'extract', duration: 4000 });
      
    } catch (error) {
      console.error('❌ [AI Menu] Extraction error:', error);
      console.error('❌ [AI Menu] Error response:', error.response);
      console.error('❌ [AI Menu] Error status:', error.response?.status);
      console.error('❌ [AI Menu] Error data:', error.response?.data);
      
      // Enhanced error handling
      let errorMsg = '❌ Extraction failed\n\n';
      
      if (error.response?.status === 400) {
        errorMsg += '📊 Issue: Invalid image format\n';
        errorMsg += '✅ Use JPEG, PNG, or WEBP format';
      } else if (error.response?.status === 413) {
        errorMsg += '📊 Issue: Image file too large\n';
        errorMsg += '✅ Compress image to under 10MB';
      } else if (error.response?.status === 500) {
        errorMsg += '📊 Issue: Server processing error\n';
        errorMsg += '✅ Try again or use URL extraction';
      } else if (error.code === 'ECONNABORTED') {
        errorMsg += '📊 Issue: Request timeout\n';
        errorMsg += '✅ Check internet connection';
      } else {
        errorMsg += error.response?.data?.message || error.message || 'Unknown error';
      }
      
      toast.error(errorMsg, { id: 'extract', duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  // Extract menu from URL
  const extractFromUrl = async () => {
    if (!urlInput || !urlInput.trim()) {
      toast.error('❌ Please enter a website URL');
      return;
    }

    // Validate URL format
    try {
      new URL(urlInput);
    } catch (e) {
      toast.error('❌ Invalid URL format\n\n✅ Example:\nhttps://valampuri.foodorders.lk/menu/2', {
        duration: 5000
      });
      return;
    }

    try {
      setLoading(true);
      
      // Step 1: Connecting
      toast.loading('🌐 Connecting to website...', { id: 'extract' });
      
      // Step 2: Loading
      setTimeout(() => {
        if (loading) {
          toast.loading('📄 Loading menu page...', { id: 'extract' });
        }
      }, 1000);
      
      // Step 3: Parsing
      setTimeout(() => {
        if (loading) {
          toast.loading('🔍 Parsing menu structure...', { id: 'extract' });
        }
      }, 2000);

      const response = await api.post('/food-complete/ai/extract-from-url', {
        url: urlInput
      });

      const menuItems = response.data.data?.menuItems || [];
      const source = response.data.data?.source || '';
      
      if (menuItems.length === 0) {
        toast.error('❌ No menu items found\n\n📊 Issue: Page structure not recognized\n\n✅ Solutions:\n  • Verify URL contains menu items with prices\n  • Try different menu page URL\n  • Check if page requires login\n  • Use image upload method instead\n\n💡 Tip: Works best with restaurant websites', { 
          id: 'extract',
          duration: 8000 
        });
        return;
      }
      
      processExtractedItems(menuItems);
      toast.success(`✅ Extracted ${menuItems.length} items from website!\n\n🌟 URL extraction provides highest accuracy\n📍 Source: ${new URL(source || urlInput).hostname}`, { 
        id: 'extract',
        duration: 5000 
      });
      
    } catch (error) {
      console.error('URL extraction error:', error);
      
      // Enhanced error handling
      let errorMsg = '❌ URL extraction failed\n\n';
      
      if (error.response?.status === 400) {
        errorMsg += '📊 Issue: Invalid URL or format\n';
        errorMsg += '✅ Check URL is correct and accessible';
      } else if (error.response?.status === 403 || error.response?.status === 401) {
        errorMsg += '📊 Issue: Access denied\n';
        errorMsg += '✅ Page may require login or be blocked';
      } else if (error.response?.status === 404) {
        errorMsg += '📊 Issue: Page not found\n';
        errorMsg += '✅ Verify URL is correct';
      } else if (error.response?.status === 500) {
        errorMsg += '📊 Issue: Server error\n';
        errorMsg += '✅ Try again or use image upload';
      } else if (error.code === 'ECONNABORTED') {
        errorMsg += '📊 Issue: Connection timeout\n';
        errorMsg += '✅ Website may be slow or unreachable';
      } else {
        errorMsg += error.response?.data?.message || error.message || 'Unknown error';
      }
      
      toast.error(errorMsg, { id: 'extract', duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  // Process extracted items and move to review step
  const processExtractedItems = (items) => {
    setExtractedItems(items);
    setSelectedItems(items.map((_, idx) => idx)); // Select all by default
    setCurrentStep(2); // Move to review step
  };

  // Toggle item selection
  const toggleItemSelection = (index) => {
    setSelectedItems(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // Select/Deselect all
  const toggleSelectAll = () => {
    if (selectedItems.length === extractedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(extractedItems.map((_, idx) => idx));
    }
  };

  // Start editing an item
  const startEditing = (item, index) => {
    setEditingItem(index);
    const dishName = item.name_english || item.name || '';
    setEditForm({
      name: dishName,
      name_tamil: item.name_tamil || '',
      description: item.description_english || item.description || '',
      price: item.price || 0,
      category: item.category || detectCategory(dishName),
      ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : '',
      dietaryTags: Array.isArray(item.dietaryTags) ? item.dietaryTags : [],
      isVeg: item.isVeg || false,
      isSpicy: item.isSpicy || false,
      cookingTime: item.cookingTime || ''
    });
  };

  // Save edited item
  const saveEdit = (index) => {
    setExtractedItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          name_english: editForm.name,
          name_tamil: editForm.name_tamil,
          description_english: editForm.description,
          price: parseFloat(editForm.price) || 0,
          category: editForm.category,
          ingredients: editForm.ingredients.split(',').map(i => i.trim()).filter(i => i),
          dietaryTags: editForm.dietaryTags,
          isVeg: editForm.isVeg,
          isSpicy: editForm.isSpicy,
          cookingTime: editForm.cookingTime
        };
      }
      return item;
    }));
    setEditingItem(null);
    setEditForm({});
    toast.success('Item updated');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingItem(null);
    setEditForm({});
  };

  // Smart category detection based on dish name
  const detectCategory = (dishName) => {
    const name = dishName.toLowerCase();
    
    // Find matching category
    const categoryMap = {
      'rice': ['rice', 'biriyani', 'biryani', 'fried rice', 'nasi', 'pulao', 'pilaf'],
      'noodles': ['noodles', 'pasta', 'spaghetti', 'noodle', 'mee', 'mie'],
      'curry': ['curry', 'masala', 'gravy', 'korma'],
      'appetizers': ['starter', 'appetizer', 'samosa', 'pakora', 'vadai', 'vada', 'fritter'],
      'breads': ['bread', 'roti', 'naan', 'paratha', 'chapati', 'dosa', 'idli', 'appam'],
      'beverages': ['tea', 'coffee', 'juice', 'drink', 'shake', 'smoothie', 'lassi'],
      'desserts': ['dessert', 'sweet', 'cake', 'ice cream', 'pudding', 'kheer', 'halwa'],
      'seafood': ['fish', 'prawn', 'shrimp', 'crab', 'seafood', 'squid'],
      'chicken': ['chicken', 'fowl'],
      'mutton': ['mutton', 'lamb', 'goat'],
      'vegetarian': ['vegetable', 'veg', 'paneer', 'tofu']
    };
    
    // Check each category mapping
    for (const [categoryKey, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        // Find category by name (case-insensitive)
        const matchingCategory = categories.find(cat => 
          cat.name.toLowerCase().includes(categoryKey) ||
          categoryKey.includes(cat.name.toLowerCase())
        );
        if (matchingCategory) {
          return matchingCategory._id;
        }
      }
    }
    
    // Default to "Main Course" or first non-beverage category
    const mainCourse = categories.find(cat => 
      cat.name.toLowerCase().includes('main') || 
      cat.name.toLowerCase().includes('course')
    );
    if (mainCourse) return mainCourse._id;
    
    // Fallback: first category that's not beverages
    const nonBeverage = categories.find(cat => 
      !cat.name.toLowerCase().includes('beverage') &&
      !cat.name.toLowerCase().includes('drink')
    );
    
    return nonBeverage?._id || categories[0]?._id || '';
  };

  // Delete item
  const deleteItem = (index) => {
    setExtractedItems(prev => prev.filter((_, idx) => idx !== index));
    setSelectedItems(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    toast.success('Item removed');
  };

  // Save selected items to menu
  const saveToMenu = async () => {
    const itemsToSave = extractedItems.filter((_, idx) => selectedItems.includes(idx));
    
    if (itemsToSave.length === 0) {
      toast.warning('Please select at least one item to save');
      return;
    }

    try {
      setSaving(true);
      toast.loading(`Saving ${itemsToSave.length} items...`, { id: 'save' });
      
      let savedCount = 0;
      let failedCount = 0;

      for (const item of itemsToSave) {
        try {
          const dishName = item.name_english || item.name || 'Unnamed Item';
          const menuItemData = {
            name: dishName,
            description: item.description_english || item.description || '',
            price: parseFloat(item.price) || 0,
            category: item.category || detectCategory(dishName),
            ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
            dietaryTags: Array.isArray(item.dietaryTags) ? item.dietaryTags : [],
            isVeg: item.isVeg || false,
            isSpicy: item.isSpicy || false,
            culturalContext: item.culturalContext || 'jaffna',
            culturalOrigin: item.culturalOrigin || 'Jaffna Tamil Cuisine',
            isAvailable: true,
            imageUrl: item.image || item.imageUrl || '',
            cookingTime: item.cookingTime || 30
          };

          await foodService.createMenuItem(menuItemData);
          savedCount++;
        } catch (error) {
          console.error('Error saving item:', error);
          failedCount++;
        }
      }

      if (savedCount > 0) {
        toast.success(`${savedCount} items saved successfully!`, { id: 'save' });
        setCurrentStep(3); // Move to success step
      } else {
        toast.error('Failed to save items', { id: 'save' });
      }

      if (failedCount > 0) {
        toast.warning(`${failedCount} items failed to save`);
      }

    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save items to menu', { id: 'save' });
    } finally {
      setSaving(false);
    }
  };

  // Reset to start
  const resetExtraction = () => {
    setCurrentStep(1);
    setExtractedItems([]);
    setSelectedItems([]);
    clearImage();
    setUrlInput('');
  };

  // Go to menu management
  const goToMenuManagement = () => {
    navigate('/admin/food/menu');
  };

  // Render Step 1: Upload/Extract
  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Choose Extraction Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={extractionMethod} onValueChange={setExtractionMethod}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Upload Image
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-4 mt-4">
              {!imagePreview ? (
                <div
                  onClick={() => {
                    console.log('🔍 [AI Menu] Upload div clicked');
                    console.log('🔍 [AI Menu] fileInputRef.current:', fileInputRef.current);
                    if (!fileInputRef.current) {
                      console.error('❌ [AI Menu] fileInputRef.current is null!');
                      toast.error('File input not ready. Please refresh the page.');
                      return;
                    }
                    console.log('🔍 [AI Menu] Triggering file input click...');
                    fileInputRef.current.click();
                  }}
                  className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all group"
                >
                  <Upload className="w-16 h-16 mx-auto mb-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Click to upload Jaffna menu image
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    JPEG, PNG, or WEBP (max 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden shadow-lg">
                    <img
                      src={imagePreview}
                      alt="Menu preview"
                      className="w-full h-auto max-h-96 object-contain bg-gray-100 dark:bg-gray-800"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-3 right-3 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <FoodButton
                    onClick={extractFromImage}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing Image...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5 mr-2" />
                        Extract Menu Items with AI
                      </>
                    )}
                  </FoodButton>
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <FoodLabel htmlFor="url">Menu URL (Website or Image Link)</FoodLabel>
                  <FoodInput
                    id="url"
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/menu OR https://example.com/menu.jpg"
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-3 space-y-1.5 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <p className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Supported URL types:
                    </p>
                    <p className="ml-5">• Restaurant website: https://valampuri.foodorders.lk/menu/2</p>
                    <p className="ml-5">• Direct image link: https://example.com/menu-photo.jpg</p>
                    <p className="ml-5">• Any image URL with .jpg, .png, .webp, .gif extension</p>
                    <p className="mt-2 ml-5 text-indigo-600 dark:text-indigo-400 font-medium">
                      💡 Tip: Image URLs are processed with AI vision for best results!
                    </p>
                  </div>
                </div>

                <FoodButton
                  onClick={extractFromUrl}
                  disabled={loading || !urlInput}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing URL...
                    </>
                  ) : (
                    <>
                      <Globe className="w-5 h-5 mr-2" />
                      Extract from URL
                    </>
                  )}
                </FoodButton>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Features Info */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Jaffna Cuisine AI Features
            </h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Tamil + English OCR:</strong> Recognizes both languages in menu images</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Jaffna Dishes:</strong> Special recognition for crab curry, mutton curry, kottu, etc.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Price Detection:</strong> Automatically finds LKR, Rs., රු prices</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Dietary Tags:</strong> Detects Halal, Spicy, Vegetarian items</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>URL Extraction:</strong> Download & analyze images from URLs or scrape restaurant websites</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Google Lens-like Analysis:</strong> AI vision recognizes dishes, prices, and ingredients</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  // Render Step 2: Review & Edit
  const renderReviewStep = () => (
    <div className="space-y-4">
      {/* Header with navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <FoodButton
                onClick={() => setCurrentStep(1)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </FoodButton>
              <div>
                <FoodBadge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {extractedItems.length} items extracted
                </FoodBadge>
                <FoodBadge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ml-2">
                  {selectedItems.length} selected
                </FoodBadge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FoodButton
                onClick={toggleSelectAll}
                variant="outline"
                size="sm"
              >
                {selectedItems.length === extractedItems.length ? 'Deselect All' : 'Select All'}
              </FoodButton>
              <FoodButton
                onClick={saveToMenu}
                disabled={saving || selectedItems.length === 0}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save to Menu ({selectedItems.length})
                  </>
                )}
              </FoodButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-3">
        {extractedItems.map((item, index) => (
          <Card
            key={index}
            className={`transition-all ${
              selectedItems.includes(index)
                ? 'ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'
                : 'hover:shadow-md'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedItems.includes(index)}
                  onChange={() => toggleItemSelection(index)}
                  className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />

                {/* Item Image */}
                {item.image && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.name_english || 'Menu item'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Item Content */}
                <div className="flex-1 min-w-0">
                  {editingItem === index ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <FoodLabel>Name (English)</FoodLabel>
                          <FoodInput
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder="Item name"
                          />
                        </div>
                        <div>
                          <FoodLabel>Name (Tamil)</FoodLabel>
                          <FoodInput
                            value={editForm.name_tamil}
                            onChange={(e) => setEditForm({ ...editForm, name_tamil: e.target.value })}
                            placeholder="தமிழ் பெயர்"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <FoodLabel>Description</FoodLabel>
                        <FoodTextarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Description"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <FoodLabel>Price (LKR)</FoodLabel>
                          <FoodInput
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          />
                        </div>
                        <div>
                          <FoodLabel>Category</FoodLabel>
                          <FoodSelect
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          >
                            {categories.map(cat => (
                              <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                          </FoodSelect>
                        </div>
                        <div>
                          <FoodLabel>Cooking Time (min)</FoodLabel>
                          <FoodInput
                            type="number"
                            value={editForm.cookingTime}
                            onChange={(e) => setEditForm({ ...editForm, cookingTime: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <FoodLabel>Ingredients (comma-separated)</FoodLabel>
                        <FoodInput
                          value={editForm.ingredients}
                          onChange={(e) => setEditForm({ ...editForm, ingredients: e.target.value })}
                          placeholder="Chicken, Curry powder, Coconut milk..."
                        />
                      </div>

                      <div className="flex gap-4 flex-wrap">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.isVeg}
                            onChange={(e) => setEditForm({ ...editForm, isVeg: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          <span className="text-sm">🥬 Vegetarian</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.isSpicy}
                            onChange={(e) => setEditForm({ ...editForm, isSpicy: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          <span className="text-sm">🌶️ Spicy</span>
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <FoodButton onClick={() => saveEdit(index)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          <Check className="w-4 h-4 mr-1" />
                          Save Changes
                        </FoodButton>
                        <FoodButton onClick={cancelEditing} variant="outline" size="sm">
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </FoodButton>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {item.name_english || item.name || 'Unnamed Item'}
                          {item.name_tamil && (
                            <span className="ml-2 text-sm text-gray-500">({item.name_tamil})</span>
                          )}
                        </h3>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          LKR {parseFloat(item.price || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      {item.description_english && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {item.description_english}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {item.isVeg && (
                          <FoodBadge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                            🥬 Vegetarian
                          </FoodBadge>
                        )}
                        {item.isSpicy && (
                          <FoodBadge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs">
                            🌶️ Spicy
                          </FoodBadge>
                        )}
                        {item.dietaryTags?.map((tag, i) => (
                          <FoodBadge key={i} className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                            {tag}
                          </FoodBadge>
                        ))}
                        {item.aiConfidence && (
                          <FoodBadge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                            {Math.round(item.aiConfidence)}% confidence
                          </FoodBadge>
                        )}
                        {item.culturalContext && (
                          <FoodBadge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs">
                            {item.culturalContext}
                          </FoodBadge>
                        )}
                      </div>

                      {item.ingredients && item.ingredients.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">Ingredients:</span> {item.ingredients.join(', ')}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                {editingItem !== index && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditing(item, index)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      title="Edit item"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Render Step 3: Success
  const renderSuccessStep = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Successfully Saved!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {selectedItems.length} menu items have been added to your menu.
            They are now visible to guests and available for ordering.
          </p>
          <div className="flex gap-3 justify-center">
            <FoodButton
              onClick={goToMenuManagement}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              View in Menu Management
            </FoodButton>
            <FoodButton
              onClick={resetExtraction}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add More Items
            </FoodButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Menu Generator
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Extract menu items from images or websites - Optimized for Jaffna Cuisine
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentStep >= 1 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {currentStep > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-medium">Extract</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentStep >= 2 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-gray-100 text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {currentStep > 2 ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-medium">Review & Edit</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentStep >= 3 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                {currentStep >= 3 ? <CheckCircle2 className="w-5 h-5" /> : '3'}
              </div>
              <span className="font-medium">Saved</span>
            </div>
          </div>
        </div>

        {/* Content based on current step */}
        {currentStep === 1 && renderUploadStep()}
        {currentStep === 2 && renderReviewStep()}
        {currentStep === 3 && renderSuccessStep()}
      </div>
    </div>
  );
};

export default CompleteAIMenuGenerator;

