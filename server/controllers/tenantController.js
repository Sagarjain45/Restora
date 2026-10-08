import * as tenantService from '../services/tenantService.js';
import Table from '../models/Table.js';
import { scopeFilter } from '../utils/tenantHelper.js';

/**
 * Controller exposing tenant isolation verification and current tenant profile
 */

export const getCurrentTenant = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(200).json({
        success: true,
        message: 'Platform administrator context. No single restaurant tenant locked.',
        data: {
          isPlatformAdmin: true,
          tenant: null,
        },
      });
    }

    const tenant = await tenantService.getTenantProfile(req.tenantId);

    res.status(200).json({
      success: true,
      message: 'Active restaurant tenant details retrieved',
      data: {
        isPlatformAdmin: false,
        tenant,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyIsolation = async (req, res, next) => {
  try {
    const auditReport = await tenantService.verifyTenantIsolation(
      req.tenantId,
      req.isPlatformAdmin
    );

    res.status(200).json({
      success: true,
      message: 'Tenant isolation verification check completed',
      data: auditReport,
    });
  } catch (error) {
    next(error);
  }
};

export const seedSandbox = async (req, res, next) => {
  try {
    const result = await tenantService.seedMultiTenantSandbox();

    res.status(200).json({
      success: true,
      message: 'Multi-tenant sandbox environment initialized',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Demonstrates live tenant query scoping:
 * Fetches tables automatically filtered by req.tenantId.
 * No client query parameter can override this.
 */
export const getTenantTables = async (req, res, next) => {
  try {
    const filter = scopeFilter(req);
    const tables = await Table.find(filter).sort({ tableNumber: 1 });

    res.status(200).json({
      success: true,
      message: `Retrieved ${tables.length} tables scoped to tenant ${req.tenantId}`,
      data: {
        tenantId: req.tenantId,
        count: tables.length,
        tables,
      },
    });
  } catch (error) {
    next(error);
  }
};
