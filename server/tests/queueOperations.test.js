import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/roleMiddleware.js';
import QueueEntry from '../models/QueueEntry.js';
import Table from '../models/Table.js';

describe('Phase 11: Waiting Queue Operations & Seating Integration Tests', () => {
  describe('1. Role Authorization for Queue Operations', () => {
    it('should permit both RESTAURANT_OWNER and RESTAURANT_STAFF to manage waiting queue', () => {
      const middleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');

      let staffPassed = false;
      middleware({ user: { role: 'RESTAURANT_STAFF' } }, {}, () => { staffPassed = true; });
      assert.equal(staffPassed, true);

      let ownerPassed = false;
      middleware({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);
    });

    it('should forbid unauthorized roles from queue management routes', () => {
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

  describe('2. QueueEntry Schema Validation & Enums', () => {
    it('should validate QueueEntry model requires restaurantId, customerName, phone, and guestCount', () => {
      const entry = new QueueEntry({});
      const error = entry.validateSync();
      assert.ok(error.errors.restaurantId);
      assert.ok(error.errors.customerName);
      assert.ok(error.errors.customerPhone);
      assert.ok(error.errors.guestCount);
    });

    it('should accept all valid queue status enums: WAITING, NOTIFIED, SEATED, CANCELLED, NO_SHOW', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const validStatuses = ['WAITING', 'NOTIFIED', 'SEATED', 'CANCELLED', 'NO_SHOW'];

      for (const st of validStatuses) {
        const entry = new QueueEntry({
          restaurantId: mockRestId,
          customerName: 'Alice Walker',
          customerPhone: '9876543210',
          guestCount: 2,
          status: st,
        });
        const err = entry.validateSync();
        assert.equal(err, undefined, `Status ${st} should be valid`);
      }
    });

    it('should reject invalid queue status strings', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const entry = new QueueEntry({
        restaurantId: mockRestId,
        customerName: 'Bob Smith',
        customerPhone: '9876543210',
        guestCount: 2,
        status: 'DISMISSED',
      });
      const err = entry.validateSync();
      assert.ok(err.errors.status);
    });

    it('should enforce guestCount must be at least 1', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const entry = new QueueEntry({
        restaurantId: mockRestId,
        customerName: 'Charlie',
        customerPhone: '9876543210',
        guestCount: 0,
      });
      const err = entry.validateSync();
      assert.ok(err.errors.guestCount);
    });
  });

  describe('3. Queue Capacity Matching & Table Suitability Logic', () => {
    it('should correctly evaluate table suitability for customer party size according to PRD rule', () => {
      // PRD Example: Customer = 4 guests
      // Table 2 (2 seats) -> Not suitable
      // Table 5 (4 seats) -> Suitable
      // Table 8 (6 seats) -> Suitable
      const party = { guestCount: 4 };

      const tables = [
        { tableNumber: 'T2', capacity: 2 },
        { tableNumber: 'T5', capacity: 4 },
        { tableNumber: 'T8', capacity: 6 },
      ];

      const suitableTables = tables.filter((t) => t.capacity >= party.guestCount);
      assert.equal(suitableTables.length, 2);
      assert.deepEqual(
        suitableTables.map((t) => t.tableNumber),
        ['T5', 'T8']
      );

      const unsuitableTables = tables.filter((t) => t.capacity < party.guestCount);
      assert.equal(unsuitableTables.length, 1);
      assert.equal(unsuitableTables[0].tableNumber, 'T2');
    });

    it('should prioritize ideal capacity fit (least excess seats)', () => {
      const party = { guestCount: 4 };
      const tables = [
        { tableNumber: 'T8', capacity: 6 },
        { tableNumber: 'T5', capacity: 4 },
        { tableNumber: 'T10', capacity: 10 },
      ];

      const sortedByFit = tables
        .filter((t) => t.capacity >= party.guestCount)
        .sort((a, b) => a.capacity - b.capacity);

      // T5 (exact 4 seats) should be recommended before T8 (6 seats) and T10 (10 seats)
      assert.equal(sortedByFit[0].tableNumber, 'T5');
      assert.equal(sortedByFit[1].tableNumber, 'T8');
      assert.equal(sortedByFit[2].tableNumber, 'T10');
    });
  });

  describe('4. Table Available -> Suggest Queue Party (FIFO)', () => {
    it('should suggest the oldest waiting party whose guestCount fits table capacity', () => {
      const table = { tableNumber: 'T-Available', capacity: 4 };

      const queue = [
        { customerName: 'Party A (Large)', guestCount: 6, arrivalTime: new Date(Date.now() - 30000) },
        { customerName: 'Party B (Medium)', guestCount: 4, arrivalTime: new Date(Date.now() - 20000) },
        { customerName: 'Party C (Small)', guestCount: 2, arrivalTime: new Date(Date.now() - 10000) },
      ];

      // Party A needs 6 seats -> does NOT fit table with 4 seats
      // Party B arrived before Party C and fits 4 seats -> Best FIFO match
      const matchingParties = queue
        .filter((p) => p.guestCount <= table.capacity)
        .sort((a, b) => a.arrivalTime - b.arrivalTime);

      assert.equal(matchingParties.length, 2);
      assert.equal(matchingParties[0].customerName, 'Party B (Medium)');
    });
  });

  describe('5. Seating Workflow & State Synchronization', () => {
    it('should transition QueueEntry to SEATED and Table to OCCUPIED upon seating', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const mockTableId = new mongoose.Types.ObjectId();

      const queueEntry = new QueueEntry({
        restaurantId: mockRestId,
        customerName: 'Diana Prince',
        customerPhone: '9998887776',
        guestCount: 2,
        status: 'WAITING',
      });

      const table = new Table({
        restaurantId: mockRestId,
        tableNumber: 'T1',
        capacity: 2,
        status: 'AVAILABLE',
      });

      // Simulate seating operation
      assert.ok(table.capacity >= queueEntry.guestCount);
      table.status = 'OCCUPIED';
      queueEntry.status = 'SEATED';
      queueEntry.assignedTableId = mockTableId;
      queueEntry.seatedAt = new Date();

      assert.equal(table.status, 'OCCUPIED');
      assert.equal(queueEntry.status, 'SEATED');
      assert.equal(queueEntry.assignedTableId, mockTableId);
      assert.ok(queueEntry.seatedAt instanceof Date);
    });
  });
});
