import mongoose from 'mongoose';

/**
 * Utility functions for strict multi-tenant query scoping and resource verification.
 */

/**
 * Scopes a MongoDB query filter with the current tenant's restaurantId.
 * For non-platform admins, guarantees restaurantId is always injected.
 * 
 * @param {Object|string} reqOrTenantId Express request object or direct tenantId string
 * @param {Object} [baseFilter={}] Existing query filter
 * @returns {Object} Scoped MongoDB filter object
 */
export const scopeFilter = (reqOrTenantId, baseFilter = {}) => {
  const tenantId = typeof reqOrTenantId === 'object' && reqOrTenantId !== null
    ? reqOrTenantId.tenantId
    : reqOrTenantId;

  if (!tenantId) {
    // If called in context of platform admin with no tenant filter requested
    if (typeof reqOrTenantId === 'object' && reqOrTenantId?.isPlatformAdmin && !reqOrTenantId.tenantId) {
      return { ...baseFilter };
    }
    const err = new Error('Tenant context missing: Query cannot be scoped safely.');
    err.statusCode = 400;
    err.code = 'MISSING_TENANT_CONTEXT';
    throw err;
  }

  return {
    ...baseFilter,
    restaurantId: new mongoose.Types.ObjectId(String(tenantId)),
  };
};

/**
 * Asserts that a retrieved document belongs to the active tenant.
 * Prevents cross-tenant reads or updates if an entity was fetched by ID.
 * 
 * @param {Object} doc Mongoose document
 * @param {string|mongoose.Types.ObjectId} tenantId Tenant ID to check against
 * @param {string} [resourceName='Resource'] Name for error messaging
 */
export const assertTenantOwnership = (doc, tenantId, resourceName = 'Resource') => {
  if (!doc) {
    const error = new Error(`${resourceName} not found.`);
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (!tenantId) {
    return; // Platform admin global scope bypass if applicable
  }

  const docTenantId = doc.restaurantId ? doc.restaurantId.toString() : null;
  const targetTenantId = tenantId.toString();

  if (docTenantId !== targetTenantId) {
    const error = new Error(`Access denied: ${resourceName} does not belong to your restaurant tenant.`);
    error.statusCode = 403;
    error.code = 'CROSS_TENANT_ACCESS_DENIED';
    throw error;
  }
};

/**
 * Validates foreign resource references (e.g., tableId, menu items, customerId)
 * to prevent cross-tenant cross-referencing attacks.
 * 
 * @param {string|mongoose.Types.ObjectId} tenantId Active tenant ID
 * @param {Array<{ model: mongoose.Model, id: string|mongoose.Types.ObjectId, name: string }>} references List of references to verify
 */
export const validateTenantReferences = async (tenantId, references = []) => {
  if (!tenantId || !references.length) return;

  const tenantObjectId = new mongoose.Types.ObjectId(String(tenantId));

  for (const ref of references) {
    if (!ref.id) continue;

    const existsInTenant = await ref.model.exists({
      _id: ref.id,
      restaurantId: tenantObjectId,
    });

    if (!existsInTenant) {
      const error = new Error(
        `Cross-tenant integrity violation: ${ref.name || 'Referenced resource'} (${ref.id}) does not exist in your restaurant tenant.`
      );
      error.statusCode = 400;
      error.code = 'CROSS_TENANT_REFERENCE_FORBIDDEN';
      throw error;
    }
  }
};
