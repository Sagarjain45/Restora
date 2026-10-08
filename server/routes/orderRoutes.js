import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { resolveTenant, requireTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// Enforce authentication & tenant isolation on all order routes
router.use(authenticate);
router.use(requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF'));
router.use(resolveTenant);
router.use(requireTenant);

// Query orders
router.get('/', orderController.getOrders);
router.get('/table/:tableId', orderController.getActiveOrderByTable);
router.get('/:id', orderController.getOrder);

// Create table order
router.post('/', orderController.createOrder);

// Order status & details update
router.patch('/:id/status', orderController.updateStatus);
router.patch('/:id/details', orderController.updateDetails);

// Modify food items on active order
router.post('/:id/items', orderController.addItem);
router.put('/:id/items/:itemId', orderController.updateItem);
router.delete('/:id/items/:itemId', orderController.removeItem);

export default router;
