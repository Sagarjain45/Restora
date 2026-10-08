import express from 'express';
import * as restaurantController from '../controllers/restaurantController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { resolveTenant, requireTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// All restaurant operations require authentication & tenant lockdown
router.use(authenticate);
router.use(requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF'));
router.use(resolveTenant);
router.use(requireTenant);

// Operational Metrics & Profile (Accessible by Owner and Staff)
router.get('/dashboard-metrics', restaurantController.getDashboardMetrics);
router.get('/profile', restaurantController.getMyRestaurant);

// Restaurant Configuration (Restricted to RESTAURANT_OWNER)
router.put('/profile', requireRole('RESTAURANT_OWNER'), restaurantController.updateMyProfile);
router.put('/opening-hours', requireRole('RESTAURANT_OWNER'), restaurantController.updateOpeningHours);
router.put('/settings', requireRole('RESTAURANT_OWNER'), restaurantController.updateSettings);
router.patch('/toggle-open', requireRole('RESTAURANT_OWNER'), restaurantController.toggleOpenStatus);

export default router;
