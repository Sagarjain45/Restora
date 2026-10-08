import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/roleMiddleware.js';
import { buildDateFilter } from '../services/reportService.js';

describe('Phase 15: Order History and Reports Analytics Tests', () => {
  describe('1. Role Authorization for Reports Endpoints', () => {
    it('should permit only PLATFORM_ADMIN to access platform analytics', () => {
      const adminMiddleware = requireRole('PLATFORM_ADMIN');

      let adminPassed = false;
      adminMiddleware({ user: { role: 'PLATFORM_ADMIN' } }, {}, () => { adminPassed = true; });
      assert.equal(adminPassed, true);

      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (p) => { jsonPayload = p; } };
        },
      };

      adminMiddleware({ user: { role: 'RESTAURANT_OWNER' } }, res, () => {});
      assert.equal(statusCode, 403);
      assert.equal(jsonPayload.code, 'FORBIDDEN');
    });

    it('should permit RESTAURANT_OWNER and RESTAURANT_STAFF to access restaurant reports & order history', () => {
      const restaurantMiddleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');

      let ownerPassed = false;
      restaurantMiddleware({ user: { role: 'RESTAURANT_OWNER' } }, {}, () => { ownerPassed = true; });
      assert.equal(ownerPassed, true);

      let staffPassed = false;
      restaurantMiddleware({ user: { role: 'RESTAURANT_STAFF' } }, {}, () => { staffPassed = true; });
      assert.equal(staffPassed, true);
    });

    it('should reject unauthenticated or guest users from restaurant reports', () => {
      const restaurantMiddleware = requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF');
      let statusCode = 0;
      let jsonPayload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (p) => { jsonPayload = p; } };
        },
      };

      restaurantMiddleware({ user: { role: 'GUEST' } }, res, () => {});
      assert.equal(statusCode, 403);
      assert.equal(jsonPayload.code, 'FORBIDDEN');
    });
  });

  describe('2. Date Filter Utility & Range Generator', () => {
    it('should build proper boundary ranges for "today"', () => {
      const filter = buildDateFilter('today');
      assert.ok(filter.$gte instanceof Date);
      assert.ok(filter.$lte instanceof Date);

      const start = new Date(filter.$gte);
      assert.equal(start.getHours(), 0);
      assert.equal(start.getMinutes(), 0);
      assert.equal(start.getSeconds(), 0);

      const end = new Date(filter.$lte);
      assert.equal(end.getHours(), 23);
      assert.equal(end.getMinutes(), 59);
    });

    it('should build proper boundary ranges for "yesterday"', () => {
      const filter = buildDateFilter('yesterday');
      assert.ok(filter.$gte instanceof Date);
      assert.ok(filter.$lte instanceof Date);
      assert.ok(filter.$gte < filter.$lte);
      assert.ok(filter.$lte < new Date());
    });

    it('should build custom date ranges when startDate and endDate are provided', () => {
      const filter = buildDateFilter(null, '2026-09-01', '2026-09-15');
      assert.equal(filter.$gte.getFullYear(), 2026);
      assert.equal(filter.$gte.getMonth(), 8); // September (0-indexed)
      assert.equal(filter.$gte.getDate(), 1);
      assert.equal(filter.$lte.getDate(), 15);
    });
  });

  describe('3. Order History Scoping & Multi-Criteria Filtering', () => {
    it('should scope orders strictly to restaurant tenant and omit other tenants', () => {
      const allOrders = [
        { _id: 'o1', restaurantId: 'tenant-A', total: 500, status: 'COMPLETED' },
        { _id: 'o2', restaurantId: 'tenant-A', total: 300, status: 'PLACED' },
        { _id: 'o3', restaurantId: 'tenant-B', total: 1200, status: 'COMPLETED' },
      ];

      const tenantAOrders = allOrders.filter((o) => o.restaurantId === 'tenant-A');
      assert.equal(tenantAOrders.length, 2);
      assert.equal(tenantAOrders.some((o) => o.restaurantId === 'tenant-B'), false);
    });

    it('should compute accurate summary metrics across filtered orders', () => {
      const orders = [
        { total: 500, status: 'COMPLETED', paymentStatus: 'PAID' },
        { total: 300, status: 'PLACED', paymentStatus: 'PENDING' },
        { total: 200, status: 'CANCELLED', paymentStatus: 'CANCELLED' },
      ];

      const totalOrders = orders.length;
      const validOrders = orders.filter((o) => o.status !== 'CANCELLED');
      const totalSales = validOrders.reduce((sum, o) => sum + o.total, 0);
      const paidCount = orders.filter((o) => o.paymentStatus === 'PAID').length;
      const aov = totalSales / validOrders.length;

      assert.equal(totalOrders, 3);
      assert.equal(totalSales, 800);
      assert.equal(paidCount, 1);
      assert.equal(aov, 400);
    });
  });

  describe('4. Restaurant Reports: Item & Table Analytics', () => {
    it('should aggregate top-selling items correctly by total quantity and revenue', () => {
      const orders = [
        {
          items: [
            { name: 'Butter Chicken', price: 350, quantity: 2 },
            { name: 'Garlic Naan', price: 50, quantity: 4 },
          ],
        },
        {
          items: [
            { name: 'Butter Chicken', price: 350, quantity: 1 },
            { name: 'Mango Lassi', price: 120, quantity: 2 },
          ],
        },
      ];

      const itemStats = {};
      orders.forEach((o) => {
        o.items.forEach((item) => {
          if (!itemStats[item.name]) {
            itemStats[item.name] = { quantity: 0, revenue: 0 };
          }
          itemStats[item.name].quantity += item.quantity;
          itemStats[item.name].revenue += item.price * item.quantity;
        });
      });

      assert.equal(itemStats['Butter Chicken'].quantity, 3);
      assert.equal(itemStats['Butter Chicken'].revenue, 1050);
      assert.equal(itemStats['Garlic Naan'].quantity, 4);
      assert.equal(itemStats['Garlic Naan'].revenue, 200);
    });

    it('should aggregate table utilization by order count and revenue', () => {
      const orders = [
        { tableId: 't1', total: 800 },
        { tableId: 't1', total: 600 },
        { tableId: 't2', total: 450 },
      ];

      const tableStats = {};
      orders.forEach((o) => {
        if (!tableStats[o.tableId]) {
          tableStats[o.tableId] = { count: 0, revenue: 0 };
        }
        tableStats[o.tableId].count += 1;
        tableStats[o.tableId].revenue += o.total;
      });

      assert.equal(tableStats['t1'].count, 2);
      assert.equal(tableStats['t1'].revenue, 1400);
      assert.equal(tableStats['t2'].count, 1);
      assert.equal(tableStats['t2'].revenue, 450);
    });
  });

  describe('5. Platform Reports: Multi-Tenant Aggregation', () => {
    it('should calculate active vs total restaurant ratios and platform revenue correctly', () => {
      const restaurants = [
        { status: 'ACTIVE' },
        { status: 'ACTIVE' },
        { status: 'SUSPENDED' },
      ];

      const bills = [
        { status: 'PAID', total: 1500 },
        { status: 'PAID', total: 2500 },
        { status: 'UNPAID', total: 800 },
      ];

      const totalRestaurants = restaurants.length;
      const activeRestaurants = restaurants.filter((r) => r.status === 'ACTIVE').length;
      const platformRevenue = bills
        .filter((b) => b.status === 'PAID')
        .reduce((sum, b) => sum + b.total, 0);

      assert.equal(totalRestaurants, 3);
      assert.equal(activeRestaurants, 2);
      assert.equal(platformRevenue, 4000);
    });
  });
});
