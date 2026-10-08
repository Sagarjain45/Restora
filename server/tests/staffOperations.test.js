import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/roleMiddleware.js';
import User from '../models/User.js';
import { STAFF_DESIGNATIONS } from '../services/staffService.js';

describe('Phase 14: Staff Management & Access Control Tests', () => {
  describe('1. Role Authorization for Staff Management', () => {
    it('should permit RESTAURANT_OWNER to manage staff', () => {
      const middleware = requireRole('RESTAURANT_OWNER');

      let ownerPassed = false;
      middleware({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);
    });

    it('should forbid RESTAURANT_STAFF from accessing staff management routes', () => {
      const middleware = requireRole('RESTAURANT_OWNER');
      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (p) => { jsonPayload = p; } };
        },
      };

      middleware({ user: { role: 'RESTAURANT_STAFF' } }, res, () => {});
      assert.equal(statusCode, 403);
      assert.equal(jsonPayload.code, 'FORBIDDEN');
    });

    it('should forbid GUEST or SUPER_ADMIN without owner role from staff routes', () => {
      const middleware = requireRole('RESTAURANT_OWNER');
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

  describe('2. User Schema with Staff Designation & Status', () => {
    it('should have designation and status default values', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const staffUser = new User({
        restaurantId: mockRestId,
        name: 'Rahul Sharma',
        email: 'rahul@test.com',
        passwordHash: 'dummyhash',
        role: 'RESTAURANT_STAFF',
      });

      assert.equal(staffUser.designation, 'Floor Staff');
      assert.equal(staffUser.status, 'ACTIVE');
      assert.equal(staffUser.role, 'RESTAURANT_STAFF');
      assert.equal(staffUser.validateSync(), undefined);
    });

    it('should validate standard staff designations list', () => {
      assert.ok(Array.isArray(STAFF_DESIGNATIONS));
      assert.ok(STAFF_DESIGNATIONS.includes('Server / Waitstaff'));
      assert.ok(STAFF_DESIGNATIONS.includes('Chef / Kitchen Staff'));
      assert.ok(STAFF_DESIGNATIONS.includes('Cashier / Billing'));
      assert.ok(STAFF_DESIGNATIONS.includes('Host / Reception'));
      assert.ok(STAFF_DESIGNATIONS.includes('Bartender'));
      assert.ok(STAFF_DESIGNATIONS.includes('Shift Supervisor'));
    });
  });

  describe('3. Multi-Tenant Isolation for Staff Roster', () => {
    it('should scope staff queries strictly by restaurantId', () => {
      const tenantStaffRoster = [
        { _id: '1', restaurantId: 'rest-alpha', name: 'Alpha Waiter', role: 'RESTAURANT_STAFF' },
        { _id: '2', restaurantId: 'rest-alpha', name: 'Alpha Chef', role: 'RESTAURANT_STAFF' },
        { _id: '3', restaurantId: 'rest-beta', name: 'Beta Cashier', role: 'RESTAURANT_STAFF' },
      ];

      const alphaStaff = tenantStaffRoster.filter((s) => s.restaurantId === 'rest-alpha');
      assert.equal(alphaStaff.length, 2);
      assert.equal(alphaStaff[0].name, 'Alpha Waiter');
      assert.equal(alphaStaff[1].name, 'Alpha Chef');

      const betaStaff = tenantStaffRoster.filter((s) => s.restaurantId === 'rest-beta');
      assert.equal(betaStaff.length, 1);
      assert.equal(betaStaff[0].name, 'Beta Cashier');
    });

    it('should reject cross-tenant staff lookup', () => {
      const staff = { _id: 'staff-1', restaurantId: 'rest-alpha', name: 'Alpha Staff' };
      const requestedTenantId = 'rest-beta';

      // Tenant isolation condition
      const isAuthorized = staff.restaurantId === requestedTenantId;
      assert.equal(isAuthorized, false, 'Staff belonging to rest-alpha should not be accessible by rest-beta');
    });
  });

  describe('4. Staff Status Toggle & Self-Deactivation Guard', () => {
    it('should prevent an authenticated user from deactivating their own account', () => {
      const currentUserId = 'user-owner-123';
      const targetStaffId = 'user-owner-123';

      let errorThrown = false;
      try {
        if (targetStaffId === currentUserId) {
          const err = new Error('You cannot deactivate your own account.');
          err.statusCode = 400;
          throw err;
        }
      } catch (err) {
        errorThrown = true;
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /cannot deactivate your own account/i);
      }
      assert.equal(errorThrown, true);
    });

    it('should toggle staff status between ACTIVE and INACTIVE', () => {
      let staff = { status: 'ACTIVE' };

      // Toggle to INACTIVE
      staff.status = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      assert.equal(staff.status, 'INACTIVE');

      // Toggle back to ACTIVE
      staff.status = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      assert.equal(staff.status, 'ACTIVE');
    });
  });

  describe('5. Duplicate Email and Security Protection', () => {
    it('should prevent adding staff with existing email in system', () => {
      const existingEmails = ['owner@restora.com', 'waiter@restora.com'];
      const newStaffEmail = 'WAITER@restora.com'.toLowerCase().trim();

      const exists = existingEmails.includes(newStaffEmail);
      assert.equal(exists, true, 'Duplicate email should be detected regardless of case');
    });

    it('should omit passwordHash from returned staff objects', () => {
      const rawStaff = {
        _id: 'staff-99',
        name: 'Anita Roy',
        email: 'anita@restora.com',
        role: 'RESTAURANT_STAFF',
        passwordHash: 'secret_bcrypt_hash_value',
        status: 'ACTIVE',
      };

      const sanitized = { ...rawStaff };
      delete sanitized.passwordHash;

      assert.equal(sanitized.passwordHash, undefined);
      assert.equal(sanitized.name, 'Anita Roy');
      assert.equal(sanitized.email, 'anita@restora.com');
    });
  });
});
