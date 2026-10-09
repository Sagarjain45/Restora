import Restaurant from '../models/Restaurant.js';
import RestaurantApplication from '../models/RestaurantApplication.js';
import User from '../models/User.js';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import { hashPassword } from '../utils/password.js';

/**
 * Service handling Platform Admin operations:
 * - Aggregated SaaS Analytics
 * - Restaurant Application Lifecycle (Submit, Review, Approve, Reject)
 * - Restaurant Lifecycle Management (Activate, Suspend, Deactivate)
 */

/**
 * Aggregates SaaS-wide metrics for the Platform Admin Dashboard
 */
export const getDashboardStats = async () => {
  const [
    totalRestaurants,
    activeRestaurants,
    suspendedRestaurants,
    pendingRestaurants,
    pendingApplications,
    totalUsers,
    totalOrders,
    revenueAgg,
  ] = await Promise.all([
    Restaurant.countDocuments(),
    Restaurant.countDocuments({ status: 'ACTIVE' }),
    Restaurant.countDocuments({ status: 'SUSPENDED' }),
    Restaurant.countDocuments({ status: 'PENDING' }),
    RestaurantApplication.countDocuments({ status: 'PENDING' }),
    User.countDocuments(),
    Order.countDocuments(),
    Bill.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]),
  ]);

  const platformRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

  return {
    restaurants: {
      total: totalRestaurants,
      active: activeRestaurants,
      suspended: suspendedRestaurants,
      pending: pendingRestaurants,
    },
    applications: {
      pending: pendingApplications,
    },
    users: {
      total: totalUsers,
    },
    orders: {
      total: totalOrders,
    },
    revenue: {
      total: platformRevenue,
      currency: 'INR',
    },
  };
};

/**
 * Lists restaurant onboarding applications with status filtering & search
 */
export const getApplications = async ({ status, search } = {}) => {
  const filter = {};

  if (status && status !== 'ALL') {
    filter.status = status.toUpperCase();
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { restaurantName: searchRegex },
      { applicantName: searchRegex },
      { applicantEmail: searchRegex },
      { city: searchRegex },
    ];
  }

  return await RestaurantApplication.find(filter)
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 });
};

/**
 * Retrieves a single application by ID
 */
export const getApplicationById = async (id) => {
  const application = await RestaurantApplication.findById(id).populate('reviewedBy', 'name email');
  if (!application) {
    const error = new Error('Restaurant application not found');
    error.statusCode = 404;
    throw error;
  }
  return application;
};

/**
 * Submits a new restaurant onboarding application (public/applicant)
 */
export const submitApplication = async (data) => {
  const {
    restaurantName,
    applicantName,
    applicantEmail,
    applicantPhone,
    address,
    city,
    state,
    postalCode,
    fssaiNumber,
    cuisine,
    businessType,
    seatingCapacity,
    gstNumber,
    website,
    password,
    notes,
  } = data;

  if (!restaurantName || !applicantName || !applicantEmail || !applicantPhone || !address || !city || !state) {
    const error = new Error('All required restaurant and owner contact fields must be provided.');
    error.statusCode = 400;
    throw error;
  }

  // Validate FSSAI license number
  const trimmedFssai = (fssaiNumber || '').trim();
  if (!trimmedFssai) {
    const error = new Error('FSSAI license number is required for food business verification in India.');
    error.statusCode = 400;
    throw error;
  }

  // Check if an existing user already exists with this email
  const existingUser = await User.findOne({ email: applicantEmail.toLowerCase() });
  if (existingUser) {
    const error = new Error('An active user account is already registered with this email address. Please sign in or use a different email.');
    error.statusCode = 409;
    throw error;
  }

  // Check if an application is already pending for this email
  const existingPending = await RestaurantApplication.findOne({
    applicantEmail: applicantEmail.toLowerCase(),
    status: 'PENDING',
  });

  if (existingPending) {
    const error = new Error('An active onboarding application is already pending review for this email address.');
    error.statusCode = 409;
    throw error;
  }

  // Pre-hash owner password if provided so owner can login immediately upon admin approval
  let ownerPasswordHash = null;
  if (password && password.trim().length >= 6) {
    ownerPasswordHash = await hashPassword(password.trim());
  }

  // Parse cuisine array
  let parsedCuisine = [];
  if (Array.isArray(cuisine)) {
    parsedCuisine = cuisine.map((c) => c.trim()).filter(Boolean);
  } else if (typeof cuisine === 'string' && cuisine.trim()) {
    parsedCuisine = cuisine.split(',').map((c) => c.trim()).filter(Boolean);
  }

  return await RestaurantApplication.create({
    restaurantName: restaurantName.trim(),
    applicantName: applicantName.trim(),
    applicantEmail: applicantEmail.toLowerCase().trim(),
    applicantPhone: applicantPhone.trim(),
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    postalCode: (postalCode || '').trim(),
    fssaiNumber: trimmedFssai,
    cuisine: parsedCuisine,
    businessType: businessType || 'Dine-In Restaurant',
    seatingCapacity: Number(seatingCapacity) || 0,
    gstNumber: (gstNumber || '').trim(),
    website: (website || '').trim(),
    ownerPasswordHash,
    notes: (notes || '').trim(),
    status: 'PENDING',
  });
};

/**
 * Checks the status of an application by email or application ID (public lookup)
 */
export const getApplicationStatus = async ({ email, applicationId } = {}) => {
  let application = null;

  if (applicationId) {
    application = await RestaurantApplication.findById(applicationId).populate('reviewedBy', 'name email');
  } else if (email) {
    // Find the latest application for this applicant email
    application = await RestaurantApplication.findOne({ applicantEmail: email.toLowerCase().trim() })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name email');
  } else {
    const error = new Error('Please provide either an application email or application ID.');
    error.statusCode = 400;
    throw error;
  }

  if (!application) {
    const error = new Error('No registration application found matching the provided criteria.');
    error.statusCode = 404;
    throw error;
  }

  return {
    id: application._id,
    restaurantName: application.restaurantName,
    applicantName: application.applicantName,
    applicantEmail: application.applicantEmail,
    city: application.city,
    state: application.state,
    fssaiNumber: application.fssaiNumber,
    status: application.status,
    rejectionReason: application.rejectionReason,
    createdAt: application.createdAt,
    reviewedAt: application.reviewedAt,
  };
};

/**
 * Approves a restaurant application:
 * 1. Creates/links the Owner user account (using applicant's password if provided).
 * 2. Creates the new Restaurant document with ACTIVE status and FSSAI details.
 * 3. Pre-provisions default starter dining tables so floor is ready immediately.
 * 4. Updates application status to APPROVED.
 */
export const approveApplication = async (applicationId, reviewerId, options = {}) => {
  const application = await RestaurantApplication.findById(applicationId);
  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  if (application.status === 'APPROVED') {
    const error = new Error('This application has already been approved.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Check or create Owner account
  let owner = await User.findOne({ email: application.applicantEmail.toLowerCase() });

  if (!owner) {
    const passwordHash =
      application.ownerPasswordHash ||
      (await hashPassword(options.temporaryPassword || 'Welcome@123'));

    owner = await User.create({
      name: application.applicantName,
      email: application.applicantEmail.toLowerCase(),
      passwordHash,
      phone: application.applicantPhone,
      role: 'RESTAURANT_OWNER',
      status: 'ACTIVE',
    });
  } else {
    owner.role = 'RESTAURANT_OWNER';
    owner.status = 'ACTIVE';
    if (application.ownerPasswordHash) {
      owner.passwordHash = application.ownerPasswordHash;
    }
  }

  // 2. Create the Restaurant
  const restaurant = await Restaurant.create({
    name: application.restaurantName,
    ownerId: owner._id,
    email: application.applicantEmail.toLowerCase(),
    phone: application.applicantPhone,
    address: application.address,
    city: application.city,
    state: application.state,
    postalCode: application.postalCode || '',
    fssaiNumber: application.fssaiNumber || '',
    seatingCapacity: application.seatingCapacity || 0,
    gstNumber: application.gstNumber || '',
    website: application.website || '',
    businessType: application.businessType || 'Dine-In Restaurant',
    cuisine: application.cuisine,
    status: 'ACTIVE',
    subscriptionPlan: options.subscriptionPlan || 'BASIC',
  });

  // Link restaurant to owner
  owner.restaurantId = restaurant._id;
  await owner.save();

  // 3. Auto-seed standard starter tables so restaurant floor is instantly operational
  const starterTables = [
    { restaurantId: restaurant._id, tableNumber: 'T-01', capacity: 2, section: 'Main Dining', status: 'AVAILABLE' },
    { restaurantId: restaurant._id, tableNumber: 'T-02', capacity: 4, section: 'Main Dining', status: 'AVAILABLE' },
    { restaurantId: restaurant._id, tableNumber: 'T-03', capacity: 4, section: 'Window Side', status: 'AVAILABLE' },
    { restaurantId: restaurant._id, tableNumber: 'T-04', capacity: 6, section: 'Patio', status: 'AVAILABLE' },
  ];
  await Table.insertMany(starterTables);

  // 4. Mark Application as APPROVED
  application.status = 'APPROVED';
  application.reviewedBy = reviewerId;
  application.reviewedAt = new Date();
  await application.save();

  return {
    application,
    restaurant,
    owner: {
      id: owner._id,
      name: owner.name,
      email: owner.email,
      role: owner.role,
    },
  };
};

/**
 * Rejects a restaurant application with a provided reason
 */
export const rejectApplication = async (applicationId, reviewerId, rejectionReason) => {
  const application = await RestaurantApplication.findById(applicationId);
  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  if (application.status === 'APPROVED') {
    const error = new Error('Cannot reject an already approved application.');
    error.statusCode = 400;
    throw error;
  }

  application.status = 'REJECTED';
  application.rejectionReason = rejectionReason || 'Application does not meet current platform onboarding requirements.';
  application.reviewedBy = reviewerId;
  application.reviewedAt = new Date();
  await application.save();

  return application;
};

/**
 * Lists restaurants with status filters, search, and owner population
 */
export const getRestaurants = async ({ status, search } = {}) => {
  const filter = {};

  if (status && status !== 'ALL') {
    filter.status = status.toUpperCase();
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { city: searchRegex },
      { phone: searchRegex },
    ];
  }

  const restaurants = await Restaurant.find(filter)
    .populate('ownerId', 'name email phone status')
    .sort({ createdAt: -1 });

  // Augment with table count for each restaurant
  const augmented = await Promise.all(
    restaurants.map(async (r) => {
      const tableCount = await Table.countDocuments({ restaurantId: r._id });
      const menuCount = await MenuItem.countDocuments({ restaurantId: r._id });
      return {
        ...r.toObject(),
        stats: {
          tables: tableCount,
          menuItems: menuCount,
        },
      };
    })
  );

  return augmented;
};

/**
 * Retrieves full restaurant profile and operational metrics
 */
export const getRestaurantDetails = async (id) => {
  const restaurant = await Restaurant.findById(id).populate('ownerId', 'name email phone status');
  if (!restaurant) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  const [tables, menuItems, orderCount, revenueAgg] = await Promise.all([
    Table.find({ restaurantId: id }),
    MenuItem.find({ restaurantId: id }),
    Order.countDocuments({ restaurantId: id }),
    Bill.aggregate([
      { $match: { restaurantId: restaurant._id, status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

  return {
    restaurant,
    stats: {
      totalTables: tables.length,
      totalMenuItems: menuItems.length,
      totalOrders: orderCount,
      totalRevenue,
    },
    tables,
    menuItems,
  };
};

/**
 * Updates restaurant status (ACTIVE, SUSPENDED, INACTIVE)
 */
export const updateRestaurantStatus = async (id, status) => {
  const allowed = ['ACTIVE', 'SUSPENDED', 'INACTIVE', 'PENDING'];
  if (!allowed.includes(status)) {
    const error = new Error(`Invalid status. Allowed values: ${allowed.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await Restaurant.findById(id);
  if (!restaurant) {
    const error = new Error('Restaurant not found');
    error.statusCode = 404;
    throw error;
  }

  restaurant.status = status;
  await restaurant.save();

  return restaurant;
};

/**
 * Seeds sample applications for demonstration and testing
 */
export const seedSampleApplications = async () => {
  const count = await RestaurantApplication.countDocuments();
  if (count > 0) {
    return { seeded: false, message: 'Applications already present' };
  }

  const samples = [
    {
      restaurantName: 'The Golden Spoon Bistro',
      applicantName: 'Vikram Mehra',
      applicantEmail: 'vikram@goldenspoon.com',
      applicantPhone: '+91 98200 12345',
      fssaiNumber: '11521018000452',
      address: 'Plot 14, Bandra Kurla Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400051',
      cuisine: ['Continental', 'Mediterranean'],
      businessType: 'Fine Dining Bistro',
      seatingCapacity: 60,
      notes: 'Fine dining establishment with 60 seats capacity.',
      status: 'PENDING',
    },
    {
      restaurantName: 'Kyoto Express Sushi',
      applicantName: 'Aarti Sharma',
      applicantEmail: 'aarti@kyotoexpress.com',
      applicantPhone: '+91 98111 67890',
      fssaiNumber: '12822003000789',
      address: '22 Park Street',
      city: 'Kolkata',
      state: 'West Bengal',
      postalCode: '700016',
      cuisine: ['Japanese', 'Asian Fusion'],
      businessType: 'Quick Service / Sushi Bar',
      seatingCapacity: 35,
      notes: 'Fast-casual sushi and bento dining.',
      status: 'PENDING',
    },
    {
      restaurantName: 'Pind Da Dhaba',
      applicantName: 'Harpreet Singh',
      applicantEmail: 'harpreet@pinddhaba.com',
      applicantPhone: '+91 98450 33445',
      fssaiNumber: '10320005001234',
      address: 'Sector 17 Market',
      city: 'Chandigarh',
      state: 'Punjab',
      postalCode: '160017',
      cuisine: ['North Indian', 'Punjabi'],
      businessType: 'Traditional Family Diner',
      seatingCapacity: 80,
      notes: 'Traditional Punjabi family diner.',
      status: 'PENDING',
    },
  ];

  const created = await RestaurantApplication.insertMany(samples);
  return { seeded: true, count: created.length, applications: created };
};
