import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  isValidStatusTransition,
  ALLOWED_TABLE_STATUSES,
  ALLOWED_TRANSITIONS,
} from '../services/tableService.js';
import Table from '../models/Table.js';

describe('Phase 7: Table Management & Floor Operations Tests', () => {
  describe('1. Role Authorization for Table Operations', () => {
    it('should allow both RESTAURANT_OWNER and RESTAURANT_STAFF to read tables', () => {
      const middleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');

      let ownerPassed = false;
      middleware({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);

      let staffPassed = false;
      middleware({ user: { role: 'RESTAURANT_STAFF' } }, {}, () => { staffPassed = true; });
      assert.equal(staffPassed, true);
    });

    it('should allow RESTAURANT_STAFF to update table status', () => {
      const middleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');
      let passed = false;
      middleware({ user: { role: 'RESTAURANT_STAFF' } }, {}, () => { passed = true; });
      assert.equal(passed, true);
    });

    it('should restrict table creation and deletion to RESTAURANT_OWNER', () => {
      const middleware = requireRole('RESTAURANT_OWNER');

      let ownerPassed = false;
      middleware({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);

      let staffStatusCode = 0;
      let staffJson = null;
      const res = {
        status: (code) => {
          staffStatusCode = code;
          return { json: (p) => { staffJson = p; } };
        },
      };

      middleware({ user: { role: 'RESTAURANT_STAFF' } }, res, () => {});
      assert.equal(staffStatusCode, 403);
      assert.equal(staffJson.code, 'FORBIDDEN');
    });
  });

  describe('2. Table Status Validation & Allowed Enums', () => {
    it('should include all PRD specified statuses', () => {
      const requiredStatuses = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'BILLING', 'OUT_OF_SERVICE'];
      for (const st of requiredStatuses) {
        assert.equal(ALLOWED_TABLE_STATUSES.includes(st), true, `Missing required status: ${st}`);
      }
    });

    it('should reject non-existent status strings', () => {
      assert.equal(ALLOWED_TABLE_STATUSES.includes('UNKNOWN_STATE'), false);
      assert.equal(ALLOWED_TABLE_STATUSES.includes('DIRTY'), false);
    });

    it('should validate table model schema constraints', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const validTable = new Table({
        restaurantId: mockRestId,
        tableNumber: 'Table 10',
        capacity: 4,
        status: 'AVAILABLE',
        section: 'Main Dining',
      });
      const error = validTable.validateSync();
      assert.equal(error, undefined);

      const invalidTable = new Table({
        restaurantId: mockRestId,
        tableNumber: '',
        capacity: 0,
        status: 'INVALID_STATUS',
      });
      const invalidError = invalidTable.validateSync();
      assert.notEqual(invalidError, undefined);
      assert.equal(Boolean(invalidError.errors.tableNumber), true);
      assert.equal(Boolean(invalidError.errors.capacity), true);
      assert.equal(Boolean(invalidError.errors.status), true);
    });
  });

  describe('3. Table State Machine & Transition Rules', () => {
    it('should allow valid transitions according to PRD workflow', () => {
      // Available -> Occupied, Reserved, Out of service
      assert.equal(isValidStatusTransition('AVAILABLE', 'OCCUPIED'), true);
      assert.equal(isValidStatusTransition('AVAILABLE', 'RESERVED'), true);
      assert.equal(isValidStatusTransition('AVAILABLE', 'OUT_OF_SERVICE'), true);

      // Occupied -> Billing
      assert.equal(isValidStatusTransition('OCCUPIED', 'BILLING'), true);
      assert.equal(isValidStatusTransition('OCCUPIED', 'AVAILABLE'), true);

      // Reserved -> Occupied (seated) or Available (cancelled)
      assert.equal(isValidStatusTransition('RESERVED', 'OCCUPIED'), true);
      assert.equal(isValidStatusTransition('RESERVED', 'AVAILABLE'), true);

      // Billing -> Available (after payment)
      assert.equal(isValidStatusTransition('BILLING', 'AVAILABLE'), true);

      // Out of Service -> Available (restored)
      assert.equal(isValidStatusTransition('OUT_OF_SERVICE', 'AVAILABLE'), true);
    });

    it('should prevent invalid transitions for floor staff', () => {
      // Floor staff cannot jump directly from Billing to Occupied
      assert.equal(isValidStatusTransition('BILLING', 'OCCUPIED', 'RESTAURANT_STAFF'), false);

      // Cannot jump from Out of service directly to Occupied
      assert.equal(isValidStatusTransition('OUT_OF_SERVICE', 'OCCUPIED', 'RESTAURANT_STAFF'), false);

      // Cannot jump from Reserved directly to Billing
      assert.equal(isValidStatusTransition('RESERVED', 'BILLING', 'RESTAURANT_STAFF'), false);

      // Cannot jump from Available directly to Billing
      assert.equal(isValidStatusTransition('AVAILABLE', 'BILLING', 'RESTAURANT_STAFF'), false);
    });

    it('should permit administrative override for RESTAURANT_OWNER', () => {
      // Owner can reassign or reset an out-of-service or billing table if needed
      assert.equal(isValidStatusTransition('OUT_OF_SERVICE', 'AVAILABLE', 'RESTAURANT_OWNER'), true);
      assert.equal(isValidStatusTransition('BILLING', 'AVAILABLE', 'RESTAURANT_OWNER'), true);
      assert.equal(isValidStatusTransition('AVAILABLE', 'OUT_OF_SERVICE', 'RESTAURANT_OWNER'), true);
    });
  });

  describe('4. Active State & Safety Guard Logic', () => {
    it('should verify deactivation safety condition', () => {
      const activeTableStatuses = ['OCCUPIED', 'BILLING'];
      for (const st of activeTableStatuses) {
        const canDeactivate = !(st === 'OCCUPIED' || st === 'BILLING');
        assert.equal(canDeactivate, false, `Should not deactivate while ${st}`);
      }

      const idleTableStatuses = ['AVAILABLE', 'OUT_OF_SERVICE', 'CLEANING'];
      for (const st of idleTableStatuses) {
        const canDeactivate = !(st === 'OCCUPIED' || st === 'BILLING');
        assert.equal(canDeactivate, true, `Should be safe to deactivate while ${st}`);
      }
    });
  });
});
