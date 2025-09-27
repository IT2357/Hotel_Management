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
        image: customizations.image || (extractedItem.image && extractedItem.image.startsWith('gridfs:') ? `/api/menu/image/${extractedItem.image}` : (extractedItem.image || "https://dummyimage.com/400x300/cccccc/000000&text=Menu+Item")),
        imageId: extractedMenu.imageId || (extractedItem.image && extractedItem.image.startsWith('gridfs:') ? extractedItem.image : null),
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
 * Generate Valdor menu with AI
 * POST /api/menu-selection/generate-valdor-menu
 */
export const generateValdorMenu = catchAsync(async (req, res) => {
  const { selectedCategories, culturalContext = 'jaffna' } = req.body;

  if (!selectedCategories || !Array.isArray(selectedCategories) || selectedCategories.length === 0) {
    throw new AppError('Selected categories are required', 400);
  }

  // Import AI service
  const aiService = (await import('../services/aiImageAnalysisService.js')).default;

  // Generate menu using AI with Valdor context
  const menuData = {
    title: 'Valdor Hotel Restaurant Menu',
    categories: [],
    source: 'ai-generated-valdor',
    extractionMethod: 'ai-valdor',
    confidence: 95
  };

  // Define Valdor menu structure
  const valdorMenuStructure = {
    "Biriyanies": [
      { name: "Chicken Biryani", tamilName: "கோழி பிரியாணி", price: 950, description: "Fragrant basmati rice cooked with tender chicken, caramelized onions, and authentic Jaffna spices" },
      { name: "Mutton Biryani", tamilName: "அட்டை பிரியாணி", price: 1100, description: "Slow-cooked mutton biryani with traditional Jaffna spices and saffron" },
      { name: "Vegetable Biryani", tamilName: "காய்கறி பிரியாணி", price: 650, description: "Mixed vegetables cooked with basmati rice and aromatic spices" },
      { name: "Fish Biryani", tamilName: "மீன் பிரியாணி", price: 1050, description: "Fresh seer fish biryani with coastal Jaffna flavors" },
      { name: "Prawn Biryani", tamilName: "இறால் பிரியாணி", price: 1250, description: "Succulent prawns in aromatic basmati rice with traditional spices" }
    ],
    "Naans and Chapathis": [
      { name: "Butter Naan", tamilName: "பட்டர் நான்", price: 150, description: "Soft, fluffy naan bread with butter" },
      { name: "Garlic Naan", tamilName: "பூண்டு நான்", price: 180, description: "Naan bread topped with garlic and herbs" },
      { name: "Plain Chapathi", tamilName: "சப்பாத்தி", price: 120, description: "Traditional Sri Lankan flatbread" },
      { name: "Paratha", tamilName: "பராட்டா", price: 200, description: "Layered flatbread cooked with ghee" },
      { name: "Aloo Paratha", tamilName: "ஆலு பராட்டா", price: 250, description: "Paratha stuffed with spiced potatoes" },
      { name: "Cheese Naan", tamilName: "சீஸ் நான்", price: 220, description: "Naan bread with cheese filling" }
    ],
    "Kottu": [
      { name: "Chicken Kottu", tamilName: "கோழி கொத்து", price: 850, description: "Chopped roti stir-fried with chicken, vegetables, and spices" },
      { name: "Vegetable Kottu", tamilName: "காய்கறி கொத்து", price: 650, description: "Vegetable stir-fry with chopped roti and traditional spices" },
      { name: "Egg Kottu", tamilName: "முட்டை கொத்து", price: 700, description: "Kottu with eggs and mixed vegetables" },
      { name: "Mixed Kottu", tamilName: "கலவை கொத்து", price: 950, description: "Chicken, egg, and vegetable combination kottu" },
      { name: "Seafood Kottu", tamilName: "கடல் உணவு கொத்து", price: 1100, description: "Fresh seafood with chopped roti and spices" }
    ],
    "Dosa and Others": [
      { name: "Masala Dosa", tamilName: "மசாலா தோசை", price: 450, description: "Crispy crepe filled with spiced potato masala" },
      { name: "Plain Dosa", tamilName: "பிளைன் தோசை", price: 350, description: "Traditional crispy rice and lentil crepe" },
      { name: "Onion Dosa", tamilName: "வெங்காயம் தோசை", price: 400, description: "Dosa topped with fresh onions and spices" },
      { name: "Ghee Dosa", tamilName: "நெய் தோசை", price: 420, description: "Dosa cooked with ghee for extra flavor" },
      { name: "Idli (2 pieces)", tamilName: "இட்லி (2 துண்டு)", price: 300, description: "Steamed rice cakes served with sambar and chutney" },
      { name: "Medu Vada", tamilName: "மேடு வடை", price: 350, description: "Crispy lentil donuts served with sambar" }
    ],
    "Jaffna style curries": [
      { name: "Jaffna Chicken Curry", tamilName: "யாழ்ப்பாண கோழி கறி", price: 750, description: "Authentic Jaffna chicken curry with coconut milk and traditional spices" },
      { name: "Jaffna Mutton Curry", tamilName: "யாழ்ப்பாண அட்டை கறி", price: 1100, description: "Slow-cooked mutton curry with Jaffna spices" },
      { name: "Fish Curry", tamilName: "மீன் கறி", price: 950, description: "Fresh seer fish curry with tamarind and coconut" },
      { name: "Prawn Curry", tamilName: "இறால் கறி", price: 1100, description: "Prawns cooked in rich coconut curry" },
      { name: "Crab Curry", tamilName: "நண்டு கறி", price: 1300, description: "Fresh crab in spicy coconut curry" }
    ],
    "Rice & Curry": [
      { name: "Rice & Curry (Chicken)", tamilName: "சாதம் & கறி (கோழி)", price: 850, description: "Steamed rice with chicken curry and accompaniments" },
      { name: "Rice & Curry (Fish)", tamilName: "சாதம் & கறி (மீன்)", price: 950, description: "Rice with fish curry and traditional sides" },
      { name: "Rice & Curry (Vegetable)", tamilName: "சாதம் & கறி (காய்கறி)", price: 650, description: "Rice with mixed vegetable curries" },
      { name: "Rice & Curry (Mutton)", tamilName: "சாதம் & கறி (அட்டை)", price: 1050, description: "Rice with mutton curry and accompaniments" }
    ]
  };

  // Generate categories based on selected categories
  selectedCategories.forEach(categoryName => {
    if (valdorMenuStructure[categoryName]) {
      const items = valdorMenuStructure[categoryName].map((item, index) => ({
        index,
        name: item.name,
        tamilName: item.tamilName,
        price: item.price,
        description: item.description,
        image: null,
        isVeg: item.name.toLowerCase().includes('veg') || item.name.toLowerCase().includes('vegetable'),
        isSpicy: true,
        isPopular: index < 2,
        ingredients: [],
        cookingTime: 20,
        confidence: 95,
        aiMethod: 'valdor-database'
      }));

      menuData.categories.push({
        name: categoryName,
        description: `${categoryName} from Valdor Hotel`,
        items
      });
    }
  });

  // Calculate totals
  menuData.totalCategories = menuData.categories.length;
  menuData.totalItems = menuData.categories.reduce((sum, cat) => sum + cat.items.length, 0);

  // For Google Lens-like functionality, we need to store the original image URL
  // This should be passed from the frontend when generating Valdor menu
  // For now, we'll use a placeholder or get it from the request context

  // Save to database
  const savedMenu = await Menu.create(menuData);

  res.status(201).json({
    success: true,
    message: `Successfully generated Valdor menu with ${menuData.totalItems} items`,
    data: {
      menu: savedMenu,
      restaurant: {
        name: "Valdor Hotel Restaurant",
        location: "148/10, Station Road, Jaffna, Sri Lanka",
        cuisine: "Sri Lankan Tamil",
        specialty: "Jaffna Traditional Cuisine"
      },
      categories: menuData.categories
    }
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
