import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Upload,
  Link,
  FolderOpen,
  Image,
  Globe,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';

const MenuUploadPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    filePath: '',
    file: null
  });
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Handle file selection
  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({ ...prev, file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    } else {
      toast.error('Please select a valid image file');
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a menu title');
      return;
    }

    // Validate based on active tab
    if (activeTab === 'upload' && !formData.file) {
      toast.error('Please select an image file');
      return;
    }
    if (activeTab === 'url' && !formData.url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }
    if (activeTab === 'path' && !formData.filePath.trim()) {
      toast.error('Please enter a valid file path');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Create FormData for the extraction request
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);

      // Handle different input types
      if (activeTab === 'upload' && formData.file) {
        // For image upload, append the file as 'file' field to match backend multer expectation
        submitFormData.append('file', formData.file);
      } else if (activeTab === 'url') {
        submitFormData.append('url', formData.url);
      } else if (activeTab === 'path') {
        submitFormData.append('path', formData.filePath);
      }

      // Call the extraction endpoint directly
      console.log('🔄 Making API call to /uploadMenu/upload with data:', {
        title: formData.title,
        hasFile: !!formData.file,
        hasUrl: !!formData.url,
        hasPath: !!formData.filePath
      });
      const response = await api.post('/uploadMenu/upload', submitFormData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('Menu extracted successfully!');

      // Navigate to review page with the extracted menu data
      setTimeout(() => {
        const menuId = response.data?.menu?.id || response.data?.previewId;
        if (menuId) {
          navigate(`/admin/menu-review/${menuId}`);
        } else {
          toast.error('Invalid response from server - no menu ID');
        }
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to process menu';
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // Clear form
  const clearForm = () => {
    setFormData({
      title: '',
      url: '',
      filePath: '',
      file: null
    });
    setPreviewImage(null);
    setUploadProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center space-x-3">
                <Sparkles className="w-10 h-10 text-purple-400" />
                <span>🤖 AI Food Analyzer</span>
              </h1>
              <p className="text-gray-300 text-lg">
                Analyze any food image like Google Lens - Upload photos and get detailed menu information with AI
              </p>
              <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-purple-300">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Visual Food Recognition</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Smart Menu Generation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Instant Results</span>
                </div>
              </div>
              <div className="mt-4 text-xs text-purple-200 opacity-75">
                <p>💡 AI services not configured - using fallback analysis</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Upload Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'upload', label: 'Upload Image', icon: Upload },
                { id: 'url', label: 'From URL', icon: Globe },
                { id: 'path', label: 'File Path', icon: FolderOpen }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Menu Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Menu Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a descriptive title for this menu"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Tab Content */}
            {activeTab === 'upload' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {previewImage ? (
                    <div className="space-y-4">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.file?.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, file: null }));
                          setPreviewImage(null);
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Image className="h-16 w-16 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          Drop your menu image here
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          or click to browse files
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Supports: JPG, PNG, WEBP, GIF (Max 15MB)
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'url' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website URL *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://restaurant.com/menu"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">URL Requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Must be a publicly accessible website</li>
                        <li>Should contain menu items with prices</li>
                        <li>Works best with restaurant websites</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'path' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Local File Path *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.filePath}
                      onChange={(e) => setFormData(prev => ({ ...prev, filePath: e.target.value }))}
                      placeholder="/path/to/menu/image.jpg"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium mb-1">File Path Requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Must be an absolute path to an image file</li>
                        <li>File must be accessible by the server</li>
                        <li>Supports common image formats (JPG, PNG, etc.)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Progress Bar */}
            {loading && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Processing Menu...
                  </span>
                  <span className="text-sm text-gray-500">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8">
              <button
                type="button"
                onClick={clearForm}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                disabled={loading}
              >
                Clear Form
              </button>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-5 w-5" />
                      <span>Extract & Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Features Info */}
        <motion.div
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {[
            {
              icon: Sparkles,
              title: 'AI-Powered Extraction',
              description: 'Advanced OCR and AI to accurately extract menu items, prices, and descriptions'
            },
            {
              icon: CheckCircle,
              title: 'Smart Categorization',
              description: 'Automatically organizes menu items into logical categories like appetizers, mains, desserts'
            },
            {
              icon: Eye,
              title: 'Review & Edit',
              description: 'Review extracted data and make edits before saving to your menu database'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
            >
              <feature.icon className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default MenuUploadPage;
