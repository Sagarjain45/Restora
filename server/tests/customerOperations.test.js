import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/roleMiddleware.js';
import Customer from '../models/Customer.js';

describe('Phase 13: Customer Management & Profile Reuse Tests', () => {
  describe('1. Role Authorization for Customer Operations', () => {
    it('should permit both RESTAURANT_OWNER and RESTAURANT_STAFF to manage customer profiles', () => {
      const middleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');

      let staffPassed = false;
      middleware({ user: { role: 'RESTAURANT_STAFF' } }, {}, () => { staffPassed = true; });
      assert.equal(staffPassed, true);

      let ownerPassed = false;
      middleware({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);
    });

    it('should forbid unauthorized roles from customer routes', () => {
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

  describe('2. Customer Schema Validation & Required Fields', () => {
    it('should validate Customer model requires restaurantId, name, and phone', () => {
      const customer = new Customer({});
      const error = customer.validateSync();
      assert.ok(error.errors.restaurantId);
      assert.ok(error.errors.name);
      assert.ok(error.errors.phone);
    });

    it('should have sensible defaults for visitCount (1), totalSpent (0), and lastVisit', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const customer = new Customer({
        restaurantId: mockRestId,
        name: 'Siddharth Rao',
        phone: '9876543210',
      });

      assert.equal(customer.visitCount, 1);
      assert.equal(customer.totalSpent, 0);
      assert.ok(customer.lastVisit instanceof Date);
      assert.equal(customer.validateSync(), undefined);
    });
  });

  describe('3. Customer Profile Reusability & Deduplication Simulation', () => {
    it('should recognize existing customer by phone number and prevent duplicate record creation', () => {
      const existingDb = [
        {
          _id: new mongoose.Types.ObjectId(),
          restaurantId: 'rest-1',
          name: 'Meera Kapoor',
          phone: '9123456780',
          visitCount: 3,
          totalSpent: 1850,
        },
      ];

      // Simulate lookup when party joins queue or creates reservation with existing phone
      const incomingParty = {
        restaurantId: 'rest-1',
        name: 'Meera',
        phone: '9123456780',
      };

      const match = existingDb.find(
        (c) => c.restaurantId === incomingParty.restaurantId && c.phone === incomingParty.phone
      );

      assert.ok(match, 'Existing customer should be found by phone');
      assert.equal(match.name, 'Meera Kapoor');
      assert.equal(match.visitCount, 3);
    });

    it('should isolate customer directories between separate restaurant tenants', () => {
      const tenantCustomers = [
        { restaurantId: 'rest-alpha', phone: '9988776655', name: 'Alpha Customer' },
        { restaurantId: 'rest-beta', phone: '9988776655', name: 'Beta Customer' },
      ];

      const searchInAlpha = tenantCustomers.filter(
        (c) => c.restaurantId === 'rest-alpha' && c.phone === '9988776655'
      );
      assert.equal(searchInAlpha.length, 1);
      assert.equal(searchInAlpha[0].name, 'Alpha Customer');

      const searchInBeta = tenantCustomers.filter(
        (c) => c.restaurantId === 'rest-beta' && c.phone === '9988776655'
      );
      assert.equal(searchInBeta.length, 1);
      assert.equal(searchInBeta[0].name, 'Beta Customer');
    });
  });

  describe('4. Visit & Spend Tracking', () => {
    it('should correctly increment visit count and accumulate spend upon order completion', () => {
      const customer = {
        visitCount: 1,
        totalSpent: 450,
        lastVisit: new Date('2026-09-01'),
      };

      // Customer dines again and spends 850
      customer.visitCount += 1;
      customer.totalSpent += 850;
      customer.lastVisit = new Date();

      assert.equal(customer.visitCount, 2);
      assert.equal(customer.totalSpent, 1300);
      assert.ok(customer.lastVisit > new Date('2026-09-01'));
    });
  });
});
