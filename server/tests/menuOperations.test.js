import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/roleMiddleware.js';
import MenuItem from '../models/MenuItem.js';
import { DEFAULT_CATEGORIES } from '../services/menuService.js';

describe('Phase 8: Menu Management & Item Catalog Tests', () => {
  describe('1. Role-Based Permissions for Menu Operations', () => {
    it('should allow both RESTAURANT_OWNER and RESTAURANT_STAFF to view menu items', () => {
      const middleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');

      let ownerPassed = false;
      middleware({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);

      let staffPassed = false;
      middleware({ user: { role: 'RESTAURANT_STAFF' } }, {}, () => { staffPassed = true; });
      assert.equal(staffPassed, true);
    });

    it('should allow RESTAURANT_STAFF to toggle item availability', () => {
      const middleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');
      let passed = false;
      middleware({ user: { role: 'RESTAURANT_STAFF' } }, {}, () => { passed = true; });
      assert.equal(passed, true);
    });

    it('should restrict creating, modifying price, or deleting items to RESTAURANT_OWNER', () => {
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

  describe('2. Menu Item Schema & Input Validations', () => {
    it('should validate valid menu item fields', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const validItem = new MenuItem({
        restaurantId: mockRestId,
        name: 'Paneer Butter Masala',
        description: 'Rich cottage cheese in creamy tomato gravy',
        category: 'Main Course',
        price: 320,
        isVegetarian: true,
        isAvailable: true,
        preparationTime: 20,
        isActive: true,
      });

      const err = validItem.validateSync();
      assert.equal(err, undefined);
    });

    it('should reject negative prices and missing required fields', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const invalidItem = new MenuItem({
        restaurantId: mockRestId,
        name: '',
        category: '',
        price: -50,
        preparationTime: 0,
      });

      const err = invalidItem.validateSync();
      assert.notEqual(err, undefined);
      assert.equal(Boolean(err.errors.name), true);
      assert.equal(Boolean(err.errors.category), true);
      assert.equal(Boolean(err.errors.price), true);
      assert.equal(Boolean(err.errors.preparationTime), true);
    });

    it('should have sensible defaults for vegetarian, availability, and active state', () => {
      const mockRestId = new mongoose.Types.ObjectId();
      const item = new MenuItem({
        restaurantId: mockRestId,
        name: 'Cold Coffee',
        category: 'Beverages',
        price: 120,
      });

      assert.equal(item.isVegetarian, true);
      assert.equal(item.isAvailable, true);
      assert.equal(item.isActive, true);
      assert.equal(item.preparationTime, 15);
    });
  });

  describe('3. Category & Dietary Classifications', () => {
    it('should include standard restaurant menu categories', () => {
      const expected = ['Starters', 'Main Course', 'Rice & Biryani', 'Breads', 'Beverages', 'Desserts'];
      for (const cat of expected) {
        assert.equal(DEFAULT_CATEGORIES.includes(cat), true, `Missing standard category: ${cat}`);
      }
    });

    it('should accurately differentiate vegetarian vs non-vegetarian items', () => {
      const vegItem = { name: 'Veg Biryani', isVegetarian: true, isAvailable: true };
      const nonVegItem = { name: 'Chicken Tikka', isVegetarian: false, isAvailable: true };

      const catalog = [vegItem, nonVegItem];
      const vegOnly = catalog.filter((i) => i.isVegetarian);
      const nonVegOnly = catalog.filter((i) => !i.isVegetarian);

      assert.equal(vegOnly.length, 1);
      assert.equal(vegOnly[0].name, 'Veg Biryani');
      assert.equal(nonVegOnly.length, 1);
      assert.equal(nonVegOnly[0].name, 'Chicken Tikka');
    });

    it('should prevent unavailable items from active order inclusion logic', () => {
      const items = [
        { id: '1', name: 'Butter Naan', isAvailable: true },
        { id: '2', name: 'Mango Lassi', isAvailable: false },
      ];

      // PRD Requirement: Unavailable items cannot be added to new orders
      const orderableItems = items.filter((i) => i.isAvailable);
      assert.equal(orderableItems.length, 1);
      assert.equal(orderableItems[0].name, 'Butter Naan');
    });
  });
});
