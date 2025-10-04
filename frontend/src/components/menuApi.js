import menuExtractionService from '../services/menuExtractionService';
import api from '../services/api';

const menuApi = {
  // Validate menu structure
  validateMenuStructure: (menuData) => {
    const errors = [];

    if (!menuData.title || !menuData.title.trim()) {
      errors.push('Menu title is required');
    }

    if (!menuData.categories || menuData.categories.length === 0) {
      errors.push('At least one category is required');
    }

    menuData.categories?.forEach((category, categoryIndex) => {
      if (!category.name || !category.name.trim()) {
        errors.push(`Category ${categoryIndex + 1} name is required`);
      }

      if (!category.items || category.items.length === 0) {
        errors.push(`Category "${category.name}" must have at least one item`);
      }

      category.items?.forEach((item, itemIndex) => {
        if (!item.name || !item.name.trim()) {
          errors.push(`Item ${itemIndex + 1} in "${category.name}" must have a name`);
        }

        if (!item.price || item.price <= 0) {
          errors.push(`Item "${item.name}" must have a valid price`);
        }
      });
    });

    return errors;
  },

  // Save menu to database
  saveMenu: async (menuData) => {
    try {
      // Use the menu extraction service to save to menu items
      const result = await menuExtractionService.saveToMenuItems(menuData);
      return result;
    } catch (error) {
      console.error('Error saving menu:', error);
      throw error;
    }
  },

  // Get image URL
  getImageUrl: (imageId) => {
    if (!imageId) return '';
    // Assuming images are served from the menu-extraction endpoint
    return `${api.defaults.baseURL}/menu-extraction/image/${imageId}`;
  }
};

export default menuApi;