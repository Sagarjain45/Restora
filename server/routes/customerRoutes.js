import express from 'express';
import * as customerController from '../controllers/customerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { resolveTenant, requireTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// Enforce authentication & tenant isolation on all customer routes
router.use(authenticate);
router.use(requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF'));
router.use(resolveTenant);
router.use(requireTenant);

// Query routes
router.get('/summary', customerController.getSummary);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomer);

// Mutation routes
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.post('/:id/visit', customerController.recordVisit);

export default router;
