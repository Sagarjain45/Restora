import express from 'express';
import * as tableController from '../controllers/tableController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { resolveTenant, requireTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// Enforce authentication & tenant isolation on all table routes
router.use(authenticate);
router.use(requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF'));
router.use(resolveTenant);
router.use(requireTenant);

// Read tables (Owner & Staff)
router.get('/', tableController.getTables);
router.get('/:id', tableController.getTable);

// Operational Status updates (Floor Staff & Owner)
router.patch('/:id/status', tableController.updateTableStatus);

// Table Structure & Management (Restricted to RESTAURANT_OWNER)
router.post('/', requireRole('RESTAURANT_OWNER'), tableController.createTable);
router.put('/:id', requireRole('RESTAURANT_OWNER'), tableController.updateTable);
router.delete('/:id', requireRole('RESTAURANT_OWNER'), tableController.deleteTable);

export default router;
