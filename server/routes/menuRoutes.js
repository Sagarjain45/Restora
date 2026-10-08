import express from 'express';
import * as menuController from '../controllers/menuController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { resolveTenant, requireTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// Enforce authentication & tenant isolation on all menu routes
router.use(authenticate);
router.use(requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF'));
router.use(resolveTenant);
router.use(requireTenant);

// Read menu items (Owner & Staff)
router.get('/', menuController.getMenuItems);
router.get('/:id', menuController.getMenuItem);

// Quick availability toggle (Kitchen Staff & Owner)
router.patch('/:id/availability', menuController.toggleAvailability);

// Menu structure & item management (Restricted to RESTAURANT_OWNER)
router.post('/', requireRole('RESTAURANT_OWNER'), menuController.createMenuItem);
router.put('/:id', requireRole('RESTAURANT_OWNER'), menuController.updateMenuItem);
router.delete('/:id', requireRole('RESTAURANT_OWNER'), menuController.deleteMenuItem);

export default router;
