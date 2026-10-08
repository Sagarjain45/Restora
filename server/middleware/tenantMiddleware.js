import Restaurant from '../models/Restaurant.js';

/**
 * Multi-Tenant Middleware Suite
 * Enforces strict application-level tenant isolation, preventing cross-tenant
 * reads, writes, deletions, and resource spoofing.
 */

/**
 * Resolves and locks down the tenant context for the current request.
 * Must be mounted after the `authenticate` middleware.
 */
export const resolveTenant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to resolving tenant context.',
        code: 'UNAUTHENTICATED',
      });
    }

    // 1. Platform Admin Handling
    if (req.user.role === 'PLATFORM_ADMIN') {
      req.isPlatformAdmin = true;

      // Platform admin can optionally target a specific restaurant via header or query
      const explicitTarget = req.headers['x-restaurant-id'] || req.query.restaurantId;
      if (explicitTarget) {
        req.tenantId = String(explicitTarget);
        const targetRestaurant = await Restaurant.findById(req.tenantId);
        if (targetRestaurant) {
          req.restaurant = targetRestaurant;
        }
      } else {
        req.tenantId = null;
        req.restaurant = null;
      }

      return next();
    }

    // 2. Restaurant Owner / Staff Handling
    req.isPlatformAdmin = false;

    if (!req.user.restaurantId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: No restaurant tenant is associated with this user account.',
        code: 'NO_TENANT_ASSIGNED',
      });
    }

    const authenticatedTenantId = req.user.restaurantId.toString();

    // 3. Prevent Tenant Spoofing / Parameter Tampering
    // Reject request if client attempted to supply a conflicting restaurantId in body, query, or params
    const clientProvidedId =
      req.body?.restaurantId || req.query?.restaurantId || req.params?.restaurantId;

    if (clientProvidedId && String(clientProvidedId) !== authenticatedTenantId) {
      return res.status(403).json({
        success: false,
        message: 'Security Alert: Unauthorized attempt to access or override another tenant.',
        code: 'CROSS_TENANT_SPOOF_ATTEMPT',
      });
    }

    // Enforce canonical tenantId across body and query
    req.tenantId = authenticatedTenantId;
    if (req.body && typeof req.body === 'object') {
      req.body.restaurantId = authenticatedTenantId;
    }

    // 4. Verify Restaurant State in Database
    const restaurant = await Restaurant.findById(authenticatedTenantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant restaurant record could not be found.',
        code: 'TENANT_NOT_FOUND',
      });
    }

    // Check account status (e.g. SUSPENDED / PENDING accounts cannot perform operations)
    if (restaurant.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Tenant Account Suspended: Your restaurant has been deactivated by platform administration.',
        code: 'RESTAURANT_SUSPENDED',
      });
    }

    if (restaurant.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        message: 'Tenant Account Pending: Your restaurant onboarding application is under review.',
        code: 'RESTAURANT_PENDING',
      });
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Requires an active tenant ID to be resolved on the request.
 * Use on restaurant operations endpoints where global/unscoped access is disallowed.
 */
export const requireTenant = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Operation requires an active restaurant tenant context.',
      code: 'TENANT_CONTEXT_REQUIRED',
    });
  }
  next();
};

/**
 * Validates that a referenced entity by ID belongs strictly to the authenticated tenant.
 *
 * @param {import('mongoose').Model} Model Mongoose model to verify against
 * @param {string} [paramKey='id'] Request params key containing the document ID
 * @param {string} [resourceName='Resource'] Resource descriptor for error messaging
 */
export const requireTenantOwnership = (Model, paramKey = 'id', resourceName = 'Resource') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramKey];
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `${resourceName} ID parameter is required.`,
          code: 'PARAM_REQUIRED',
        });
      }

      const doc = await Model.findById(resourceId);

      if (!doc) {
        return res.status(404).json({
          success: false,
          message: `${resourceName} not found.`,
          code: 'RESOURCE_NOT_FOUND',
        });
      }

      // Check tenant ownership (Platform Admin bypasses ownership check)
      if (!req.isPlatformAdmin && doc.restaurantId) {
        if (doc.restaurantId.toString() !== req.tenantId) {
          return res.status(403).json({
            success: false,
            message: `Forbidden: This ${resourceName.toLowerCase()} belongs to another restaurant tenant.`,
            code: 'CROSS_TENANT_ACCESS_DENIED',
          });
        }
      }

      // Attach resolved document for reuse in controller
      req.scopedResource = doc;
      next();
    } catch (error) {
      next(error);
    }
  };
};
