import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/seed-demo', authController.seedDemo);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

// Role-protected verification endpoints
router.get('/admin-only', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized: Platform Admin access granted.',
    user: req.user,
  });
});

router.get(
  '/restaurant-only',
  authenticate,
  requireRole('RESTAURANT_OWNER', 'RESTAURANT_STAFF'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Authorized: Restaurant operations access granted.',
      user: req.user,
    });
  }
);

export default router;
