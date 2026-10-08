import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { resolveTenant, requireTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// 1. Platform-wide reports for Platform Admin
router.get(
  '/platform',
  authenticate,
  requireRole('PLATFORM_ADMIN'),
  reportController.getPlatformReports
);

// 2. Tenant-scoped reports & Order History (Owner & Staff)
router.get(
  '/orders',
  authenticate,
  requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF'),
  resolveTenant,
  requireTenant,
  reportController.getOrderHistory
);

router.get(
  '/restaurant',
  authenticate,
  requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF'),
  resolveTenant,
  requireTenant,
  reportController.getRestaurantReports
);

export default router;
