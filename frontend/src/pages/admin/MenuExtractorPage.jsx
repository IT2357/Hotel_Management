import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MenuUploader from '../../components/MenuUploader';
import MenuReview from '../../components/food/MenuReview';
import { CheckCircle2, ArrowRight, Home } from 'lucide-react';

const MenuExtractorPage = () => {
  const [currentStep, setCurrentStep] = useState('upload'); // 'upload', 'review', 'success'
  const [extractionResult, setExtractionResult] = useState(null);
  const [savedMenu, setSavedMenu] = useState(null);
  const navigate = useNavigate();

  // Handle successful extraction
  const handleExtractionComplete = (result) => {
    console.log('Extraction completed:', result);
    setExtractionResult(result);
    setCurrentStep('review');
    toast.success(result.message || 'Menu extracted successfully!');
  };

  // Handle extraction error
  const handleExtractionError = (error) => {
    console.error('Extraction error:', error);
    toast.error(error);
  };

  // Handle successful save
  const handleSaveComplete = (result) => {
    console.log('Save completed:', result);
    setSavedMenu(result);
    setCurrentStep('success');
    toast.success('Menu saved to database successfully!');
  };

  // Handle save error
  const handleSaveError = (error) => {
    console.error('Save error:', error);
    toast.error(error);
  };

  // Handle cancel/back to upload
  const handleBackToUpload = () => {
    setCurrentStep('upload');
    setExtractionResult(null);
    setSavedMenu(null);
  };

  // Start new extraction
  const handleStartNew = () => {
    setCurrentStep('upload');
    setExtractionResult(null);
    setSavedMenu(null);
  };

  // Navigate to menu management
  const goToMenuManagement = () => {
    navigate('/admin/food/menu');
  };

  // Navigate to dashboard
  const goToDashboard = () => {
    navigate('/admin');
  };

  // Step indicator
  const steps = [
    { id: 'upload', title: 'Upload', description: 'Upload image or provide URL' },
    { id: 'review', title: 'Review', description: 'Review and edit extracted data' },
    { id: 'success', title: 'Complete', description: 'Menu saved successfully' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🤖 AI Menu Extractor & Importer
              </h1>
              <p className="mt-2 text-gray-600">
                Extract menu items from images, URLs, or file paths using advanced AI technology
              </p>
            </div>
            <button
              onClick={goToDashboard}
              className="inline-flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIndex) => (
                <li key={step.id} className={`relative ${stepIndex !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                  <div className="flex items-center">
                    <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                      stepIndex < currentStepIndex
                        ? 'bg-green-600'
                        : stepIndex === currentStepIndex
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                    }`}>
                      {stepIndex < currentStepIndex ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      ) : (
                        <span className="text-white font-medium">{stepIndex + 1}</span>
                      )}
                    </div>
                    <div className="ml-4 min-w-0 flex flex-col">
                      <span className={`text-sm font-medium ${
                        stepIndex <= currentStepIndex ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                      <span className="text-sm text-gray-500">{step.description}</span>
                    </div>
                  </div>
                  {stepIndex !== steps.length - 1 && (
                    <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {currentStep === 'upload' && (
            <MenuUploader
              onExtractionComplete={handleExtractionComplete}
              onError={handleExtractionError}
            />
          )}

          {currentStep === 'review' && extractionResult && (
            <MenuReview
              extractionResult={extractionResult}
              onSave={handleSaveComplete}
              onCancel={handleBackToUpload}
              onError={handleSaveError}
            />
          )}

          {currentStep === 'success' && savedMenu && (
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 Menu Successfully Saved!
              </h2>
              
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Your menu has been extracted and saved to the database. You can now manage it through the menu management system.
              </p>

              {/* Success Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-md mx-auto">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">
                    {savedMenu.menu?.totalCategories || 0}
                  </div>
                  <div className="text-sm text-blue-700">Categories</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">
                    {savedMenu.menu?.totalItems || 0}
                  </div>
                  <div className="text-sm text-green-700">Items</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">
                    {savedMenu.menu?.confidence || 0}%
                  </div>
                  <div className="text-sm text-purple-700">Confidence</div>
                </div>
              </div>

              {/* Menu ID */}
              <div className="bg-gray-50 p-4 rounded-lg mb-8 max-w-md mx-auto">
                <p className="text-sm text-gray-600 mb-1">Menu ID:</p>
                <code className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded">
                  {savedMenu.insertedId}
                </code>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleStartNew}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Extract Another Menu
                </button>
                <button
                  onClick={goToMenuManagement}
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Manage Menus
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
                <button
                  onClick={goToDashboard}
                  className="inline-flex items-center px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            🔧 How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">1. Upload & Extract</h4>
              <p className="text-blue-700">
                Upload a menu image, provide a restaurant URL, or specify a file path. Our AI will extract menu items, categories, and prices automatically.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">2. Review & Edit</h4>
              <p className="text-blue-700">
                Review the extracted data and make any necessary corrections. Add, edit, or remove items and categories as needed.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">3. Save & Manage</h4>
              <p className="text-blue-700">
                Save the final menu to your database. Access it through the menu management system for ongoing updates and integration.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Powered by advanced OCR technology with Tesseract.js and Google Vision API fallback.
            Supports JPEG, PNG, WEBP, and GIF images up to 15MB.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuExtractorPage;
