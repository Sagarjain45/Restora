import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import Restaurant from '../models/Restaurant.js';
import Customer from '../models/Customer.js';
import Reservation from '../models/Reservation.js';
import { suggestQueuePartyForTable } from './queueService.js';
import mongoose from 'mongoose';

/**
 * Service for Restaurant Billing & Payment (Phase 10)
 * Handles bill generation, tax/discount calculation,
 * payment recording (Cash, UPI, Card), order completion,
 * and automated table release back to AVAILABLE.
 */

export const ACCEPTED_PAYMENT_METHODS = ['CASH', 'UPI', 'CARD'];

/**
 * Generate human-readable invoice / bill number (e.g. INV-1082)
 */
const generateBillNumber = () => {
  const now = new Date();
  const timePart = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `INV-${timePart}-${randomSuffix}`;
};

/**
 * Generate a bill for an active order
 */
export const generateBill = async (restaurantId, data) => {
  const { orderId, discount = null, notes = '' } = data;

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error('Valid order ID is required to generate a bill');
    error.statusCode = 400;
    throw error;
  }

  // 1. Fetch order and verify tenant
  const order = await Order.findOne({ _id: orderId, restaurantId });
  if (!order) {
    const error = new Error('Order not found or belongs to another tenant');
    error.statusCode = 404;
    throw error;
  }

  if (order.status === 'CANCELLED') {
    const error = new Error('Cannot generate a bill for a cancelled order');
    error.statusCode = 400;
    throw error;
  }

  if (order.status === 'COMPLETED' && order.paymentStatus === 'PAID') {
    const existingPaid = await Bill.findOne({ restaurantId, orderId, status: 'PAID' });
    if (existingPaid) {
      return existingPaid;
    }
  }

  if (!order.items || order.items.length === 0) {
    const error = new Error('Cannot generate bill for an empty order without items');
    error.statusCode = 400;
    throw error;
  }

  // 2. Check if an unpaid bill already exists for this order
  let bill = await Bill.findOne({ restaurantId, orderId, status: 'UNPAID' });

  // 3. Retrieve restaurant tax settings
  const restaurant = await Restaurant.findById(restaurantId).select('settings');
  const taxRate = order.taxRate ?? (restaurant?.settings?.taxRatePercent ?? 5);

  // 4. Calculate items snapshot & totals
  const itemsSnapshot = order.items.map((item) => ({
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    total: Math.round(item.price * item.quantity * 100) / 100,
    notes: item.notes || '',
  }));

  const subtotal = itemsSnapshot.reduce((sum, i) => sum + i.total, 0);
  const activeDiscount = discount !== null && discount !== undefined
    ? Math.min(Math.max(parseFloat(discount) || 0, 0), subtotal)
    : order.discount || 0;

  const taxableAmount = Math.max(0, subtotal - activeDiscount);
  const tax = Math.round(taxableAmount * (taxRate / 100) * 100) / 100;
  const total = Math.round((taxableAmount + tax) * 100) / 100;

  if (bill) {
    // Update existing unpaid bill
    bill.items = itemsSnapshot;
    bill.subtotal = subtotal;
    bill.taxRate = taxRate;
    bill.tax = tax;
    bill.discount = activeDiscount;
    bill.total = total;
    if (notes) bill.notes = String(notes).trim();
    await bill.save();
  } else {
    // Create new bill
    bill = await Bill.create({
      restaurantId,
      billNumber: generateBillNumber(),
      orderId: order._id,
      tableId: order.tableId,
      items: itemsSnapshot,
      subtotal,
      taxRate,
      tax,
      discount: activeDiscount,
      total,
      status: 'UNPAID',
      notes: String(notes || '').trim(),
    });
  }

  // 5. Update Table State: Occupied -> Billing
  const table = await Table.findOne({ _id: order.tableId, restaurantId });
  if (table) {
    table.status = 'BILLING';
    await table.save();
  }

  return bill;
};

/**
 * Record payment and complete the order-to-table workflow
 */
export const recordPayment = async (restaurantId, data) => {
  const { billId, paymentMethod, amount, transactionReference = null } = data;

  if (!billId || !mongoose.Types.ObjectId.isValid(billId)) {
    const error = new Error('Valid bill ID is required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedMethod = String(paymentMethod || '').toUpperCase();
  if (!ACCEPTED_PAYMENT_METHODS.includes(normalizedMethod)) {
    const error = new Error(
      `Payment method "${paymentMethod}" is invalid. Accepted: ${ACCEPTED_PAYMENT_METHODS.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  // 1. Fetch Bill
  const bill = await Bill.findOne({ _id: billId, restaurantId });
  if (!bill) {
    const error = new Error('Bill not found or belongs to another restaurant tenant');
    error.statusCode = 404;
    throw error;
  }

  if (bill.status === 'PAID') {
    const error = new Error('This bill has already been paid and settled');
    error.statusCode = 400;
    throw error;
  }

  if (bill.status === 'VOID') {
    const error = new Error('Cannot process payment on a voided bill');
    error.statusCode = 400;
    throw error;
  }

  const paidAmount = parseFloat(amount) || bill.total;
  if (paidAmount < bill.total) {
    const error = new Error(
      `Paid amount (₹${paidAmount}) is less than the bill total (₹${bill.total})`
    );
    error.statusCode = 400;
    throw error;
  }

  const paidAt = new Date();

  // 2. Create Payment Record
  const payment = await Payment.create({
    restaurantId,
    billId: bill._id,
    orderId: bill.orderId,
    amount: paidAmount,
    method: normalizedMethod,
    status: 'SUCCESS',
    transactionReference: transactionReference ? String(transactionReference).trim() : null,
    paidAt,
  });

  // 3. Settle Bill
  bill.status = 'PAID';
  bill.paymentMethod = normalizedMethod;
  bill.paidAt = paidAt;
  await bill.save();

  // 4. Complete Order
  const order = await Order.findOne({ _id: bill.orderId, restaurantId });
  if (order) {
    order.status = 'COMPLETED';
    order.paymentStatus = 'PAID';
    await order.save();
  }

  // 5. Release Table (Phase 10 Rule: Order = COMPLETED, Payment = PAID, Table = AVAILABLE)
  const table = await Table.findOne({ _id: bill.tableId, restaurantId });
  if (table) {
    table.status = 'AVAILABLE';
    table.currentOrderId = null;
    await table.save();
  }

  // 6. Full Feature Integration (Phase 16)
  // A. Customer Lifetime Spend & Loyalty Tracking
  if (order && order.customerId) {
    try {
      await Customer.findOneAndUpdate(
        { _id: order.customerId, restaurantId },
        {
          $inc: { visitCount: 1, totalSpent: bill.total },
          $set: { lastVisit: paidAt },
        }
      );
    } catch (custErr) {
      console.warn('Customer loyalty update warning:', custErr.message);
    }
  }

  // B. Reservation Lifecycle Completion
  if (bill.tableId) {
    try {
      await Reservation.updateMany(
        { restaurantId, tableId: bill.tableId, status: 'SEATED' },
        { $set: { status: 'COMPLETED' } }
      );
    } catch (resErr) {
      console.warn('Reservation completion warning:', resErr.message);
    }
  }

  // C. Automated Queue Check for Newly Freed Table
  let queueSuggestion = null;
  if (bill.tableId) {
    try {
      const suggestionResult = await suggestQueuePartyForTable(restaurantId, bill.tableId);
      queueSuggestion = suggestionResult?.bestMatch || null;
    } catch (qErr) {
      console.warn('Queue suggestion check warning:', qErr.message);
    }
  }

  return {
    bill,
    payment,
    order,
    table,
    suggestedQueueParty: queueSuggestion,
  };
};

/**
 * Retrieve bills for the restaurant tenant with optional filters
 */
export const getBills = async (restaurantId, query = {}) => {
  const filter = { restaurantId };

  if (query.status && query.status !== 'ALL') {
    filter.status = query.status.toUpperCase();
  }

  if (query.tableId && mongoose.Types.ObjectId.isValid(query.tableId)) {
    filter.tableId = query.tableId;
  }

  if (query.search) {
    const cleanSearch = String(query.search).trim();
    if (cleanSearch) {
      filter.$or = [
        { billNumber: { $regex: cleanSearch, $options: 'i' } },
        { notes: { $regex: cleanSearch, $options: 'i' } },
      ];
    }
  }

  const bills = await Bill.find(filter)
    .populate('tableId', 'tableNumber section')
    .populate('orderId', 'orderNumber status')
    .sort({ createdAt: -1 });

  // Calculate billing summary
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const allTenantBills = await Bill.find({ restaurantId });
  const paidBills = allTenantBills.filter((b) => b.status === 'PAID');
  const todaysPaidBills = paidBills.filter((b) => new Date(b.paidAt || b.createdAt) >= startOfDay);

  const summary = {
    totalBills: allTenantBills.length,
    paidCount: paidBills.length,
    unpaidCount: allTenantBills.filter((b) => b.status === 'UNPAID').length,
    totalSales: paidBills.reduce((acc, b) => acc + (b.total || 0), 0),
    todaySales: todaysPaidBills.reduce((acc, b) => acc + (b.total || 0), 0),
  };

  return { bills, summary };
};

/**
 * Retrieve a single bill with full invoice details
 */
export const getBillById = async (restaurantId, billId) => {
  if (!mongoose.Types.ObjectId.isValid(billId)) {
    const error = new Error('Invalid bill ID');
    error.statusCode = 400;
    throw error;
  }

  const bill = await Bill.findOne({ _id: billId, restaurantId })
    .populate('tableId', 'tableNumber section capacity')
    .populate('orderId', 'orderNumber status customerId');

  if (!bill) {
    const error = new Error('Bill not found or belongs to another restaurant tenant');
    error.statusCode = 404;
    throw error;
  }

  const restaurant = await Restaurant.findById(restaurantId).select(
    'name email phone address city state settings'
  );

  return { bill, restaurant };
};

/**
 * Retrieve bill for a specific order
 */
export const getBillByOrder = async (restaurantId, orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error('Invalid order ID');
    error.statusCode = 400;
    throw error;
  }

  const bill = await Bill.findOne({ restaurantId, orderId })
    .populate('tableId', 'tableNumber section')
    .populate('orderId', 'orderNumber status');

  return bill;
};

/**
 * Void an unpaid bill
 */
export const voidBill = async (restaurantId, billId, reason = '') => {
  const bill = await Bill.findOne({ _id: billId, restaurantId });
  if (!bill) {
    const error = new Error('Bill not found');
    error.statusCode = 404;
    throw error;
  }

  if (bill.status === 'PAID') {
    const error = new Error('Cannot void a paid bill');
    error.statusCode = 400;
    throw error;
  }

  bill.status = 'VOID';
  if (reason) bill.notes = `VOID: ${reason}`;
  await bill.save();

  // Return table to OCCUPIED if order is still active
  const order = await Order.findById(bill.orderId);
  if (order && order.status !== 'CANCELLED' && order.status !== 'COMPLETED') {
    const table = await Table.findById(bill.tableId);
    if (table) {
      table.status = 'OCCUPIED';
      await table.save();
    }
  }

  return bill;
};

/**
 * Retrieve payment history log
 */
export const getPayments = async (restaurantId, query = {}) => {
  const filter = { restaurantId };

  if (query.method && query.method !== 'ALL') {
    filter.method = query.method.toUpperCase();
  }

  const payments = await Payment.find(filter)
    .populate('billId', 'billNumber total status')
    .populate('orderId', 'orderNumber')
    .sort({ paidAt: -1 });

  return payments;
};
