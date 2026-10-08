import express from 'express';
import * as queueController from '../controllers/queueController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { resolveTenant, requireTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// Enforce authentication & tenant isolation on all queue routes
router.use(authenticate);
router.use(requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF'));
router.use(resolveTenant);
router.use(requireTenant);

// Query queue & summary
router.get('/summary', queueController.getSummary);
router.get('/suitable-tables/:id', queueController.getSuitableTables);
router.get('/suggest-party/:tableId', queueController.suggestPartyForTable);
router.get('/', queueController.getQueue);
router.get('/:id', queueController.getQueueEntry);

// Add to queue
router.post('/', queueController.addToQueue);

// Lifecycle actions
router.patch('/:id/status', queueController.updateQueueStatus);
router.post('/:id/seat', queueController.seatCustomer);
router.post('/:id/notify', queueController.notifyParty);
router.post('/:id/cancel', queueController.cancelQueueEntry);
router.post('/:id/no-show', queueController.markNoShow);

export default router;
