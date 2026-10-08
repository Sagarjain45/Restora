/**
 * Reports & Order History API Service (Phase 15: Order History and Reports)
 * Handles tenant-scoped order history search, sales reports, and platform-wide analytics.
 */

const REPORTS_BASE = '/api/reports';

/**
 * Fetch filtered order history with pagination & summary metrics
 */
export const getOrderHistoryApi = async (token, params = {}) => {
  const query = new URLSearchParams();

  if (params.search) query.append('search', params.search);
  if (params.datePreset && params.datePreset !== 'all') query.append('datePreset', params.datePreset);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.tableId && params.tableId !== 'ALL') query.append('tableId', params.tableId);
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.paymentStatus && params.paymentStatus !== 'ALL') query.append('paymentStatus', params.paymentStatus);
  if (params.paymentMethod && params.paymentMethod !== 'ALL') query.append('paymentMethod', params.paymentMethod);
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);

  const url = `${REPORTS_BASE}/orders${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve order history.');
  }
  return data;
};

/**
 * Fetch tenant-scoped restaurant reports (Daily, Weekly, Monthly, Top items, Payments, Table utilization)
 */
export const getRestaurantReportsApi = async (token, params = {}) => {
  const query = new URLSearchParams();

  if (params.datePreset) query.append('datePreset', params.datePreset);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const url = `${REPORTS_BASE}/restaurant${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve restaurant reports.');
  }
  return data.data;
};

/**
 * Fetch platform-wide reports (For PLATFORM_ADMIN)
 */
export const getPlatformReportsApi = async (token) => {
  const response = await fetch(`${REPORTS_BASE}/platform`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve platform analytics reports.');
  }
  return data.data;
};
