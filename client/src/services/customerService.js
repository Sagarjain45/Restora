/**
 * Customer Service Client (Phase 13: Customer Management & CRM)
 * Handles customer directories, deduplication, lifetime spend, and visit history.
 */

const CUSTOMERS_BASE = '/api/customers';

export const getCustomersApi = async (token, params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.filter && params.filter !== 'ALL') query.append('filter', params.filter);
  if (params.sortBy) query.append('sortBy', params.sortBy);

  const url = `${CUSTOMERS_BASE}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve customers.');
  }
  return data;
};

export const getCustomerSummaryApi = async (token) => {
  const response = await fetch(`${CUSTOMERS_BASE}/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve customer summary.');
  }
  return data.data;
};

export const getCustomerByIdApi = async (token, customerId) => {
  const response = await fetch(`${CUSTOMERS_BASE}/${customerId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve customer profile.');
  }
  return data.data;
};

export const createCustomerApi = async (token, customerData) => {
  const response = await fetch(`${CUSTOMERS_BASE}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(customerData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to save customer.');
  }
  return data;
};

export const updateCustomerApi = async (token, customerId, updateData) => {
  const response = await fetch(`${CUSTOMERS_BASE}/${customerId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update customer profile.');
  }
  return data.data;
};

export const recordCustomerVisitApi = async (token, customerId, visitData = {}) => {
  const response = await fetch(`${CUSTOMERS_BASE}/${customerId}/visit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(visitData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to record customer visit.');
  }
  return data.data;
};
