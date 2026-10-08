import Order from '../models/Order.js';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import mongoose from 'mongoose';

/**
 * Service for Restaurant Order Management (Phase 9)
 * Handles table-based ordering, adding/updating/removing items,
 * enforcing menu availability rules, calculating subtotals/tax/discounts,
 * and synchronizing table occupancy states.
 */

export const ORDER_STATUSES = [
  'NEW',
  'PLACED',
  'PREPARING',
  'READY',
  'SERVED',
  'COMPLETED',
  'CANCELLED',
];

export const ACTIVE_ORDER_STATUSES = [
  'NEW',
  'PLACED',
  'PREPARING',
  'READY',
  'SERVED',
];

/**
 * Helper to calculate subtotal, tax, discount, and total
 */
export const calculateOrderTotals = (items = [], taxRatePercent = 5, discount = 0) => {
  const subtotal = items.reduce((sum, item) => {
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const price = Math.max(0, parseFloat(item.price) || 0);
    return sum + price * qty;
  }, 0);

  const cleanDiscount = Math.min(Math.max(parseFloat(discount) || 0, 0), subtotal);
  const taxableAmount = Math.max(0, subtotal - cleanDiscount);
  const cleanTaxRate = Math.max(0, parseFloat(taxRatePercent) || 0);
  const tax = Math.round(taxableAmount * (cleanTaxRate / 100) * 100) / 100;
  const total = Math.round((taxableAmount + tax) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(cleanDiscount * 100) / 100,
    tax,
    total,
  };
};

/**
 * Generate human-readable order number (e.g. ORD-1082)
 */
const generateOrderNumber = () => {
  const now = new Date();
  const timePart = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `ORD-${timePart}-${randomSuffix}`;
};

/**
 * Create a new table order
 */
export const createOrder = async (restaurantId, data) => {
  const { tableId, items = [], notes = '', customerId = null, discount = 0 } = data;

  if (!tableId || !mongoose.Types.ObjectId.isValid(tableId)) {
    const error = new Error('A valid Table ID is required for table ordering');
    error.statusCode = 400;
    throw error;
  }

  // 1. Verify table exists and belongs to this tenant
  const table = await Table.findOne({ _id: tableId, restaurantId });
  if (!table) {
    const error = new Error('Table not found or belongs to another restaurant tenant');
    error.statusCode = 404;
    throw error;
  }

  if (table.isActive === false) {
    const error = new Error(`Table ${table.tableNumber} is currently inactive and cannot take orders`);
    error.statusCode = 400;
    throw error;
  }

  // 2. Retrieve restaurant settings for tax rate
  const restaurant = await Restaurant.findById(restaurantId).select('settings');
  const taxRate = restaurant?.settings?.taxRatePercent ?? 5;

  // 3. Process items snapshot & enforce availability rule
  const validatedItems = [];
  for (const itemInput of items) {
    if (!itemInput.menuItemId || !mongoose.Types.ObjectId.isValid(itemInput.menuItemId)) {
      const error = new Error('Each order item must specify a valid menuItemId');
      error.statusCode = 400;
      throw error;
    }

    const menuItem = await MenuItem.findOne({
      _id: itemInput.menuItemId,
      restaurantId,
    });

    if (!menuItem) {
      const error = new Error('Menu item not found in this restaurant');
      error.statusCode = 404;
      throw error;
    }

    // PRD Critical Rule: Unavailable menu items cannot be added to new orders
    if (!menuItem.isAvailable || menuItem.isActive === false) {
      const error = new Error(
        `"${menuItem.name}" is currently unavailable or sold out and cannot be added to an order.`
      );
      error.statusCode = 400;
      throw error;
    }

    const qty = Math.max(1, parseInt(itemInput.quantity, 10) || 1);
    validatedItems.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: qty,
      notes: String(itemInput.notes || '').trim(),
    });
  }

  // 4. Calculate totals
  const totals = calculateOrderTotals(validatedItems, taxRate, discount);

  // 5. Create the Order
  const order = await Order.create({
    restaurantId,
    orderNumber: generateOrderNumber(),
    tableId,
    customerId: customerId && mongoose.Types.ObjectId.isValid(customerId) ? customerId : null,
    items: validatedItems,
    notes: String(notes || '').trim(),
    taxRate,
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total,
    status: 'PLACED',
    paymentStatus: 'PENDING',
  });

  // 6. Update Table Behavior: Available -> Occupied, set currentOrderId
  table.status = 'OCCUPIED';
  table.currentOrderId = order._id;
  await table.save();

  return order;
};

/**
 * Retrieve orders for the restaurant tenant with filters
 */
export const getOrders = async (restaurantId, query = {}) => {
  const filter = { restaurantId };

  if (query.status && query.status !== 'ALL') {
    filter.status = query.status.toUpperCase();
  }

  if (query.activeOnly === 'true' || query.activeOnly === true) {
    filter.status = { $in: ACTIVE_ORDER_STATUSES };
  }

  if (query.tableId && mongoose.Types.ObjectId.isValid(query.tableId)) {
    filter.tableId = query.tableId;
  }

  if (query.paymentStatus && query.paymentStatus !== 'ALL') {
    filter.paymentStatus = query.paymentStatus.toUpperCase();
  }

  if (query.search) {
    const cleanSearch = String(query.search).trim();
    if (cleanSearch) {
      filter.$or = [
        { orderNumber: { $regex: cleanSearch, $options: 'i' } },
        { notes: { $regex: cleanSearch, $options: 'i' } },
        { 'items.name': { $regex: cleanSearch, $options: 'i' } },
      ];
    }
  }

  const orders = await Order.find(filter)
    .populate('tableId', 'tableNumber section capacity status')
    .populate('customerId', 'name phone email')
    .sort({ createdAt: -1 });

  // Compute operational order summary
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const allTenantOrders = await Order.find({ restaurantId });
  const todaysOrders = allTenantOrders.filter((o) => new Date(o.createdAt) >= startOfDay);
  const activeOrders = allTenantOrders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status));

  const summary = {
    total: allTenantOrders.length,
    activeCount: activeOrders.length,
    todayCount: todaysOrders.length,
    todaySales: todaysOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.total || 0), 0),
  };

  return { orders, summary };
};

/**
 * Retrieve a single order by ID
 */
export const getOrderById = async (restaurantId, orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error('Invalid order ID');
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findOne({ _id: orderId, restaurantId })
    .populate('tableId', 'tableNumber section capacity status')
    .populate('customerId', 'name phone email');

  if (!order) {
    const error = new Error('Order not found or belongs to another tenant');
    error.statusCode = 404;
    throw error;
  }

  return order;
};

/**
 * Get active order for a specific table
 */
export const getActiveOrderByTable = async (restaurantId, tableId) => {
  if (!mongoose.Types.ObjectId.isValid(tableId)) {
    const error = new Error('Invalid table ID');
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findOne({
    restaurantId,
    tableId,
    status: { $in: ACTIVE_ORDER_STATUSES },
  })
    .populate('tableId', 'tableNumber section capacity status')
    .populate('customerId', 'name phone email');

  return order;
};

/**
 * Add a menu item to an active order
 */
export const addItemToOrder = async (restaurantId, orderId, data) => {
  const order = await getOrderById(restaurantId, orderId);

  if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
    const error = new Error(`Cannot add items to an order with status "${order.status}"`);
    error.statusCode = 400;
    throw error;
  }

  const { menuItemId, quantity = 1, notes = '' } = data;
  if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
    const error = new Error('Valid menuItemId is required');
    error.statusCode = 400;
    throw error;
  }

  const menuItem = await MenuItem.findOne({ _id: menuItemId, restaurantId });
  if (!menuItem) {
    const error = new Error('Menu item not found');
    error.statusCode = 404;
    throw error;
  }

  // PRD Critical Rule: Unavailable menu items cannot be added to orders
  if (!menuItem.isAvailable || menuItem.isActive === false) {
    const error = new Error(
      `"${menuItem.name}" is currently sold out and cannot be added.`
    );
    error.statusCode = 400;
    throw error;
  }

  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  // Check if item already exists in order
  const existingItemIndex = order.items.findIndex(
    (i) => String(i.menuItemId) === String(menuItemId) && (!notes || i.notes === notes)
  );

  if (existingItemIndex > -1) {
    order.items[existingItemIndex].quantity += qty;
  } else {
    order.items.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: qty,
      notes: String(notes || '').trim(),
    });
  }

  // Recalculate totals
  const totals = calculateOrderTotals(order.items, order.taxRate, order.discount);
  order.subtotal = totals.subtotal;
  order.tax = totals.tax;
  order.total = totals.total;

  await order.save();
  return order;
};

/**
 * Update quantity or notes of an item in the order
 */
export const updateOrderItem = async (restaurantId, orderId, itemId, data) => {
  const order = await getOrderById(restaurantId, orderId);

  if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
    const error = new Error(`Cannot modify items on an order with status "${order.status}"`);
    error.statusCode = 400;
    throw error;
  }

  const targetItem = order.items.id(itemId);
  if (!targetItem) {
    const error = new Error('Item not found in this order');
    error.statusCode = 404;
    throw error;
  }

  if (data.quantity !== undefined) {
    const qty = parseInt(data.quantity, 10);
    if (qty <= 0) {
      // Remove item if quantity reduced to 0
      targetItem.deleteOne();
    } else {
      targetItem.quantity = qty;
    }
  }

  if (data.notes !== undefined) {
    targetItem.notes = String(data.notes || '').trim();
  }

  // Recalculate totals
  const totals = calculateOrderTotals(order.items, order.taxRate, order.discount);
  order.subtotal = totals.subtotal;
  order.tax = totals.tax;
  order.total = totals.total;

  await order.save();
  return order;
};

/**
 * Remove an item from the order
 */
export const removeOrderItem = async (restaurantId, orderId, itemId) => {
  const order = await getOrderById(restaurantId, orderId);

  if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
    const error = new Error(`Cannot remove items from an order with status "${order.status}"`);
    error.statusCode = 400;
    throw error;
  }

  const targetItem = order.items.id(itemId);
  if (!targetItem) {
    const error = new Error('Item not found in this order');
    error.statusCode = 404;
    throw error;
  }

  targetItem.deleteOne();

  // Recalculate totals
  const totals = calculateOrderTotals(order.items, order.taxRate, order.discount);
  order.subtotal = totals.subtotal;
  order.tax = totals.tax;
  order.total = totals.total;

  await order.save();
  return order;
};

/**
 * Update order status (NEW/PLACED -> PREPARING -> READY -> SERVED -> COMPLETED / CANCELLED)
 */
export const updateOrderStatus = async (restaurantId, orderId, status) => {
  const order = await getOrderById(restaurantId, orderId);
  const normalizedStatus = String(status || '').toUpperCase();

  if (!ORDER_STATUSES.includes(normalizedStatus)) {
    const error = new Error(
      `Invalid order status "${status}". Allowed: ${ORDER_STATUSES.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  order.status = normalizedStatus;

  // If order is cancelled, release table reference if no other orders exist
  if (normalizedStatus === 'CANCELLED') {
    const table = await Table.findOne({ _id: order.tableId, restaurantId });
    if (table && String(table.currentOrderId) === String(order._id)) {
      table.currentOrderId = null;
      table.status = 'AVAILABLE';
      await table.save();
    }
  }

  await order.save();
  return order;
};

/**
 * Update order discount, notes, or details
 */
export const updateOrderDetails = async (restaurantId, orderId, data) => {
  const order = await getOrderById(restaurantId, orderId);

  if (data.notes !== undefined) {
    order.notes = String(data.notes).trim();
  }

  if (data.discount !== undefined) {
    const disc = parseFloat(data.discount);
    if (isNaN(disc) || disc < 0) {
      const error = new Error('Discount must be a valid number of 0 or greater');
      error.statusCode = 400;
      throw error;
    }
    order.discount = disc;
  }

  // Recalculate totals
  const totals = calculateOrderTotals(order.items, order.taxRate, order.discount);
  order.subtotal = totals.subtotal;
  order.discount = totals.discount;
  order.tax = totals.tax;
  order.total = totals.total;

  await order.save();
  return order;
};
