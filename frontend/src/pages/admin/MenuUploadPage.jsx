import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
  const [detailLevel, setDetailLevel] = useState('standard'); // 'standard' or 'wikipedia'

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
      submitFormData.append('detailLevel', detailLevel);

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
      console.log('🔄 Making API call to /menu/extract with data:', {
        title: formData.title,
        hasFile: !!formData.file,
        hasUrl: !!formData.url,
        hasPath: !!formData.filePath
      });
      const response = await api.post('/menu/extract', submitFormData);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-12 h-12 text-purple-200 mr-3" />
              <h1 className="text-4xl font-bold">🤖 AI Food Analyzer</h1>
            </div>
            <p className="text-purple-100 text-lg mb-6 max-w-2xl mx-auto">
              Analyze any food image like Google Lens - Upload photos and get detailed menu information with AI
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-purple-200">
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
            <div className="mt-4 text-xs text-purple-300 opacity-75">
              <p>💡 AI services not configured - using fallback analysis</p>
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
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <nav className="flex justify-center">
              {[
                { id: 'upload', label: 'Upload Image', icon: Upload },
                { id: 'url', label: 'From URL', icon: Globe },
                { id: 'path', label: 'File Path', icon: FolderOpen }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`py-4 px-6 font-medium text-sm flex items-center space-x-2 transition-colors border-b-2 ${
                    activeTab === id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800'
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
          <form onSubmit={handleSubmit} className="p-8">
            {/* Menu Title */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Menu Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a descriptive title for this menu (e.g., 'Valampuri Special Menu')"
                className="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 text-base"
                required
              />
            </div>

            {/* Detail Level */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Analysis Detail Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  detailLevel === 'standard'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                }`}>
                  <input
                    type="radio"
                    name="detailLevel"
                    value="standard"
                    checked={detailLevel === 'standard'}
                    onChange={(e) => setDetailLevel(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
                      detailLevel === 'standard'
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {detailLevel === 'standard' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Standard</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Basic menu information</div>
                    </div>
                  </div>
                </label>

                <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  detailLevel === 'wikipedia'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                }`}>
                  <input
                    type="radio"
                    name="detailLevel"
                    value="wikipedia"
                    checked={detailLevel === 'wikipedia'}
                    onChange={(e) => setDetailLevel(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
                      detailLevel === 'wikipedia'
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {detailLevel === 'wikipedia' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Wikipedia</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Cultural & historical details</div>
                    </div>
                  </div>
                </label>
              </div>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Wikipedia level</strong> provides comprehensive descriptions including cultural significance, traditional recipes, regional variations, and historical context - perfect for authentic Jaffna Tamil cuisine documentation.
                </p>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'upload' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div
                  className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                    dragActive
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
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
                    <div className="space-y-6">
                      <div className="relative inline-block">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="max-w-full max-h-80 mx-auto rounded-xl shadow-lg border-4 border-white dark:border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, file: null }));
                            setPreviewImage(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {formData.file?.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Image ready for analysis
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="mx-auto w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <Image className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">
                          Drop your menu image here
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          or click to browse files from your device
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>JPG, PNG, WEBP, GIF</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>Max 15MB</span>
                        </span>
                      </div>
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
                className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      Processing Menu...
                    </span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
                  AI is analyzing your image and extracting menu details...
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={clearForm}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium"
                disabled={loading}
              >
                Clear Form
              </button>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 font-medium shadow-lg"
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
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {[
            {
              icon: Sparkles,
              title: 'AI-Powered Extraction',
              description: 'Advanced computer vision and AI to accurately extract menu items, prices, and descriptions from any food image',
              color: 'text-purple-600'
            },
            {
              icon: CheckCircle,
              title: 'Smart Categorization',
              description: 'Automatically organizes menu items into Valampuri-style categories with Jaffna Tamil cuisine recognition',
              color: 'text-green-600'
            },
            {
              icon: Eye,
              title: 'Review & Edit',
              description: 'Interactive review interface to edit extracted data before saving to your menu database',
              color: 'text-blue-600'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200"
            >
              <div className={`inline-flex p-3 rounded-lg bg-gray-50 dark:bg-gray-700 mb-4`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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
