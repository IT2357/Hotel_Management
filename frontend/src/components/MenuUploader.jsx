import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Link, 
  Folder, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  X,
  FileImage,
  Globe,
  HardDrive
} from 'lucide-react';
import menuApi from '../api/menuApi';

const MenuUploader = ({ onExtractionComplete, onError }) => {
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState('upload'); // 'upload', 'url', 'path'
  const [urlInput, setUrlInput] = useState('');
  const [pathInput, setPathInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');

  // Handle file drop
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File too large. Maximum size is 15MB.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.');
      } else {
        setError('File upload failed. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024, // 15MB
    disabled: loading
  });

  // Clear uploaded file
  const clearFile = () => {
    setUploadedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError('');
  };

  // Handle extraction
  const handleExtraction = async () => {
    setLoading(true);
    setError('');

    try {
      let result;

      switch (inputType) {
        case 'upload':
          if (!uploadedFile) {
            throw new Error('Please select an image file');
          }
          result = await menuApi.extractFromImage(uploadedFile);
          break;

        case 'url':
          if (!urlInput.trim()) {
            throw new Error('Please enter a valid URL');
          }
          // Basic URL validation
          try {
            new URL(urlInput);
          } catch {
            throw new Error('Please enter a valid URL');
          }
          result = await menuApi.extractFromURL(urlInput.trim());
          break;

        case 'path':
          if (!pathInput.trim()) {
            throw new Error('Please enter a valid file path');
          }
          result = await menuApi.extractFromPath(pathInput.trim());
          break;

        default:
          throw new Error('Invalid input type');
      }

      if (result.success) {
        onExtractionComplete(result);
        // Clear form after successful extraction
        clearForm();
      } else {
        throw new Error(result.message || 'Extraction failed');
      }

    } catch (error) {
      console.error('Extraction error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Extraction failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Clear form
  const clearForm = () => {
    setUrlInput('');
    setPathInput('');
    clearFile();
    setError('');
  };

  // Input type options
  const inputTypes = [
    { 
      value: 'upload', 
      label: 'Upload Image', 
      icon: FileImage, 
      description: 'Upload a menu image from your device' 
    },
    { 
      value: 'url', 
      label: 'Website URL', 
      icon: Globe, 
      description: 'Extract menu from a restaurant website' 
    },
    { 
      value: 'path', 
      label: 'File Path', 
      icon: HardDrive, 
      description: 'Process image from server file path (for development)' 
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 AI Menu Extractor
        </h2>
        <p className="text-gray-600">
          Upload a menu image, provide a website URL, or specify a file path to automatically extract menu items using AI.
        </p>
      </div>

      {/* Input Type Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Input Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {inputTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => {
                  setInputType(type.value);
                  clearForm();
                }}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  inputType === type.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                disabled={loading}
              >
                <div className="flex items-center mb-2">
                  <IconComponent className={`h-5 w-5 mr-2 ${
                    inputType === type.value ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <span className={`font-medium ${
                    inputType === type.value ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {type.label}
                  </span>
                </div>
                <p className={`text-sm ${
                  inputType === type.value ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Forms */}
      <div className="mb-8">
        {inputType === 'upload' && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : uploadedFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${loading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                {uploadedFile ? (
                  <div className="space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-green-900">
                        File Selected: {uploadedFile.name}
                      </p>
                      <p className="text-sm text-green-700">
                        Size: {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    {previewUrl && (
                      <div className="mt-4">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg shadow-md"
                        />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        {isDragActive ? 'Drop the image here' : 'Drag & drop a menu image here'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        or click to browse files (JPEG, PNG, WEBP, GIF up to 15MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {inputType === 'url' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Restaurant Website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://restaurant-website.com/menu"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={loading}
              />
            </div>
            <p className="text-sm text-gray-600">
              Enter the URL of a restaurant website with menu information. The system will attempt to extract menu items from the webpage.
            </p>
          </div>
        )}

        {inputType === 'path' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Server File Path
            </label>
            <div className="relative">
              <HardDrive className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                placeholder="/path/to/menu/image.jpg"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={loading}
              />
            </div>
            <p className="text-sm text-gray-600">
              Enter the full path to an image file on the server. This option is primarily for development and testing purposes.
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Extract Button */}
      <div className="flex justify-center">
        <button
          onClick={handleExtraction}
          disabled={loading || (inputType === 'upload' && !uploadedFile) || (inputType === 'url' && !urlInput.trim()) || (inputType === 'path' && !pathInput.trim())}
          className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Extracting Menu...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Extract Menu Items
            </>
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">💡 Tips for Best Results:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use high-quality, well-lit images with clear text</li>
          <li>• Ensure menu items and prices are clearly visible</li>
          <li>• For URLs, provide direct links to menu pages</li>
          <li>• Supported formats: JPEG, PNG, WEBP, GIF (max 15MB)</li>
          <li>• The AI will automatically detect categories and extract pricing</li>
        </ul>
      </div>
    </div>
  );
};

export default MenuUploader;
