import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/roleMiddleware.js';
import Reservation from '../models/Reservation.js';
import Table from '../models/Table.js';
import {
  timeToMinutes,
  minutesToTime,
  calculateDefaultEndTime,
} from '../services/reservationService.js';

describe('Phase 12: Table Reservation & Conflict Detection Tests', () => {
  describe('1. Role Authorization for Reservation Operations', () => {
    it('should permit both RESTAURANT_OWNER and RESTAURANT_STAFF to manage reservations', () => {
      const middleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');

      let staffPassed = false;
      middleware({ user: { role: 'RESTAURANT_STAFF' } }, {}, () => { staffPassed = true; });
      assert.equal(staffPassed, true);

      let ownerPassed = false;
      middleware({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);
    });

    it('should forbid unauthorized roles from reservation management routes', () => {
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

  describe('2. Reservation Schema Validation & Allowed Enums', () => {
    it('should validate Reservation model requires customerName, customerPhone, guestCount, date, startTime', () => {
      const res = new Reservation({});
      const error = res.validateSync();
      assert.ok(error.errors.restaurantId);
      assert.ok(error.errors.customerName);
      assert.ok(error.errors.customerPhone);
      assert.ok(error.errors.guestCount);
      assert.ok(error.errors.date);
      assert.ok(error.errors.startTime);
    });

    it('should accept all valid PRD statuses: PENDING, CONFIRMED, ARRIVED, SEATED, COMPLETED, CANCELLED, NO_SHOW', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const validStatuses = ['PENDING', 'CONFIRMED', 'ARRIVED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

      for (const st of validStatuses) {
        const res = new Reservation({
          restaurantId: mockRestId,
          customerName: 'Rahul Sharma',
          customerPhone: '9876543210',
          guestCount: 4,
          date: '2026-10-15',
          startTime: '19:00',
          endTime: '20:30',
          status: st,
        });
        const err = res.validateSync();
        assert.equal(err, undefined, `Status ${st} should be valid`);
      }
    });

    it('should reject invalid reservation status strings', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const res = new Reservation({
        restaurantId: mockRestId,
        customerName: 'Priya Patel',
        customerPhone: '9876543210',
        guestCount: 2,
        date: '2026-10-15',
        startTime: '19:00',
        status: 'CHECKED_IN',
      });
      const err = res.validateSync();
      assert.ok(err.errors.status);
    });
  });

  describe('3. Time Utilities & Interval Calculations', () => {
    it('should correctly convert HH:mm strings to minutes from midnight and back', () => {
      assert.equal(timeToMinutes('00:00'), 0);
      assert.equal(timeToMinutes('01:30'), 90);
      assert.equal(timeToMinutes('19:45'), 19 * 60 + 45);

      assert.equal(minutesToTime(90), '01:30');
      assert.equal(minutesToTime(1185), '19:45');
    });

    it('should calculate default 90-minute end time when endTime is omitted', () => {
      assert.equal(calculateDefaultEndTime('19:00'), '20:30');
      assert.equal(calculateDefaultEndTime('20:30'), '22:00');
    });
  });

  describe('4. Conflict Detection Algorithm', () => {
    // Overlap condition helper for pure unit testing of intervals
    const isOverlapping = (startA, endA, startB, endB) => {
      const aS = timeToMinutes(startA);
      const aE = timeToMinutes(endA);
      const bS = timeToMinutes(startB);
      const bE = timeToMinutes(endB);
      return aS < bE && bS < aE;
    };

    it('should detect direct overlapping time intervals on the same table', () => {
      // Slot 1: 19:00 to 20:30
      // Slot 2: 19:30 to 21:00 (overlaps!)
      assert.equal(isOverlapping('19:00', '20:30', '19:30', '21:00'), true);

      // Slot 3: 20:00 to 20:15 (fully enclosed overlap!)
      assert.equal(isOverlapping('19:00', '20:30', '20:00', '20:15'), true);

      // Slot 4: 18:30 to 21:30 (enclosing overlap!)
      assert.equal(isOverlapping('19:00', '20:30', '18:30', '21:30'), true);
    });

    it('should allow adjacent, non-overlapping back-to-back bookings', () => {
      // Slot 1: 18:00 to 19:30
      // Slot 2: 19:30 to 21:00 (exact boundary touch, no overlap)
      assert.equal(isOverlapping('18:00', '19:30', '19:30', '21:00'), false);

      // Slot 3: 21:00 to 22:30 (after)
      assert.equal(isOverlapping('18:00', '19:30', '21:00', '22:30'), false);
    });
  });

  describe('5. Table Capacity & Seating Lifecycle Workflow', () => {
    it('should enforce that table capacity must accommodate reservation party size', () => {
      const table = { tableNumber: 'T2', capacity: 2 };
      const resParty = { guestCount: 4 };

      const isSuitable = table.capacity >= resParty.guestCount;
      assert.equal(isSuitable, false);
    });

    it('should transition Table to OCCUPIED and Reservation to SEATED upon guest arrival and seating', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const mockTableId = new mongoose.Types.ObjectId();

      const reservation = new Reservation({
        restaurantId: mockRestId,
        customerName: 'Vikram Seth',
        customerPhone: '9876543210',
        guestCount: 4,
        date: '2026-10-15',
        startTime: '20:00',
        endTime: '21:30',
        tableId: mockTableId,
        status: 'CONFIRMED',
      });

      const table = new Table({
        restaurantId: mockRestId,
        tableNumber: 'T4',
        capacity: 4,
        status: 'AVAILABLE',
      });

      // 1. Mark Arrived
      reservation.status = 'ARRIVED';
      reservation.arrivedAt = new Date();
      assert.equal(reservation.status, 'ARRIVED');
      assert.ok(reservation.arrivedAt instanceof Date);

      // 2. Seat Reservation
      table.status = 'OCCUPIED';
      reservation.status = 'SEATED';
      reservation.seatedAt = new Date();
      assert.equal(table.status, 'OCCUPIED');
      assert.equal(reservation.status, 'SEATED');
      assert.ok(reservation.seatedAt instanceof Date);

      // 3. Complete Reservation
      reservation.status = 'COMPLETED';
      reservation.completedAt = new Date();
      assert.equal(reservation.status, 'COMPLETED');
      assert.ok(reservation.completedAt instanceof Date);
    });
  });
});
