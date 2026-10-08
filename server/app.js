import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import billRoutes from './routes/billRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';
import { sanitizeMongoInput, apiRateLimiter, authRateLimiter } from './middleware/securityMiddleware.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization against NoSQL injection
app.use(sanitizeMongoInput);

// Rate limiting (active in development and production, bypassed in test runs)
if (env.NODE_ENV !== 'test') {
  app.use('/api', apiRateLimiter);
  app.use('/api/auth/login', authRateLimiter);
  app.use('/api/auth/register', authRateLimiter);
}

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Restora - Multi-Tenant Restaurant Management System API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);

// Catch-all 404 & Global Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
