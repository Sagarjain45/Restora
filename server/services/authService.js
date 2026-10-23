import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import Customer from '../models/Customer.js';
import QueueEntry from '../models/QueueEntry.js';
import Reservation from '../models/Reservation.js';
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
    const adminPasswordHash = await hashPassword('Admin@123');
    const ownerPasswordHash = await hashPassword('Owner@123');
    const staffPasswordHash = await hashPassword('Staff@123');

    // 1. Platform Admin
    let admin = await User.findOne({ email: 'admin@restora.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Platform Administrator',
        email: 'admin@restora.com',
        passwordHash: adminPasswordHash,
        role: 'PLATFORM_ADMIN',
        restaurantId: null,
        status: 'ACTIVE',
        phone: '+91 99000 00001',
        designation: 'Super Administrator',
      });
    } else {
      admin.passwordHash = adminPasswordHash;
      admin.status = 'ACTIVE';
      await admin.save();
    }

    // 2. RESTAURANT 1: Trattoria Roma
    let owner1 = await User.findOne({ email: 'owner@roma.com' });
    if (!owner1) {
      owner1 = await User.create({
        name: 'Chef Marco Rossi',
        email: 'owner@roma.com',
        passwordHash: ownerPasswordHash,
        role: 'RESTAURANT_OWNER',
        status: 'ACTIVE',
        phone: '+91 98201 11222',
        designation: 'Head Chef & Owner',
      });
    } else {
      owner1.passwordHash = ownerPasswordHash;
      owner1.status = 'ACTIVE';
      await owner1.save();
    }

    let rest1 = await Restaurant.findOne({ name: 'Trattoria Roma' });
    if (!rest1) {
      rest1 = await Restaurant.create({
        name: 'Trattoria Roma',
        ownerId: owner1._id,
        email: 'contact@trattoriaroma.com',
        phone: '+91 98201 11222',
        address: '42 Culinary Boulevard, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        cuisine: ['Italian', 'Continental', 'Wood-Fired Pizza'],
        description: 'Authentic Italian bistro serving handcrafted pastas and Neapolitan pizzas.',
        status: 'ACTIVE',
        seatingCapacity: 45,
        settings: { currency: 'INR', taxRatePercent: 5, autoAcceptReservations: true },
      });
    }
    owner1.restaurantId = rest1._id;
    await owner1.save();

    // Owner 1 alias (owner@bistro.com)
    let owner1Alias = await User.findOne({ email: 'owner@bistro.com' });
    if (!owner1Alias) {
      await User.create({
        name: 'Chef Marco Rossi',
        email: 'owner@bistro.com',
        passwordHash: ownerPasswordHash,
        role: 'RESTAURANT_OWNER',
        restaurantId: rest1._id,
        status: 'ACTIVE',
      });
    } else {
      owner1Alias.restaurantId = rest1._id;
      owner1Alias.passwordHash = ownerPasswordHash;
      await owner1Alias.save();
    }

    // Staff 1 for Restaurant 1
    let staff1 = await User.findOne({ email: 'staff@roma.com' });
    if (!staff1) {
      staff1 = await User.create({
        name: 'Luigi Floor Lead',
        email: 'staff@roma.com',
        passwordHash: staffPasswordHash,
        role: 'RESTAURANT_STAFF',
        restaurantId: rest1._id,
        status: 'ACTIVE',
        phone: '+91 98201 33445',
        designation: 'Floor Captain',
      });
    } else {
      staff1.restaurantId = rest1._id;
      staff1.passwordHash = staffPasswordHash;
      await staff1.save();
    }

    // Staff 1 alias (staff@bistro.com)
    let staff1Alias = await User.findOne({ email: 'staff@bistro.com' });
    if (!staff1Alias) {
      await User.create({
        name: 'Luigi Floor Lead',
        email: 'staff@bistro.com',
        passwordHash: staffPasswordHash,
        role: 'RESTAURANT_STAFF',
        restaurantId: rest1._id,
        status: 'ACTIVE',
      });
    } else {
      staff1Alias.restaurantId = rest1._id;
      staff1Alias.passwordHash = staffPasswordHash;
      await staff1Alias.save();
    }

    // Seed/Ensure tables and menus for Rest 1
    const tCount1 = await Table.countDocuments({ restaurantId: rest1._id });
    if (tCount1 === 0) {
      await Table.insertMany([
        { restaurantId: rest1._id, tableNumber: 'T-01', capacity: 2, section: 'Main Dining', status: 'AVAILABLE' },
        { restaurantId: rest1._id, tableNumber: 'T-02', capacity: 4, section: 'Main Dining', status: 'AVAILABLE' },
        { restaurantId: rest1._id, tableNumber: 'T-03', capacity: 4, section: 'Patio Terrace', status: 'AVAILABLE' },
        { restaurantId: rest1._id, tableNumber: 'T-04', capacity: 6, section: 'Rooftop Lounge', status: 'AVAILABLE' },
        { restaurantId: rest1._id, tableNumber: 'T-05', capacity: 8, section: 'Private Cellar', status: 'AVAILABLE' },
      ]);
    }

    const mCount1 = await MenuItem.countDocuments({ restaurantId: rest1._id });
    if (mCount1 === 0) {
      await MenuItem.insertMany([
        { restaurantId: rest1._id, name: 'Truffle Mushroom Bruschetta', category: 'Starters', price: 340, isVegetarian: true, isAvailable: true, description: 'Crusty sourdough, wild mushrooms, white truffle oil.' },
        { restaurantId: rest1._id, name: 'Burrata Margherita Pizza', category: 'Mains', price: 680, isVegetarian: true, isAvailable: true, description: 'San Marzano DOP tomato sauce, fresh artisanal burrata, basil leaves.' },
        { restaurantId: rest1._id, name: 'Fettuccine Alfredo Pollo', category: 'Mains', price: 590, isVegetarian: false, isAvailable: true, description: 'Egg fettuccine, parmigiano-reggiano emulsion, herb chicken.' },
        { restaurantId: rest1._id, name: 'Signature Tiramisu Tradizionale', category: 'Desserts', price: 390, isVegetarian: true, isAvailable: true, description: 'Espresso-dipped savoiardi with silky mascarpone.' },
        { restaurantId: rest1._id, name: 'San Pellegrino Sparkling', category: 'Beverages', price: 240, isVegetarian: true, isAvailable: true, description: 'Natural sparkling Italian mineral water.' },
      ]);
    }

    // 3. RESTAURANT 2: Spice Symphony
    let owner2 = await User.findOne({ email: 'owner@spicesymphony.com' });
    if (!owner2) {
      owner2 = await User.create({
        name: 'Vikramaditya Singhania',
        email: 'owner@spicesymphony.com',
        passwordHash: ownerPasswordHash,
        role: 'RESTAURANT_OWNER',
        status: 'ACTIVE',
        phone: '+91 99880 11223',
        designation: 'Managing Director & Owner',
      });
    } else {
      owner2.passwordHash = ownerPasswordHash;
      owner2.status = 'ACTIVE';
      await owner2.save();
    }

    let rest2 = await Restaurant.findOne({ name: 'Spice Symphony' });
    if (!rest2) {
      rest2 = await Restaurant.create({
        name: 'Spice Symphony',
        ownerId: owner2._id,
        email: 'contact@spicesymphony.com',
        phone: '+91 99880 11223',
        address: '18 Indiranagar 100ft Road',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        cuisine: ['North Indian', 'Tandoor', 'Mughlai', 'Biryani'],
        description: 'Royal Indian culinary house with charcoal clay oven kebabs and slow-cooked curries.',
        status: 'ACTIVE',
        seatingCapacity: 60,
        settings: { currency: 'INR', taxRatePercent: 5, autoAcceptReservations: true },
      });
    }
    owner2.restaurantId = rest2._id;
    await owner2.save();

    // Staff 2 for Restaurant 2
    let staff2 = await User.findOne({ email: 'staff@spicesymphony.com' });
    if (!staff2) {
      staff2 = await User.create({
        name: 'Kabir Singh',
        email: 'staff@spicesymphony.com',
        passwordHash: staffPasswordHash,
        role: 'RESTAURANT_STAFF',
        restaurantId: rest2._id,
        status: 'ACTIVE',
        phone: '+91 99880 33445',
        designation: 'Head Steward',
      });
    } else {
      staff2.restaurantId = rest2._id;
      staff2.passwordHash = staffPasswordHash;
      await staff2.save();
    }

    // Seed/Ensure tables and menus for Rest 2
    const tCount2 = await Table.countDocuments({ restaurantId: rest2._id });
    if (tCount2 === 0) {
      await Table.insertMany([
        { restaurantId: rest2._id, tableNumber: 'S-01', capacity: 2, section: 'Royal Courtyard', status: 'AVAILABLE' },
        { restaurantId: rest2._id, tableNumber: 'S-02', capacity: 4, section: 'Royal Courtyard', status: 'AVAILABLE' },
        { restaurantId: rest2._id, tableNumber: 'S-03', capacity: 4, section: 'Mughal Hall', status: 'AVAILABLE' },
        { restaurantId: rest2._id, tableNumber: 'S-04', capacity: 6, section: 'Mughal Hall', status: 'AVAILABLE' },
        { restaurantId: rest2._id, tableNumber: 'S-05', capacity: 10, section: 'Maharaja Suite', status: 'AVAILABLE' },
      ]);
    }

    const mCount2 = await MenuItem.countDocuments({ restaurantId: rest2._id });
    if (mCount2 === 0) {
      await MenuItem.insertMany([
        { restaurantId: rest2._id, name: 'Paneer Tikka Angara', category: 'Starters', price: 360, isVegetarian: true, isAvailable: true, description: 'Cottage cheese marinated in smoked hung curd and ajwain.' },
        { restaurantId: rest2._id, name: 'Murgh Malai Tandoori Kebab', category: 'Starters', price: 440, isVegetarian: false, isAvailable: true, description: 'Tender chicken infused with cardamom and cream cheese.' },
        { restaurantId: rest2._id, name: 'Butter Chicken Aslam Style', category: 'Mains', price: 540, isVegetarian: false, isAvailable: true, description: 'Roasted tandoori chicken simmered in rich velvety tomato gravy.' },
        { restaurantId: rest2._id, name: 'Dal Makhani Slow-Cooked 24h', category: 'Mains', price: 390, isVegetarian: true, isAvailable: true, description: 'Black urad lentils slow-cooked overnight with white butter.' },
        { restaurantId: rest2._id, name: 'Garlic Chur Chur Naan', category: 'Mains', price: 110, isVegetarian: true, isAvailable: true, description: 'Clay-oven leavened bread layered with roasted garlic and butter.' },
        { restaurantId: rest2._id, name: 'Shahi Kesari Phirni', category: 'Desserts', price: 260, isVegetarian: true, isAvailable: true, description: 'Traditional Kashmiri rice pudding with saffron and pistachios.' },
        { restaurantId: rest2._id, name: 'Alphonso Mango Lassi', category: 'Beverages', price: 190, isVegetarian: true, isAvailable: true, description: 'Chilled rich yogurt blended with Ratnagiri mango pulp.' },
      ]);
    }

    return {
      seeded: true,
      accounts: [
        { role: 'PLATFORM_ADMIN', email: admin.email, password: 'Admin@123' },
        { role: 'RESTAURANT_OWNER', restaurant: 'Trattoria Roma', email: owner1.email, password: 'Owner@123' },
        { role: 'RESTAURANT_STAFF', restaurant: 'Trattoria Roma', email: staff1.email, password: 'Staff@123' },
        { role: 'RESTAURANT_OWNER', restaurant: 'Spice Symphony', email: owner2.email, password: 'Owner@123' },
        { role: 'RESTAURANT_STAFF', restaurant: 'Spice Symphony', email: staff2.email, password: 'Staff@123' },
      ],
    };
  } catch (err) {
    console.warn('[Seed Accounts Notice]:', err.message);
    return { seeded: false, error: err.message };
  }
};
