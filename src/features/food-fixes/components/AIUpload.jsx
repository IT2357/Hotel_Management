import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const AIUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');
  const navigate = useNavigate();

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear previous data
      setExtractedData(null);
      setError(null);
    }
  };

  // Handle file upload and processing
  const handleUpload = async () => {
    if (!selectedFile) {
      setError(language === 'en' ? 'Please select an image file' : 'ஒரு படக்கோப்பைத் தேர்ந்தெடுக்கவும்');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await api.post('/food-fixes/menu/process-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setExtractedData(res.data.data);
      } else {
        setError(res.data.msg || (language === 'en' ? 'Failed to process image' : 'படத்தைச் செயலாக்க முடியவில்லை'));
      }
    } catch (err) {
      setError(err.response?.data?.message || (language === 'en' ? 'Error processing image' : 'படத்தைச் செயலாக்குவதில் பிழை'));
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission to create menu item
  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    
    if (!extractedData) {
      setError(language === 'en' ? 'No extracted data available' : 'பிரித்தெடுக்கப்பட்ட தரவு எதுவும் இல்லை');
      return;
    }

    try {
      const formData = new FormData();
      
      // Add extracted data
      formData.append('name[en]', extractedData.name.en);
      formData.append('name[ta]', extractedData.name.ta);
      formData.append('price', extractedData.originalPrice);
      formData.append('description[en]', extractedData.description.en);
      formData.append('description[ta]', extractedData.description.ta);
      formData.append('category', extractedData.category);
      formData.append('ingredients', JSON.stringify(extractedData.ingredients));
      formData.append('tags', JSON.stringify(extractedData.tags));
      formData.append('availability', true);
      
      // Add the same image file for the menu item
      if (selectedFile) {
        formData.append('image', selectedFile);
      }
      
      const res = await api.post('/food-fixes/admin/menu', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        alert(language === 'en' ? 'Menu item created successfully!' : 'மெனு பொருள் வெற்றிகரமாக உருவாக்கப்பட்டது!');
        navigate('/admin/food/menu');
      }
    } catch (err) {
      setError(err.response?.data?.message || (language === 'en' ? 'Failed to create menu item' : 'மெனு பொருளை உருவாக்க முடியவில்லை'));
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `LKR ${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-[#4A4A4A]">
            {language === 'en' ? 'AI Menu Extractor' : 'AI மெனு பிரித்தெடுப்பான்'}
          </h1>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded ${language === 'en' ? 'bg-[#FF9933] text-white' : 'bg-gray-200'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage('ta')}
              className={`px-3 py-1 rounded ${language === 'ta' ? 'bg-[#FF9933] text-white' : 'bg-gray-200'}`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#4A4A4A] mb-6">
                {language === 'en' ? 'Upload Menu Image' : 'மெனு படத்தைப் பதிவேற்றவும்'}
              </h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-64 mx-auto rounded-lg"
                  />
                ) : (
                  <div className="space-y-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-gray-600">
                      {language === 'en' ? 'Upload a clear image of your menu' : 'உங்கள் மெனுவின் தெளிவான படத்தைப் பதிவேற்றவும்'}
                    </p>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-4 inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-[#4A4A4A] hover:bg-gray-50 cursor-pointer"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {language === 'en' ? 'Select Image' : 'படத்தைத் தேர்ந்தெடு'}
                </label>
              </div>
              
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">{language === 'en' ? 'Error! ' : 'பிழை! '}</strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              
              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                  !selectedFile || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#FF9933] hover:bg-[#E68A2E]'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {language === 'en' ? 'Processing...' : 'செயலாக்கம்...'}
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    {language === 'en' ? 'Extract Menu Data' : 'மெனு தரவைப் பிரித்தெடு'}
                  </>
                )}
              </button>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">
                  {language === 'en' ? 'How it works' : 'இது எவ்வாறு வேலை செய்கிறது'}
                </h3>
                <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
                  <li>{language === 'en' ? 'Upload a clear image of your menu' : 'உங்கள் மெனுவின் தெளிவான படத்தைப் பதிவேற்றவும்'}</li>
                  <li>{language === 'en' ? 'Our AI will extract dish names, prices, and descriptions' : 'எங்கள் AI உணவு பெயர்கள், விலைகள் மற்றும் விளக்கங்களைப் பிரித்தெடுக்கும்'}</li>
                  <li>{language === 'en' ? 'Review and edit the extracted information' : 'பிரித்தெடுக்கப்பட்ட தகவல்களை மதிப்பாய்வு செய்து திருத்தவும்'}</li>
                  <li>{language === 'en' ? 'Add the item to your menu with one click' : 'ஒரு கிளிக்கில் உங்கள் மெனுவில் பொருளைச் சேர்க்கவும்'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Extracted Data Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#4A4A4A] mb-6">
                {language === 'en' ? 'Extracted Menu Data' : 'பிரித்தெடுக்கப்பட்ட மெனு தரவு'}
              </h2>
              
              {!extractedData ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-[#4A4A4A]">
                    {language === 'en' ? 'No data extracted' : 'தரவு எதுவும் பிரித்தெடுக்கப்படவில்லை'}
                  </h3>
                  <p className="mt-1 text-gray-500">
                    {language === 'en' ? 'Upload a menu image to extract data' : 'தரவைப் பிரித்தெடுக்க மெனு படத்தைப் பதிவேற்றவும்'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateMenuItem}>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'English Name' : 'ஆங்கில பெயர்'}
                      </label>
                      <input
                        type="text"
                        name="name.en"
                        defaultValue={extractedData.name.en}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Tamil Name' : 'தமிழ் பெயர்'}
                      </label>
                      <input
                        type="text"
                        name="name.ta"
                        defaultValue={extractedData.name.ta}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                          {language === 'en' ? 'Original Price' : 'அசல் விலை'}
                        </label>
                        <input
                          type="number"
                          name="originalPrice"
                          defaultValue={extractedData.originalPrice}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                          {language === 'en' ? 'Adjusted Price (-5%)' : 'சரிசெய்யப்பட்ட விலை (-5%)'}
                        </label>
                        <input
                          type="number"
                          name="price"
                          defaultValue={extractedData.price}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Category' : 'வகை'}
                      </label>
                      <input
                        type="text"
                        name="category"
                        defaultValue={extractedData.category}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'English Description' : 'ஆங்கில விளக்கம்'}
                      </label>
                      <textarea
                        name="description.en"
                        defaultValue={extractedData.description.en}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Tamil Description' : 'தமிழ் விளக்கம்'}
                      </label>
                      <textarea
                        name="description.ta"
                        defaultValue={extractedData.description.ta}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Ingredients' : 'உறுப்புகள்'}
                      </label>
                      <input
                        type="text"
                        name="ingredients"
                        defaultValue={extractedData.ingredients.join(', ')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Tags' : 'குறிச்சொற்கள்'}
                      </label>
                      <input
                        type="text"
                        name="tags"
                        defaultValue={extractedData.tags.join(', ')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="availability"
                        defaultChecked={true}
                        className="h-4 w-4 text-[#FF9933] focus:ring-[#FF9933] border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-[#4A4A4A]">
                        {language === 'en' ? 'Available' : 'கிடைக்கிறது'}
                      </label>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setExtractedData(null);
                          setPreviewUrl(null);
                          setSelectedFile(null);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-[#4A4A4A] font-medium hover:bg-gray-50"
                      >
                        {language === 'en' ? 'Reset' : 'மீட்டமை'}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-[#FF9933] hover:bg-[#E68A2E] text-white font-medium rounded-lg transition-colors duration-300"
                      >
                        {language === 'en' ? 'Add to Menu' : 'மெனுவில் சேர்'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
        
        {/* Jaffna-Specific Information */}
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">
              {language === 'en' ? 'Jaffna Cuisine Support' : 'யாழ் உணவு ஆதரவு'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-[#FF9933] mb-2">
                  {language === 'en' ? 'Tamil Language Recognition' : 'தமிழ் மொழி அங்கீகாரம்'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 
                    'Our AI is trained to recognize Tamil text in Jaffna cuisine menus, including traditional names like "நண்டு கறி" (Crab Curry) and "அப்பம்" (Hoppers).' : 
                    'எங்கள் AI யாழ் உணவு மெனுக்களில் தமிழ் உரையை அங்கீகரிக்கும் வகையில் பயிற்சி பெற்றுள்ளது, இதில் "நண்டு கறி" மற்றும் "அப்பம்" போன்ற பாரம்பரிய பெயர்கள் அடங்கும்.'}
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-[#FF9933] mb-2">
                  {language === 'en' ? 'Local Dish Detection' : 'உள்ளூர் உணவு கண்டறிதல்'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 
                    'Specialized detection for popular Jaffna dishes like Odiyal Kool, Brinjal Curry, and String Hoppers with accurate price parsing.' : 
                    'ஓடியால் கூல், கத்தரிக்கை கறி மற்றும் இடியாப்பம் போன்ற பிரபலமான யாழ் உணவுகளுக்கு சிறப்பு கண்டறிதல், துல்லியமான விலை பாகுபடுத்தலுடன்.'}
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-[#FF9933] mb-2">
                  {language === 'en' ? 'Cultural Context' : 'கலாச்சார சூழல்'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 
                    'Understands cultural context and automatically applies tags like "Traditional", "Spicy", and "Seafood" based on dish names and ingredients.' : 
                    'கலாச்சார சூழலைப் புரிந்துகொண்டு, உணவு பெயர்கள் மற்றும் உறுப்புகளின் அடிப்படையில் "பாரம்பரியமான", "காரமான" மற்றும் "கடல் உணவு" போன்ற குறிச்சொற்களைத் தானாகவே செயல்படுத்துகிறது.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIUpload;