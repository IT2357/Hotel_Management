import Menu from '../models/Menu.js';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

/**
 * Save selected menu items from extracted menu to MenuItem collection
 * POST /api/menu-selection/save-selected
 */
export const saveSelectedItems = catchAsync(async (req, res) => {
  console.log('🔍 Save selected items request received');
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  
  const { menuId, selectedItems, categoryMappings = {} } = req.body;

  // Validation
  if (!menuId) {
    console.error('❌ Menu ID is missing');
    throw new AppError('Menu ID is required', 400);
  }

  if (!selectedItems || !Array.isArray(selectedItems)) {
    console.error('❌ Selected items is not an array:', selectedItems);
    throw new AppError('Selected items must be an array', 400);
  }

  if (selectedItems.length === 0) {
    console.error(' No items selected');
    throw new AppError('At least one item must be selected', 400);
  }

  console.log(` Processing ${selectedItems.length} selected items`);

  try {
    // Find the extracted menu
    const extractedMenu = await Menu.findById(menuId);
    if (!extractedMenu) {
      throw new AppError('Extracted menu not found', 404);
    }

    console.log(' Found extracted menu:', extractedMenu.title);

    const savedItems = [];
    const categoryCache = new Map();

    // Process each selected item
    for (const selectedItem of selectedItems) {
      const { categoryName, itemIndex, customizations = {} } = selectedItem;

      console.log(` Processing item: ${categoryName}[${itemIndex}]`);

      // Find the category in extracted menu
      const extractedCategory = extractedMenu.categories.find(cat => cat.name === categoryName);
      if (!extractedCategory) {
        console.warn(` Category "${categoryName}" not found in extracted menu`);
        continue;
      }

      // Find the item in the category
      const extractedItem = extractedCategory.items?.[itemIndex];
      if (!extractedItem) {
        console.warn(` Item at index ${itemIndex} not found in category "${categoryName}"`);
        continue;
      }

      console.log(' Found extracted item:', extractedItem.name);

      // Get or create category
      let categoryId;
      const mappedCategoryName = categoryMappings[categoryName] || categoryName;
      
      if (categoryCache.has(mappedCategoryName)) {
        categoryId = categoryCache.get(mappedCategoryName);
        console.log(' Using cached category ID:', categoryId);
      } else {
        console.log(' Looking for category:', mappedCategoryName);
        let category = await Category.findOne({ name: mappedCategoryName });

        if (!category) {
          console.log(' Creating new category:', mappedCategoryName);
          category = await Category.create({
            name: mappedCategoryName,
            slug: mappedCategoryName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-'),
            description: `${mappedCategoryName} items`
          });
          console.log(' Created category:', category._id);
          categoryId = category._id;
        } else {
          console.log(' Found existing category:', category._id);
          categoryId = category._id;
        }
        
        categoryCache.set(mappedCategoryName, categoryId);
      }

      // Prepare menu item data
      const menuItemData = {
        name: customizations.name || extractedItem.name,
        description: customizations.description || extractedItem.description || '',
        price: parseFloat(customizations.price || extractedItem.price || 0),
        category: categoryId,
        image: customizations.image || extractedItem.image || "https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item",
        imageId: extractedMenu.imageId || null,
        isAvailable: customizations.isAvailable !== false,
        isVeg: customizations.isVeg || extractedItem.isVeg || false,
        isSpicy: customizations.isSpicy || extractedItem.isSpicy || false,
        isPopular: customizations.isPopular || extractedItem.isPopular || false,
        ingredients: Array.isArray(customizations.ingredients) ? customizations.ingredients : (extractedItem.ingredients || []),
        nutritionalInfo: customizations.nutritionalInfo || extractedItem.nutritionalInfo || {},
        cookingTime: parseInt(customizations.cookingTime) || extractedItem.cookingTime || 15,
        dietaryTags: extractedItem.dietaryTags || [],
        allergens: extractedItem.allergens || []
      };

      console.log(' Creating menu item:', menuItemData.name);

      // Create menu item
      const menuItem = await MenuItem.create(menuItemData);
      savedItems.push(menuItem);

      console.log(' Created menu item:', menuItem._id);
    }

    console.log(` Successfully saved ${savedItems.length} menu items`);

    res.status(201).json({
      success: true,
      message: `Successfully saved ${savedItems.length} menu items to your restaurant menu`,
      data: {
        savedCount: savedItems.length,
        items: savedItems.map(item => ({
          id: item._id,
          name: item.name,
          price: item.price,
          category: item.category
        }))
      }
    });

  } catch (error) {
    console.error(' Error in saveSelectedItems:', error);
    throw error;
  }
});

/**
 * Get extracted menu with selection status
 * GET /api/menu-selection/:menuId
 */
export const getMenuForSelection = catchAsync(async (req, res) => {
  const { menuId } = req.params;

  const extractedMenu = await Menu.findById(menuId);
  if (!extractedMenu) {
    throw new AppError('Extracted menu not found', 404);
  }

  // Get existing categories for mapping
  const existingCategories = await Category.find({}).select('name slug');

  const menuData = {
    id: extractedMenu._id,
    title: extractedMenu.title,
    source: extractedMenu.source,
    categories: extractedMenu.categories.map(category => ({
      name: category.name,
      description: category.description,
      items: category.items.map((item, index) => ({
        index,
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image,
        isVeg: item.isVeg || false,
        isSpicy: item.isSpicy || false,
        isPopular: item.isPopular || false,
        ingredients: item.ingredients || [],
        cookingTime: item.cookingTime || 15,
        confidence: item.confidence || 85,
        aiMethod: item.aiMethod || 'unknown'
      }))
    })),
    extractionMethod: extractedMenu.extractionMethod,
    confidence: extractedMenu.confidence,
    imageUrl: extractedMenu.imageId ? `/api/menu/image/${extractedMenu.imageId}` : null,
    existingCategories: existingCategories.map(cat => ({
      name: cat.name,
      slug: cat.slug
    }))
  };

  res.status(200).json({
    success: true,
    message: 'Menu data retrieved successfully',
    data: menuData
  });
});

/**
 * Update item customizations in extracted menu
 * PUT /api/menu-selection/:menuId/item/:categoryName/:itemIndex
 */
export const updateItemCustomizations = catchAsync(async (req, res) => {
  const { menuId, categoryName, itemIndex } = req.params;
  const { customizations } = req.body;

  const extractedMenu = await Menu.findById(menuId);
  if (!extractedMenu) {
    throw new AppError('Extracted menu not found', 404);
  }

  // Find and update the item
  const categoryIndex = extractedMenu.categories.findIndex(cat => cat.name === categoryName);
  if (categoryIndex === -1) {
    throw new AppError('Category not found', 404);
  }

  const itemIdx = parseInt(itemIndex);
  if (itemIdx >= extractedMenu.categories[categoryIndex].items.length) {
    throw new AppError('Item not found', 404);
  }

  // Update item with customizations
  const item = extractedMenu.categories[categoryIndex].items[itemIdx];
  Object.assign(item, customizations);

  await extractedMenu.save();

  res.status(200).json({
    success: true,
    message: 'Item customizations updated successfully',
    data: item
  });
});

/**
 * Delete extracted menu after processing
 * DELETE /api/menu-selection/:menuId
 */
export const deleteExtractedMenu = catchAsync(async (req, res) => {
  const { menuId } = req.params;

  const extractedMenu = await Menu.findByIdAndDelete(menuId);
  if (!extractedMenu) {
    throw new AppError('Extracted menu not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Extracted menu deleted successfully'
  });
});

/**
 * Get selection statistics
 * GET /api/menu-selection/stats
 */
export const getSelectionStats = catchAsync(async (req, res) => {
  const totalExtractedMenus = await Menu.countDocuments();
  const totalMenuItems = await MenuItem.countDocuments();
  const totalCategories = await Category.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      totalExtractedMenus,
      totalMenuItems,
      totalCategories
    }
  });
});
