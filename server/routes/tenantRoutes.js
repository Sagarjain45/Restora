import express from 'express';
import * as tenantController from '../controllers/tenantController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { resolveTenant, requireTenant } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// Development/Sandbox setup route
router.post('/seed-sandbox', tenantController.seedSandbox);

// Protected Tenant-Aware Endpoints
router.use(authenticate);
router.use(resolveTenant);

// Current Tenant Profile
router.get('/current', tenantController.getCurrentTenant);

// Multi-Tenant Isolation Audit & Verification
router.get('/verify-isolation', tenantController.verifyIsolation);

// Proof of Query Scoping (e.g. Scoped Tables)
router.get('/tables', requireTenant, tenantController.getTenantTables);

export default router;
