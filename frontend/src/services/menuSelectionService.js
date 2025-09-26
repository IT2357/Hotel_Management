import api from './api';

class MenuSelectionService {
  /**
   * Get extracted menu for selection
   * @param {string} menuId - The extracted menu ID
   * @returns {Promise} API response
   */
  async getMenuForSelection(menuId) {
    try {
      const response = await api.get(`/menu-selection/${menuId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching menu for selection:', error);
      throw error;
    }
  }

  /**
   * Save selected items to MenuItem collection
   * @param {string} menuId - The extracted menu ID
   * @param {Array} selectedItems - Array of selected items
   * @param {Object} categoryMappings - Category name mappings
   * @returns {Promise} API response
   */
  async saveSelectedItems(menuId, selectedItems, categoryMappings = {}) {
    try {
      const response = await api.post('/menu-selection/save-selected', {
        menuId,
        selectedItems,
        categoryMappings
      });
      return response.data;
    } catch (error) {
      console.error('Error saving selected items:', error);
      throw error;
    }
  }

  /**
   * Update item customizations
   * @param {string} menuId - The extracted menu ID
   * @param {string} categoryName - Category name
   * @param {number} itemIndex - Item index in category
   * @param {Object} customizations - Item customizations
   * @returns {Promise} API response
   */
  async updateItemCustomizations(menuId, categoryName, itemIndex, customizations) {
    try {
      const response = await api.put(
        `/menu-selection/${menuId}/item/${encodeURIComponent(categoryName)}/${itemIndex}`,
        customizations
      );
      return response.data;
    } catch (error) {
      console.error('Error updating item customizations:', error);
      throw error;
    }
  }

  /**
   * Delete extracted menu
   * @param {string} menuId - The extracted menu ID
   * @returns {Promise} API response
   */
  async deleteExtractedMenu(menuId) {
    try {
      const response = await api.delete(`/menu-selection/${menuId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting extracted menu:', error);
      throw error;
    }
  }

  /**
   * Get menu selection statistics
   * @returns {Promise} API response
   */
  async getSelectionStats() {
    try {
      const response = await api.get('/menu-selection/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching selection stats:', error);
      throw error;
    }
  }

  /**
   * Get all extracted menus (for admin dashboard)
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getExtractedMenus(params = {}) {
    try {
      const response = await api.get('/uploadMenu/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching extracted menus:', error);
      throw error;
    }
  }

  /**
   * Upload and extract menu
   * @param {FormData|Object} data - Upload data (file, URL, or path)
   * @returns {Promise} API response
   */
  async uploadAndExtract(data) {
    try {
      const response = await api.post('/uploadMenu/upload', data, {
        headers: {
          'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading and extracting menu:', error);
      throw error;
    }
  }

  /**
   * Validate URL before processing
   * @param {string} url - URL to validate
   * @returns {Promise} API response
   */
  async validateUrl(url) {
    try {
      const response = await api.post('/uploadMenu/validate-url', { url });
      return response.data;
    } catch (error) {
      console.error('Error validating URL:', error);
      throw error;
    }
  }

  /**
   * Upload image for menu extraction
   * @param {File} file - Image file
   * @returns {Promise} API response
   */
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/uploadMenu/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Get menu image URL
   * @param {string} imageId - Image ID
   * @returns {string} Image URL
   */
  getImageUrl(imageId) {
    if (!imageId) return null;
    return `${api.defaults.baseURL}/menu/image/${imageId}`;
  }

  /**
   * Format menu data for display
   * @param {Object} menuData - Raw menu data
   * @returns {Object} Formatted menu data
   */
  formatMenuData(menuData) {
    if (!menuData) return null;

    return {
      ...menuData,
      categories: menuData.categories?.map(category => ({
        ...category,
        items: category.items?.map((item, index) => ({
          ...item,
          index,
          selected: false,
          imageUrl: item.image || this.getImageUrl(menuData.imageId),
          formattedPrice: typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : item.price,
          customizations: {
            name: item.name,
            description: item.description || '',
            price: item.price,
            isAvailable: true,
            isVeg: false,
            isSpicy: false,
            isPopular: false,
            ...item.customizations
          }
        })) || []
      })) || []
    };
  }

  /**
   * Calculate selection summary
   * @param {Array} selectedItems - Selected items array
   * @param {Object} menuData - Menu data
   * @returns {Object} Selection summary
   */
  getSelectionSummary(selectedItems, menuData) {
    if (!selectedItems || !menuData) {
      return {
        totalSelected: 0,
        totalItems: 0,
        categoriesWithSelection: 0,
        totalCategories: 0,
        estimatedValue: 0
      };
    }

    const totalItems = menuData.categories?.reduce((sum, cat) => sum + (cat.items?.length || 0), 0) || 0;
    const totalCategories = menuData.categories?.length || 0;
    
    const categoriesWithSelection = new Set(
      selectedItems.map(item => item.categoryName)
    ).size;

    const estimatedValue = selectedItems.reduce((sum, selectedItem) => {
      const category = menuData.categories?.find(cat => cat.name === selectedItem.categoryName);
      const item = category?.items?.[selectedItem.itemIndex];
      return sum + (typeof item?.price === 'number' ? item.price : 0);
    }, 0);

    return {
      totalSelected: selectedItems.length,
      totalItems,
      categoriesWithSelection,
      totalCategories,
      estimatedValue
    };
  }

  /**
   * Export selected items data
   * @param {Array} selectedItems - Selected items
   * @param {Object} menuData - Menu data
   * @returns {Object} Export data
   */
  exportSelectionData(selectedItems, menuData) {
    const items = selectedItems.map(selectedItem => {
      const category = menuData.categories?.find(cat => cat.name === selectedItem.categoryName);
      const item = category?.items?.[selectedItem.itemIndex];
      
      return {
        categoryName: selectedItem.categoryName,
        itemIndex: selectedItem.itemIndex,
        name: item?.name,
        description: item?.description,
        price: item?.price,
        customizations: item?.customizations,
        image: item?.image
      };
    });

    return {
      menuId: menuData.id,
      extractionMethod: menuData.extractionMethod,
      confidence: menuData.confidence,
      selectedItems: items,
      summary: this.getSelectionSummary(selectedItems, menuData),
      exportDate: new Date().toISOString()
    };
  }
}

export default new MenuSelectionService();
