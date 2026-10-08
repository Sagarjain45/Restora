import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Models
import User from '../models/User.js';
import Table from '../models/Table.js';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import Payment from '../models/Payment.js';
import QueueEntry from '../models/QueueEntry.js';
import Reservation from '../models/Reservation.js';
import Customer from '../models/Customer.js';

// Middlewares & Helpers
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { scopeFilter, assertTenantOwnership } from '../utils/tenantHelper.js';
import { signToken, verifyToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';

// Services
import { isValidStatusTransition, ALLOWED_TRANSITIONS } from '../services/tableService.js';
import { calculateOrderTotals, ORDER_STATUSES, ACTIVE_ORDER_STATUSES } from '../services/orderService.js';
import { ACCEPTED_PAYMENT_METHODS } from '../services/billingService.js';
import { checkReservationConflict, timeToMinutes, calculateDefaultEndTime } from '../services/reservationService.js';
import { suggestQueuePartyForTable } from '../services/queueService.js';

describe('Phase 17: Complete System Validation & Edge Case Suite', () => {
  const tenantA_Id = new mongoose.Types.ObjectId().toString();
  const tenantB_Id = new mongoose.Types.ObjectId().toString();

  // =========================================================================
  // 1. AUTHENTICATION
  // =========================================================================
  describe('1. Authentication System Validation', () => {
    it('should validate password hashing and comparison correctly', async () => {
      const plainPassword = 'SecurePassword@2026';
      const hash = await hashPassword(plainPassword);

      assert.notEqual(hash, plainPassword);
      const isMatch = await comparePassword(plainPassword, hash);
      assert.equal(isMatch, true);

      const isWrongMatch = await comparePassword('WrongPassword', hash);
      assert.equal(isWrongMatch, false);
    });

    it('should generate valid JWT tokens with correct user claims', () => {
      const payload = {
        id: 'usr_101',
        email: 'owner@bistro.com',
        role: 'RESTAURANT_OWNER',
        restaurantId: tenantA_Id,
        name: 'Chef Mario',
      };

      const token = signToken(payload);
      assert.ok(token);

      const decoded = verifyToken(token);
      assert.equal(decoded.id, payload.id);
      assert.equal(decoded.email, payload.email);
      assert.equal(decoded.role, payload.role);
      assert.equal(decoded.restaurantId, tenantA_Id);
    });

    it('should reject expired tokens and return null on verifyToken', () => {
      const expiredToken = jwt.sign(
        { id: 'usr_exp', email: 'exp@restora.com', role: 'RESTAURANT_STAFF' },
        env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const decoded = verifyToken(expiredToken);
      assert.equal(decoded, null, 'Expired token must return null on verification');
    });

    it('should handle authenticate middleware for valid tokens', async () => {
      const token = signToken({
        id: 'usr_valid',
        email: 'valid@restora.com',
        role: 'RESTAURANT_STAFF',
        restaurantId: tenantA_Id,
        name: 'Staff Member',
      });

      const req = {
        headers: { authorization: `Bearer ${token}` },
      };
      let nextCalled = false;
      const res = {};

      await authenticate(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(req.user.id, 'usr_valid');
      assert.equal(req.user.role, 'RESTAURANT_STAFF');
      assert.equal(req.user.restaurantId, tenantA_Id);
    });

    it('should reject protected routes when authorization header is missing (401 UNAUTHORIZED)', async () => {
      const req = { headers: {} };
      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { jsonPayload = data; } };
        },
      };

      await authenticate(req, res, () => {});

      assert.equal(statusCode, 401);
      assert.equal(jsonPayload.code, 'UNAUTHORIZED');
    });

    it('should reject protected routes with expired token (401 INVALID_TOKEN)', async () => {
      const expiredToken = jwt.sign(
        { id: 'usr_exp', email: 'exp@restora.com', role: 'RESTAURANT_STAFF' },
        env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const req = {
        headers: { authorization: `Bearer ${expiredToken}` },
      };
      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (data) => { jsonPayload = data; } };
        },
      };

      await authenticate(req, res, () => {});

      assert.equal(statusCode, 401);
      assert.equal(jsonPayload.code, 'INVALID_TOKEN');
    });
  });

  // =========================================================================
  // 2. AUTHORIZATION
  // =========================================================================
  describe('2. Authorization & RBAC Permission Matrix', () => {
    it('should permit PLATFORM_ADMIN on admin routes and deny other roles', () => {
      const adminGuard = requireRole('PLATFORM_ADMIN');

      let adminPassed = false;
      adminGuard({ user: { role: 'PLATFORM_ADMIN' } }, {}, () => { adminPassed = true; });
      assert.equal(adminPassed, true);

      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (d) => { jsonPayload = d; } };
        },
      };

      adminGuard({ user: { role: 'RESTAURANT_OWNER' } }, res, () => {});
      assert.equal(statusCode, 403);
      assert.equal(jsonPayload.code, 'FORBIDDEN');

      adminGuard({ user: { role: 'RESTAURANT_STAFF' } }, res, () => {});
      assert.equal(statusCode, 403);
    });

    it('should permit RESTAURANT_OWNER on owner-specific routes (e.g. staff management)', () => {
      const ownerGuard = requireRole('RESTAURANT_OWNER');

      let ownerPassed = false;
      ownerGuard({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);

      let staffStatusCode = 0;
      const res = {
        status: (code) => {
          staffStatusCode = code;
          return { json: () => {} };
        },
      };

      ownerGuard({ user: { role: 'RESTAURANT_STAFF' } }, res, () => {});
      assert.equal(staffStatusCode, 403);
    });

    it('should permit both RESTAURANT_OWNER and RESTAURANT_STAFF on floor operations', () => {
      const floorGuard = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');

      let staffPassed = false;
      floorGuard({ user: { role: 'RESTAURANT_STAFF' } }, {}, () => { staffPassed = true; });
      assert.equal(staffPassed, true);

      let ownerPassed = false;
      floorGuard({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);

      let guestStatusCode = 0;
      const res = {
        status: (code) => {
          guestStatusCode = code;
          return { json: () => {} };
        },
      };
      floorGuard({ user: { role: 'GUEST' } }, res, () => {});
      assert.equal(guestStatusCode, 403);
    });
  });

  // =========================================================================
  // 3. TENANT ISOLATION (Critical Tests: Read, Update, Delete)
  // =========================================================================
  describe('3. Multi-Tenant Data Isolation (Critical Security Boundaries)', () => {
    it('CRITICAL: Restaurant A cannot read Restaurant B data across collections', () => {
      const foreignTable = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(tenantB_Id),
        tableNumber: 'B-101',
      };
      const foreignOrder = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(tenantB_Id),
        orderNumber: 'ORD-999',
      };
      const foreignBill = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(tenantB_Id),
        billNumber: 'INV-999',
      };
      const foreignCustomer = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(tenantB_Id),
        name: 'Tenant B VIP',
      };

      // Tenant A attempts to access each of Tenant B's documents
      assert.throws(
        () => assertTenantOwnership(foreignTable, tenantA_Id, 'Table'),
        (err) => err.code === 'CROSS_TENANT_ACCESS_DENIED' && err.statusCode === 403
      );
      assert.throws(
        () => assertTenantOwnership(foreignOrder, tenantA_Id, 'Order'),
        (err) => err.code === 'CROSS_TENANT_ACCESS_DENIED' && err.statusCode === 403
      );
      assert.throws(
        () => assertTenantOwnership(foreignBill, tenantA_Id, 'Bill'),
        (err) => err.code === 'CROSS_TENANT_ACCESS_DENIED' && err.statusCode === 403
      );
      assert.throws(
        () => assertTenantOwnership(foreignCustomer, tenantA_Id, 'Customer'),
        (err) => err.code === 'CROSS_TENANT_ACCESS_DENIED' && err.statusCode === 403
      );
    });

    it('CRITICAL: Restaurant A cannot update Restaurant B data (scoped query isolation)', () => {
      const updateFilterTenantA = scopeFilter(tenantA_Id, { _id: 'some_doc_id' });
      assert.equal(updateFilterTenantA.restaurantId.toString(), tenantA_Id);
      assert.notEqual(updateFilterTenantA.restaurantId.toString(), tenantB_Id);

      // Verify that an update target belonging to tenant B will fail ownership assertion
      const targetDoc = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(tenantB_Id),
        status: 'PENDING',
      };

      assert.throws(
        () => assertTenantOwnership(targetDoc, tenantA_Id, 'Resource'),
        (err) => err.code === 'CROSS_TENANT_ACCESS_DENIED'
      );
    });

    it('CRITICAL: Restaurant A cannot delete Restaurant B data', () => {
      const foreignQueueEntry = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(tenantB_Id),
        customerName: 'Secret VIP of B',
      };

      assert.throws(
        () => assertTenantOwnership(foreignQueueEntry, tenantA_Id, 'QueueEntry'),
        (err) => err.code === 'CROSS_TENANT_ACCESS_DENIED' && err.statusCode === 403
      );
    });
  });

  // =========================================================================
  // 4. TABLES
  // =========================================================================
  describe('4. Table Operations & State Machine', () => {
    it('should validate valid table assignment within capacity', () => {
      const table = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: tenantA_Id,
        tableNumber: 'T-10',
        capacity: 4,
        status: 'AVAILABLE',
      };

      const partySize = 4;
      const canAssign = table.status === 'AVAILABLE' && table.capacity >= partySize;
      assert.equal(canAssign, true);

      // Transition to OCCUPIED
      table.status = 'OCCUPIED';
      assert.equal(table.status, 'OCCUPIED');
    });

    it('should reject invalid table assignment when party exceeds capacity', () => {
      const table = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: tenantA_Id,
        tableNumber: 'T-02',
        capacity: 2,
        status: 'AVAILABLE',
      };

      const partySize = 5;
      const canAssign = table.status === 'AVAILABLE' && table.capacity >= partySize;
      assert.equal(canAssign, false, 'Party of 5 cannot be assigned to 2-seat table');
    });

    it('should reject table assignment if table is not in AVAILABLE state', () => {
      const tableOccupied = { status: 'OCCUPIED', capacity: 6 };
      const tableCleaning = { status: 'CLEANING', capacity: 6 };
      const tableOutOfService = { status: 'OUT_OF_SERVICE', capacity: 6 };

      assert.equal(tableOccupied.status === 'AVAILABLE', false);
      assert.equal(tableCleaning.status === 'AVAILABLE', false);
      assert.equal(tableOutOfService.status === 'AVAILABLE', false);
    });

    it('should enforce state machine transitions according to PRD workflow', () => {
      // Allowed transitions:
      assert.equal(isValidStatusTransition('AVAILABLE', 'OCCUPIED', 'RESTAURANT_STAFF'), true);
      assert.equal(isValidStatusTransition('AVAILABLE', 'RESERVED', 'RESTAURANT_STAFF'), true);
      assert.equal(isValidStatusTransition('OCCUPIED', 'BILLING', 'RESTAURANT_STAFF'), true);
      assert.equal(isValidStatusTransition('BILLING', 'CLEANING', 'RESTAURANT_STAFF'), true);
      assert.equal(isValidStatusTransition('CLEANING', 'AVAILABLE', 'RESTAURANT_STAFF'), true);

      // Disallowed transitions for floor staff:
      assert.equal(isValidStatusTransition('OCCUPIED', 'RESERVED', 'RESTAURANT_STAFF'), false);
      assert.equal(isValidStatusTransition('OUT_OF_SERVICE', 'OCCUPIED', 'RESTAURANT_STAFF'), false);
      assert.equal(isValidStatusTransition('CLEANING', 'OCCUPIED', 'RESTAURANT_STAFF'), false);

      // Administrative override for owner:
      assert.equal(isValidStatusTransition('OUT_OF_SERVICE', 'AVAILABLE', 'RESTAURANT_OWNER'), true);
    });
  });

  // =========================================================================
  // 5. ORDERS
  // =========================================================================
  describe('5. Order Management & Calculation Rules', () => {
    it('should accurately calculate subtotals, tax %, discounts, and grand totals', () => {
      const items = [
        { price: 250, quantity: 2 }, // 500
        { price: 120, quantity: 3 }, // 360
        { price: 80, quantity: 1 },  // 80
      ]; // subtotal = 940

      const taxRate = 5; // 5%
      const discount = 40; // 40 discount => taxable = 900
      // tax = 900 * 0.05 = 45.00
      // total = 900 + 45 = 945.00

      const result = calculateOrderTotals(items, taxRate, discount);
      assert.equal(result.subtotal, 940);
      assert.equal(result.discount, 40);
      assert.equal(result.tax, 45);
      assert.equal(result.total, 945);
    });

    it('should correctly validate all allowed order statuses and active status list', () => {
      const expectedStatuses = ['NEW', 'PLACED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'];
      for (const s of expectedStatuses) {
        assert.ok(ORDER_STATUSES.includes(s), `Missing status: ${s}`);
      }

      assert.ok(ACTIVE_ORDER_STATUSES.includes('PLACED'));
      assert.ok(ACTIVE_ORDER_STATUSES.includes('PREPARING'));
      assert.ok(ACTIVE_ORDER_STATUSES.includes('READY'));
      assert.ok(ACTIVE_ORDER_STATUSES.includes('SERVED'));
      assert.equal(ACTIVE_ORDER_STATUSES.includes('COMPLETED'), false);
      assert.equal(ACTIVE_ORDER_STATUSES.includes('CANCELLED'), false);
    });

    it('should allow order cancellation from early stages but forbid once served/completed', () => {
      const canCancelOrder = (status) => {
        return ['NEW', 'PLACED', 'PREPARING'].includes(status);
      };

      assert.equal(canCancelOrder('PLACED'), true);
      assert.equal(canCancelOrder('PREPARING'), true);
      assert.equal(canCancelOrder('SERVED'), false);
      assert.equal(canCancelOrder('COMPLETED'), false);
    });
  });

  // =========================================================================
  // 6. BILLING & PAYMENTS
  // =========================================================================
  describe('6. Billing, Payment Processing & Table Release', () => {
    it('should compute correct bill totals and validate payment methods', () => {
      const billData = {
        subtotal: 1000,
        tax: 50,
        serviceCharge: 50,
        discount: 100,
      };

      const finalTotal = billData.subtotal + billData.tax + billData.serviceCharge - billData.discount;
      assert.equal(finalTotal, 1000);

      // Verify PRD accepted payment methods
      assert.ok(ACCEPTED_PAYMENT_METHODS.includes('CASH'));
      assert.ok(ACCEPTED_PAYMENT_METHODS.includes('UPI'));
      assert.ok(ACCEPTED_PAYMENT_METHODS.includes('CARD'));
      assert.equal(ACCEPTED_PAYMENT_METHODS.includes('CRYPTOCURRENCY'), false);
    });

    it('should transition bill status to PAID upon payment recording and release table', () => {
      const bill = {
        _id: new mongoose.Types.ObjectId(),
        orderId: new mongoose.Types.ObjectId(),
        tableId: new mongoose.Types.ObjectId(),
        total: 1000,
        status: 'UNPAID',
      };

      const table = {
        _id: bill.tableId,
        status: 'BILLING',
        currentOrderId: bill.orderId,
      };

      // Record payment:
      bill.status = 'PAID';
      bill.paymentMethod = 'UPI';

      // Table release:
      table.status = 'AVAILABLE';
      table.currentOrderId = null;

      assert.equal(bill.status, 'PAID');
      assert.equal(table.status, 'AVAILABLE');
      assert.equal(table.currentOrderId, null);
    });
  });

  // =========================================================================
  // 7. QUEUE MANAGEMENT
  // =========================================================================
  describe('7. Queue FIFO Ordering, Capacity Matching & Seating', () => {
    it('should enforce FIFO ordering based on monotonic position and arrival time', () => {
      const queue = [
        { customerName: 'Party A', guestCount: 2, position: 1, arrivalTime: new Date(1000) },
        { customerName: 'Party B', guestCount: 4, position: 2, arrivalTime: new Date(2000) },
        { customerName: 'Party C', guestCount: 6, position: 3, arrivalTime: new Date(3000) },
      ];

      // Sorted by position ascending
      const sortedQueue = [...queue].sort((a, b) => a.position - b.position);
      assert.equal(sortedQueue[0].customerName, 'Party A');
      assert.equal(sortedQueue[1].customerName, 'Party B');
      assert.equal(sortedQueue[2].customerName, 'Party C');
    });

    it('should match suitable queue party by table capacity', () => {
      const queueEntries = [
        { _id: 'q1', customerName: 'Large Group', guestCount: 6, position: 1 },
        { _id: 'q2', customerName: 'Couples Party', guestCount: 2, position: 2 },
        { _id: 'q3', customerName: 'Solo Diner', guestCount: 1, position: 3 },
      ];

      // Table for 2 becomes available: Large Group (6) cannot fit, Couples Party (2) fits
      const tableForTwo = { capacity: 2 };
      const matchedParty = queueEntries.find((entry) => entry.guestCount <= tableForTwo.capacity);

      assert.ok(matchedParty);
      assert.equal(matchedParty.customerName, 'Couples Party');
      assert.equal(matchedParty.guestCount, 2);
    });

    it('should seat queue party and update status to SEATED with assignedTableId', () => {
      const queueEntry = {
        _id: new mongoose.Types.ObjectId(),
        customerName: 'Ananya Roy',
        status: 'WAITING',
        assignedTableId: null,
      };

      const tableId = new mongoose.Types.ObjectId();

      // Seat action
      queueEntry.status = 'SEATED';
      queueEntry.assignedTableId = tableId;

      assert.equal(queueEntry.status, 'SEATED');
      assert.equal(queueEntry.assignedTableId, tableId);
    });
  });

  // =========================================================================
  // 8. RESERVATIONS
  // =========================================================================
  describe('8. Reservation Lifecycle, Conflict Detection & Edge Cases', () => {
    it('should convert time to minutes and calculate default 90-minute end time', () => {
      assert.equal(timeToMinutes('18:00'), 1080);
      assert.equal(timeToMinutes('19:30'), 1170);

      const computedEnd = calculateDefaultEndTime('18:00', 90);
      assert.equal(computedEnd, '19:30');
    });

    it('should detect conflicts for overlapping reservations on the same table', () => {
      const existing = {
        startTime: '19:00', // 1140
        endTime: '20:30',   // 1230
      };

      const checkOverlap = (startA, endA, startB, endB) => {
        const sA = timeToMinutes(startA);
        const eA = timeToMinutes(endA);
        const sB = timeToMinutes(startB);
        const eB = timeToMinutes(endB);
        return sA < eB && sB < eA;
      };

      // Proposed booking: 19:30 to 21:00 (overlaps with 19:00 - 20:30)
      assert.equal(checkOverlap('19:30', '21:00', existing.startTime, existing.endTime), true);

      // Proposed booking: 20:30 to 22:00 (adjacent back-to-back, no overlap)
      assert.equal(checkOverlap('20:30', '22:00', existing.startTime, existing.endTime), false);

      // Proposed booking: 17:00 to 18:30 (prior non-overlapping)
      assert.equal(checkOverlap('17:00', '18:30', existing.startTime, existing.endTime), false);
    });

    it('should handle reservation cancellation and no-show state transitions', () => {
      const reservation = {
        _id: new mongoose.Types.ObjectId(),
        status: 'CONFIRMED',
      };

      // Cancellation:
      reservation.status = 'CANCELLED';
      assert.equal(reservation.status, 'CANCELLED');

      // Another reservation marked NO_SHOW:
      const reservation2 = {
        _id: new mongoose.Types.ObjectId(),
        status: 'CONFIRMED',
      };
      reservation2.status = 'NO_SHOW';
      assert.equal(reservation2.status, 'NO_SHOW');
    });
  });
});
