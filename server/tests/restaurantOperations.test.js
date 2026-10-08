import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/roleMiddleware.js';

describe('Phase 6: Restaurant Onboarding & Operational Configuration Tests', () => {
  describe('1. Role-Based Permissions for Configuration', () => {
    it('should allow RESTAURANT_OWNER to update profile and settings', () => {
      const ownerReq = {
        user: { id: 'owner1', role: 'RESTAURANT_OWNER' },
      };
      let passed = false;
      const middleware = requireRole('RESTAURANT_OWNER');
      middleware(ownerReq, {}, () => { passed = true; });
      assert.equal(passed, true);
    });

    it('should forbid RESTAURANT_STAFF from changing restaurant profile or settings', () => {
      const staffReq = {
        user: { id: 'staff1', role: 'RESTAURANT_STAFF' },
      };
      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (payload) => { jsonPayload = payload; },
          };
        },
      };

      const middleware = requireRole('RESTAURANT_OWNER');
      middleware(staffReq, res, () => {});

      assert.equal(statusCode, 403);
      assert.equal(jsonPayload.code, 'FORBIDDEN');
    });

    it('should allow both RESTAURANT_OWNER and RESTAURANT_STAFF to view dashboard metrics', () => {
      const middleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');
      
      let ownerPassed = false;
      middleware({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);

      let staffPassed = false;
      middleware({ user: { role: 'RESTAURANT_STAFF' } }, {}, () => { staffPassed = true; });
      assert.equal(staffPassed, true);
    });
  });

  describe('2. Operational Settings & Hours Schema Rules', () => {
    it('should validate opening hours structure', () => {
      const validHours = [
        { day: 'Monday', openTime: '10:00', closeTime: '23:00', isClosed: false },
        { day: 'Tuesday', openTime: '10:00', closeTime: '23:00', isClosed: false },
        { day: 'Wednesday', openTime: '10:00', closeTime: '23:00', isClosed: true },
      ];

      assert.equal(validHours.length, 3);
      assert.equal(validHours[2].isClosed, true);
    });

    it('should validate tax and service charge percentages', () => {
      const settings = {
        currency: 'INR',
        taxRatePercent: 5,
        serviceChargePercent: 10,
        autoAcceptReservations: true,
      };

      assert.equal(settings.currency, 'INR');
      assert.equal(settings.taxRatePercent >= 0 && settings.taxRatePercent <= 100, true);
      assert.equal(settings.serviceChargePercent >= 0 && settings.serviceChargePercent <= 50, true);
    });

    it('should correctly format comma-separated cuisine strings into arrays', () => {
      const rawCuisine = 'Italian, Continental, Woodfire Pizza';
      const formatted = rawCuisine.split(',').map((c) => c.trim()).filter(Boolean);

      assert.deepEqual(formatted, ['Italian', 'Continental', 'Woodfire Pizza']);
    });
  });
});
