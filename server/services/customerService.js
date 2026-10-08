import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Reservation from '../models/Reservation.js';
import QueueEntry from '../models/QueueEntry.js';

/**
 * Create or reuse an existing customer profile by phone number.
 */
export const createCustomer = async (tenantId, customerData) => {
  const { name, phone, email, notes } = customerData;

  if (!name || !phone) {
    const error = new Error('Customer name and phone number are required.');
    error.statusCode = 400;
    throw error;
  }

  const cleanPhone = phone.trim();
  const cleanName = name.trim();

  // Deduplication check: check if phone already registered in this restaurant
  let existingCustomer = await Customer.findOne({
    restaurantId: tenantId,
    phone: cleanPhone,
  });

  if (existingCustomer) {
    // Update name/email/notes if supplied, without creating a duplicate record
    if (cleanName && cleanName !== existingCustomer.name) {
      existingCustomer.name = cleanName;
    }
    if (email) {
      existingCustomer.email = email.trim().toLowerCase();
    }
    if (notes) {
      existingCustomer.notes = notes.trim();
    }
    await existingCustomer.save();
    return { customer: existingCustomer, isExisting: true };
  }

  const newCustomer = new Customer({
    restaurantId: tenantId,
    name: cleanName,
    phone: cleanPhone,
    email: email ? email.trim().toLowerCase() : null,
    visitCount: 1,
    totalSpent: 0,
    lastVisit: new Date(),
    notes: notes ? notes.trim() : '',
  });

  await newCustomer.save();
  return { customer: newCustomer, isExisting: false };
};

/**
 * Query customer directory with search and categorization filters.
 */
export const getCustomers = async (tenantId, params = {}) => {
  const query = { restaurantId: tenantId };

  if (params.search) {
    const searchRegex = new RegExp(params.search.trim(), 'i');
    query.$or = [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { notes: searchRegex },
    ];
  }

  if (params.filter === 'FREQUENT') {
    query.visitCount = { $gt: 1 };
  } else if (params.filter === 'VIP') {
    query.totalSpent = { $gte: 2000 };
  }

  let sortOption = { lastVisit: -1 };
  if (params.sortBy === 'visits') {
    sortOption = { visitCount: -1 };
  } else if (params.sortBy === 'spent') {
    sortOption = { totalSpent: -1 };
  } else if (params.sortBy === 'name') {
    sortOption = { name: 1 };
  }

  const customers = await Customer.find(query).sort(sortOption);
  return customers;
};

/**
 * Get comprehensive 360-degree customer profile with historical activity.
 */
export const getCustomerById = async (tenantId, customerId) => {
  const customer = await Customer.findOne({
    _id: customerId,
    restaurantId: tenantId,
  });

  if (!customer) {
    const error = new Error('Customer profile not found.');
    error.statusCode = 404;
    throw error;
  }

  // Fetch recent customer activity
  const [recentOrders, recentReservations, recentQueueEntries] = await Promise.all([
    Order.find({ restaurantId: tenantId, customerId: customer._id })
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: -1 })
      .limit(5),
    Reservation.find({ restaurantId: tenantId, customerId: customer._id })
      .populate('tableId', 'tableNumber')
      .sort({ date: -1, startTime: -1 })
      .limit(5),
    QueueEntry.find({ restaurantId: tenantId, customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  return {
    customer,
    recentOrders,
    recentReservations,
    recentQueueEntries,
  };
};

/**
 * Update an existing customer profile.
 */
export const updateCustomer = async (tenantId, customerId, updateData) => {
  const customer = await Customer.findOne({
    _id: customerId,
    restaurantId: tenantId,
  });

  if (!customer) {
    const error = new Error('Customer profile not found.');
    error.statusCode = 404;
    throw error;
  }

  // If changing phone number, check uniqueness within restaurant
  if (updateData.phone && updateData.phone.trim() !== customer.phone) {
    const duplicate = await Customer.findOne({
      restaurantId: tenantId,
      phone: updateData.phone.trim(),
      _id: { $ne: customerId },
    });
    if (duplicate) {
      const error = new Error('Another customer already exists with this phone number.');
      error.statusCode = 409;
      throw error;
    }
    customer.phone = updateData.phone.trim();
  }

  if (updateData.name) customer.name = updateData.name.trim();
  if (updateData.email !== undefined) {
    customer.email = updateData.email ? updateData.email.trim().toLowerCase() : null;
  }
  if (updateData.notes !== undefined) customer.notes = updateData.notes.trim();
  if (updateData.visitCount !== undefined) customer.visitCount = Math.max(0, parseInt(updateData.visitCount, 10));
  if (updateData.totalSpent !== undefined) customer.totalSpent = Math.max(0, parseFloat(updateData.totalSpent));

  await customer.save();
  return customer;
};

/**
 * Record a visit and spend for a customer (called on order completion or seating).
 */
export const recordCustomerVisit = async (tenantId, customerId, visitData = {}) => {
  const customer = await Customer.findOne({
    _id: customerId,
    restaurantId: tenantId,
  });

  if (!customer) {
    const error = new Error('Customer profile not found.');
    error.statusCode = 404;
    throw error;
  }

  customer.visitCount += 1;
  customer.lastVisit = new Date();

  if (visitData.spendAmount) {
    customer.totalSpent += Math.max(0, parseFloat(visitData.spendAmount) || 0);
  }

  await customer.save();
  return customer;
};

/**
 * Summary metrics for customer directory.
 */
export const getCustomerSummary = async (tenantId) => {
  const [totalCount, repeatCount, totals] = await Promise.all([
    Customer.countDocuments({ restaurantId: tenantId }),
    Customer.countDocuments({ restaurantId: tenantId, visitCount: { $gt: 1 } }),
    Customer.aggregate([
      { $match: { restaurantId: tenantId } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalSpent' } } },
    ]),
  ]);

  const totalSpentAll = totals[0]?.totalRevenue || 0;
  const avgSpendPerCustomer = totalCount > 0 ? Math.round(totalSpentAll / totalCount) : 0;

  return {
    totalCustomers: totalCount,
    repeatCustomers: repeatCount,
    newCustomers: totalCount - repeatCount,
    totalLifetimeRevenue: totalSpentAll,
    avgSpendPerCustomer,
  };
};
