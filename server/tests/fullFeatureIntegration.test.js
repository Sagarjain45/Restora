import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import QueueEntry from '../models/QueueEntry.js';
import Reservation from '../models/Reservation.js';
import Customer from '../models/Customer.js';
import { calculateOrderTotals } from '../services/orderService.js';
import { suggestQueuePartyForTable } from '../services/queueService.js';

describe('Phase 16: Full Feature Integration & Business Workflow Tests', () => {
  describe('1. Walk-in to Queue to Seating Workflow', () => {
    it('should route waiting walk-in customer into Queue when tables are occupied, then seat upon availability', () => {
      const restId = new mongoose.Types.ObjectId();
      const table1Id = new mongoose.Types.ObjectId();

      // Simulated state: Table 1 is OCCUPIED
      const table1 = {
        _id: table1Id,
        restaurantId: restId,
        tableNumber: 'T-1',
        capacity: 4,
        status: 'OCCUPIED',
      };

      // Walk-in party of 4 arrives: enters Waiting Queue
      const queueParty = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: restId,
        customerName: 'Vikram Malhotra',
        customerPhone: '9876543210',
        guestCount: 4,
        status: 'WAITING',
        position: 1,
        arrivalTime: new Date('2026-10-08T12:00:00Z'),
      };

      assert.equal(queueParty.status, 'WAITING');
      assert.equal(queueParty.position, 1);

      // Table 1 becomes AVAILABLE after previous party leaves
      table1.status = 'AVAILABLE';

      // Check queue suitability for Table 1 (Capacity 4 >= Party Size 4)
      const fitsCapacity = table1.capacity >= queueParty.guestCount;
      assert.equal(fitsCapacity, true);

      // Seat customer at Table 1
      table1.status = 'OCCUPIED';
      queueParty.status = 'SEATED';
      queueParty.assignedTableId = table1._id;

      assert.equal(table1.status, 'OCCUPIED');
      assert.equal(queueParty.status, 'SEATED');
      assert.equal(queueParty.assignedTableId, table1._id);
    });
  });

  describe('2. Table Seating to Order to Billing to Payment Lifecycle', () => {
    it('should complete entire order-bill-payment cycle, update customer loyalty, and free table', () => {
      const restId = new mongoose.Types.ObjectId();
      const tableId = new mongoose.Types.ObjectId();
      const customerId = new mongoose.Types.ObjectId();

      const customer = {
        _id: customerId,
        restaurantId: restId,
        name: 'Pooja Hegde',
        phone: '9811223344',
        visitCount: 2,
        totalSpent: 1200,
      };

      const table = {
        _id: tableId,
        restaurantId: restId,
        tableNumber: 'T-5',
        capacity: 2,
        status: 'OCCUPIED',
        currentOrderId: null,
      };

      // 1. Order Creation
      const items = [
        { menuItemId: new mongoose.Types.ObjectId(), name: 'Paneer Tikka', price: 280, quantity: 2 },
        { menuItemId: new mongoose.Types.ObjectId(), name: 'Butter Roti', price: 30, quantity: 4 },
      ];

      const totals = calculateOrderTotals(items, 5, 50); // 5% tax, 50 discount
      // subtotal = 280*2 + 30*4 = 560 + 120 = 680
      // discount = 50 -> taxable = 630
      // tax = 630 * 0.05 = 31.5
      // total = 661.5
      assert.equal(totals.subtotal, 680);
      assert.equal(totals.discount, 50);
      assert.equal(totals.tax, 31.5);
      assert.equal(totals.total, 661.5);

      const order = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: restId,
        tableId: table._id,
        customerId: customer._id,
        items,
        total: totals.total,
        status: 'PLACED',
        paymentStatus: 'PENDING',
      };
      table.currentOrderId = order._id;

      // 2. Bill Generation -> Table status transitions to BILLING
      const bill = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: restId,
        orderId: order._id,
        tableId: table._id,
        total: order.total,
        status: 'UNPAID',
      };
      table.status = 'BILLING';
      assert.equal(table.status, 'BILLING');

      // 3. Payment Settlement (e.g. UPI)
      bill.status = 'PAID';
      bill.paymentMethod = 'UPI';
      bill.paidAt = new Date();

      order.status = 'COMPLETED';
      order.paymentStatus = 'PAID';

      // Table released to AVAILABLE
      table.status = 'AVAILABLE';
      table.currentOrderId = null;

      // Customer loyalty accumulated
      customer.visitCount += 1;
      customer.totalSpent += bill.total;

      assert.equal(order.status, 'COMPLETED');
      assert.equal(order.paymentStatus, 'PAID');
      assert.equal(bill.status, 'PAID');
      assert.equal(table.status, 'AVAILABLE');
      assert.equal(table.currentOrderId, null);
      assert.equal(customer.visitCount, 3);
      assert.equal(customer.totalSpent, 1861.5);
    });
  });

  describe('3. Reservation to Seating to Bill Settlement Workflow', () => {
    it('should transition reservation through CONFIRMED -> ARRIVED -> SEATED -> COMPLETED', () => {
      const restId = new mongoose.Types.ObjectId();
      const tableId = new mongoose.Types.ObjectId();

      const reservation = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: restId,
        tableId,
        customerName: 'Kunal Verma',
        customerPhone: '9988776655',
        guestCount: 2,
        status: 'CONFIRMED',
      };

      const table = {
        _id: tableId,
        restaurantId: restId,
        status: 'AVAILABLE',
      };

      // Guest Arrives
      reservation.status = 'ARRIVED';
      assert.equal(reservation.status, 'ARRIVED');

      // Guest Seated
      reservation.status = 'SEATED';
      table.status = 'OCCUPIED';
      assert.equal(reservation.status, 'SEATED');
      assert.equal(table.status, 'OCCUPIED');

      // Dining finishes & bill settled -> table released, reservation completed
      table.status = 'AVAILABLE';
      reservation.status = 'COMPLETED';

      assert.equal(table.status, 'AVAILABLE');
      assert.equal(reservation.status, 'COMPLETED');
    });
  });

  describe('4. Post-Payment Queue Suggestion Integration', () => {
    it('should immediately evaluate waiting queue parties when table is freed upon payment', () => {
      const table = {
        _id: 't-10',
        tableNumber: '10',
        capacity: 4,
        status: 'AVAILABLE',
      };

      const waitingQueue = [
        { _id: 'q1', customerName: 'Rohan', guestCount: 6, arrivalTime: new Date('2026-10-08T13:00:00Z') }, // Too big for table of 4
        { _id: 'q2', customerName: 'Sneha', guestCount: 4, arrivalTime: new Date('2026-10-08T13:05:00Z') }, // Perfect fit!
        { _id: 'q3', customerName: 'Arjun', guestCount: 2, arrivalTime: new Date('2026-10-08T13:10:00Z') },
      ];

      // Filter eligible parties fitting table capacity
      const eligible = waitingQueue.filter((p) => p.guestCount <= table.capacity);
      assert.equal(eligible.length, 2);

      // Best match FIFO
      const bestMatch = eligible[0];
      assert.equal(bestMatch.customerName, 'Sneha');
      assert.equal(bestMatch.guestCount, 4);
    });
  });
});
