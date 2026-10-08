import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

export const register = async ({ name, email, password, role, restaurantId = null, phone = null }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('A user with this email address already exists.');
    error.statusCode = 409;
    error.code = 'USER_EXISTS';
    throw error;
  }

  // Validate restaurantId requirement for restaurant roles
  if (role !== 'PLATFORM_ADMIN' && !restaurantId) {
    // If not platform admin, restaurantId is expected for restaurant association
  }

  const passwordHash = await hashPassword(password);

  const newUser = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role || 'RESTAURANT_STAFF',
    restaurantId: role === 'PLATFORM_ADMIN' ? null : restaurantId,
    phone,
    status: 'ACTIVE',
  });

  const tokenPayload = {
    id: newUser._id.toString(),
    email: newUser.email,
    role: newUser.role,
    restaurantId: newUser.restaurantId ? newUser.restaurantId.toString() : null,
    name: newUser.name,
  };

  const token = signToken(tokenPayload);

  return {
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      restaurantId: newUser.restaurantId,
    },
    token,
  };
};

export const login = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const error = new Error('Invalid email or password credentials.');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (user.status !== 'ACTIVE') {
    const error = new Error(`Account is currently ${user.status.toLowerCase()}. Please contact support.`);
    error.statusCode = 403;
    error.code = 'ACCOUNT_INACTIVE';
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password credentials.');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const tokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId ? user.restaurantId.toString() : null,
    name: user.name,
  };

  const token = signToken(tokenPayload);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    },
    token,
  };
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }
  return user;
};

/**
 * Ensures demo user accounts exist for immediate Phase 3 verification
 */
export const seedInitialAccounts = async () => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return { seeded: false, message: 'Accounts already exist' };
    }

    // 1. Create a demo restaurant
    const adminPasswordHash = await hashPassword('Admin@123');
    const ownerPasswordHash = await hashPassword('Owner@123');
    const staffPasswordHash = await hashPassword('Staff@123');

    // Platform Admin (restaurantId = null)
    const admin = await User.create({
      name: 'Platform Administrator',
      email: 'admin@restora.com',
      passwordHash: adminPasswordHash,
      role: 'PLATFORM_ADMIN',
      restaurantId: null,
      status: 'ACTIVE',
    });

    // Restaurant Owner
    const owner = await User.create({
      name: 'Mario Rossi',
      email: 'owner@bistro.com',
      passwordHash: ownerPasswordHash,
      role: 'RESTAURANT_OWNER',
      status: 'ACTIVE',
    });

    // Demo Restaurant
    const demoRestaurant = await Restaurant.create({
      name: 'Trattoria Roma Demo',
      ownerId: owner._id,
      email: 'contact@trattoriaroma.com',
      phone: '+91 98765 43210',
      address: '42 Culinary Boulevard',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      cuisine: ['Italian', 'Continental'],
      status: 'ACTIVE',
      subscriptionPlan: 'PREMIUM',
    });

    // Link owner to restaurant
    owner.restaurantId = demoRestaurant._id;
    await owner.save();

    // Restaurant Staff
    const staff = await User.create({
      name: 'Luigi Floor Lead',
      email: 'staff@bistro.com',
      passwordHash: staffPasswordHash,
      role: 'RESTAURANT_STAFF',
      restaurantId: demoRestaurant._id,
      status: 'ACTIVE',
    });

    return {
      seeded: true,
      accounts: [
        { email: admin.email, role: admin.role, restaurantId: null },
        { email: owner.email, role: owner.role, restaurantId: demoRestaurant._id },
        { email: staff.email, role: staff.role, restaurantId: demoRestaurant._id },
      ],
    };
  } catch (err) {
    console.warn('[Seed Accounts Notice]:', err.message);
    return { seeded: false, error: err.message };
  }
};
