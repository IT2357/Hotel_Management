import React, { useState } from 'react';
import { Upload, Link, FolderOpen, Image, Globe, FileText, Loader2, AlertCircle } from 'lucide-react';
import menuExtractionService from '../services/menuExtractionService';
import { toast } from 'react-hot-toast';

const MenuUploader = ({ onExtractionComplete, onError }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
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

    try {
      // Create FormData for the extraction request
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);

      // Handle different input types
      if (activeTab === 'upload' && formData.file) {
        submitFormData.append('file', formData.file);
      } else if (activeTab === 'url') {
        submitFormData.append('url', formData.url);
      } else if (activeTab === 'path') {
        submitFormData.append('path', formData.filePath);
      }

      // Call the extraction service
      const result = await menuExtractionService.uploadMenu(submitFormData);

      if (result.success) {
        onExtractionComplete(result);
      } else {
        throw new Error(result.message || 'Extraction failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process menu';
      onError(errorMessage);
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
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-gray-50 rounded-t-lg">
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
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Menu Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter a descriptive title for this menu"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
            required
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
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
                  <div className="relative inline-block">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg border-4 border-white"
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
                    <p className="text-lg font-medium text-gray-900">
                      {formData.file?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Image ready for analysis
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Image className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-gray-900">
                      Drop your menu image here
                    </p>
                    <p className="text-gray-600">
                      or click to browse files from your device
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>JPG, PNG, WEBP, GIF</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Max 15MB</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL *
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://restaurant.com/menu"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">URL Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Must be a publicly accessible website</li>
                    <li>Should contain menu items with prices</li>
                    <li>Works best with restaurant websites</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'path' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local File Path *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.filePath}
                  onChange={(e) => setFormData(prev => ({ ...prev, filePath: e.target.value }))}
                  placeholder="/path/to/menu/image.jpg"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">File Path Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Must be an absolute path to an image file</li>
                    <li>File must be accessible by the server</li>
                    <li>Supports common image formats (JPG, PNG, etc.)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={clearForm}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
            disabled={loading}
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 font-medium shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Extract Menu</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MenuUploader;