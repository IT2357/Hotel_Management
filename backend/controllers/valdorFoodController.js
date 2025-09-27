// 📁 backend/controllers/valdorFoodController.js
import Food from '../models/Food.js';
import AIMenuExtractor from '../services/aiMenuExtractor.js';
import ValdorScraper from '../services/valdorScraper.js';
import mongoose from 'mongoose';

/**
 * Get all Valdor food items with filtering and pagination
 */
export const getValdorFoods = async (req, res) => {
  try {
    const {
      category,
      search,
      dietary,
      minPrice,
      maxPrice,
      isAvailable,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ingredients: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (dietary) {
      filter.dietaryTags = { $in: [dietary] };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const foods = await Food.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalItems = await Food.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.json({
      success: true,
      data: {
        foods,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching Valdor foods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food items',
      error: error.message,
    });
  }
};

/**
 * Get single Valdor food item by ID
 */
export const getValdorFood = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid food item ID',
      });
    }

    const food = await Food.findById(id).lean();

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found',
      });
    }

    res.json({
      success: true,
      data: food,
    });

  } catch (error) {
    console.error('Error fetching food item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food item',
      error: error.message,
    });
  }
};

/**
 * Get food categories with item counts
 */
export const getValdorCategories = async (req, res) => {
  try {
    const categories = await Food.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          avgPrice: { $round: ['$avgPrice', 2] },
          minPrice: 1,
          maxPrice: 1,
          _id: 0
        }
      },
      {
        $sort: { category: 1 }
      }
    ]);

    res.json({
      success: true,
      data: categories,
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

/**
 * Create new Valdor food item (Admin only)
 */
export const createValdorFood = async (req, res) => {
  try {
    const foodData = req.body;

    // Validate required fields
    if (!foodData.name || !foodData.price || !foodData.category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and category are required',
      });
    }

    // Validate category
    const validCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverage', 'Dessert'];
    if (!validCategories.includes(foodData.category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Must be one of: ' + validCategories.join(', '),
      });
    }

    // Create new food item
    const food = new Food({
      ...foodData,
      sentimentBreakdown: foodData.sentimentBreakdown || { positive: 0, neutral: 0, negative: 0 }
    });

    await food.save();

    res.status(201).json({
      success: true,
      message: 'Food item created successfully',
      data: food,
    });

  } catch (error) {
    console.error('Error creating food item:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create food item',
      error: error.message,
    });
  }
};

/**
 * Update Valdor food item (Admin only)
 */
export const updateValdorFood = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid food item ID',
      });
    }

    // Validate category if provided
    if (updateData.category) {
      const validCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverage', 'Dessert'];
      if (!validCategories.includes(updateData.category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category. Must be one of: ' + validCategories.join(', '),
        });
      }
    }

    const food = await Food.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found',
      });
    }

    res.json({
      success: true,
      message: 'Food item updated successfully',
      data: food,
    });

  } catch (error) {
    console.error('Error updating food item:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update food item',
      error: error.message,
    });
  }
};

/**
 * Delete Valdor food item (Admin only)
 */
export const deleteValdorFood = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid food item ID',
      });
    }

    const food = await Food.findByIdAndDelete(id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found',
      });
    }

    res.json({
      success: true,
      message: 'Food item deleted successfully',
      data: food,
    });

  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete food item',
      error: error.message,
    });
  }
};

/**
 * Extract menu using AI (Admin only)
 */
export const extractValdorMenu = async (req, res) => {
  try {
    const { url, imagePath, imageUrl } = req.body;

    if (!url && !imagePath && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'URL, image path, or image URL is required',
      });
    }

    const extractor = new AIMenuExtractor();
    const input = url || imagePath || imageUrl;
    
    console.log('🤖 Starting AI menu extraction for:', input);
    
    const extractionResult = await extractor.extractMenu(input);

    // Save extracted items to database
    const savedItems = [];
    for (const item of extractionResult.items) {
      try {
        const food = new Food(item);
        await food.save();
        savedItems.push(food);
      } catch (saveError) {
        console.error('Error saving food item:', saveError);
        // Continue with other items
      }
    }

    res.json({
      success: true,
      message: `Successfully extracted and saved ${savedItems.length} food items`,
      data: {
        extractedItems: extractionResult.items.length,
        savedItems: savedItems.length,
        extractionMethod: extractionResult.extractionMethod,
        confidence: extractionResult.confidence,
        categories: extractionResult.categories,
        items: savedItems
      },
    });

  } catch (error) {
    console.error('Error extracting menu:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract menu',
      error: error.message,
    });
  }
};

/**
 * Scrape Valdor website and save to database (Admin only)
 */
export const scrapeValdorWebsite = async (req, res) => {
  try {
    console.log('🕷️ Starting Valdor website scraping...');
    
    const scraper = new ValdorScraper();
    const scrapedData = await scraper.scrapeFullMenu();

    // Save scraped items to database
    const savedItems = [];
    for (const item of scrapedData.items) {
      try {
        // Check if item already exists
        const existingFood = await Food.findOne({ 
          name: { $regex: new RegExp(item.name, 'i') },
          price: item.price 
        });

        if (!existingFood) {
          const food = new Food(item);
          await food.save();
          savedItems.push(food);
        } else {
          console.log(`Item already exists: ${item.name}`);
        }
      } catch (saveError) {
        console.error('Error saving food item:', saveError);
        // Continue with other items
      }
    }

    // Save scraped data for debugging
    await scraper.saveToFile(scrapedData);

    res.json({
      success: true,
      message: `Successfully scraped and saved ${savedItems.length} new food items`,
      data: {
        totalScraped: scrapedData.items.length,
        newItems: savedItems.length,
        categories: scrapedData.categories,
        metadata: scrapedData.metadata,
        items: savedItems
      },
    });

  } catch (error) {
    console.error('Error scraping Valdor website:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scrape website',
      error: error.message,
    });
  }
};

/**
 * Get food statistics
 */
export const getValdorStats = async (req, res) => {
  try {
    const stats = await Food.aggregate([
      {
        $facet: {
          totalItems: [{ $count: "count" }],
          categoryStats: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                avgPrice: { $avg: '$price' }
              }
            }
          ],
          priceStats: [
            {
              $group: {
                _id: null,
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
              }
            }
          ],
          availabilityStats: [
            {
              $group: {
                _id: '$isAvailable',
                count: { $sum: 1 }
              }
            }
          ],
          dietaryStats: [
            { $unwind: '$dietaryTags' },
            {
              $group: {
                _id: '$dietaryTags',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const result = stats[0];

    res.json({
      success: true,
      data: {
        totalItems: result.totalItems[0]?.count || 0,
        categories: result.categoryStats,
        priceRange: result.priceStats[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0 },
        availability: result.availabilityStats,
        dietaryTags: result.dietaryStats
      },
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

/**
 * Search foods with advanced filters
 */
export const searchValdorFoods = async (req, res) => {
  try {
    const { q, filters = {} } = req.body;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Build search pipeline
    const pipeline = [
      {
        $match: {
          $and: [
            {
              $or: [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { ingredients: { $in: [new RegExp(q, 'i')] } },
                { dietaryTags: { $in: [new RegExp(q, 'i')] } }
              ]
            }
          ]
        }
      }
    ];

    // Add filters
    if (filters.category) {
      pipeline[0].$match.$and.push({ category: filters.category });
    }

    if (filters.priceRange) {
      const priceFilter = {};
      if (filters.priceRange.min) priceFilter.$gte = filters.priceRange.min;
      if (filters.priceRange.max) priceFilter.$lte = filters.priceRange.max;
      pipeline[0].$match.$and.push({ price: priceFilter });
    }

    if (filters.dietary) {
      pipeline[0].$match.$and.push({ dietaryTags: { $in: filters.dietary } });
    }

    if (filters.isAvailable !== undefined) {
      pipeline[0].$match.$and.push({ isAvailable: filters.isAvailable });
    }

    // Add scoring for relevance
    pipeline.push({
      $addFields: {
        score: {
          $add: [
            { $cond: [{ $regexMatch: { input: '$name', regex: q, options: 'i' } }, 10, 0] },
            { $cond: [{ $regexMatch: { input: '$description', regex: q, options: 'i' } }, 5, 0] },
            { $multiply: [{ $size: { $filter: { input: '$ingredients', cond: { $regexMatch: { input: '$$this', regex: q, options: 'i' } } } } }, 2] }
          ]
        }
      }
    });

    // Sort by relevance
    pipeline.push({ $sort: { score: -1, name: 1 } });

    // Limit results
    pipeline.push({ $limit: 50 });

    const results = await Food.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        query: q,
        filters,
        results,
        count: results.length
      },
    });

  } catch (error) {
    console.error('Error searching foods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search foods',
      error: error.message,
    });
  }
};
