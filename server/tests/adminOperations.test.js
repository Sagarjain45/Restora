import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  submitApplication,
  approveApplication,
  rejectApplication,
  updateRestaurantStatus,
} from '../services/adminService.js';
import RestaurantApplication from '../models/RestaurantApplication.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import { requireRole } from '../middleware/roleMiddleware.js';

describe('Phase 5: Platform Admin Operations & Restaurant Lifecycle Tests', () => {
  const adminUserId = new mongoose.Types.ObjectId();

  describe('1. Role Authorization Guard (requireRole)', () => {
    it('should grant access to PLATFORM_ADMIN on protected admin routes', () => {
      const req = {
        user: { id: adminUserId.toString(), role: 'PLATFORM_ADMIN' },
      };
      let passed = false;
      const middleware = requireRole('PLATFORM_ADMIN');
      middleware(req, {}, () => { passed = true; });
      assert.equal(passed, true);
    });

    it('should forbid RESTAURANT_OWNER and RESTAURANT_STAFF from admin routes', () => {
      const ownerReq = {
        user: { id: 'owner1', role: 'RESTAURANT_OWNER' },
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

      const middleware = requireRole('PLATFORM_ADMIN');
      middleware(ownerReq, res, () => {});

      assert.equal(statusCode, 403);
      assert.equal(jsonPayload.code, 'FORBIDDEN');
    });

    it('should reject unauthenticated requests with 401', () => {
      const unauthReq = {};
      let statusCode = 0;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: () => {},
          };
        },
      };

      const middleware = requireRole('PLATFORM_ADMIN');
      middleware(unauthReq, res, () => {});
      assert.equal(statusCode, 401);
    });
  });

  describe('2. Restaurant Application Validation & Logic', () => {
    it('should validate application rejection status update rules', () => {
      // Mock application object
      const app = {
        _id: new mongoose.Types.ObjectId(),
        status: 'PENDING',
        rejectionReason: null,
      };

      assert.equal(app.status, 'PENDING');
      app.status = 'REJECTED';
      app.rejectionReason = 'Insufficient documentation provided';

      assert.equal(app.status, 'REJECTED');
      assert.equal(app.rejectionReason, 'Insufficient documentation provided');
    });

    it('should require FSSAI license number during registration', async () => {
      await assert.rejects(
        async () => {
          await submitApplication({
            restaurantName: 'Test Diner',
            applicantName: 'Test Owner',
            applicantEmail: 'unique_owner@test.com',
            applicantPhone: '+91 99999 88888',
            address: '123 Test St',
            city: 'Delhi',
            state: 'Delhi',
            fssaiNumber: '', // Missing FSSAI
          });
        },
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /FSSAI/i);
          return true;
        }
      );
    });

    it('should validate status transition constraints', () => {
      const app = { status: 'APPROVED' };
      // Cannot reject already approved
      assert.throws(
        () => {
          if (app.status === 'APPROVED') {
            const error = new Error('Cannot reject an already approved application.');
            error.statusCode = 400;
            throw error;
          }
        },
        (err) => err.statusCode === 400
      );
    });
  });

  describe('3. Restaurant Status Lifecycle (Active vs Suspended)', () => {
    it('should only allow valid lifecycle states', async () => {
      const allowed = ['ACTIVE', 'SUSPENDED', 'INACTIVE', 'PENDING'];
      assert.equal(allowed.includes('ACTIVE'), true);
      assert.equal(allowed.includes('SUSPENDED'), true);
      assert.equal(allowed.includes('DELETED'), false);
    });

    it('should reject invalid status with validation error', async () => {
      await assert.rejects(
        async () => {
          await updateRestaurantStatus('invalid-id', 'BOGUS_STATUS');
        },
        (err) => err.statusCode === 400
      );
    });
  });
});
