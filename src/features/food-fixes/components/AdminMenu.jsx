import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState('en');
  const navigate = useNavigate();

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: { en: '', ta: '' },
    price: '',
    description: { en: '', ta: '' },
    category: '',
    ingredients: '',
    tags: '',
    availability: true,
    image: null
  });

  // Fetch menu items
  const fetchMenuItems = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/food-fixes/admin/menu?page=${page}&limit=10&search=${searchTerm}`);
      setMenuItems(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setCurrentPage(res.data.pagination.currentPage);
    } catch (err) {
      setError('Failed to load menu items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load menu items on component mount and when page/search changes
  useEffect(() => {
    fetchMenuItems(currentPage);
  }, [currentPage, searchTerm]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMenuItems(1);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties like name.en, name.ta
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: e.target.files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle add menu item
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('name[en]', formData.name.en);
      formDataToSend.append('name[ta]', formData.name.ta);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('description[en]', formData.description.en);
      formDataToSend.append('description[ta]', formData.description.ta);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('ingredients', JSON.stringify(formData.ingredients.split(',').map(i => i.trim())));
      formDataToSend.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim())));
      formDataToSend.append('availability', formData.availability);
      
      // Add image if provided
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      const res = await api.post('/food-fixes/admin/menu', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        setShowAddModal(false);
        resetForm();
        fetchMenuItems(currentPage);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add menu item');
    }
  };

  // Handle edit menu item
  const handleEditItem = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      
      // Add text fields if they have values
      if (formData.name.en) formDataToSend.append('name[en]', formData.name.en);
      if (formData.name.ta) formDataToSend.append('name[ta]', formData.name.ta);
      if (formData.price) formDataToSend.append('price', formData.price);
      if (formData.description.en) formDataToSend.append('description[en]', formData.description.en);
      if (formData.description.ta) formDataToSend.append('description[ta]', formData.description.ta);
      if (formData.category) formDataToSend.append('category', formData.category);
      if (formData.ingredients) formDataToSend.append('ingredients', JSON.stringify(formData.ingredients.split(',').map(i => i.trim())));
      if (formData.tags) formDataToSend.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim())));
      formDataToSend.append('availability', formData.availability);
      
      // Add image if provided
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      const res = await api.put(`/food-fixes/admin/menu/${currentItem._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchMenuItems(currentPage);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update menu item');
    }
  };

  // Handle delete menu item
  const handleDeleteItem = async () => {
    try {
      const res = await api.delete(`/food-fixes/admin/menu/${currentItem._id}`);
      
      if (res.data.success) {
        setShowDeleteModal(false);
        setCurrentItem(null);
        fetchMenuItems(currentPage);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete menu item');
    }
  };

  // Open edit modal with item data
  const openEditModal = (item) => {
    setCurrentItem(item);
    setFormData({
      name: { en: item.name.en || '', ta: item.name.ta || '' },
      price: item.originalPrice || item.price || '',
      description: { en: item.description.en || '', ta: item.description.ta || '' },
      category: item.category || '',
      ingredients: item.ingredients ? item.ingredients.join(', ') : '',
      tags: item.tags ? item.tags.join(', ') : '',
      availability: item.availability !== undefined ? item.availability : true,
      image: null
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (item) => {
    setCurrentItem(item);
    setShowDeleteModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: { en: '', ta: '' },
      price: '',
      description: { en: '', ta: '' },
      category: '',
      ingredients: '',
      tags: '',
      availability: true,
      image: null
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `LKR ${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#4A4A4A]">
              {language === 'en' ? 'Menu Management' : 'மெனு மேலாண்மை'}
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
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 border-b">
                      <div className="flex items-center">
                        <div className="bg-gray-200 rounded w-16 h-16"></div>
                        <div className="ml-4">
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">{language === 'en' ? 'Error! ' : 'பிழை! '}</strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-[#4A4A4A]">
            {language === 'en' ? 'Menu Management' : 'மெனு மேலாண்மை'}
          </h1>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-sm ${language === 'en' ? 'bg-[#FF9933] text-white' : 'bg-gray-200'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('ta')}
                className={`px-3 py-1 rounded text-sm ${language === 'ta' ? 'bg-[#FF9933] text-white' : 'bg-gray-200'}`}
              >
                தமிழ்
              </button>
            </div>
            
            <button
              onClick={() => navigate('/admin/food/ai-menu')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
            >
              {language === 'en' ? 'AI Menu Extractor' : 'AI மெனு பிரித்தெடுப்பான்'}
            </button>
            
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-[#FF9933] hover:bg-[#E68A2E] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              {language === 'en' ? 'Add Item' : 'பொருளைச் சேர்'}
            </button>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'en' ? "Search menu items..." : "மெனு பொருட்களைத் தேடு..."}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#FF9933] hover:bg-[#E68A2E] text-white px-6 py-2 rounded-lg font-medium transition-colors duration-300"
            >
              {language === 'en' ? 'Search' : 'தேடு'}
            </button>
          </form>
        </div>

        {/* Menu Items Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Item' : 'பொருள்'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Category' : 'வகை'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Price' : 'விலை'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Availability' : 'கிடைக்கும் நிலை'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'en' ? 'Actions' : 'செயல்கள்'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menuItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      {language === 'en' ? 'No menu items found' : 'மெனு பொருட்கள் எதுவும் கிடைக்கவில்லை'}
                    </td>
                  </tr>
                ) : (
                  menuItems.map(item => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={language === 'en' ? item.name.en : item.name.ta} 
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          ) : (
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-[#4A4A4A]">
                              {language === 'en' ? item.name.en : item.name.ta}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {language === 'en' ? item.description.en : item.description.ta}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#4A4A4A]">{item.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#FF9933]">
                          {formatCurrency(item.price)}
                        </div>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <div className="text-xs text-gray-500 line-through">
                            {formatCurrency(item.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.availability 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.availability 
                            ? (language === 'en' ? 'Available' : 'கிடைக்கிறது') 
                            : (language === 'en' ? 'Unavailable' : 'கிடைக்கவில்லை')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          {language === 'en' ? 'Edit' : 'திருத்து'}
                        </button>
                        <button
                          onClick={() => openDeleteModal(item)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {language === 'en' ? 'Delete' : 'நீக்கு'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {language === 'en' ? 'Previous' : 'முந்தையது'}
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {language === 'en' ? 'Next' : 'அடுத்தது'}
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {language === 'en' 
                      ? `Showing page ${currentPage} of ${totalPages}` 
                      : `பக்கம் ${currentPage} இல் ${totalPages} காட்டுகிறது`}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                        currentPage === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">{language === 'en' ? 'Previous' : 'முந்தையது'}</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-[#FF9933] border-[#FF9933] text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                        currentPage === totalPages 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">{language === 'en' ? 'Next' : 'அடுத்தது'}</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Menu Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-[#4A4A4A]">
                    {language === 'en' ? 'Add Menu Item' : 'மெனு பொருளைச் சேர்'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleAddItem}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'English Name' : 'ஆங்கில பெயர்'} *
                      </label>
                      <input
                        type="text"
                        name="name.en"
                        value={formData.name.en}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Tamil Name' : 'தமிழ் பெயர்'} *
                      </label>
                      <input
                        type="text"
                        name="name.ta"
                        value={formData.name.ta}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Price (LKR)' : 'விலை (LKR)'} *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Category' : 'வகை'} *
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'English Description' : 'ஆங்கில விளக்கம்'} *
                      </label>
                      <textarea
                        name="description.en"
                        value={formData.description.en}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Tamil Description' : 'தமிழ் விளக்கம்'} *
                      </label>
                      <textarea
                        name="description.ta"
                        value={formData.description.ta}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Ingredients (comma separated)' : 'உறுப்புகள் (கமாவால் பிரிக்கப்பட்டது)'}
                      </label>
                      <input
                        type="text"
                        name="ingredients"
                        value={formData.ingredients}
                        onChange={handleInputChange}
                        placeholder={language === 'en' ? "e.g., crab, coconut, spices" : "எ.கா., நண்டு, தேங்காய், மசாலாக்கள்"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Tags (comma separated)' : 'குறிச்சொற்கள் (கமாவால் பிரிக்கப்பட்டது)'}
                      </label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder={language === 'en' ? "e.g., Jaffna, spicy, traditional" : "எ.கா., யாழ், காரமான, பாரம்பரியமான"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Image' : 'படம்'}
                      </label>
                      <input
                        type="file"
                        name="image"
                        onChange={handleInputChange}
                        accept="image/*"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="availability"
                        checked={formData.availability}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-[#FF9933] focus:ring-[#FF9933] border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-[#4A4A4A]">
                        {language === 'en' ? 'Available' : 'கிடைக்கிறது'}
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-[#4A4A4A] font-medium hover:bg-gray-50"
                    >
                      {language === 'en' ? 'Cancel' : 'ரத்துசெய்'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#FF9933] hover:bg-[#E68A2E] text-white font-medium rounded-lg transition-colors duration-300"
                    >
                      {language === 'en' ? 'Add Item' : 'பொருளைச் சேர்'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Menu Item Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-[#4A4A4A]">
                    {language === 'en' ? 'Edit Menu Item' : 'மெனு பொருளைத் திருத்து'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                      setCurrentItem(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleEditItem}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'English Name' : 'ஆங்கில பெயர்'}
                      </label>
                      <input
                        type="text"
                        name="name.en"
                        value={formData.name.en}
                        onChange={handleInputChange}
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
                        value={formData.name.ta}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Price (LKR)' : 'விலை (LKR)'}
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Category' : 'வகை'}
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'English Description' : 'ஆங்கில விளக்கம்'}
                      </label>
                      <textarea
                        name="description.en"
                        value={formData.description.en}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Tamil Description' : 'தமிழ் விளக்கம்'}
                      </label>
                      <textarea
                        name="description.ta"
                        value={formData.description.ta}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Ingredients (comma separated)' : 'உறுப்புகள் (கமாவால் பிரிக்கப்பட்டது)'}
                      </label>
                      <input
                        type="text"
                        name="ingredients"
                        value={formData.ingredients}
                        onChange={handleInputChange}
                        placeholder={language === 'en' ? "e.g., crab, coconut, spices" : "எ.கா., நண்டு, தேங்காய், மசாலாக்கள்"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Tags (comma separated)' : 'குறிச்சொற்கள் (கமாவால் பிரிக்கப்பட்டது)'}
                      </label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder={language === 'en' ? "e.g., Jaffna, spicy, traditional" : "எ.கா., யாழ், காரமான, பாரம்பரியமான"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                        {language === 'en' ? 'Image' : 'படம்'}
                      </label>
                      <input
                        type="file"
                        name="image"
                        onChange={handleInputChange}
                        accept="image/*"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9933]"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="availability"
                        checked={formData.availability}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-[#FF9933] focus:ring-[#FF9933] border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-[#4A4A4A]">
                        {language === 'en' ? 'Available' : 'கிடைக்கிறது'}
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        resetForm();
                        setCurrentItem(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-[#4A4A4A] font-medium hover:bg-gray-50"
                    >
                      {language === 'en' ? 'Cancel' : 'ரத்துசெய்'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#FF9933] hover:bg-[#E68A2E] text-white font-medium rounded-lg transition-colors duration-300"
                    >
                      {language === 'en' ? 'Update Item' : 'பொருளைப் புதுப்பி'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                  <div className="mt-0 ml-4 text-center sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-bold text-[#4A4A4A]">
                      {language === 'en' ? 'Delete Menu Item' : 'மெனு பொருளை நீக்கு'}
                    </h3>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {language === 'en' 
                      ? `Are you sure you want to delete "${currentItem?.name[language]}"? This action cannot be undone.` 
                      : `"${currentItem?.name[language]}" ஐ நீக்க விரும்புகிறீர்களா? இந்த செயலை மீட்க முடியாது.`}
                  </p>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCurrentItem(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-[#4A4A4A] font-medium hover:bg-gray-50"
                  >
                    {language === 'en' ? 'Cancel' : 'ரத்துசெய்'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteItem}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-300"
                  >
                    {language === 'en' ? 'Delete' : 'நீக்கு'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMenu;