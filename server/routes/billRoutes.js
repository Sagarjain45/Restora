import express from 'express';
import * as billController from '../controllers/billController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { resolveTenant, requireTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// Enforce authentication & tenant isolation on all billing routes
router.use(authenticate);
router.use(requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF'));
router.use(resolveTenant);
router.use(requireTenant);

// Query bills & payments
router.get('/', billController.getBills);
router.get('/payments', billController.getPayments);
router.get('/order/:orderId', billController.getBillByOrder);
router.get('/:id', billController.getBill);

// Generate Bill
router.post('/', billController.generateBill);

// Record Payment & Settle Bill
router.post('/:id/pay', billController.recordPayment);

// Void Bill
router.post('/:id/void', billController.voidBill);

export default router;
