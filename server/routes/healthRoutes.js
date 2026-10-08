import express from 'express';
import { getDBStatus } from '../config/database.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const dbStatus = getDBStatus();

  res.status(200).json({
    success: true,
    message: 'Restora API is operational',
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  });
});

export default router;
