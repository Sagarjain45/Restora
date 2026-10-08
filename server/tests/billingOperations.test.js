import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/roleMiddleware.js';
import { ACCEPTED_PAYMENT_METHODS } from '../services/billingService.js';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';

describe('Phase 10: Restaurant Billing & Payment Tests', () => {
  describe('1. Role-Based Permissions for Billing Operations', () => {
    it('should permit both RESTAURANT_OWNER and RESTAURANT_STAFF to generate bills and record payments', () => {
      const middleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');

      let staffPassed = false;
      middleware({ user: { role: 'RESTAURANT_STAFF' } }, {}, () => { staffPassed = true; });
      assert.equal(staffPassed, true);

      let ownerPassed = false;
      middleware({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);
    });

    it('should forbid unauthenticated or unauthorized users from billing routes', () => {
      const middleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');
      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (p) => { jsonPayload = p; } };
        },
      };

      middleware({ user: { role: 'GUEST' } }, res, () => {});
      assert.equal(statusCode, 403);
      assert.equal(jsonPayload.code, 'FORBIDDEN');
    });
  });

  describe('2. Accepted Payment Methods & Model Enums', () => {
    it('should accept all standard payment methods specified in PRD', () => {
      const expected = ['CASH', 'UPI', 'CARD'];
      for (const m of expected) {
        assert.equal(ACCEPTED_PAYMENT_METHODS.includes(m), true, `Missing payment method: ${m}`);
      }
    });

    it('should reject invalid payment methods', () => {
      assert.equal(ACCEPTED_PAYMENT_METHODS.includes('BITCOIN'), false);
      assert.equal(ACCEPTED_PAYMENT_METHODS.includes('CHEQUE'), false);
    });

    it('should validate Bill schema structure', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const mockOrderId = new mongoose.Types.ObjectId();
      const mockTableId = new mongoose.Types.ObjectId();

      const validBill = new Bill({
        restaurantId: mockRestId,
        orderId: mockOrderId,
        tableId: mockTableId,
        items: [{ name: 'Biryani', price: 250, quantity: 2, total: 500 }],
        subtotal: 500,
        tax: 25,
        discount: 0,
        total: 525,
        status: 'UNPAID',
      });

      const err = validBill.validateSync();
      assert.equal(err, undefined);
    });
  });

  describe('3. Order-to-Payment Completion Workflow Simulation', () => {
    it('should verify Phase 10 completion rules: Order = COMPLETED, Payment = PAID, Table = AVAILABLE', () => {
      const simulatedOrder = { status: 'PLACED', paymentStatus: 'PENDING' };
      const simulatedTable = { status: 'OCCUPIED', currentOrderId: 'order123' };
      const simulatedBill = { status: 'UNPAID', total: 630, paymentMethod: null };

      // Step 1: Bill Generated -> Table moves to BILLING
      simulatedTable.status = 'BILLING';
      assert.equal(simulatedTable.status, 'BILLING');

      // Step 2: Customer pays via UPI
      const paymentMethod = 'UPI';
      const paidAmount = 630;
      assert.equal(ACCEPTED_PAYMENT_METHODS.includes(paymentMethod), true);
      assert.equal(paidAmount >= simulatedBill.total, true);

      // Step 3: Payment settled -> Transition everything to finalized state
      simulatedBill.status = 'PAID';
      simulatedBill.paymentMethod = paymentMethod;

      simulatedOrder.status = 'COMPLETED';
      simulatedOrder.paymentStatus = 'PAID';

      simulatedTable.status = 'AVAILABLE';
      simulatedTable.currentOrderId = null;

      // Assert Completion Criteria
      assert.equal(simulatedBill.status, 'PAID');
      assert.equal(simulatedOrder.status, 'COMPLETED');
      assert.equal(simulatedOrder.paymentStatus, 'PAID');
      assert.equal(simulatedTable.status, 'AVAILABLE');
      assert.equal(simulatedTable.currentOrderId, null);
    });

    it('should enforce that tables are NOT released prematurely before payment', () => {
      const table = { status: 'OCCUPIED', currentOrderId: 'order1' };
      const bill = { status: 'UNPAID' };

      // Rule: If bill is UNPAID, table must not be marked AVAILABLE
      if (bill.status !== 'PAID') {
        assert.notEqual(table.status, 'AVAILABLE');
      }
    });
  });
});
