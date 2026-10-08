/**
 * Tenant Service Client
 * Handles tenant profile and multi-tenant isolation audit communications
 */

const TENANT_BASE = '/api/tenant';

export const getCurrentTenantApi = async (token) => {
  const response = await fetch(`${TENANT_BASE}/current`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch active tenant info.');
  }
  return data.data;
};

export const verifyTenantIsolationApi = async (token) => {
  const response = await fetch(`${TENANT_BASE}/verify-isolation`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify tenant isolation.');
  }
  return data.data;
};

export const getTenantTablesApi = async (token) => {
  const response = await fetch(`${TENANT_BASE}/tables`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tenant tables.');
  }
  return data.data;
};

export const seedSandboxApi = async () => {
  const response = await fetch(`${TENANT_BASE}/seed-sandbox`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to seed multi-tenant sandbox.');
  }
  return data.data;
};
