import express from 'express';
import * as reservationController from '../controllers/reservationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { resolveTenant, requireTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// Enforce authentication & tenant isolation on all reservation routes
router.use(authenticate);
router.use(requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF'));
router.use(resolveTenant);
router.use(requireTenant);

// Query routes
router.get('/summary', reservationController.getSummary);
router.get('/available-tables', reservationController.checkAvailableTables);
router.get('/', reservationController.getReservations);
router.get('/:id', reservationController.getReservation);

// Mutation routes
router.post('/', reservationController.createReservation);
router.put('/:id', reservationController.updateReservation);
router.patch('/:id/status', reservationController.updateStatus);
router.post('/:id/seat', reservationController.seatReservation);

export default router;
