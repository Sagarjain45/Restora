import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import QueueEntry from '../models/QueueEntry.js';
import Reservation from '../models/Reservation.js';

export const runPresentationSeed = async () => {
  console.log('🌱 Starting Restora Presentation Seeding...');
  await connectDB();

  const adminPassword = await hashPassword('Admin@123');
  const ownerPassword = await hashPassword('Owner@123');
  const staffPassword = await hashPassword('Staff@123');

  // ==========================================
  // 1. PLATFORM ADMIN
  // ==========================================
  const adminEmail = 'admin@restora.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Restora Platform Admin',
      email: adminEmail,
      passwordHash: adminPassword,
      role: 'PLATFORM_ADMIN',
      restaurantId: null,
      status: 'ACTIVE',
      phone: '+91 99000 00001',
      designation: 'Super Administrator',
    });
  } else {
    admin.passwordHash = adminPassword;
    admin.status = 'ACTIVE';
    await admin.save();
  }
  console.log(`✅ Admin verified: ${adminEmail}`);

  // ==========================================
  // 2. RESTAURANT 1: Trattoria Roma (Italian)
  // ==========================================
  const owner1Email = 'owner@roma.com';
  let owner1 = await User.findOne({ email: owner1Email });
  if (!owner1) {
    owner1 = await User.create({
      name: 'Chef Marco Rossi',
      email: owner1Email,
      passwordHash: ownerPassword,
      role: 'RESTAURANT_OWNER',
      status: 'ACTIVE',
      phone: '+91 98201 11222',
      designation: 'Head Chef & Owner',
    });
  } else {
    owner1.passwordHash = ownerPassword;
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
      description: 'Artisanal Italian bistro serving wood-fired pizzas and handmade pastas.',
      status: 'ACTIVE',
      seatingCapacity: 45,
      fssaiNumber: '11521018000452',
      gstNumber: '27AABCT1234F1Z5',
      settings: {
        currency: 'INR',
        taxRatePercent: 5,
        serviceChargePercent: 5,
        autoAcceptReservations: true,
        allowSpecialRequests: true,
      },
    });
  }
  owner1.restaurantId = rest1._id;
  await owner1.save();

  // Also support owner@bistro.com alias for convenience
  let owner1Alias = await User.findOne({ email: 'owner@bistro.com' });
  if (!owner1Alias) {
    owner1Alias = await User.create({
      name: 'Chef Marco Rossi (Bistro Alias)',
      email: 'owner@bistro.com',
      passwordHash: ownerPassword,
      role: 'RESTAURANT_OWNER',
      restaurantId: rest1._id,
      status: 'ACTIVE',
      phone: '+91 98201 11222',
      designation: 'Owner',
    });
  } else {
    owner1Alias.restaurantId = rest1._id;
    owner1Alias.passwordHash = ownerPassword;
    await owner1Alias.save();
  }

  // Restaurant 1 Staff
  const staff1Email = 'staff@roma.com';
  let staff1 = await User.findOne({ email: staff1Email });
  if (!staff1) {
    staff1 = await User.create({
      name: 'Luigi Floor Lead',
      email: staff1Email,
      passwordHash: staffPassword,
      role: 'RESTAURANT_STAFF',
      restaurantId: rest1._id,
      status: 'ACTIVE',
      phone: '+91 98201 33445',
      designation: 'Floor Captain',
    });
  } else {
    staff1.restaurantId = rest1._id;
    staff1.passwordHash = staffPassword;
    staff1.status = 'ACTIVE';
    await staff1.save();
  }

  // Also support staff@bistro.com alias
  let staff1Alias = await User.findOne({ email: 'staff@bistro.com' });
  if (!staff1Alias) {
    staff1Alias = await User.create({
      name: 'Luigi Floor Lead',
      email: 'staff@bistro.com',
      passwordHash: staffPassword,
      role: 'RESTAURANT_STAFF',
      restaurantId: rest1._id,
      status: 'ACTIVE',
      phone: '+91 98201 33445',
      designation: 'Floor Staff',
    });
  } else {
    staff1Alias.restaurantId = rest1._id;
    staff1Alias.passwordHash = staffPassword;
    await staff1Alias.save();
  }

  // Clear & Rebuild Rest 1 floor data
  await Table.deleteMany({ restaurantId: rest1._id });
  const tables1 = await Table.insertMany([
    { restaurantId: rest1._id, tableNumber: 'T-01', capacity: 2, section: 'Main Dining', status: 'AVAILABLE' },
    { restaurantId: rest1._id, tableNumber: 'T-02', capacity: 4, section: 'Main Dining', status: 'OCCUPIED' },
    { restaurantId: rest1._id, tableNumber: 'T-03', capacity: 4, section: 'Patio Terrace', status: 'AVAILABLE' },
    { restaurantId: rest1._id, tableNumber: 'T-04', capacity: 6, section: 'Rooftop Lounge', status: 'AVAILABLE' },
    { restaurantId: rest1._id, tableNumber: 'T-05', capacity: 8, section: 'Private Cellar', status: 'AVAILABLE' },
  ]);

  await MenuItem.deleteMany({ restaurantId: rest1._id });
  const menu1 = await MenuItem.insertMany([
    { restaurantId: rest1._id, name: 'Truffle Mushroom Bruschetta', category: 'Starters', price: 340, isVegetarian: true, isAvailable: true, description: 'Crusty sourdough, wild forest mushrooms, thyme, white truffle oil.' },
    { restaurantId: rest1._id, name: 'Crispy Calamari Fritti', category: 'Starters', price: 420, isVegetarian: false, isAvailable: true, description: 'Golden baby squid rings with roasted garlic aioli and lemon.' },
    { restaurantId: rest1._id, name: 'Burrata Margherita Pizza', category: 'Mains', price: 680, isVegetarian: true, isAvailable: true, description: 'San Marzano DOP tomato sauce, fresh artisanal burrata, basil leaves.' },
    { restaurantId: rest1._id, name: 'Fettuccine Alfredo Pollo', category: 'Mains', price: 590, isVegetarian: false, isAvailable: true, description: 'Fresh egg fettuccine, parmigiano-reggiano emulsion, herb-grilled chicken.' },
    { restaurantId: rest1._id, name: 'Wood-Fired Diavola Pizza', category: 'Mains', price: 720, isVegetarian: false, isAvailable: true, description: 'Spicy pork pepperoni, mozzarella fiore di latte, crushed chili flakes.' },
    { restaurantId: rest1._id, name: 'Signature Tiramisu Tradizionale', category: 'Desserts', price: 390, isVegetarian: true, isAvailable: true, description: 'Espresso-dipped savoiardi with silky mascarpone zabaglione.' },
    { restaurantId: rest1._id, name: 'San Pellegrino Sparkling 750ml', category: 'Beverages', price: 240, isVegetarian: true, isAvailable: true, description: 'Chilled natural effervescent Italian spring water.' },
    { restaurantId: rest1._id, name: 'Classic Aperol Spritz Mocktail', category: 'Beverages', price: 290, isVegetarian: true, isAvailable: true, description: 'Bitter orange spritz, sparkling tonic, fresh orange slice.' },
  ]);

  await Customer.deleteMany({ restaurantId: rest1._id });
  const customers1 = await Customer.insertMany([
    { restaurantId: rest1._id, name: 'Aarav Sharma', phone: '9820011223', email: 'aarav.sharma@gmail.com', visitCount: 6, totalSpent: 7800 },
    { restaurantId: rest1._id, name: 'Pooja Hegde', phone: '9811223344', email: 'pooja.h@yahoo.com', visitCount: 3, totalSpent: 3450 },
    { restaurantId: rest1._id, name: 'Rohan Mehra', phone: '9876543210', email: 'rohan.mehra@outlook.com', visitCount: 2, totalSpent: 2100 },
  ]);

  // Active Order on Table T-02
  await Order.deleteMany({ restaurantId: rest1._id });
  await Bill.deleteMany({ restaurantId: rest1._id });
  const tableT02 = tables1.find((t) => t.tableNumber === 'T-02');
  const activeOrder1 = await Order.create({
    restaurantId: rest1._id,
    orderNumber: 'ORD-1001',
    tableId: tableT02._id,
    customerId: customers1[0]._id,
    status: 'PREPARING',
    paymentStatus: 'PENDING',
    items: [
      { menuItemId: menu1[2]._id, name: menu1[2].name, price: menu1[2].price, quantity: 1, notes: 'Extra crispy crust' },
      { menuItemId: menu1[3]._id, name: menu1[3].name, price: menu1[3].price, quantity: 1, notes: '' },
      { menuItemId: menu1[6]._id, name: menu1[6].name, price: menu1[6].price, quantity: 2, notes: 'With lemon wedges' },
    ],
    subtotal: 1750,
    tax: 87.5,
    discount: 0,
    total: 1837.5,
  });
  tableT02.currentOrderId = activeOrder1._id;
  await tableT02.save();

  // Completed past order & bill for revenue reports
  const completedOrder1 = await Order.create({
    restaurantId: rest1._id,
    orderNumber: 'ORD-0998',
    tableId: tables1[0]._id,
    customerId: customers1[1]._id,
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    items: [
      { menuItemId: menu1[0]._id, name: menu1[0].name, price: menu1[0].price, quantity: 1 },
      { menuItemId: menu1[5]._id, name: menu1[5].name, price: menu1[5].price, quantity: 2 },
    ],
    subtotal: 1120,
    tax: 56,
    discount: 50,
    total: 1126,
  });
  const bill1 = await Bill.create({
    restaurantId: rest1._id,
    orderId: completedOrder1._id,
    billNumber: 'BILL-1001',
    tableId: tables1[0]._id,
    subtotal: 1120,
    tax: 56,
    discount: 50,
    total: 1126,
    status: 'PAID',
    paymentMethod: 'UPI',
    items: completedOrder1.items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, total: i.price * i.quantity })),
  });
  await Payment.create({
    restaurantId: rest1._id,
    billId: bill1._id,
    amount: 1126,
    method: 'UPI',
    status: 'SUCCESS',
    transactionReference: 'UPI-TXN-88721',
  });

  // Queue entries
  await QueueEntry.deleteMany({ restaurantId: rest1._id });
  await QueueEntry.insertMany([
    { restaurantId: rest1._id, customerName: 'Simran Kaur', customerPhone: '9899887766', guestCount: 4, position: 1, status: 'WAITING' },
    { restaurantId: rest1._id, customerName: 'Aditya Roy', customerPhone: '9871122334', guestCount: 2, position: 2, status: 'WAITING' },
  ]);

  // Reservations
  await Reservation.deleteMany({ restaurantId: rest1._id });
  const todayStr = new Date().toISOString().split('T')[0];
  await Reservation.insertMany([
    { restaurantId: rest1._id, tableId: tables1[2]._id, customerName: 'Vikram Malhotra', customerPhone: '9988776655', guestCount: 4, date: todayStr, startTime: '19:30', endTime: '21:00', status: 'CONFIRMED' },
    { restaurantId: rest1._id, tableId: tables1[3]._id, customerName: 'Ananya Roy', customerPhone: '9871122334', guestCount: 6, date: todayStr, startTime: '20:15', endTime: '21:45', status: 'CONFIRMED' },
  ]);

  console.log(`✅ Restaurant 1 seeded: Trattoria Roma (Owner: ${owner1Email}, Staff: ${staff1Email})`);

  // ==========================================
  // 3. RESTAURANT 2: Spice Symphony (North Indian / Pan-Asian)
  // ==========================================
  const owner2Email = 'owner@spicesymphony.com';
  let owner2 = await User.findOne({ email: owner2Email });
  if (!owner2) {
    owner2 = await User.create({
      name: 'Vikramaditya Singhania',
      email: owner2Email,
      passwordHash: ownerPassword,
      role: 'RESTAURANT_OWNER',
      status: 'ACTIVE',
      phone: '+91 99880 11223',
      designation: 'Managing Director & Owner',
    });
  } else {
    owner2.passwordHash = ownerPassword;
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
      description: 'Royal Indian dining celebrating slow-cooked curries and authentic charcoal clay tandoor.',
      status: 'ACTIVE',
      seatingCapacity: 60,
      fssaiNumber: '11221002000889',
      gstNumber: '29AAECS5566K1Z9',
      settings: {
        currency: 'INR',
        taxRatePercent: 5,
        serviceChargePercent: 0,
        autoAcceptReservations: true,
        allowSpecialRequests: true,
      },
    });
  }
  owner2.restaurantId = rest2._id;
  await owner2.save();

  // Restaurant 2 Staff
  const staff2Email = 'staff@spicesymphony.com';
  let staff2 = await User.findOne({ email: staff2Email });
  if (!staff2) {
    staff2 = await User.create({
      name: 'Kabir Singh',
      email: staff2Email,
      passwordHash: staffPassword,
      role: 'RESTAURANT_STAFF',
      restaurantId: rest2._id,
      status: 'ACTIVE',
      phone: '+91 99880 33445',
      designation: 'Head Steward',
    });
  } else {
    staff2.restaurantId = rest2._id;
    staff2.passwordHash = staffPassword;
    staff2.status = 'ACTIVE';
    await staff2.save();
  }

  // Clear & Rebuild Rest 2 floor data
  await Table.deleteMany({ restaurantId: rest2._id });
  const tables2 = await Table.insertMany([
    { restaurantId: rest2._id, tableNumber: 'S-01', capacity: 2, section: 'Royal Courtyard', status: 'OCCUPIED' },
    { restaurantId: rest2._id, tableNumber: 'S-02', capacity: 4, section: 'Royal Courtyard', status: 'AVAILABLE' },
    { restaurantId: rest2._id, tableNumber: 'S-03', capacity: 4, section: 'Mughal Hall', status: 'AVAILABLE' },
    { restaurantId: rest2._id, tableNumber: 'S-04', capacity: 6, section: 'Mughal Hall', status: 'AVAILABLE' },
    { restaurantId: rest2._id, tableNumber: 'S-05', capacity: 10, section: 'Maharaja Suite', status: 'AVAILABLE' },
  ]);

  await MenuItem.deleteMany({ restaurantId: rest2._id });
  const menu2 = await MenuItem.insertMany([
    { restaurantId: rest2._id, name: 'Paneer Tikka Angara', category: 'Starters', price: 360, isVegetarian: true, isAvailable: true, description: 'Cottage cheese cubes marinated in smoked hung curd, kashmiri deggi mirch and ajwain.' },
    { restaurantId: rest2._id, name: 'Murgh Malai Tandoori Kebab', category: 'Starters', price: 440, isVegetarian: false, isAvailable: true, description: 'Melt-in-mouth chicken infused with green cardamom, cream cheese, and mace.' },
    { restaurantId: rest2._id, name: 'Butter Chicken Aslam Style', category: 'Mains', price: 540, isVegetarian: false, isAvailable: true, description: 'Roasted tandoori chicken simmered in rich velvety tomato, cashew, and fenugreek gravy.' },
    { restaurantId: rest2._id, name: 'Dal Makhani Slow-Simmered 24h', category: 'Mains', price: 390, isVegetarian: true, isAvailable: true, description: 'Black urad lentils slow-cooked overnight with churned white butter.' },
    { restaurantId: rest2._id, name: 'Dum Gosht Awadhi Biryani', category: 'Mains', price: 620, isVegetarian: false, isAvailable: true, description: 'Fragrant aged basmati rice layered with tender spring mutton and saffron.' },
    { restaurantId: rest2._id, name: 'Garlic Chur Chur Butter Naan', category: 'Mains', price: 110, isVegetarian: true, isAvailable: true, description: 'Clay-oven leavened bread layered with roasted garlic and farm butter.' },
    { restaurantId: rest2._id, name: 'Shahi Kesari Phirni', category: 'Desserts', price: 260, isVegetarian: true, isAvailable: true, description: 'Traditional Kashmiri rice pudding served in earthenware with silver vark and pistachios.' },
    { restaurantId: rest2._id, name: 'Alphonso Mango Lassi', category: 'Beverages', price: 190, isVegetarian: true, isAvailable: true, description: 'Chilled rich yogurt blended with pure Ratnagiri Alphonso mango pulp.' },
  ]);

  await Customer.deleteMany({ restaurantId: rest2._id });
  const customers2 = await Customer.insertMany([
    { restaurantId: rest2._id, name: 'Deepak Verma', phone: '9910022334', email: 'deepak.v@gmail.com', visitCount: 8, totalSpent: 9600 },
    { restaurantId: rest2._id, name: 'Sneha Kulkarni', phone: '9920033445', email: 'sneha.k@outlook.com', visitCount: 4, totalSpent: 4800 },
    { restaurantId: rest2._id, name: 'Harsh Vardhan', phone: '9930044556', email: 'harsh.v@gmail.com', visitCount: 2, totalSpent: 2600 },
  ]);

  // Active Order on Table S-01
  await Order.deleteMany({ restaurantId: rest2._id });
  await Bill.deleteMany({ restaurantId: rest2._id });
  const tableS01 = tables2.find((t) => t.tableNumber === 'S-01');
  const activeOrder2 = await Order.create({
    restaurantId: rest2._id,
    orderNumber: 'ORD-2001',
    tableId: tableS01._id,
    customerId: customers2[0]._id,
    status: 'PLACED',
    paymentStatus: 'PENDING',
    items: [
      { menuItemId: menu2[0]._id, name: menu2[0].name, price: menu2[0].price, quantity: 1, notes: 'Medium spice' },
      { menuItemId: menu2[3]._id, name: menu2[3].name, price: menu2[3].price, quantity: 1, notes: 'Extra butter on side' },
      { menuItemId: menu2[5]._id, name: menu2[5].name, price: menu2[5].price, quantity: 3, notes: 'Crispy' },
      { menuItemId: menu2[7]._id, name: menu2[7].name, price: menu2[7].price, quantity: 2, notes: 'Chilled' },
    ],
    subtotal: 1460,
    tax: 73,
    discount: 0,
    total: 1533,
  });
  tableS01.currentOrderId = activeOrder2._id;
  await tableS01.save();

  // Completed past order & bill for revenue reports
  const completedOrder2 = await Order.create({
    restaurantId: rest2._id,
    orderNumber: 'ORD-1999',
    tableId: tables2[1]._id,
    customerId: customers2[1]._id,
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    items: [
      { menuItemId: menu2[2]._id, name: menu2[2].name, price: menu2[2].price, quantity: 1 },
      { menuItemId: menu2[4]._id, name: menu2[4].name, price: menu2[4].price, quantity: 1 },
      { menuItemId: menu2[5]._id, name: menu2[5].name, price: menu2[5].price, quantity: 2 },
    ],
    subtotal: 1380,
    tax: 69,
    discount: 100,
    total: 1349,
  });
  const bill2 = await Bill.create({
    restaurantId: rest2._id,
    orderId: completedOrder2._id,
    billNumber: 'BILL-2001',
    tableId: tables2[1]._id,
    subtotal: 1380,
    tax: 69,
    discount: 100,
    total: 1349,
    status: 'PAID',
    paymentMethod: 'CARD',
    items: completedOrder2.items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, total: i.price * i.quantity })),
  });
  await Payment.create({
    restaurantId: rest2._id,
    billId: bill2._id,
    amount: 1349,
    method: 'CARD',
    status: 'SUCCESS',
    transactionReference: 'CARD-AUTH-99104',
  });

  // Queue entries
  await QueueEntry.deleteMany({ restaurantId: rest2._id });
  await QueueEntry.insertMany([
    { restaurantId: rest2._id, customerName: 'Manish Pandey', customerPhone: '9940055667', guestCount: 6, position: 1, status: 'WAITING' },
    { restaurantId: rest2._id, customerName: 'Priya Nambiar', customerPhone: '9950066778', guestCount: 2, position: 2, status: 'WAITING' },
  ]);

  // Reservations
  await Reservation.deleteMany({ restaurantId: rest2._id });
  await Reservation.insertMany([
    { restaurantId: rest2._id, tableId: tables2[3]._id, customerName: 'Rajesh Khanna', customerPhone: '9960077889', guestCount: 6, date: todayStr, startTime: '20:00', endTime: '21:30', status: 'CONFIRMED' },
    { restaurantId: rest2._id, tableId: tables2[4]._id, customerName: 'Sunita Menon', customerPhone: '9970088990', guestCount: 8, date: todayStr, startTime: '21:00', endTime: '22:30', status: 'CONFIRMED' },
  ]);

  console.log(`✅ Restaurant 2 seeded: Spice Symphony (Owner: ${owner2Email}, Staff: ${staff2Email})`);

  console.log('\n======================================================');
  console.log('🎉 RESTORA PRESENTATION CREDENTIALS READY:');
  console.log('======================================================');
  console.log('👑 1. PLATFORM ADMIN:');
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: Admin@123`);
  console.log(`   Scope:    Global Platform Overview, Applications, Restaurants`);
  console.log('------------------------------------------------------');
  console.log('🏛️ 2. RESTAURANT 1 — Trattoria Roma (Italian Bistro):');
  console.log(`   Owner:    ${owner1Email} (or owner@bistro.com)`);
  console.log(`   Password: Owner@123`);
  console.log(`   Staff:    ${staff1Email} (or staff@bistro.com)`);
  console.log(`   Password: Staff@123`);
  console.log('------------------------------------------------------');
  console.log('🍛 3. RESTAURANT 2 — Spice Symphony (Royal Indian):');
  console.log(`   Owner:    ${owner2Email}`);
  console.log(`   Password: Owner@123`);
  console.log(`   Staff:    ${staff2Email}`);
  console.log(`   Password: Staff@123`);
  console.log('======================================================\n');
};

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seedForPresentation.js')) {
  runPresentationSeed()
    .then(() => {
      console.log('Seeding finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
