import MenuItem from '../models/MenuItem.js';
import mongoose from 'mongoose';

/**
 * Service for Restaurant Menu Management (Phase 8)
 * Handles multi-tenant scoped menu item CRUD, categories,
 * dietary flags (veg/non-veg), pricing, and availability toggles.
 */

export const DEFAULT_CATEGORIES = [
  'Starters',
  'Main Course',
  'Rice & Biryani',
  'Breads',
  'Beverages',
  'Desserts',
  'Snacks',
];

/**
 * Retrieves all menu items for the restaurant tenant with optional filters
 */
export const getMenuItems = async (restaurantId, query = {}) => {
  const filter = { restaurantId };

  // Category filter
  if (query.category && query.category !== 'ALL') {
    filter.category = query.category;
  }

  // Dietary filter (veg / non-veg)
  if (query.isVegetarian !== undefined && query.isVegetarian !== '' && query.isVegetarian !== 'ALL') {
    filter.isVegetarian = query.isVegetarian === 'true' || query.isVegetarian === true;
  }

  // Availability filter
  if (query.isAvailable !== undefined && query.isAvailable !== '' && query.isAvailable !== 'ALL') {
    filter.isAvailable = query.isAvailable === 'true' || query.isAvailable === true;
  }

  // Active / Deactivated filter (defaults to active items only unless specified)
  if (query.isActive !== undefined && query.isActive !== '') {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  } else {
    filter.isActive = true;
  }

  // Search keyword (name or description)
  if (query.search) {
    const cleanSearch = String(query.search).trim();
    if (cleanSearch) {
      filter.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { description: { $regex: cleanSearch, $options: 'i' } },
      ];
    }
  }

  // Price range bounds
  if (query.minPrice !== undefined && query.minPrice !== '') {
    const minP = parseFloat(query.minPrice);
    if (!isNaN(minP)) {
      filter.price = { ...filter.price, $gte: minP };
    }
  }
  if (query.maxPrice !== undefined && query.maxPrice !== '') {
    const maxP = parseFloat(query.maxPrice);
    if (!isNaN(maxP)) {
      filter.price = { ...filter.price, $lte: maxP };
    }
  }

  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });

  // Compute tenant-level summary metrics
  const allTenantItems = await MenuItem.find({ restaurantId, isActive: true });
  const distinctCategories = Array.from(new Set(allTenantItems.map((item) => item.category))).filter(Boolean);

  const summary = {
    total: allTenantItems.length,
    availableCount: allTenantItems.filter((i) => i.isAvailable).length,
    unavailableCount: allTenantItems.filter((i) => !i.isAvailable).length,
    vegCount: allTenantItems.filter((i) => i.isVegetarian).length,
    nonVegCount: allTenantItems.filter((i) => !i.isVegetarian).length,
    categories: distinctCategories.length > 0 ? distinctCategories : DEFAULT_CATEGORIES,
  };

  return { items, summary };
};

/**
 * Retrieves a single menu item by ID
 */
export const getMenuItemById = async (restaurantId, itemId) => {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    const error = new Error('Invalid menu item ID');
    error.statusCode = 400;
    throw error;
  }

  const item = await MenuItem.findOne({ _id: itemId, restaurantId });
  if (!item) {
    const error = new Error('Menu item not found or belongs to another tenant');
    error.statusCode = 404;
    throw error;
  }

  return item;
};

/**
 * Create a new menu item for the restaurant tenant
 */
export const createMenuItem = async (restaurantId, data) => {
  const name = String(data.name || '').trim();
  const category = String(data.category || '').trim();
  const price = parseFloat(data.price);
  const prepTime = parseInt(data.preparationTime, 10);

  if (!name) {
    const error = new Error('Menu item name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!category) {
    const error = new Error('Menu item category is required');
    error.statusCode = 400;
    throw error;
  }

  if (isNaN(price) || price < 0) {
    const error = new Error('Valid price (0 or greater) is required');
    error.statusCode = 400;
    throw error;
  }

  if (data.preparationTime !== undefined && (isNaN(prepTime) || prepTime < 1)) {
    const error = new Error('Preparation time must be at least 1 minute');
    error.statusCode = 400;
    throw error;
  }

  // Prevent duplicate item name within this restaurant
  const existing = await MenuItem.findOne({
    restaurantId,
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    isActive: true,
  });

  if (existing) {
    const error = new Error(`A menu item named "${name}" already exists in your restaurant`);
    error.statusCode = 409;
    throw error;
  }

  const newItem = await MenuItem.create({
    restaurantId,
    name,
    description: String(data.description || '').trim(),
    category,
    price,
    image: data.image || null,
    isVegetarian: data.isVegetarian !== undefined ? Boolean(data.isVegetarian) : true,
    isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) : true,
    preparationTime: prepTime || 15,
    isActive: true,
  });

  return newItem;
};

/**
 * Update an existing menu item
 */
export const updateMenuItem = async (restaurantId, itemId, data) => {
  const item = await getMenuItemById(restaurantId, itemId);

  // If renaming, verify unique within tenant
  if (data.name !== undefined) {
    const newName = String(data.name).trim();
    if (!newName) {
      const error = new Error('Menu item name cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    if (newName.toLowerCase() !== item.name.toLowerCase()) {
      const existing = await MenuItem.findOne({
        restaurantId,
        _id: { $ne: itemId },
        name: { $regex: new RegExp(`^${newName}$`, 'i') },
        isActive: true,
      });

      if (existing) {
        const error = new Error(`A menu item named "${newName}" already exists in your restaurant`);
        error.statusCode = 409;
        throw error;
      }
      item.name = newName;
    }
  }

  if (data.category !== undefined) {
    const cat = String(data.category).trim();
    if (!cat) {
      const error = new Error('Category cannot be empty');
      error.statusCode = 400;
      throw error;
    }
    item.category = cat;
  }

  if (data.price !== undefined) {
    const price = parseFloat(data.price);
    if (isNaN(price) || price < 0) {
      const error = new Error('Price cannot be negative');
      error.statusCode = 400;
      throw error;
    }
    item.price = price;
  }

  if (data.description !== undefined) {
    item.description = String(data.description).trim();
  }

  if (data.image !== undefined) {
    item.image = data.image;
  }

  if (data.isVegetarian !== undefined) {
    item.isVegetarian = Boolean(data.isVegetarian);
  }

  if (data.isAvailable !== undefined) {
    item.isAvailable = Boolean(data.isAvailable);
  }

  if (data.preparationTime !== undefined) {
    const prep = parseInt(data.preparationTime, 10);
    if (isNaN(prep) || prep < 1) {
      const error = new Error('Preparation time must be at least 1 minute');
      error.statusCode = 400;
      throw error;
    }
    item.preparationTime = prep;
  }

  if (data.isActive !== undefined) {
    item.isActive = Boolean(data.isActive);
  }

  await item.save();
  return item;
};

/**
 * Toggle menu item availability (e.g., item runs out of stock or returns)
 */
export const toggleAvailability = async (restaurantId, itemId, isAvailable) => {
  const item = await getMenuItemById(restaurantId, itemId);
  item.isAvailable = isAvailable !== undefined ? Boolean(isAvailable) : !item.isAvailable;
  await item.save();
  return item;
};

/**
 * Delete or deactivate menu item
 */
export const deleteMenuItem = async (restaurantId, itemId, forceHardDelete = false) => {
  const item = await getMenuItemById(restaurantId, itemId);

  if (forceHardDelete) {
    await MenuItem.deleteOne({ _id: itemId, restaurantId });
    return { deleted: true, itemId, mode: 'hard' };
  }

  // Soft delete / deactivate
  item.isActive = false;
  item.isAvailable = false;
  await item.save();

  return { deleted: true, itemId, mode: 'soft', item };
};
