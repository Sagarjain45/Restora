import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public Application Onboarding, Status Tracking & Demo Seeding
router.post('/applications/apply', adminController.submitApplication);
router.get('/applications/status', adminController.getApplicationStatus);
router.post('/seed-applications', adminController.seedApplications);

// Protected Platform Admin Routes
router.use(authenticate);
router.use(requireRole('PLATFORM_ADMIN'));

// Platform Analytics & KPI Dashboard
router.get('/dashboard-stats', adminController.getDashboardStats);

// Restaurant Applications Workflow
router.get('/applications', adminController.getApplications);
router.get('/applications/:id', adminController.getApplicationById);
router.post('/applications/:id/approve', adminController.approveApplication);
router.post('/applications/:id/reject', adminController.rejectApplication);

// Restaurant Management (Search, Filter, Suspend, Activate, Details)
router.get('/restaurants', adminController.getRestaurants);
router.get('/restaurants/:id', adminController.getRestaurantDetails);
router.patch('/restaurants/:id/status', adminController.updateRestaurantStatus);

export default router;
