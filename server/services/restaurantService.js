import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import QueueEntry from '../models/QueueEntry.js';
import Reservation from '../models/Reservation.js';

/**
 * Service handling Restaurant Owner and Operations Dashboard functionality:
 * - Restaurant Profile & Basic Information
 * - Opening Hours & Operational Scheduling
 * - Operational Settings (Taxes, Currencies, Service Charges)
 * - Real-Time Dashboard Operational Metrics
 */

/**
 * Retrieves the full profile of the specified restaurant tenant
 */
export const getRestaurantProfile = async (restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId).populate('ownerId', 'name email phone role');
  if (!restaurant) {
    const error = new Error('Restaurant tenant record not found');
    error.statusCode = 404;
    throw error;
  }
  return restaurant;
};

/**
 * Updates basic restaurant profile information
 */
export const updateRestaurantProfile = async (restaurantId, updateData) => {
  const allowedFields = [
    'name',
    'description',
    'email',
    'phone',
    'address',
    'city',
    'state',
    'country',
    'postalCode',
    'website',
    'cuisine',
  ];

  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredUpdates[field] = updateData[field];
    }
  }

  // Ensure cuisine is properly formatted as array if provided
  if (filteredUpdates.cuisine && typeof filteredUpdates.cuisine === 'string') {
    filteredUpdates.cuisine = filteredUpdates.cuisine
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }

  const updatedRestaurant = await Restaurant.findByIdAndUpdate(
    restaurantId,
    { $set: filteredUpdates },
    { new: true, runValidators: true }
  ).populate('ownerId', 'name email phone role');

  if (!updatedRestaurant) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  return updatedRestaurant;
};

/**
 * Updates the weekly opening hours schedule
 */
export const updateOpeningHours = async (restaurantId, openingHours) => {
  if (!Array.isArray(openingHours)) {
    const error = new Error('Opening hours must be provided as an array of daily schedules.');
    error.statusCode = 400;
    throw error;
  }

  const updated = await Restaurant.findByIdAndUpdate(
    restaurantId,
    { $set: { openingHours } },
    { new: true, runValidators: true }
  );

  return updated.openingHours;
};

/**
 * Updates restaurant operational settings (tax rate, service charge, auto-reservations)
 */
export const updateRestaurantSettings = async (restaurantId, newSettings) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  restaurant.settings = {
    ...restaurant.settings?.toObject(),
    ...newSettings,
  };

  await restaurant.save();
  return restaurant.settings;
};

/**
 * Toggles whether the restaurant is currently open for floor dining
 */
export const toggleOpenStatus = async (restaurantId, isOpenNow) => {
  const restaurant = await Restaurant.findByIdAndUpdate(
    restaurantId,
    { $set: { isOpenNow: Boolean(isOpenNow) } },
    { new: true }
  );
  return { isOpenNow: restaurant.isOpenNow };
};

/**
 * Gathers live operational metrics for the Restaurant Dashboard
 */
export const getRestaurantDashboardMetrics = async (restaurantId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    tables,
    activeOrdersCount,
    todaysOrdersCount,
    waitingQueueCount,
    todaysSalesAgg,
    upcomingReservationsCount,
    restaurant,
  ] = await Promise.all([
    Table.find({ restaurantId }),
    Order.countDocuments({
      restaurantId,
      status: { $in: ['PENDING', 'CONFIRMED', 'PREPARING', 'SERVED'] },
    }),
    Order.countDocuments({
      restaurantId,
      createdAt: { $gte: startOfDay },
    }),
    QueueEntry.countDocuments({
      restaurantId,
      status: 'WAITING',
    }),
    Bill.aggregate([
      {
        $match: {
          restaurantId,
          status: 'PAID',
          createdAt: { $gte: startOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          billCount: { $sum: 1 },
        },
      },
    ]),
    Reservation.countDocuments({
      restaurantId,
      status: { $in: ['CONFIRMED', 'PENDING'] },
    }),
    Restaurant.findById(restaurantId).select('name status isOpenNow settings openingHours'),
  ]);

  const totalTables = tables.length;
  const availableTables = tables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED').length;
  const reservedTables = tables.filter((t) => t.status === 'RESERVED').length;
  const billingTables = tables.filter((t) => t.status === 'BILLING').length;
  const outOfServiceTables = tables.filter((t) => t.status === 'OUT_OF_SERVICE' || t.status === 'UNAVAILABLE').length;
  const cleaningTables = tables.filter((t) => t.status === 'CLEANING').length;

  const todaySales = todaysSalesAgg.length > 0 ? todaysSalesAgg[0].totalSales : 0;
  const paidBillsCount = todaysSalesAgg.length > 0 ? todaysSalesAgg[0].billCount : 0;

  return {
    restaurant: {
      name: restaurant?.name || 'Restaurant',
      status: restaurant?.status || 'ACTIVE',
      isOpenNow: restaurant?.isOpenNow ?? true,
      currency: restaurant?.settings?.currency || 'INR',
    },
    tables: {
      total: totalTables,
      available: availableTables,
      occupied: occupiedTables,
      reserved: reservedTables,
      billing: billingTables,
      outOfService: outOfServiceTables,
      cleaning: cleaningTables,
      matrix: tables.map((t) => ({
        id: t._id,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        status: t.status,
        section: t.section,
        isActive: t.isActive !== false,
      })),
    },
    orders: {
      active: activeOrdersCount,
      today: todaysOrdersCount,
    },
    queue: {
      waiting: waitingQueueCount,
    },
    sales: {
      todayRevenue: todaySales,
      billsPaidToday: paidBillsCount,
      currency: restaurant?.settings?.currency || 'INR',
    },
    reservations: {
      upcoming: upcomingReservationsCount,
    },
  };
};
