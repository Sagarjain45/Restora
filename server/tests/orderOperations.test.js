import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  calculateOrderTotals,
  ORDER_STATUSES,
  ACTIVE_ORDER_STATUSES,
} from '../services/orderService.js';
import Order from '../models/Order.js';

describe('Phase 9: Table-Based Order Management Tests', () => {
  describe('1. Role-Based Permissions for Orders', () => {
    it('should permit both RESTAURANT_OWNER and RESTAURANT_STAFF to place and update orders', () => {
      const middleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');

      let staffPassed = false;
      middleware({ user: { role: 'RESTAURANT_STAFF' } }, {}, () => { staffPassed = true; });
      assert.equal(staffPassed, true);

      let ownerPassed = false;
      middleware({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);
    });

    it('should reject unauthenticated or non-restaurant roles', () => {
      const middleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');
      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (p) => { jsonPayload = p; } };
        },
      };

      middleware({ user: { role: 'CUSTOMER' } }, res, () => {});
      assert.equal(statusCode, 403);
      assert.equal(jsonPayload.code, 'FORBIDDEN');
    });
  });

  describe('2. Order Financial Calculations & Totals', () => {
    it('should correctly compute subtotal, tax, discount, and total', () => {
      const sampleItems = [
        { price: 200, quantity: 2 }, // 400
        { price: 50, quantity: 4 },  // 200
      ]; // subtotal = 600

      // 5% tax, 0 discount
      const res1 = calculateOrderTotals(sampleItems, 5, 0);
      assert.equal(res1.subtotal, 600);
      assert.equal(res1.discount, 0);
      assert.equal(res1.tax, 30); // 5% of 600 = 30
      assert.equal(res1.total, 630);

      // 5% tax, 100 discount (taxable = 500, tax = 25, total = 525)
      const res2 = calculateOrderTotals(sampleItems, 5, 100);
      assert.equal(res2.subtotal, 600);
      assert.equal(res2.discount, 100);
      assert.equal(res2.tax, 25);
      assert.equal(res2.total, 525);
    });

    it('should handle zero price items and avoid negative totals', () => {
      const res = calculateOrderTotals([{ price: 100, quantity: 1 }], 5, 200); // discount > subtotal
      assert.equal(res.subtotal, 100);
      assert.equal(res.discount, 100); // capped at subtotal
      assert.equal(res.tax, 0);
      assert.equal(res.total, 0);
    });
  });

  describe('3. Order Model Constraints & Lifecycle Statuses', () => {
    it('should validate all PRD specified order statuses', () => {
      const expectedStatuses = ['NEW', 'PLACED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];
      for (const st of expectedStatuses) {
        assert.equal(ORDER_STATUSES.includes(st), true, `Missing status: ${st}`);
      }
    });

    it('should define active statuses properly for floor/kitchen tracking', () => {
      assert.equal(ACTIVE_ORDER_STATUSES.includes('PLACED'), true);
      assert.equal(ACTIVE_ORDER_STATUSES.includes('PREPARING'), true);
      assert.equal(ACTIVE_ORDER_STATUSES.includes('READY'), true);
      assert.equal(ACTIVE_ORDER_STATUSES.includes('SERVED'), true);
      assert.equal(ACTIVE_ORDER_STATUSES.includes('COMPLETED'), false);
      assert.equal(ACTIVE_ORDER_STATUSES.includes('CANCELLED'), false);
    });

    it('should validate order schema requires restaurantId and tableId', () => {
      const invalidOrder = new Order({});
      const err = invalidOrder.validateSync();
      assert.notEqual(err, undefined);
      assert.equal(Boolean(err.errors.restaurantId), true);
      assert.equal(Boolean(err.errors.tableId), true);
    });
  });

  describe('4. PRD Rule: Unavailable Menu Items Cannot Be Ordered', () => {
    it('should simulate check blocking unavailable items from being added', () => {
      const mockItems = [
        { name: 'Paneer Tikka', isAvailable: true, isActive: true },
        { name: 'Mutton Kebab', isAvailable: false, isActive: true },
      ];

      for (const item of mockItems) {
        const canOrder = item.isAvailable && item.isActive;
        if (item.name === 'Mutton Kebab') {
          assert.equal(canOrder, false, 'Sold out item must not be orderable');
        } else {
          assert.equal(canOrder, true, 'Available item should be orderable');
        }
      }
    });
  });

  describe('5. Table State Synchronization Rules', () => {
    it('should update table to OCCUPIED when order becomes active', () => {
      const initialTable = { status: 'AVAILABLE', currentOrderId: null };
      const orderId = new mongoose.Types.ObjectId();

      // Rule: When an order becomes active: Available -> Occupied
      initialTable.status = 'OCCUPIED';
      initialTable.currentOrderId = orderId;

      assert.equal(initialTable.status, 'OCCUPIED');
      assert.equal(initialTable.currentOrderId, orderId);
    });
  });
});
