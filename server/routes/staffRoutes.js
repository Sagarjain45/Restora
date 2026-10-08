import express from 'express';
import * as staffController from '../controllers/staffController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { resolveTenant, requireTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// Enforce authentication, restaurant owner permissions, and tenant isolation
router.use(authenticate);
router.use(requireRole('RESTAURANT_OWNER'));
router.use(resolveTenant);
router.use(requireTenant);

// Metrics & summary
router.get('/summary', staffController.getSummary);

// Staff roster
router.get('/', staffController.getStaff);
router.get('/:id', staffController.getStaffMember);

// Staff lifecycle & management
router.post('/', staffController.addStaff);
router.put('/:id', staffController.updateStaff);
router.patch('/:id/status', staffController.toggleStatus);

export default router;
